import { z } from "zod";
import { DIAS } from "@/data/actividad-form";
import type { ActividadFormData, DiaCfg, DiaKey, TarifaFila } from "@/types/actividad-form";

/**
 * Validaciones del formulario de actividad, en zod y en un solo lugar: las
 * comparten el alta (`ActivityForm`) y la modificación (`[id]/editar`).
 *
 * Los editores compartidos —tarifas, listas, FAQ— piden sus errores por claves
 * planas (`nombre`, `tar_<id>_min`, `day_lunes`), así que el schema emite los
 * issues en paths que `aErroresPlanos` traduce a esas claves. Algunos paths no
 * corresponden a un campo del formulario (`tarOverlap`, `diasNone`, o
 * `tarifas[i].overlap`): son errores de una combinación, no de un campo, y
 * viajan así para que el resolver los vea y bloquee el envío igual.
 */
export type ErroresActividad = Record<string, string>;

export const EDAD_MIN = 0;
export const EDAD_MAX = 120;
/** Tope de la vigencia, contado desde hoy. */
export const DIAS_VIGENCIA_MAX = 120;

const REQUERIDO = "Este campo es requerido";
const BASE_DUPLICADA = "No puedes tener más de una tarifa base en la misma actividad.";
const NOMBRE_DUPLICADO = "No puedes registrar más de una tarifa con el mismo nombre.";
const MIN_ITEM = 5;

const edadOk = (v: string) => /^[0-9]{1,3}$/.test(v) && +v >= EDAD_MIN && +v <= EDAD_MAX;
const precioOk = (v: string) => /^[0-9]+$/.test(v);

/** Sólo dígitos, para los campos numéricos. */
export const soloDigitos = (s: string) => s.replace(/[^0-9]/g, "");
/** Los ítems y las FAQ aceptan texto, no números. */
export const soloTexto = (s: string) => s.replace(/[0-9]/g, "");
/** Quita los renglones en blanco que deja el editor de listas. */
export function limpiarLista(items: string[]): string[] {
  return items.map((t) => t.trim()).filter(Boolean);
}

let secuencia = 0;
/** Fila nueva, siempre desde el cliente (el usuario apretó "Agregar rango"). */
export function nuevaTarifa(): TarifaFila {
  secuencia += 1;
  return { id: `tar-${secuencia}-${Math.random().toString(36).slice(2, 6)}`, nombre: "", min: "", max: "", precio: "", on: true, base: false };
}

/* ---- Piezas del schema --------------------------------------------------- */

type Ruta = (string | number)[];
type Ctx = { addIssue: (i: { code: "custom"; message: string; path: Ruta }) => void };

const marcar = (ctx: Ctx) => (path: Ruta, message: string) =>
  ctx.addIssue({ code: "custom", message, path });

/** Texto obligatorio con un mínimo, medido sin espacios de más. */
function textoRequerido(min: number, vacio: string) {
  return z.string().superRefine((s, ctx) => {
    const t = s.trim();
    if (!t) ctx.addIssue({ code: "custom", message: vacio, path: [] });
    else if (t.length < min)
      ctx.addIssue({ code: "custom", message: `Debe tener al menos ${min} caracteres`, path: [] });
  });
}

/** Ítems de "Qué incluye" / "Qué NO incluye": opcionales, pero no a medias. */
const listaItems = z.array(z.string()).superRefine((items, ctx) => {
  items.forEach((t, i) => {
    const s = t.trim();
    if (s && s.length < MIN_ITEM)
      ctx.addIssue({ code: "custom", message: `Debe tener al menos ${MIN_ITEM} caracteres`, path: [i] });
  });
});

const faqsSchema = z
  .array(z.object({ q: z.string(), a: z.string() }))
  .superRefine((faqs, ctx) => {
    const err = marcar(ctx);
    faqs.forEach((f, i) => {
      const q = f.q.trim();
      const a = f.a.trim();
      if (q && q.length < MIN_ITEM) err([i, "q"], `Debe tener al menos ${MIN_ITEM} caracteres`);
      if (a && a.length < MIN_ITEM) err([i, "a"], `Debe tener al menos ${MIN_ITEM} caracteres`);
      if (q && !a) err([i, "a"], "Completá la respuesta de esta pregunta");
      if (a && !q) err([i, "q"], "Completá la pregunta");
    });
  });

