import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch, comoEnvelope } from "@/lib/api";
import { aFechaLocal, leerFechaLocal } from "@/lib/format";
import { conToken } from "@/lib/sesion";
import type {
  DatosResolverDeuda, Deuda, DeudaDetalle, EstadoDeuda, EstadoHistorialDeuda, PagoDeuda, TipoResolucionDeuda,
} from "@/types/deudas";

/** Item crudo de GET /admin/deudas. Opcionales por defensivo. */
interface DeudaBackend {
  id?: string | null;
  fechaCreacionDeuda?: unknown;
  establecimientoDeudorNombre?: string | null;
  montoTotal?: unknown;
  montoDevuelto?: unknown;
  estado?: string | null;
}

/** El enum del backend, por su nombre crudo. */
const ESTADO: Record<string, EstadoDeuda> = {
  SIN_DEVOLVER: "sin_devolver",
  DEVOLUCION_PARCIAL: "parcial",
  DEVOLUCION_TOTAL: "total",
  ACUERDO_MEDIO: "acuerdo",
};

function aEstado(v: unknown): EstadoDeuda | undefined {
  return typeof v === "string" ? ESTADO[v.trim()] : undefined;
}

function aNumero(v: unknown): number {
  // BigDecimal puede venir como número o como string según la config de Jackson.
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : 0;
}

function aDeuda(d: DeudaBackend, i: number, estado: EstadoDeuda): Deuda {
  return {
    id: d.id ?? `sin-id-${i}`,
    fecha: leerFechaLocal(d.fechaCreacionDeuda),
    deudor: d.establecimientoDeudorNombre?.trim() ?? "",
    montoTotal: aNumero(d.montoTotal),
    montoDevuelto: aNumero(d.montoDevuelto),
    estado,
  };
}

