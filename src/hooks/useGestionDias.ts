import { useEffect, useRef, useState } from "react";
import { ApiError, apiFetch, comoEnvelope } from "@/lib/api";
import { conToken } from "@/lib/sesion";
import { aEstado } from "@/hooks/useActividades";
import { useLecturaConToken, type UseAsyncConToken } from "@/hooks/useLecturaConToken";
import { hoyISO, sumarDiasISO } from "@/components/ui/date-picker";
import { ORDEN_DIAS } from "@/lib/gestion-dias";
import type {
  AltaDia, AltaLote, CalendarioGestion, ConfiguracionDias, DiaProgramado, DiaSemana,
  EstadoDia, HorarioVigencia, PlanLote, Tarifa, VigenciaMes,
} from "@/types/gestion-dias";

function diasPath(establecimientoId: string, actividadId: string): string {
  return `/establecimientos/${encodeURIComponent(establecimientoId)}/actividades/${encodeURIComponent(actividadId)}/dias`;
}

/* ---- Lectura -------------------------------------------------------------
   Todo campo del backend se trata como opcional: la pantalla nunca ve su
   vocabulario, y uno que falte no tira abajo el calendario. */

interface DiaBackend {
  id?: string;
  fecha?: unknown;
  estadoActual?: unknown;
  horaInicio?: unknown;
  horaFin?: unknown;
  cuposMaximos?: unknown;
  cuposPagados?: unknown;
  cuposPendientes?: unknown;
}

interface HorarioBackend {
  horaInicio?: unknown;
  horaFin?: unknown;
  dias?: unknown;
}

interface VigenciaBackend {
  fechaDesde?: unknown;
  fechaHasta?: unknown;
  horarios?: unknown;
}

interface CalendarioBackend {
  id?: string;
  nombre?: string;
  nombreEstablecimiento?: string;
  precioBase?: unknown;
  cupoBase?: unknown;
  estadoActividad?: unknown;
  vigenciaDesde?: unknown;
  vigenciaHasta?: unknown;
  configuraciones?: unknown;
  diasDelMes?: unknown;
}

interface TarifaBackend {
  nombre?: string;
  precio?: unknown;
}

interface ConfiguracionBackend {
  fechaMaxima?: unknown;
  ventanaMaximaDias?: unknown;
  tarifas?: unknown;
}

interface DiaLoteBackend {
  fecha?: unknown;
}

interface PlanLoteBackend {
  diasACrear?: unknown;
  diasOcupados?: unknown;
}

const ESTADOS_DIA: Record<string, EstadoDia> = {
  ACTIVA: "activa",
  REPROGRAMADA: "reprogramada",
  FINALIZADA: "finalizada",
  CANCELADA: "cancelada",
};

function objetos<T>(v: unknown): T[] {
  return Array.isArray(v) ? v.filter((x): x is T => !!x && typeof x === "object") : [];
}

