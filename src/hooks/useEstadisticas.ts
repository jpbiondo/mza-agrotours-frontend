import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { apiFetch, comoEnvelope } from "@/lib/api";
import {
  estadisticasACsv, estadisticasAPdf, estadisticasAXlsx, type AlcanceReporte, type EncabezadoReporte,
} from "@/lib/reporteEstadisticas";
import type { ActividadPerf, BarDatum, Estadisticas, Kpis, Periodo, RangoFechas, Serie } from "@/types/estadisticas";

/** Cómo nombra el backend cada período (`PeriodoRango`). */
const PERIODO_BACKEND: Record<Periodo, string> = {
  "30d": "TREINTA_D",
  "6m": "SEIS_M",
  "12m": "DOCE_M",
};

function estadisticasDe(establecimientoId: string, periodo: Periodo): string {
  return `/estadisticas-productores/${encodeURIComponent(establecimientoId)}?periodo=${PERIODO_BACKEND[periodo]}`;
}

/** Respuesta cruda. Campos opcionales: defensivo. */
interface EstadisticasBackend {
  periodo?: PeriodoBackend;
  kpis?: KpisBackend;
  serie?: SerieBackend;
  actividades?: unknown;
}

interface PeriodoBackend {
  desde?: unknown;
  hasta?: unknown;
  desdeAnterior?: unknown;
  hastaAnterior?: unknown;
}

interface KpisBackend {
  ocupacionFilled?: unknown;
  ocupacionTotal?: unknown;
  ocupacionPct?: unknown;
  beneficios?: unknown;
  beneficiosDelta?: unknown;
  cancelacionCount?: unknown;
  cancelacionPct?: unknown;
}

interface SerieBackend {
  title?: unknown;
  sub?: unknown;
  bars?: unknown;
}

interface BarraBackend {
  label?: unknown;
  value?: unknown;
  ganancia?: unknown;
}

interface ActividadBackend {
  id?: unknown;
  nombre?: unknown;
  cultivo?: unknown;
  cupos?: unknown;
  reservas?: unknown;
  ocupacion?: unknown;
  ingresos?: unknown;
}

/** Los `BigDecimal` pueden llegar como número o como string según el serializador. */
function aNumero(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

const num = (v: unknown) => aNumero(v) ?? 0;
const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const p2 = (x: number) => String(x).padStart(2, "0");

/** `LocalDate` del backend, como string ISO o como `[año, mes, día]`, a "AAAA-MM-DD". */
function aFecha(v: unknown): string | null {
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.trim())) return v.trim();
  if (Array.isArray(v) && v.length >= 3 && v.every((x) => typeof x === "number")) {
    return `${v[0]}-${p2(v[1])}-${p2(v[2])}`;
  }
  return null;
}

/** El día anterior a una fecha ISO, en hora local para no correrse por el huso. */
function diaAnterior(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const f = new Date(y, m - 1, d - 1);
  return `${f.getFullYear()}-${p2(f.getMonth() + 1)}-${p2(f.getDate())}`;
}

function aRango(p: PeriodoBackend | undefined): { actual: RangoFechas; anterior: RangoFechas | null } {
  const desde = aFecha(p?.desde) ?? "";
  const hasta = aFecha(p?.hasta) ?? "";
  const desdeAnt = aFecha(p?.desdeAnterior);
  const hastaAnt = aFecha(p?.hastaAnterior);
  return {
    actual: { desde, hasta },
    // El backend cierra el rango anterior en el día en que arranca el actual,
    // como cota exclusiva: el último día que de verdad cuenta es el previo.
    anterior: desdeAnt && hastaAnt ? { desde: desdeAnt, hasta: diaAnterior(hastaAnt) } : null,
  };
}

function aKpis(k: KpisBackend | undefined): Kpis {
  return {
    ocupacionPct: num(k?.ocupacionPct),
    ocupacionFilled: num(k?.ocupacionFilled),
    ocupacionTotal: num(k?.ocupacionTotal),
    beneficios: num(k?.beneficios),
    // `null` es un dato: el período anterior no tuvo ingresos.
    beneficiosDelta: aNumero(k?.beneficiosDelta),
    cancelacionPct: num(k?.cancelacionPct),
    cancelacionCount: num(k?.cancelacionCount),
  };
}

function aSerie(s: SerieBackend | undefined): Serie {
  const bars: BarDatum[] = Array.isArray(s?.bars)
    ? s.bars
        .filter((b): b is BarraBackend => !!b && typeof b === "object")
        .map((b) => ({ label: texto(b.label), value: num(b.value), ganancia: num(b.ganancia) }))
    : [];
  return { title: texto(s?.title), sub: texto(s?.sub), bars };
}

