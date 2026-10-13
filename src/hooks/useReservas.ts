import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch, comoEnvelope } from "@/lib/api";
import { leerFechaLocal } from "@/lib/format";
import { conToken } from "@/lib/sesion";
import type {
  AsistenteReserva, CondicionCancelacion, ErrorCancelacion, ErrorValoracion, ReservaDetalle,
  ReservaResumen, ResultadoCancelacion,
} from "@/types/reservas";

/**
 * Item crudo de GET /reserva/get (ListarReservaDTO). Los campos nulos del DTO
 * llegan como `null` explícito (NON_NULL sólo aplica al envelope); opcionales
 * igual, por defensivo.
 */
interface ReservaBackend {
  idReserva?: string | null;
  totalReserva?: unknown;
  /** Cuándo se empezó la reserva. Sólo lo trae el listado. */
  fechaHoraInicioReserva?: unknown;
  estadoReserva?: string | null;
  cantPersonas?: unknown;
  actividadFechaHoraInicio?: unknown;
  actividadFechaHoraFin?: unknown;
  nombreActividad?: string | null;
  idActividad?: string | null;
  nombreEstablecimiento?: string | null;
  ubicacionEstablecimiento?: string | null;
}

function aNumero(v: unknown): number {
  // BigDecimal puede venir como número o como string según la config de Jackson.
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : 0;
}

function aResumen(r: ReservaBackend, i: number): ReservaResumen {
  return {
    id: r.idReserva ?? `sin-id-${i}`,
    actividadId: r.idActividad ?? "",
    actividad: r.nombreActividad ?? "",
    establecimiento: r.nombreEstablecimiento ?? "",
    ubicacion: r.ubicacionEstablecimiento ?? "",
    inicio: leerFechaLocal(r.actividadFechaHoraInicio),
    fin: leerFechaLocal(r.actividadFechaHoraFin),
    creada: leerFechaLocal(r.fechaHoraInicioReserva),
    personas: aNumero(r.cantPersonas),
    total: aNumero(r.totalReserva),
    estado: (r.estadoReserva ?? "").trim(),
  };
}

/** De la reserva hecha más recientemente a la más vieja. Sin fecha, al final. */
function ordenar(reservas: ReservaResumen[]): ReservaResumen[] {
  const t = (r: ReservaResumen) => r.creada?.getTime() ?? NaN;
  return [...reservas].sort((a, b) => {
    const ta = t(a);
    const tb = t(b);
    if (Number.isNaN(ta)) return Number.isNaN(tb) ? 0 : 1;
    if (Number.isNaN(tb)) return -1;
    return tb - ta;
  });
}

interface UseReservasReturn {
  /** Siempre definido: `[]` significa "cargó y no hay ninguna". Las hechas más recientemente primero (ver `ordenar`). */
  reservas: ReservaResumen[];
  isLoading: boolean;
  error: string | null;
  /** No hay sesión de Firebase: la pantalla debe redirigir a /acceso. */
  unauthenticated: boolean;
  reload: () => void;
}

/**
 * Reservas del visitante en sesión (GET /reserva/get). El backend lo identifica
 * por el token, así que no lleva parámetros.
 */