function aFecha(v: unknown): string | null {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

/** `LocalTime` viaja como "06:00" o "06:00:00" según tenga segundos. */
function aHora(v: unknown): string {
  return typeof v === "string" && /^\d{2}:\d{2}/.test(v) ? v.slice(0, 5) : "";
}

function aNumero(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Un estado que no conocemos cae en "finalizada", que es la lectura prudente:
 * el día queda de consulta y no se ofrece tocarle el cupo a algo que quizás ya
 * no admite cambios. Si se pudiera, el backend lo habría mandado como activo.
 */
function aEstadoDia(v: unknown): EstadoDia {
  return (typeof v === "string" && ESTADOS_DIA[v.trim().toUpperCase()]) || "finalizada";
}

function aDiasSemana(v: unknown): DiaSemana[] {
  if (!Array.isArray(v)) return [];
  return ORDEN_DIAS.filter((d) => v.some((x) => typeof x === "string" && x.trim().toUpperCase() === d));
}

function aDia(d: DiaBackend): DiaProgramado | null {
  const fecha = aFecha(d.fecha);
  // Sin id no hay sobre qué modificar el cupo, y sin fecha no hay dónde dibujarlo.
  if (typeof d.id !== "string" || !d.id || !fecha) return null;
  return {
    id: d.id,
    fecha,
    estado: aEstadoDia(d.estadoActual),
    horaInicio: aHora(d.horaInicio),
    horaFin: aHora(d.horaFin),
    cupoMax: aNumero(d.cuposMaximos),
    pagadas: aNumero(d.cuposPagados),
    pendientes: aNumero(d.cuposPendientes),
  };
}

function aHorario(h: HorarioBackend): HorarioVigencia {
  return { horaInicio: aHora(h.horaInicio), horaFin: aHora(h.horaFin), dias: aDiasSemana(h.dias) };
}

function aVigencia(v: VigenciaBackend): VigenciaMes | null {
  const desde = aFecha(v.fechaDesde);
  const hasta = aFecha(v.fechaHasta);
  if (!desde || !hasta) return null;
  return { desde, hasta, horarios: objetos<HorarioBackend>(v.horarios).map(aHorario) };
}

function aCalendario(c: CalendarioBackend): CalendarioGestion {
  return {
    id: c.id ?? "",
    nombre: c.nombre ?? "",
    establecimiento: c.nombreEstablecimiento ?? "",
    // Lo completa un @AfterMapping; llega en null si la actividad no tiene tarifa base.
    precioBase: c.precioBase == null ? null : aNumero(c.precioBase),
    cupoBase: aNumero(c.cupoBase),
    estado: aEstado(c.estadoActividad),
    vigenciaDesde: aFecha(c.vigenciaDesde),
    vigenciaHasta: aFecha(c.vigenciaHasta),
    vigencias: objetos<VigenciaBackend>(c.configuraciones)
      .map(aVigencia)
      .filter((v): v is VigenciaMes => v !== null),
    dias: objetos<DiaBackend>(c.diasDelMes)
      .map(aDia)
      .filter((d): d is DiaProgramado => d !== null),
  };
}

function aTarifas(v: unknown): Tarifa[] {
  return objetos<TarifaBackend>(v).map((t) => ({ nombre: t.nombre ?? "", precio: aNumero(t.precio) }));
}

function aFechasLote(v: unknown): string[] {
  return objetos<DiaLoteBackend>(v)
    .map((d) => aFecha(d.fecha))
    .filter((f): f is string => f !== null);
}

function aPlan(p: PlanLoteBackend | undefined): PlanLote {
  return { aCrear: aFechasLote(p?.diasACrear), descartadas: aFechasLote(p?.diasOcupados) };
}

const SIN_SESION = "Necesitás iniciar sesión para gestionar los días";

/**
 * GET .../dias/calendario?mes&anio. `mes` va de 1 a 12, como lo espera el
 * backend. Trae la cabecera de la actividad, las vigencias que cruzan el mes y
 * los días de ese mes con sus cupos.
 */
export function useCalendarioGestion(
  establecimientoId: string,
  actividadId: string,
  anio: number,
  mes: number,
): UseAsyncConToken<CalendarioGestion> {
  const qs = new URLSearchParams({ mes: String(mes), anio: String(anio) });
  const clave = establecimientoId && actividadId ? `${establecimientoId}|${actividadId}|${qs}` : "";

  return useLecturaConToken<CalendarioGestion>(
    clave,
    async (token) => {
      const r = await apiFetch<unknown>(`${diasPath(establecimientoId, actividadId)}/calendario?${qs}`, { token });
      const env = comoEnvelope<CalendarioBackend>(r);
      if (!env.ok || !env.data) throw new Error(env.code ?? "No pudimos cargar el calendario");
      return aCalendario(env.data);
    },
    SIN_SESION,
  );
}

/** GET .../dias/configuracion: hasta qué fecha se pueden abrir días y las tarifas vigentes. */
export function useConfiguracionDias(
  establecimientoId: string,
  actividadId: string,
): UseAsyncConToken<ConfiguracionDias> {
  const clave = establecimientoId && actividadId ? `conf|${establecimientoId}|${actividadId}` : "";

  return useLecturaConToken<ConfiguracionDias>(
    clave,
    async (token) => {
      const r = await apiFetch<unknown>(`${diasPath(establecimientoId, actividadId)}/configuracion`, { token });
      const env = comoEnvelope<ConfiguracionBackend>(r);
      if (!env.ok) throw new Error(env.code ?? "No pudimos cargar la configuración de días");
      const ventanaDias = aNumero(env.data?.ventanaMaximaDias) || 120;
      return {
        ventanaDias,
        // Sin fecha máxima se calcula con la ventana: es la misma cuenta que hace el backend.
        fechaMaxima: aFecha(env.data?.fechaMaxima) ?? sumarDiasISO(hoyISO(), ventanaDias),
        tarifas: aTarifas(env.data?.tarifas),
      };
    },
    SIN_SESION,
  );
}

/* ---- Previsualización de un lote ----------------------------------------- */

interface UsePrevisualizacion {
  plan: PlanLote | null;
  isLoading: boolean;
  /** Código de dominio si el backend rechazó la combinación. */
  code: string | null;
  fallo: boolean;
}

/** Cuánto se espera a que el productor deje de tocar el formulario antes de pedir. */
const ESPERA_PREVIEW_MS = 350;

/**
 * POST .../dias/lote/previsualizacion. Muestra en vivo qué fechas va a crear el
 * lote y cuáles descarta. Es una lectura disparada por el usuario, así que va
 * con `conToken`; `null` significa que el formulario todavía no está completo y
 * no hay nada que pedir.
 */
export function usePrevisualizacionLote(
  establecimientoId: string,
  actividadId: string,
  lote: AltaLote | null,
): UsePrevisualizacion {
  const clave = lote ? JSON.stringify(lote) : "";
  const [res, setRes] = useState<{ clave: string; plan: PlanLote | null; code: string | null; fallo: boolean }>(
    { clave: "", plan: null, code: null, fallo: false },
  );
  const loteRef = useRef(lote);
  useEffect(() => { loteRef.current = lote; });

  useEffect(() => {
    if (!clave) return;
    let active = true;
    const t = setTimeout(async () => {
      const actual = loteRef.current;
      if (!actual) return;
      try {
        const r = await conToken((token) =>
          apiFetch<unknown>(`${diasPath(establecimientoId, actividadId)}/lote/previsualizacion`, {
            method: "POST", token, body: JSON.stringify(aCuerpoLote(actual)),
          }),
        );
        const env = comoEnvelope<PlanLoteBackend>(r);
        if (!active) return;
        setRes(env.ok
          ? { clave, plan: aPlan(env.data), code: null, fallo: false }
          : { clave, plan: null, code: env.code ?? null, fallo: true });
      } catch (e) {
        if (active) setRes({ clave, plan: null, code: e instanceof ApiError ? e.code ?? null : null, fallo: true });
      }
    }, ESPERA_PREVIEW_MS);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [clave, establecimientoId, actividadId]);

  const alDia = !!clave && res.clave === clave;
  return {
    plan: alDia ? res.plan : null,
    isLoading: !!clave && !alDia,
    code: alDia ? res.code : null,
    fallo: alDia && res.fallo,
  };
}

/* ---- Escrituras ---------------------------------------------------------- */

export interface ResultadoDias {
  ok: boolean;
  code?: string;
}

export interface ResultadoLote extends ResultadoDias {
  plan?: PlanLote;
}

function aCuerpoLote(l: AltaLote) {
  return {
    fechaDesde: l.desde,
    fechaHasta: l.hasta,
    dias: l.dias,
    horaInicio: l.horaInicio,
    horaFin: l.horaFin,
    cuposMax: l.cupoMax,
  };
}

/** Alta de un día, alta por lote y cambio de cupo de un día. */
export function useGestionDiasAcciones(establecimientoId: string, actividadId: string) {
  const [guardando, setGuardando] = useState(false);
  const base = diasPath(establecimientoId, actividadId);

  async function escribir<T>(sufijo: string, method: string, body: unknown): Promise<ResultadoDias & { data?: T }> {
    setGuardando(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(`${base}${sufijo}`, { method, token, body: JSON.stringify(body) }),
      );
      const env = comoEnvelope<T>(res);
      return env.ok ? { ok: true, data: env.data } : { ok: false, code: env.code };
    } catch (e) {
      if (e instanceof ApiError) return { ok: false, code: e.code };
      // 2xx sin cuerpo: el cambio se hizo.
      if (e instanceof SyntaxError) return { ok: true };
      return { ok: false };
    } finally {
      setGuardando(false);
    }
  }

  /** POST .../dias: abre un día puntual. No genera vigencia: eso sólo lo hace el lote. */
  async function abrirDia(d: AltaDia): Promise<ResultadoDias> {
    const { ok, code } = await escribir("", "POST", {
      fecha: d.fecha, horaInicio: d.horaInicio, horaFin: d.horaFin, cuposMax: d.cupoMax,
    });
    return { ok, code };
  }

  /** POST .../dias/lote. El backend recalcula el plan al guardar y devuelve el que aplicó. */
  async function abrirLote(l: AltaLote): Promise<ResultadoLote> {
    const { ok, code, data } = await escribir<PlanLoteBackend>("/lote", "POST", aCuerpoLote(l));
    return ok ? { ok, plan: data ? aPlan(data) : undefined } : { ok, code };
  }

  /** PATCH .../dias/{id}/cupo. No puede quedar por debajo de las reservas vigentes. */
  async function cambiarCupo(diaId: string, cupoMax: number): Promise<ResultadoDias> {
    const { ok, code } = await escribir(`/${encodeURIComponent(diaId)}/cupo`, "PATCH", { cuposMax: cupoMax });
    return { ok, code };
  }

  return { abrirDia, abrirLote, cambiarCupo, guardando };
}
