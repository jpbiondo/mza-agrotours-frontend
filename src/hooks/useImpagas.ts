import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch, comoEnvelope } from "@/lib/api";
import { leerFechaLocal } from "@/lib/format";
import type {
  ContactoReembolso, EstadoReembolso, MetodoPago, PagoReembolsoSistema, PersonaReembolso, Reembolso,
  ReembolsoDetalle,
} from "@/types/impagas";

/** Item crudo de GET /admin/reembolsos. Opcionales por defensivo. */
interface ReembolsoBackend {
  idReembolso?: string | null;
  fechaHoraPedido?: unknown;
  montoReembolso?: unknown;
  estado?: string | null;
  fechaHoraEstado?: unknown;
  nombreEstablecimiento?: string | null;
  nombreProductorLider?: string | null;
}

/** El enum del backend, por su nombre crudo. */
const ESTADO: Record<string, EstadoReembolso> = {
  IMPAGO: "impago",
  REEMBOLSADO_SISTEMA: "sistema",
};

function aNumero(v: unknown): number {
  // BigDecimal puede venir como número o como string según la config de Jackson.
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : 0;
}

function aReembolso(r: ReembolsoBackend, i: number): Reembolso | null {
  const estado = ESTADO[(r.estado ?? "").trim()];
  // El backend sólo manda estos dos; otro estado no tiene lugar en la pantalla.
  if (!estado) return null;
  return {
    id: r.idReembolso ?? `sin-id-${i}`,
    estado,
    monto: aNumero(r.montoReembolso),
    fechaPedido: leerFechaLocal(r.fechaHoraPedido),
    fechaEstado: leerFechaLocal(r.fechaHoraEstado),
    establecimiento: r.nombreEstablecimiento ?? "",
    productorLider: r.nombreProductorLider ?? "",
  };
}