interface UseDeudasReturn {
  /**
   * Siempre definido: `[]` significa "cargó y no hay ninguna". En el orden del
   * backend —la más vieja primero—; no reordenar.
   */
  deudas: Deuda[];
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/** Deudas de todos los establecimientos (GET /admin/deudas). */
export function useDeudas(): UseDeudasReturn {
  const [nonce, setNonce] = useState(0);
  /** Lo cargado junto con el nonce que lo pidió: mientras no coincida, está cargando. */
  const [cargado, setCargado] = useState<{
    clave: number;
    deudas: Deuda[];
    error: string | null;
  } | null>(null);

  const alDia = cargado?.clave === nonce;

  useEffect(() => {
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      const fin = (datos: Partial<{ deudas: Deuda[]; error: string }>) =>
        setCargado({ clave: nonce, deudas: [], error: null, ...datos });

      if (!user) {
        fin({ error: "Necesitás iniciar sesión para ver las deudas" });
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await apiFetch<unknown>("/admin/deudas", { token });
        if (!active) return;
        const env = comoEnvelope<DeudaBackend[]>(res);
        if (!env.ok) {
          fin({ error: env.code ?? "No pudimos cargar las deudas" });
          return;
        }
        // Envelope ok sin `data` es lista vacía, no error.
        const lista = Array.isArray(env.data) ? env.data : [];
        const deudas: Deuda[] = [];
        lista.forEach((d, i) => {
          // Un estado que no conocemos no tiene badge ni filtro: se saltea.
          const estado = d && typeof d === "object" ? aEstado(d.estado) : undefined;
          if (estado) deudas.push(aDeuda(d, i, estado));
        });
        fin({ deudas });
      } catch (e) {
        if (!active) return;
        if (e instanceof ApiError && e.status === 403) {
          fin({ error: "No tenés permiso para ver las deudas" });
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
    deudas: alDia ? cargado.deudas : [],
    isLoading: !alDia,
    error: alDia ? cargado.error : null,
    reload,
  };
}

/* ---- Detalle ------------------------------------------------------------ */

interface EstadoHistorialBackend {
  nombre?: string | null;
  fechaHoraInicio?: unknown;
  fechaHoraFin?: unknown;
  montoDevueltoTransaccion?: unknown;
  motivo?: string | null;
  pago?: PagoBackend | null;
}

interface PagoBackend {
  idPago?: string | null;
  fechaHoraPago?: unknown;
  idPagoExterno?: string | null;
  monto?: unknown;
  metodoPago?: string | null;
  fechaHoraCarga?: unknown;
  administrador?: string | null;
}

function aPago(p: PagoBackend | null | undefined): PagoDeuda | null {
  if (!p || typeof p !== "object") return null;
  return {
    id: p.idPago ?? "",
    monto: aNumero(p.monto),
    fecha: leerFechaLocal(p.fechaHoraPago),
    metodo: p.metodoPago?.trim() ?? "",
    idExterno: p.idPagoExterno?.trim() ?? "",
    fechaCarga: leerFechaLocal(p.fechaHoraCarga),
    administrador: p.administrador?.trim() ?? "",
  };
}

/** Detalle crudo de GET /admin/deudas/{id}. El estado actual es el último del historial. */
interface DeudaDetalleBackend extends Omit<DeudaBackend, "estado"> {
  estados?: unknown;
}

/** En el orden en que vienen, del más viejo al más nuevo: no reordenar. */
function aHistorial(v: unknown): EstadoHistorialDeuda[] {
  if (!Array.isArray(v)) return [];
  const historial: EstadoHistorialDeuda[] = [];
  for (const e of v as EstadoHistorialBackend[]) {
    const estado = e && typeof e === "object" ? aEstado(e.nombre) : undefined;
    if (!estado) continue;
    historial.push({
      estado,
      desde: leerFechaLocal(e.fechaHoraInicio),
      hasta: leerFechaLocal(e.fechaHoraFin),
      montoTransaccion: aNumero(e.montoDevueltoTransaccion),
      motivo: typeof e.motivo === "string" ? e.motivo.trim() : "",
      pago: aPago(e.pago),
    });
  }
  return historial;
}

function aDetalle(d: DeudaDetalleBackend): DeudaDetalle | null {
  const historial = aHistorial(d.estados);
  const actual = historial.at(-1);
  // Sin un estado legible no hay con qué pintar la cabecera.
  if (!actual) return null;
  return { ...aDeuda(d, 0, actual.estado), historial };
}

interface UseDeudaReturn {
  deuda: DeudaDetalle | null;
  isLoading: boolean;
  error: string | null;
  /** La deuda no existe o el id está mal formado. La pantalla no los distingue. */
  notFound: boolean;
  reload: () => void;
  /** Pisa el detalle con uno que ya devolvió una escritura, sin volver a pedirlo. */
  reemplazar: (d: DeudaDetalle) => void;
}

/** Detalle de una deuda con su historial de estados (GET /admin/deudas/{id}). */
export function useDeuda(id: string): UseDeudaReturn {
  const [nonce, setNonce] = useState(0);
  const [cargado, setCargado] = useState<{
    clave: string;
    deuda: DeudaDetalle | null;
    error: string | null;
    notFound: boolean;
  } | null>(null);

  // Clave con el id: al pasar de una deuda a otra no se ve un frame la anterior.
  const clave = `${nonce}|${id}`;
  const alDia = cargado?.clave === clave;

  useEffect(() => {
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      const fin = (datos: Partial<{ deuda: DeudaDetalle; error: string; notFound: boolean }>) =>
        setCargado({ clave, deuda: null, error: null, notFound: false, ...datos });

      if (!user) {
        fin({ error: "Necesitás iniciar sesión para ver la deuda" });
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await apiFetch<unknown>(`/admin/deudas/${encodeURIComponent(id)}`, { token });
        if (!active) return;
        const env = comoEnvelope<DeudaDetalleBackend>(res);
        if (!env.ok) {
          fin(env.code === "entityNotFound" ? { notFound: true } : { error: env.code ?? "No pudimos cargar la deuda" });
          return;
        }
        const deuda = env.data && typeof env.data === "object" ? aDetalle(env.data) : null;
        fin(deuda ? { deuda } : { notFound: true });
      } catch (e) {
        if (!active) return;
        // 400 es un uuid mal formado: para quien pegó el link, es lo mismo que no existir.
        if (e instanceof ApiError && (e.status === 404 || e.status === 400 || e.code === "entityNotFound")) {
          fin({ notFound: true });
          return;
        }
        if (e instanceof ApiError && e.status === 403) {
          fin({ error: "No tenés permiso para ver las deudas" });
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
  // Con la clave vigente: queda al día sin disparar el efecto.
  const reemplazar = useCallback(
    (deuda: DeudaDetalle) => setCargado({ clave, deuda, error: null, notFound: false }),
    [clave],
  );

  return {
    deuda: alDia ? cargado.deuda : null,
    isLoading: !alDia,
    error: alDia ? cargado.error : null,
    notFound: alDia ? cargado.notFound : false,
    reload,
    reemplazar,
  };
}

/* ---- Resolver una deuda ------------------------------------------------- */

const TIPO: Record<TipoResolucionDeuda, string> = {
  devolucion: "DEVOLUCION",
  acuerdo: "ACUERDO_MEDIO",
};

/** Campos que puede rechazar el backend → los del formulario. */
export type CampoResolverDeuda = "motivo" | "fecha" | "monto" | "metodo" | "idExterno";

const CAMPO: Record<string, CampoResolverDeuda> = {
  motivo: "motivo",
  "pago.fechaHoraPago": "fecha",
  "pago.monto": "monto",
  "pago.metodoPago": "metodo",
  "pago.idPagoExterno": "idExterno",
};

export interface ResultadoResolverDeuda {
  ok: boolean;
  /** Sólo si `ok`: el detalle ya actualizado, o `null` si vino sin un detalle legible. */
  deuda?: DeudaDetalle | null;
  code?: string;
  status?: number;
  /** El `message` del backend, si vino. */
  mensaje?: string;
  /** En `validationError`: el mensaje de cada campo que rechazó. */
  errores?: Partial<Record<CampoResolverDeuda, string>>;
  /** Mensajes de `validationError` de campos que el formulario no tiene. */
  otros?: string[];
}

function comoRechazo(status: number | undefined, body: unknown): ResultadoResolverDeuda {
  const b = (body ?? {}) as { code?: unknown; message?: unknown; data?: unknown };
  const code = typeof b.code === "string" ? b.code : undefined;
  const r: ResultadoResolverDeuda = {
    ok: false,
    code,
    status,
    mensaje: typeof b.message === "string" && b.message.trim() ? b.message.trim() : undefined,
  };
  if (code === "validationError" && b.data && typeof b.data === "object") {
    const errores: ResultadoResolverDeuda["errores"] = {};
    const otros: string[] = [];
    for (const [campo, msg] of Object.entries(b.data as Record<string, unknown>)) {
      if (typeof msg !== "string" || !msg.trim()) continue;
      const nuestro = CAMPO[campo];
      if (nuestro) errores[nuestro] = msg.trim();
      else otros.push(msg.trim());
    }
    r.errores = errores;
    r.otros = otros;
  }
  return r;
}

/**
 * Registra una devolución o un acuerdo medio sobre una deuda
 * (POST /admin/deudas/{id}/cambio-estado). Devuelve el detalle ya con el
 * estado nuevo para pisar el de la pantalla sin volver a pedirlo.
 */
export function useResolverDeuda() {
  const [isLoading, setIsLoading] = useState(false);

  async function resolver(id: string, datos: DatosResolverDeuda): Promise<ResultadoResolverDeuda> {
    setIsLoading(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(`/admin/deudas/${encodeURIComponent(id)}/cambio-estado`, {
          method: "POST",
          token,
          body: JSON.stringify({
            tipo: TIPO[datos.tipo],
            motivo: datos.motivo,
            pago: datos.pago && {
              fechaHoraPago: aFechaLocal(datos.pago.fecha),
              monto: datos.pago.monto,
              metodoPago: datos.pago.metodo,
              idPagoExterno: datos.pago.idExterno,
            },
          }),
        }),
      );
      const env = comoEnvelope<DeudaDetalleBackend>(res);
      if (!env.ok) return comoRechazo(undefined, res);
      return { ok: true, deuda: env.data && typeof env.data === "object" ? aDetalle(env.data) : null };
    } catch (e) {
      if (e instanceof ApiError) return comoRechazo(e.status, e.body);
      // `apiFetch` sólo llega a res.json() con un 2xx: un error de parseo es un
      // cambio registrado y contestado sin cuerpo.
      if (e instanceof SyntaxError) return { ok: true, deuda: null };
      return { ok: false };
    } finally {
      setIsLoading(false);
    }
  }

  return { resolver, isLoading };
}