export function useReservas(): UseReservasReturn {
  const [nonce, setNonce] = useState(0);
  /** Lo cargado junto con el nonce que lo pidió: mientras no coincida, está cargando. */
  const [cargado, setCargado] = useState<{
    clave: number;
    reservas: ReservaResumen[];
    error: string | null;
    unauthenticated: boolean;
  } | null>(null);

  const alDia = cargado?.clave === nonce;

  useEffect(() => {
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      const fin = (datos: Partial<{ reservas: ReservaResumen[]; error: string; unauthenticated: boolean }>) =>
        setCargado({ clave: nonce, reservas: [], error: null, unauthenticated: false, ...datos });

      if (!user) {
        fin({ unauthenticated: true });
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await apiFetch<unknown>("/reserva/get", { token });
        if (!active) return;
        const env = comoEnvelope<ReservaBackend[]>(res);
        if (!env.ok) {
          fin({ error: env.code ?? "No pudimos cargar tus reservas" });
          return;
        }
        // Envelope ok sin `data` es lista vacía, no error. Las expiradas ya
        // vienen filtradas por el backend.
        fin({ reservas: Array.isArray(env.data) ? ordenar(env.data.map(aResumen)) : [] });
      } catch (e) {
        if (active) fin({ error: e instanceof Error ? e.message : "Error inesperado" });
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return {
    reservas: alDia ? cargado.reservas : [],
    isLoading: !alDia,
    error: alDia ? cargado.error : null,
    unauthenticated: alDia ? cargado.unauthenticated : false,
    reload,
  };
}

/* ---- Detalle ------------------------------------------------------------ */

/** Detalle crudo de GET /reserva/get/{uuid} (ConsultarReservaDTO). */
interface ReservaDetalleBackend extends ReservaBackend {
  idEstablecimiento?: string | null;
  detalleDTOs?: unknown;
  calificada?: boolean | null;
  /** TODO backend: ConsultarReservaDTO no los trae; los nombres son a confirmar. */
  preferenceId?: string | null;
  fechaHoraExpiracion?: unknown;
}

/** Renglón crudo de `detalleDTOs` (ConsultarReservaDetalleDTO). */
interface AsistenteBackend {
  renglon?: unknown;
  nombre?: string | null;
  tipoRangoEtario?: string | null;
  subtotal?: unknown;
}

function aAsistentes(v: unknown): AsistenteReserva[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((a): a is AsistenteBackend => !!a && typeof a === "object")
    .map((a, i) => ({
      // Sin renglón se numera por posición, para que la tabla no muestre ceros.
      renglon: aNumero(a.renglon) || i + 1,
      nombre: a.nombre ?? "",
      rangoEtario: a.tipoRangoEtario ?? "",
      subtotal: aNumero(a.subtotal),
    }))
    .sort((a, b) => a.renglon - b.renglon);
}

function aDetalle(r: ReservaDetalleBackend): ReservaDetalle {
  // Sin vencimiento no se puede saber si el checkout todavía abre: no se ofrece.
  const vence = leerFechaLocal(r.fechaHoraExpiracion);
  return {
    ...aResumen(r, 0),
    establecimientoId: r.idEstablecimiento ?? "",
    asistentes: aAsistentes(r.detalleDTOs),
    calificada: r.calificada === true,
    checkout: r.preferenceId && vence ? { preferenceId: r.preferenceId, vence } : null,
  };
}

/**
 * Sólo se cancela una reserva Pagada cuya actividad todavía no terminó. Es la
 * misma regla que aplica el backend (que igual la valida): acá sólo decide si
 * se muestra el botón. Sin fecha de fin se usa la de inicio; sin ninguna, no.
 */
function esCancelable(r: ReservaDetalle, ahora: number): boolean {
  const limite = r.fin ?? r.inicio;
  return r.estado === "Pagada" && !!limite && limite.getTime() > ahora;
}

/** Se paga una reserva Pendiente cuyo checkout todavía no venció. */
function esPagable(r: ReservaDetalle, ahora: number): boolean {
  return r.estado === "Pendiente" && !!r.checkout && r.checkout.vence.getTime() > ahora;
}

interface UseReservaReturn {
  reserva: ReservaDetalle | null;
  /** Se calcula al llegar la reserva: `Date.now()` no puede ir en el render. */
  cancelable: boolean;
  /** Ídem: muestra el botón para (re)abrir el checkout de Mercado Pago. */
  pagable: boolean;
  isLoading: boolean;
  error: string | null;
  /**
   * El backend contestó 404: el uuid está mal formado, la reserva no existe o
   * es de otro visitante. No distingue entre los tres, y la pantalla tampoco.
   */
  notFound: boolean;
  /** No hay sesión de Firebase: la pantalla debe redirigir a /acceso. */
  unauthenticated: boolean;
  reload: () => void;
  /** Vuelve a pedir la reserva dejando la anterior a la vista mientras tanto (sin esqueleto). */
  refrescar: () => void;
}

/** Detalle de una reserva del visitante en sesión (GET /reserva/get/{uuid}). */
export function useReserva(id: string): UseReservaReturn {
  const [nonce, setNonce] = useState(0);
  const [silencioso, setSilencioso] = useState(false);
  const [cargado, setCargado] = useState<{
    clave: string;
    id: string;
    reserva: ReservaDetalle | null;
    cancelable: boolean;
    pagable: boolean;
    error: string | null;
    notFound: boolean;
    unauthenticated: boolean;
  } | null>(null);

  // Clave con el id: al navegar de una reserva a otra no se ve un frame la anterior.
  const clave = `${nonce}|${id}`;
  const alDia = cargado?.clave === clave;
  // Un `refrescar` deja a la vista lo último que llegó de esta misma reserva.
  const vigente = alDia || (silencioso && cargado?.id === id);

  useEffect(() => {
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      const fin = (
        datos: Partial<{
          reserva: ReservaDetalle; cancelable: boolean; pagable: boolean; error: string; notFound: boolean;
          unauthenticated: boolean;
        }>,
      ) => setCargado({
        clave, id, reserva: null, cancelable: false, pagable: false, error: null, notFound: false,
        unauthenticated: false, ...datos,
      });

      if (!user) {
        fin({ unauthenticated: true });
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await apiFetch<unknown>(`/reserva/get/${encodeURIComponent(id)}`, { token });
        if (!active) return;
        const env = comoEnvelope<ReservaDetalleBackend>(res);
        if (!env.ok) {
          fin(env.code === "notFound" ? { notFound: true } : { error: env.code ?? "No pudimos cargar la reserva" });
          return;
        }
        // Un ok sin `data` no debería pasar; se trata como no encontrada.
        if (!env.data || typeof env.data !== "object") {
          fin({ notFound: true });
          return;
        }
        const reserva = aDetalle(env.data);
        const ahora = Date.now();
        fin({ reserva, cancelable: esCancelable(reserva, ahora), pagable: esPagable(reserva, ahora) });
      } catch (e) {
        if (!active) return;
        if (e instanceof ApiError && (e.status === 404 || e.code === "notFound")) {
          fin({ notFound: true });
          return;
        }
        fin({ error: e instanceof Error ? e.message : "Error inesperado" });
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [clave, id]);

  const reload = useCallback(() => {
    setSilencioso(false);
    setNonce((n) => n + 1);
  }, []);
  const refrescar = useCallback(() => {
    setSilencioso(true);
    setNonce((n) => n + 1);
  }, []);

  const datos = vigente ? cargado : null;
  return {
    reserva: datos?.reserva ?? null,
    cancelable: datos?.cancelable ?? false,
    pagable: datos?.pagable ?? false,
    isLoading: !vigente,
    error: datos?.error ?? null,
    notFound: datos?.notFound ?? false,
    unauthenticated: datos?.unauthenticated ?? false,
    reload,
    refrescar,
  };
}

/* ---- Cancelación --------------------------------------------------------- */

const CONDICIONES: Record<string, CondicionCancelacion> = {
  CancelacionConReembolso: "conReembolso",
  CancelacionSinReembolso: "sinReembolso",
};

const RESULTADOS: Record<string, ResultadoCancelacion> = {
  CanceladaSinReembolso: "sinReembolso",
  ReembolsoRealizado: "reembolsado",
  ReembolsoEnProceso: "reembolsoEnProceso",
  ReembolsoManualProductor: "reembolsoManual",
};

const ERRORES: Record<string, ErrorCancelacion> = {
  notFound: "noEncontrada",
  forbiddenState: "estadoInvalido",
  forbiddenDate: "yaTermino",
};

/** Error de cualquiera de los dos pedidos, ya en nuestro vocabulario. Sin code conocido, técnico. */
function aErrorCancelacion(code: string | undefined): ErrorCancelacion {
  return (code && ERRORES[code]) || "tecnico";
}

type RespuestaCancelacion<T> = { ok: true; valor: T } | { ok: false; error: ErrorCancelacion };

/**
 * Los dos endpoints contestan igual: `{ resultado }` en el envelope, o un 403/404
 * con code. Un `resultado` que no conocemos no es error: se mapea a "desconocido".
 */
async function pedirCancelacion<T>(
  path: string,
  method: "GET" | "POST",
  mapa: Record<string, T>,
  desconocido: T,
): Promise<RespuestaCancelacion<T>> {
  try {
    const res = await conToken((token) => apiFetch<unknown>(path, { method, token }));
    const env = comoEnvelope<{ resultado?: string | null } | null>(res);
    if (!env.ok) return { ok: false, error: aErrorCancelacion(env.code) };
    const resultado = env.data?.resultado ?? "";
    return { ok: true, valor: mapa[resultado] ?? desconocido };
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: aErrorCancelacion(e.code) };
    return { ok: false, error: "tecnico" };
  }
}

/**
 * Cancelación de una reserva del visitante: primero se consulta qué pasaría
 * (GET, no cambia nada) y, si confirma, se cancela (POST). Las dos las dispara
 * el usuario, así que van con `conToken`.
 */
export function useCancelarReserva(idReserva: string) {
  const [cancelando, setCancelando] = useState(false);
  const id = encodeURIComponent(idReserva);

  // Estable por id: el modal la usa como dependencia del efecto que consulta al abrir.
  const consultarCondicion = useCallback(
    () => pedirCancelacion<CondicionCancelacion>(
      `/reserva/cancelarReservaCondicion/${id}`, "GET", CONDICIONES, "desconocida",
    ),
    [id],
  );

  async function cancelar() {
    setCancelando(true);
    try {
      return await pedirCancelacion<ResultadoCancelacion>(
        `/reserva/cancelarReserva/${id}`, "POST", RESULTADOS, "desconocido",
      );
    } finally {
      setCancelando(false);
    }
  }

  return { consultarCondicion, cancelar, cancelando };
}

/* ---- Valoración ---------------------------------------------------------- */

const ERRORES_VALORACION: Record<string, ErrorValoracion> = {
  "CAL.reservaNoFinalizada": "noFinalizada",
  "CAL.yaCalificada": "yaValorada",
  notFound: "noEncontrada",
  validationError: "invalida",
};

function aErrorValoracion(code: string | undefined): ErrorValoracion {
  return (code && ERRORES_VALORACION[code]) || "tecnico";
}

/**
 * Valoración de una reserva Finalizada del visitante (POST
 * /calificaciones/reserva/{uuid}). Se valora una sola vez: después el detalle
 * llega con `calificada`. La reseña es opcional; vacía no se manda, porque el
 * backend exige entre 20 y 2000 caracteres si viene.
 */
export function useValorarReserva(idReserva: string) {
  const [enviando, setEnviando] = useState(false);

  async function valorar(
    puntaje: number,
    resenia: string,
  ): Promise<{ ok: true } | { ok: false; error: ErrorValoracion }> {
    setEnviando(true);
    try {
      const body = resenia ? { puntaje, resenia } : { puntaje };
      const res = await conToken((token) => apiFetch<unknown>(
        `/calificaciones/reserva/${encodeURIComponent(idReserva)}`,
        { method: "POST", token, body: JSON.stringify(body) },
      ));
      const env = comoEnvelope<unknown>(res);
      return env.ok ? { ok: true } : { ok: false, error: aErrorValoracion(env.code) };
    } catch (e) {
      // 2xx con cuerpo vacío: se registró igual.
      if (e instanceof SyntaxError) return { ok: true };
      if (e instanceof ApiError) {
        return { ok: false, error: e.status === 404 ? "noEncontrada" : aErrorValoracion(e.code) };
      }
      return { ok: false, error: "tecnico" };
    } finally {
      setEnviando(false);
    }
  }

  return { valorar, enviando };
}

/* ---- Contrato de POST /reserva/reservar ----------------------------------- */

/** ConsultarReservaDTO tal como lo devuelve el alta de la reserva (lo usa `useCheckout`). */
export interface ConsultarReserva{
  idReserva: string;
  totalReserva: number;
  estadoReserva: string;
  cantPersonas: number;
  detalleDTOs: ConsultarReservaDetalle[];
  actividadFechaHoraInicio: string;
  actividadFechaHoraFin: string;
  nombreActividad: string;
  idActividad: string;
  nombreEstablecimiento: string;
  idEstablecimiento: string;
  ubicacionEstablecimiento: string;
}
interface ConsultarReservaDetalle{
  renglon: number;
  nombre: string;
  tipoRangoEtario: string;
  subtotal: number;
}
