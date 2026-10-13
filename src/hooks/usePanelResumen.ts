import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { apiFetch, comoEnvelope } from "@/lib/api";
import { leerFechaLocal } from "@/lib/format";
import type {
  DiaReservas, PendientesPanel, ReseniaReciente, ReseniasPanel, ReservaProxima, ResumenPanel,
} from "@/types/panel";

function resumenDe(establecimientoId: string): string {
  return `/establecimientos/${encodeURIComponent(establecimientoId)}/panel/resumen`;
}

/** Respuesta cruda (`DTOResumenPanelProductor`). Campos opcionales: defensivo. */
interface ResumenBackend {
  pendientes?: PendientesBackend;
  proximasReservas?: unknown;
  resenias?: ReseniasBackend;
}

interface PendientesBackend {
  reembolsosPendientes?: unknown;
  reembolsoMasAntiguo?: unknown;
  actividadesBorrador?: unknown;
  mercadoPagoVinculado?: unknown;
  mercadoPagoTokenExpira?: unknown;
}

interface GrupoBackend {
  fecha?: unknown;
  reservas?: unknown;
}

interface ReservaBackend {
  reservaId?: unknown;
  actividadId?: unknown;
  actividadDiaId?: unknown;
  fechaHoraInicio?: unknown;
  actividadNombre?: unknown;
  visitanteNombre?: unknown;
  personas?: unknown;
}

interface ReseniasBackend {
  promedio?: unknown;
  total?: unknown;
  ultimas?: unknown;
}

interface ReseniaBackend {
  puntaje?: unknown;
  resenia?: unknown;
  fecha?: unknown;
  visitanteNombre?: unknown;
  actividadNombre?: unknown;
}

const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const p2 = (x: number) => String(x).padStart(2, "0");

/** `LocalDate` del backend, como string ISO o como `[año, mes, día]`, a "AAAA-MM-DD". */
function aFecha(v: unknown): string | null {
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.trim())) return v.trim();
  if (Array.isArray(v) && v.length >= 3 && v.every((x) => typeof x === "number")) {
    return `${v[0]}-${p2(v[1])}-${p2(v[2])}`;
  }
  return null;
}

/** Sólo los objetos de una lista: lo demás no se puede mapear. */
function objetos<T>(v: unknown): T[] {
  return Array.isArray(v) ? v.filter((x): x is T => !!x && typeof x === "object") : [];
}

function aPendientes(p: PendientesBackend | undefined): PendientesPanel {
  return {
    reembolsos: num(p?.reembolsosPendientes),
    reembolsoMasAntiguo: leerFechaLocal(p?.reembolsoMasAntiguo),
    borradores: num(p?.actividadesBorrador),
    mercadoPagoVinculado: p?.mercadoPagoVinculado === true,
    mercadoPagoTokenExpira: leerFechaLocal(p?.mercadoPagoTokenExpira),
  };
}

function aReserva(r: ReservaBackend, i: number): ReservaProxima {
  return {
    id: texto(r.reservaId) || `sin-id-${i}`,
    actividadId: texto(r.actividadId),
    actividadDiaId: texto(r.actividadDiaId),
    inicio: leerFechaLocal(r.fechaHoraInicio),
    actividad: texto(r.actividadNombre),
    visitante: texto(r.visitanteNombre),
    personas: num(r.personas),
  };
}

/** Los grupos sin fecha legible se descartan: no hay bajo qué día mostrarlos. */
function aDias(v: unknown): DiaReservas[] {
  return objetos<GrupoBackend>(v)
    .map((g) => ({ fecha: aFecha(g.fecha), reservas: objetos<ReservaBackend>(g.reservas).map(aReserva) }))
    .filter((g): g is DiaReservas => g.fecha !== null && g.reservas.length > 0);
}

function aResenia(r: ReseniaBackend): ReseniaReciente {
  return {
    puntaje: num(r.puntaje),
    texto: texto(r.resenia),
    fecha: leerFechaLocal(r.fecha),
    visitante: texto(r.visitanteNombre),
    actividad: texto(r.actividadNombre),
  };
}

function aResenias(r: ReseniasBackend | undefined): ReseniasPanel {
  return {
    // `null` es un dato: todavía no hay reseñas con las que promediar.
    promedio: typeof r?.promedio === "number" && Number.isFinite(r.promedio) ? r.promedio : null,
    total: num(r?.total),
    ultimas: objetos<ReseniaBackend>(r?.ultimas).map(aResenia),
  };
}

function aResumen(r: ResumenBackend): ResumenPanel {
  return {
    pendientes: aPendientes(r.pendientes),
    proximas: aDias(r.proximasReservas),
    resenias: aResenias(r.resenias),
  };
}

interface UsePanelResumenReturn {
  data: ResumenPanel | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * GET /establecimientos/{id}/panel/resumen: lo que el inicio del panel muestra
 * del establecimiento —pendientes, próximas reservas y reseñas— en un solo
 * pedido. Los KPIs no vienen acá: salen de las estadísticas, que son sólo del
 * Productor Líder.
 *
 * Con el id vacío —sin establecimiento elegido— no se pide nada.
 */
export function usePanelResumen(establecimientoId: string): UsePanelResumenReturn {
  const [nonce, setNonce] = useState(0);
  /**
   * Lo cargado, con la clave de la petición que lo trajo: mientras no coincida
   * con la actual, la pantalla está cargando. Así, al cambiar de
   * establecimiento, no se ven un frame las reservas del anterior.
   */
  const [cargado, setCargado] = useState<{
    clave: string;
    data: ResumenPanel | null;
    error: string | null;
  } | null>(null);

  const path = establecimientoId ? resumenDe(establecimientoId) : null;
  const clave = path ? `${nonce}|${path}` : "";
  const alDia = !!clave && cargado?.clave === clave;

  useEffect(() => {
    if (!path) return;
    let active = true;
    const fin = (datos: { data?: ResumenPanel; error?: string }) =>
      setCargado({ clave, data: datos.data ?? null, error: datos.error ?? null });

    // La lectura sale al montar la pantalla: `auth.currentUser` todavía puede
    // estar vacío y el pedido iría sin token.
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        fin({ error: "Necesitás iniciar sesión para ver tu panel" });
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await apiFetch<unknown>(path, { token });
        if (!active) return;
        const env = comoEnvelope<ResumenBackend>(res);
        if (!env.ok || !env.data) {
          fin({ error: env.code ?? "No pudimos cargar tu panel" });
          return;
        }
        fin({ data: aResumen(env.data) });
      } catch (e) {
        if (active) fin({ error: e instanceof Error ? e.message : "Error inesperado" });
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [clave, path]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return {
    data: alDia ? cargado.data : null,
    isLoading: !!path && !alDia,
    error: alDia ? cargado.error : null,
    reload,
  };
}