export const tarifaFilaSchema = z.object({
  id: z.string(),
  backendId: z.string().optional(),
  nombre: z.string(),
  min: z.string(),
  max: z.string(),
  precio: z.string(),
  on: z.boolean(),
  base: z.boolean(),
});

/**
 * Rangos etarios. Se refina desde la raíz del objeto —y no sobre el array— para
 * poder marcar aparte los errores que no son de una fila sino del conjunto
 * (`tarOverlap`, `tarDup`, `tarBase`, `tarNone`), que son los que bloquean el
 * guardado y se muestran arriba de la tabla.
 */
export function refinarTarifas(filas: TarifaFila[], ctx: Ctx) {
  const err = marcar(ctx);
  const activas = filas.map((r, i) => ({ r, i })).filter(({ r }) => r.on);

  if (activas.length === 0) err(["tarNone"], "Es obligatorio configurar al menos un rango etario.");

  activas.forEach(({ r, i }) => {
    if (!r.nombre.trim()) err(["tarifas", i, "nombre"], REQUERIDO);
    if (!precioOk(r.precio))
      err(["tarifas", i, "precio"], r.precio === "" ? REQUERIDO : "Ingresá un monto válido");
    if (!edadOk(r.min))
      err(["tarifas", i, "min"], r.min === "" ? REQUERIDO : `Ingresá un número entero entre ${EDAD_MIN} y ${EDAD_MAX}`);
    if (!edadOk(r.max))
      err(["tarifas", i, "max"], r.max === "" ? REQUERIDO : `Ingresá un número entero entre ${EDAD_MIN} y ${EDAD_MAX}`);
    if (edadOk(r.min) && edadOk(r.max) && +r.min > +r.max)
      err(["tarifas", i, "orden"], "La edad mínima no puede ser mayor a la edad máxima.");
  });

  const bases = activas.filter(({ r }) => r.base);
  if (bases.length === 0) err(["tarBase"], "Es obligatorio marcar un rango etario como tarifa base.");
  else if (bases.length > 1) err(["tarBase"], BASE_DUPLICADA);

  const vistos = new Map<string, number>();
  activas.forEach(({ r, i }) => {
    const k = r.nombre.trim().toLowerCase();
    if (!k) return;
    const previo = vistos.get(k);
    if (previo !== undefined) {
      err(["tarDup"], NOMBRE_DUPLICADO);
      err(["tarifas", i, "dup"], NOMBRE_DUPLICADO);
      err(["tarifas", previo, "dup"], NOMBRE_DUPLICADO);
    }
    vistos.set(k, i);
  });

  // Solapamiento: se reporta el primer par que se pisa y se corta. Listar todos
  // los pares no ayuda —arreglado el primero, los demás se recalculan— y sí
  // llenaría la pantalla de mensajes.
  const validas = activas.filter(({ r }) => edadOk(r.min) && edadOk(r.max) && +r.min <= +r.max);
  for (let a = 0; a < validas.length; a++) {
    for (let b = a + 1; b < validas.length; b++) {
      const x = validas[a];
      const y = validas[b];
      if (+x.r.min <= +y.r.max && +y.r.min <= +x.r.max) {
        const msg = `Solapamiento detectado: el rango ${x.r.nombre.trim() || "sin nombre"} tiene solapamiento de edades con el rango ${y.r.nombre.trim() || "sin nombre"}.`;
        err(["tarOverlap"], msg);
        err(["tarifas", x.i, "overlap"], msg);
        err(["tarifas", y.i, "overlap"], msg);
        return;
      }
    }
  }
}