function aActividades(v: unknown): ActividadPerf[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((a): a is ActividadBackend => !!a && typeof a === "object")
    .map((a, i) => ({
      id: texto(a.id) || `sin-id-${i}`,
      nombre: texto(a.nombre),
      cultivo: texto(a.cultivo),
      cupos: num(a.cupos),
      reservas: num(a.reservas),
      ocupacion: num(a.ocupacion),
      ingresos: num(a.ingresos),
    }))
    // Es un ranking de ocupación: la que más llena, arriba.
    .sort((a, b) => b.ocupacion - a.ocupacion || b.ingresos - a.ingresos);
}

function aEstadisticas(r: EstadisticasBackend): Estadisticas {
  return {
    ...aRango(r.periodo),
    kpis: aKpis(r.kpis),
    serie: aSerie(r.serie),
    actividades: aActividades(r.actividades),
  };
}

interface UseEstadisticasReturn {
  data: Estadisticas | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * GET /estadisticas-productores/{id}?periodo=…: KPIs, serie y performance por
 * actividad del establecimiento, todo en una sola respuesta. Cada cambio de
 * período es un pedido nuevo: el backend calcula los rangos contra hoy.
 *
 * Con el id vacío —sin establecimiento o sin ser su titular— no se pide nada.
 */
export function useEstadisticas(establecimientoId: string, periodo: Periodo): UseEstadisticasReturn {
  const [nonce, setNonce] = useState(0);
  /**
   * Lo cargado, con la clave de la petición que lo trajo: mientras no coincida
   * con la actual, la pantalla está cargando. Así, al cambiar de período, no se
   * ven un frame los números del anterior bajo el rótulo del nuevo.
   */
  const [cargado, setCargado] = useState<{
    clave: string;
    data: Estadisticas | null;
    error: string | null;
  } | null>(null);

  const path = establecimientoId ? estadisticasDe(establecimientoId, periodo) : null;
  const clave = path ? `${nonce}|${path}` : "";
  const alDia = !!clave && cargado?.clave === clave;

  useEffect(() => {
    if (!path) return;
    let active = true;
    const fin = (datos: { data?: Estadisticas; error?: string }) =>
      setCargado({ clave, data: datos.data ?? null, error: datos.error ?? null });

    // La lectura sale al montar la pantalla: `auth.currentUser` todavía puede
    // estar vacío y el pedido iría sin token.
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        fin({ error: "Necesitás iniciar sesión para ver las estadísticas" });
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await apiFetch<unknown>(path, { token });
        if (!active) return;
        const env = comoEnvelope<EstadisticasBackend>(res);
        if (!env.ok || !env.data) {
          fin({ error: env.code ?? "No pudimos cargar las estadísticas" });
          return;
        }
        fin({ data: aEstadisticas(env.data) });
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

/* ---- Exportar --------------------------------------------------------------- */

export interface ExportOpts {
  format: "pdf" | "csv" | "xlsx";
  scope: AlcanceReporte;
}

/** Baja un archivo generado en el navegador. */
function descargar(contenido: BlobPart, nombre: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  // Revocar en el mismo tick puede cortar la descarga en algunos navegadores.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

const TIPOS: Record<ExportOpts["format"], string> = {
  csv: "text/csv;charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
};

/**
 * Genera y descarga el reporte en el navegador, con los datos que ya están en
 * pantalla: el backend no tiene un endpoint que lo arme.
 */
export function useExportarReporte() {
  const [isLoading, setIsLoading] = useState(false);

  async function exportar(
    opts: ExportOpts,
    data: Estadisticas,
    periodo: Periodo,
    enc: EncabezadoReporte,
  ): Promise<{ ok: boolean }> {
    setIsLoading(true);
    try {
      const contenido =
        opts.format === "csv" ? estadisticasACsv(data, opts.scope, enc)
        : opts.format === "xlsx" ? await estadisticasAXlsx(data, opts.scope, enc)
        : await estadisticasAPdf(data, opts.scope, enc);
      descargar(contenido, `estadisticas-${periodo}-${data.actual.hasta || "reporte"}.${opts.format}`, TIPOS[opts.format]);
      return { ok: true };
    } catch {
      return { ok: false };
    } finally {
      setIsLoading(false);
    }
  }

  return { exportar, isLoading };
}