interface UseImpagasReturn {
  /**
   * Siempre definido: `[]` significa "cargó y no hay ninguno". En el orden del
   * backend —el que lleva más tiempo en su estado, primero—; no reordenar.
   */
  reembolsos: Reembolso[];
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/** Reembolsos impagos y cubiertos por el sistema (GET /admin/reembolsos). */
export function useImpagas(): UseImpagasReturn {
  const [nonce, setNonce] = useState(0);
  /** Lo cargado junto con el nonce que lo pidió: mientras no coincida, está cargando. */
  const [cargado, setCargado] = useState<{
    clave: number;
    reembolsos: Reembolso[];
    error: string | null;
  } | null>(null);

  const alDia = cargado?.clave === nonce;

  useEffect(() => {
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      const fin = (datos: Partial<{ reembolsos: Reembolso[]; error: string }>) =>
        setCargado({ clave: nonce, reembolsos: [], error: null, ...datos });

      if (!user) {
        fin({ error: "Necesitás iniciar sesión para ver los reembolsos" });
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await apiFetch<unknown>("/admin/reembolsos", { token });
        if (!active) return;
        const env = comoEnvelope<ReembolsoBackend[]>(res);
        if (!env.ok) {
          fin({ error: env.code ?? "No pudimos cargar los reembolsos" });
          return;
        }
        // Envelope ok sin `data` es lista vacía, no error.
        const lista = Array.isArray(env.data) ? env.data : [];
        fin({ reembolsos: lista.map(aReembolso).filter((r): r is Reembolso => r !== null) });
      } catch (e) {
        if (!active) return;
        if (e instanceof ApiError && e.status === 403) {
          fin({ error: "No tenés permiso para ver los reembolsos" });
          return;
        }
        fin({ error: e instanceof Error ? e.message : "Error inesperado" });
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return {
    reembolsos: alDia ? cargado.reembolsos : [],
    isLoading: !alDia,
    error: alDia ? cargado.error : null,
    reload,
  };
}

/* ---- Detalle ------------------------------------------------------------ */

interface ContactoBackend {
  nombre?: string | null;
  telefono?: string | null;
  email?: string | null;
}

interface PersonaBackend {
  nombre?: string | null;
  fechaNacimiento?: string | null;
}

interface PagoBackend {
  idPago?: string | null;
  fechaHoraPago?: unknown;
  metodoPago?: string | null;
}

const METODO: Record<string, MetodoPago> = {
  MANUAL: "manual",
  MERCADO_PAGO: "mercadoPago",
};

function aPago(p: PagoBackend | null | undefined): PagoReembolsoSistema | null {
  if (!p || typeof p !== "object") return null;
  return {
    id: p.idPago ?? "",
    fecha: leerFechaLocal(p.fechaHoraPago),
    metodo: METODO[(p.metodoPago ?? "").trim()] ?? null,
  };
}

/** Detalle crudo de GET /admin/reembolsos/{id}. */
interface ReembolsoDetalleBackend extends Omit<ReembolsoBackend, "nombreProductorLider"> {
  pagoReembolsoSistema?: PagoBackend | null;
  idReserva?: string | null;
  nombreActividad?: string | null;
  actividadFechaHoraInicio?: unknown;
  actividadFechaHoraFin?: unknown;
  visitante?: ContactoBackend | null;
  productorLider?: ContactoBackend | null;
  personas?: unknown;
}

function aContacto(c: ContactoBackend | null | undefined): ContactoReembolso {
  return {
    nombre: c?.nombre?.trim() ?? "",
    telefono: c?.telefono?.trim() ?? "",
    email: c?.email?.trim() ?? "",
  };
}

/** En el orden en que vienen, que es el de la reserva: no reordenar. */
function aPersonas(v: unknown): PersonaReembolso[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((p): p is PersonaBackend => !!p && typeof p === "object")
    .map((p) => ({ nombre: p.nombre ?? "", fechaNacimiento: p.fechaNacimiento ?? null }));
}

function aDetalle(r: ReembolsoDetalleBackend): ReembolsoDetalle | null {
  const base = aReembolso(r, 0);
  if (!base) return null;
  return {
    ...base,
    reservaId: r.idReserva ?? "",
    actividad: r.nombreActividad ?? "",
    inicio: leerFechaLocal(r.actividadFechaHoraInicio),
    fin: leerFechaLocal(r.actividadFechaHoraFin),
    visitante: aContacto(r.visitante),
    productorLider: r.productorLider ? aContacto(r.productorLider) : null,
    personas: aPersonas(r.personas),
    // Un impago no tiene pago aunque viniera uno: la pantalla no lo muestra.
    pago: base.estado === "sistema" ? aPago(r.pagoReembolsoSistema) : null,
  };
}

interface UseReembolsoReturn {
  reembolso: ReembolsoDetalle | null;
  isLoading: boolean;
  error: string | null;
  /**
   * El reembolso no existe, ya no está impago ni cubierto por el sistema (se
   * resolvió por otro lado), o el id está mal formado. La pantalla no los distingue.
   */
  notFound: boolean;
  reload: () => void;
}

/** Detalle de un reembolso impago o cubierto por el sistema. */
export function useReembolso(id: string): UseReembolsoReturn {
  const [nonce, setNonce] = useState(0);
  const [cargado, setCargado] = useState<{
    clave: string;
    reembolso: ReembolsoDetalle | null;
    error: string | null;
    notFound: boolean;
  } | null>(null);

  // Clave con el id: al pasar de un reembolso a otro no se ve un frame el anterior.
  const clave = `${nonce}|${id}`;
  const alDia = cargado?.clave === clave;

  useEffect(() => {
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      const fin = (datos: Partial<{ reembolso: ReembolsoDetalle; error: string; notFound: boolean }>) =>
        setCargado({ clave, reembolso: null, error: null, notFound: false, ...datos });

      if (!user) {
        fin({ error: "Necesitás iniciar sesión para ver el reembolso" });
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await apiFetch<unknown>(`/admin/reembolsos/${encodeURIComponent(id)}`, { token });
        if (!active) return;
        const env = comoEnvelope<ReembolsoDetalleBackend>(res);
        if (!env.ok) {
          fin(env.code === "reembolsoNotFound" ? { notFound: true } : { error: env.code ?? "No pudimos cargar el reembolso" });
          return;
        }
        // Sin `data`, o con un estado que no es de esta pantalla: no encontrado.
        const reembolso = env.data && typeof env.data === "object" ? aDetalle(env.data) : null;
        fin(reembolso ? { reembolso } : { notFound: true });
      } catch (e) {
        if (!active) return;
        // 400 es un uuid mal formado: para quien pegó el link, es lo mismo que no existir.
        if (e instanceof ApiError && (e.status === 404 || e.status === 400 || e.code === "reembolsoNotFound")) {
          fin({ notFound: true });
          return;
        }
        if (e instanceof ApiError && e.status === 403) {
          fin({ error: "No tenés permiso para ver los reembolsos" });
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
    reembolso: alDia ? cargado.reembolso : null,
    isLoading: !alDia,
    error: alDia ? cargado.error : null,
    notFound: alDia ? cargado.notFound : false,
    reload,
  };
}

// TODO backend: cargar la transferencia de un reembolso impago (US-RESE-10).