/** Días y horarios. Sólo los usa el alta: la modificación no los edita. */
function refinarDias(days: Record<DiaKey, DiaCfg>, ctx: Ctx) {
  const err = marcar(ctx);
  const elegidos = DIAS.filter((d) => days[d.key].on);

  if (elegidos.length === 0)
    err(["diasNone"], "Debe seleccionar y configurar al menos un día de la semana para la actividad");

  // El valor es un marcador, no un mensaje: el editor pinta la fila y el texto
  // sale una sola vez, abajo del bloque.
  let faltaHora = false;
  let malOrden = false;
  elegidos.forEach((d) => {
    const fila = days[d.key];
    if (!fila.desde || !fila.hasta) {
      err(["days", d.key], "horario");
      faltaHora = true;
    } else if (fila.hasta <= fila.desde) {
      err(["days", d.key], "orden");
      malOrden = true;
    }
  });
  if (faltaHora) err(["diasHoras"], "Debe ingresar los horarios para los días seleccionados");
  if (malOrden) err(["diasOrden"], "La hora de fin debe ser posterior a la de inicio");
}

/* ---- Schemas ------------------------------------------------------------- */

/** Lo que comparten el alta y la modificación. */
export const camposComunes = {
  nombre: textoRequerido(5, "El nombre es requerido"),
  descripcion: textoRequerido(20, "La descripción es requerida"),
  cultivos: z.array(z.string()).min(1, "El tipo de cultivo es requerido"),
  tarifas: z.array(tarifaFilaSchema),
  incluye: listaItems,
  noIncluye: listaItems,
  faqs: faqsSchema,
};

const diaCfgSchema = z.object({ on: z.boolean(), desde: z.string(), hasta: z.string() });

export const actividadAltaSchema = z
  .object({
    ...camposComunes,
    cupos: z.string(),
    days: z.record(z.string(), diaCfgSchema),
    fechaDesde: z.string(),
    fechaHasta: z.string(),
  })
  .superRefine((v, ctx) => {
    const err = marcar(ctx);

    if (!v.cupos) err(["cupos"], "Este campo es obligatorio");
    else if (!/^[0-9]+$/.test(v.cupos) || parseInt(v.cupos, 10) <= 0)
      err(["cupos"], "El valor debe ser mayor a 0");

    refinarTarifas(v.tarifas, ctx);
    refinarDias(v.days as Record<DiaKey, DiaCfg>, ctx);

    if (!v.fechaDesde) err(["fechaDesde"], "La fecha desde es requerida");
    if (!v.fechaHasta) err(["fechaHasta"], "La fecha hasta es requerida");
    else if (v.fechaDesde && v.fechaHasta < v.fechaDesde)
      err(["fechaHasta"], "La fecha de fin no puede ser anterior al inicio");
  });

/* ---- De los issues a las claves planas ------------------------------------
   Los editores compartidos piden `errs["tar_<id>_min"]`, así que hay que
   traducir el path de cada issue. Las tarifas se nombran por el id de la fila y
   no por su posición: al agregar o borrar filas los índices se corren, y un
   error quedaría pegado en la fila equivocada. */

function clavePlana(path: Ruta, tarifas: TarifaFila[]): string | null {
  const [a, b, c] = path;
  if (a === undefined) return null;

  if (a === "tarifas" && typeof b === "number" && typeof c === "string") {
    const fila = tarifas[b];
    return fila ? `tar_${fila.id}_${c}` : null;
  }
  if (a === "incluye" && typeof b === "number") return `inc_${b}`;
  if (a === "noIncluye" && typeof b === "number") return `ninc_${b}`;
  if (a === "faqs" && typeof b === "number" && typeof c === "string") return `faq_${b}_${c}`;
  if (a === "days" && typeof b === "string") return `day_${b}`;
  // Campos sueltos (`nombre`, `cupos`) y los sintéticos del conjunto (`tarOverlap`).
  if (typeof a === "string" && path.length === 1) return a;
  return null;
}

