import { ApiError } from "@/lib/api";

/**
 * Qué le pasó a una lectura, en el vocabulario de la pantalla. La regla de la
 * guía es que nunca se muestra un mensaje técnico (`Backend respondió 500`,
 * `Failed to fetch`, códigos `X.y`): esto los traduce a un tipo, y cada tipo
 * tiene su texto.
 *
 * - `red`: no hubo respuesta (sin conexión, CORS, timeout).
 * - `servidor`: respondió con un error que no tiene traducción propia.
 * - `sesion`: 401, o se pidió sin sesión.
 * - `permiso`: 403.
 * - `noEncontrado`: 404.
 * - `dominio`: el hook ya mandó un mensaje pensado para el usuario.
 */
export type TipoFalla = "red" | "servidor" | "sesion" | "permiso" | "noEncontrado" | "dominio";

export interface Falla {
  tipo: TipoFalla;
  /** Texto para el usuario. */
  mensaje: string;
  /** Lo que llegó, para la consola. Nunca se pinta. */
  detalle?: string;
}

export const MENSAJE_FALLA: Record<Exclude<TipoFalla, "dominio">, { titulo: string; mensaje: string }> = {
  red: {
    titulo: "No pudimos conectarnos",
    mensaje: "Revisá tu conexión a internet y volvé a intentarlo.",
  },
  servidor: {
    titulo: "No pudimos cargar la información",
    mensaje: "Tuvimos un problema de nuestro lado. Probá de nuevo en unos minutos.",
  },
  sesion: {
    titulo: "Tu sesión venció",
    mensaje: "Iniciá sesión de nuevo para seguir.",
  },
  permiso: {
    titulo: "No tenés acceso a esta sección",
    mensaje: "Tu rol no incluye este permiso. Pedile a un administrador que te lo habilite.",
  },
  noEncontrado: {
    titulo: "No encontramos lo que buscabas",
    mensaje: "Puede que se haya eliminado o que el enlace esté incompleto.",
  },
};

/** El `message` de `ApiError`: "Backend respondió 403" o "Backend respondió 403 (activityFull)". */
const RE_STATUS = /Backend respondió (\d{3})(?: \(([^)]+)\))?/;
const RE_RED = /failed to fetch|networkerror|load failed|network request failed|fetch failed/i;
/** Códigos del backend tal cual (`Actividad.NOT_FOUND`, `A.diaYaComenzo`, `entityNotFound`). */
const RE_CODIGO = /^[A-Za-z]+(\.[A-Za-z_]+)+$|^[a-z]+[A-Z][A-Za-z]*$/;
const TECNICOS = new Set(["Error inesperado", "Sin sesión", "Unexpected error"]);

/**
 * El backend también usa 403 y 404 para errores de dominio con `code`
 * (`activityFull`, `A.diaFinalizado`, `forbiddenState`, `badCreds`…): ésos
 * no son "sin permiso" ni "no existe". Cuentan como tales sólo sin `code` —lo
 * que responde Spring Security por su cuenta— o con estos códigos.
 */
const CODIGOS_PERMISO = new Set(["accessDenied"]);
const CODIGOS_NO_ENCONTRADO = new Set(["entityNotFound", "entityNonExistent"]);

function porStatus(status: number, code?: string): TipoFalla {
  if (status === 401) return "sesion";
  if (status === 403 && (!code || CODIGOS_PERMISO.has(code))) return "permiso";
  if (status === 404 && (!code || CODIGOS_NO_ENCONTRADO.has(code))) return "noEncontrado";
  return "servidor";
}

function falla(tipo: Exclude<TipoFalla, "dominio">, detalle?: string): Falla {
  return { tipo, mensaje: MENSAJE_FALLA[tipo].mensaje, detalle };
}

/**
 * Clasifica lo que venga como error: un `ApiError`, un `Error` o el string que
 * guardan los hooks (casi siempre `e.message`). Un string que no parece técnico
 * se respeta: es un mensaje que el hook ya redactó para el usuario.
 */
export function clasificarError(e: unknown): Falla | null {
  if (e === null || e === undefined || e === "") return null;

  if (e instanceof ApiError) return falla(porStatus(e.status, e.code) as Exclude<TipoFalla, "dominio">, e.message);
  if (e instanceof TypeError && RE_RED.test(e.message)) return falla("red", e.message);

  const texto = e instanceof Error ? e.message : typeof e === "string" ? e : String(e);
  const m = RE_STATUS.exec(texto);
  if (m) return falla(porStatus(Number(m[1]), m[2]) as Exclude<TipoFalla, "dominio">, texto);
  if (RE_RED.test(texto)) return falla("red", texto);
  if (texto === "Sin sesión" || /iniciar sesión/i.test(texto)) return falla("sesion", texto);
  if (/no tenés permiso/i.test(texto)) return { tipo: "permiso", mensaje: texto, detalle: texto };
  if (TECNICOS.has(texto) || RE_CODIGO.test(texto)) return falla("servidor", texto);
  if (typeof navigator !== "undefined" && navigator.onLine === false) return falla("red", texto);

  return { tipo: "dominio", mensaje: texto };
}
