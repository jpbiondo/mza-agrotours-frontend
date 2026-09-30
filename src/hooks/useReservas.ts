import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { apiFetch, comoEnvelope } from "@/lib/api";
import type { ReservaResumen } from "@/types/reservas";

/** Item crudo de GET /reserva/get (ListarReservaDTO). Campos opcionales: defensivo. */
interface ReservaBackend {
  idReserva?: string;
  totalReserva?: unknown;
  estadoReserva?: string;
  cantPersonas?: unknown;
  actividadFechaHoraInicio?: unknown;
  actividadFechaHoraFin?: unknown;
  nombreActividad?: string;
  idActividad?: string;
  nombreEstablecimiento?: string;
  ubicacionEstablecimiento?: string;
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

/* ---- Mutaciones -------------------------------------------------------- */

export function useCancelarReserva() {
  const [isLoading, setIsLoading] = useState(false);

  async function cancelar(reservaId: string): Promise<void> {
    setIsLoading(true);
    try {
      await mockCancelar(reservaId);
    } finally {
      setIsLoading(false);
    }
  }

  return { cancelar, isLoading };
}

// MOCK — reemplazar por fetch(`/api/reservas/${id}/cancelar`, { method: "POST" })
async function mockCancelar(_reservaId: string): Promise<void> {
  await new Promise<void>((res) => setTimeout(res, 700));
}

export interface ConsultarReserva{
  idReserva: string;
  totalReserva: number;
  estadoReserva: string;
  cantPersonas: number;
  detalleDTOs: ConsultarReservaDetalle[];
  fechaHoraInicio: string;
  fechaHoraFin: string;
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

export interface ValoracionPayload {
  reservaId: string;
  rating: number;
  comentario: string;
}

export function useValorarActividad() {
  const [isLoading, setIsLoading] = useState(false);

  async function valorar(payload: ValoracionPayload): Promise<void> {
    setIsLoading(true);
    try {
      await mockValorar(payload);
    } finally {
      setIsLoading(false);
    }
  }

  return { valorar, isLoading };
}

// MOCK — reemplazar por fetch(`/api/reservas/${reservaId}/valoracion`, { method: "POST", body })
async function mockValorar(_payload: ValoracionPayload): Promise<void> {
  await new Promise<void>((res) => setTimeout(res, 1000));
}