/** Aplana el `error.issues` de un `safeParse`. */
export function aErroresPlanos(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
  tarifas: TarifaFila[],
): ErroresActividad {
  const e: ErroresActividad = {};
  for (const issue of issues) {
    const clave = clavePlana(issue.path as Ruta, tarifas);
    // El primero gana: dentro de una fila, el error de rango es más útil que el
    // de campo vacío, y `refinarTarifas` los emite en ese orden.
    if (clave && !(clave in e)) e[clave] = issue.message;
  }
  return e;
}

/**
 * Aplana el árbol de errores de react-hook-form. Es el mismo mapa que
 * `aErroresPlanos`, pero armado desde lo que ya validó el resolver en vez de
 * volver a correr el schema.
 */
export function aErroresPlanosDeForm(errors: unknown, tarifas: TarifaFila[]): ErroresActividad {
  const e: ErroresActividad = {};

  const recorrer = (nodo: unknown, path: Ruta) => {
    if (!nodo || typeof nodo !== "object") return;

    const message = (nodo as { message?: unknown }).message;
    if (typeof message === "string" && message) {
      const clave = clavePlana(path, tarifas);
      if (clave && !(clave in e)) e[clave] = message;
    }

    for (const [k, valor] of Object.entries(nodo)) {
      // Metadatos que agrega RHF alrededor del mensaje.
      if (k === "message" || k === "type" || k === "types" || k === "ref" || k === "root") continue;
      recorrer(valor, [...path, /^\d+$/.test(k) ? Number(k) : k]);
    }
  };

  recorrer(errors, []);
  return e;
}

/* ---- Validación del alta -------------------------------------------------
   `ActivityForm` no usa react-hook-form (es un asistente de cuatro pasos que
   pinta los errores en cada tecla), así que corre el schema a mano y consume el
   mismo mapa plano. */

export function erroresDeActividad(v: ActividadFormData): ErroresActividad {
  const res = actividadAltaSchema.safeParse(v);
  return res.success ? {} : aErroresPlanos(res.error.issues, v.tarifas);
}

/* ---- Derivados del valor -------------------------------------------------- */

/**
 * Los errores de tarifas que impiden guardar aunque el resto esté completo.
 * No son "campos faltantes" sino configuraciones contradictorias, así que se
 * muestran apenas ocurren y deshabilitan el botón.
 */
export function bloqueoDeTarifas(e: ErroresActividad): string | null {
  return e.tarOverlap || e.tarDup || (e.tarBase === BASE_DUPLICADA ? e.tarBase : null) || null;
}

/** Edades entre 0 y 120 que ningún rango cubre. Es un aviso, no un error. */
export function huecosDeEdad(filas: TarifaFila[]): string[] {
  const rangos = filas
    .filter((r) => r.on && edadOk(r.min) && edadOk(r.max) && +r.min <= +r.max)
    .map((r) => [+r.min, +r.max] as const)
    .sort((a, b) => a[0] - b[0]);

  const huecos: [number, number][] = [];
  let cursor = EDAD_MIN;
  rangos.forEach(([desde, hasta]) => {
    if (desde > cursor) huecos.push([cursor, desde - 1]);
    cursor = Math.max(cursor, hasta + 1);
  });
  if (cursor <= EDAD_MAX) huecos.push([cursor, EDAD_MAX]);

  return huecos.map(([a, b]) => (a === b ? `${a} años` : `${a} a ${b} años`));
}

/* ---- Pasos --------------------------------------------------------------- */

export const PASOS = [
  { n: 1, label: "Información general", sub: "Nombre, descripción y cultivos" },
  { n: 2, label: "Detalles de la experiencia", sub: "Qué incluye y preguntas" },
  { n: 3, label: "Participantes y tarifas", sub: "Cupos y precio según rango" },
  { n: 4, label: "Disponibilidad", sub: "Días y vigencia" },
] as const;

/** En qué paso vive el campo de cada error, para poder llevar ahí al usuario. */
export function pasoDelError(k: string): number {
  if (k === "nombre" || k === "descripcion" || k === "cultivos") return 1;
  if (k.startsWith("inc_") || k.startsWith("ninc_") || k.startsWith("faq_")) return 2;
  if (k === "cupos" || k.startsWith("tar")) return 3;
  return 4;
}
