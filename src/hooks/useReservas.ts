import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch, comoEnvelope } from "@/lib/api";
import type { AsistenteReserva, ReservaDetalle, ReservaResumen } from "@/types/reservas";

/**
 * Item crudo de GET /reserva/get (ListarReservaDTO). Los campos nulos del DTO
 * llegan como `null` explícito (NON_NULL sólo aplica al envelope); opcionales
 * igual, por defensivo.
 */
interface ReservaBackend {
  idReserva?: string | null;
  totalReserva?: unknown;
  estadoReserva?: string | null;
  cantPersonas?: unknown;
  actividadFechaHoraInicio?: unknown;
  actividadFechaHoraFin?: unknown;
  nombreActividad?: string | null;
  idActividad?: string | null;
  nombreEstablecimiento?: string | null;
  ubicacionEstablecimiento?: string | null;
}

/**
 * `LocalDateTime` del backend ("2026-10-12T09:30:00", sin offset) como hora
 * local. Se arma a mano en vez de confiar en `Date.parse`, que según el formato
 * exacto puede interpretarlo como UTC y correr la hora.
 */
function aFechaLocal(v: unknown): Date | null {
  if (typeof v !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(v.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  return new Date(+y, +mo - 1, +d, +h, +mi, s ? +s : 0);
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
    inicio: aFechaLocal(r.actividadFechaHoraInicio),
    fin: aFechaLocal(r.actividadFechaHoraFin),
    personas: aNumero(r.cantPersonas),
    total: aNumero(r.totalReserva),
    estado: (r.estadoReserva ?? "").trim(),
  };
}

/**
 * Primero las que todavía no ocurrieron, de la más cercana a la más lejana;
 * después las pasadas, de la más reciente a la más vieja. Sin fecha, al final.
 */
function ordenar(reservas: ReservaResumen[], ahora: number): ReservaResumen[] {
  const t = (r: ReservaResumen) => r.inicio?.getTime() ?? NaN;
  return [...reservas].sort((a, b) => {
    const ta = t(a);
    const tb = t(b);
    if (Number.isNaN(ta)) return Number.isNaN(tb) ? 0 : 1;
    if (Number.isNaN(tb)) return -1;
    const fa = ta >= ahora;
    const fb = tb >= ahora;
    if (fa !== fb) return fa ? -1 : 1;
    return fa ? ta - tb : tb - ta;
  });
}

interface UseReservasReturn {
  /** Siempre definido: `[]` significa "cargó y no hay ninguna". Próximas primero (ver `ordenar`). */
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
        // Envelope ok sin `data` es lista vacía, no error. El corte entre
        // próximas y pasadas se toma al llegar los datos.
        fin({ reservas: Array.isArray(env.data) ? ordenar(env.data.map(aResumen), Date.now()) : [] });
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
  return {
    ...aResumen(r, 0),
    establecimientoId: r.idEstablecimiento ?? "",
    asistentes: aAsistentes(r.detalleDTOs),
  };
}

interface UseReservaReturn {
  reserva: ReservaDetalle | null;
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
}

/** Detalle de una reserva del visitante en sesión (GET /reserva/get/{uuid}). */
export function useReserva(id: string): UseReservaReturn {
  const [nonce, setNonce] = useState(0);
  const [cargado, setCargado] = useState<{
    clave: string;
    reserva: ReservaDetalle | null;
    error: string | null;
    notFound: boolean;
    unauthenticated: boolean;
  } | null>(null);

  // Clave con el id: al navegar de una reserva a otra no se ve un frame la anterior.
  const clave = `${nonce}|${id}`;
  const alDia = cargado?.clave === clave;

  useEffect(() => {
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      const fin = (
        datos: Partial<{ reserva: ReservaDetalle; error: string; notFound: boolean; unauthenticated: boolean }>,
      ) => setCargado({ clave, reserva: null, error: null, notFound: false, unauthenticated: false, ...datos });

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
        fin(env.data && typeof env.data === "object" ? { reserva: aDetalle(env.data) } : { notFound: true });
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

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return {
    reserva: alDia ? cargado.reserva : null,
    isLoading: !alDia,
    error: alDia ? cargado.error : null,
    notFound: alDia ? cargado.notFound : false,
    unauthenticated: alDia ? cargado.unauthenticated : false,
    reload,
  };
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
