import { useState } from "react";
import { ApiError, apiFetch, comoEnvelope, comoPagina, type Pagina } from "@/lib/api";
import { aNumero, objetos } from "@/hooks/useGestionDias";
import { useLecturaConToken, type UseAsyncConToken } from "@/hooks/useLecturaConToken";
import { clasificarError } from "@/lib/errores";
import { descargar, type FormatoExport } from "@/lib/exportar";
import { nombrePlanilla, planillaACsv, planillaAPdf, planillaAXlsx } from "@/lib/planillaDia";
import { conToken } from "@/lib/sesion";
import { aCultivos } from "@/hooks/useTiposCultivo";
import type { EstadoDia } from "@/types/gestion-dias";
import type { ConteoEstados, EstadoReservaDia, Reprogramacion, ReservaDia, ResumenDia } from "@/types/reservas-dia";

function diaPath(establecimientoId: string, actividadId: string, diaId: string): string {
  return `/establecimientos/${encodeURIComponent(establecimientoId)}/actividades/${encodeURIComponent(actividadId)}/dias/${encodeURIComponent(diaId)}`;
}

/* ---- Vocabulario del backend -------------------------------------------- */

/** `DTOListadoReservasResumenResponse`. Todo opcional: defensivo. */
interface ResumenBackend {
  id?: string;
  nombre?: string;
  estadoDia?: unknown;
  motivoEstadoDia?: unknown;
  cultivos?: unknown;
  nombreEstablecimiento?: string;
  nombreDepartamento?: string;
  fecha?: unknown;
  horaInicio?: unknown;
  horaFin?: unknown;
  ingresoEstimadoDelDia?: unknown;
  cantidadTotalReservas?: unknown;
}

/** `DTODetalleReservaCard`. */
interface ReservaBackend {
  id?: string;
  estadoReserva?: unknown;
  cantidadTotalPersona?: unknown;
  resumenRangoEtario?: unknown;
  visitantes?: unknown;
  montoTotalReserva?: unknown;
}

interface RangoBackend {
  rango?: string;
  cantidad?: unknown;
}

interface VisitanteBackend {
  nombreCompleto?: string;
  tipo?: string;
  edad?: unknown;
}

/** `DTOFiltro` de los estados de reserva: `valor` es el nombre del enum. */
interface FiltroBackend {
  valor?: unknown;
  cantidad?: unknown;
}

const ESTADOS_DIA: Record<string, EstadoDia> = {
  ACTIVA: "activa",
  REPROGRAMADA: "reprogramada",
  FINALIZADA: "finalizada",
  CANCELADA: "cancelada",
};

const ESTADOS_RESERVA: Record<string, EstadoReservaDia> = {
  PENDIENTE: "pendiente",
  PAGADA: "pagada",
  CANCELADA_CON_REEMBOLSO: "cancelada_con_reembolso",
  CANCELADA_SIN_REEMBOLSO: "cancelada_sin_reembolso",
  FINALIZADA: "finalizada",
  EXPIRADA: "expirada",
};

/** El nombre del enum `EstadoReservaNombre`, que es como viaja el filtro `estado`. */
const ESTADO_RESERVA_BACKEND: Record<EstadoReservaDia, string> = {
  pendiente: "PENDIENTE",
  pagada: "PAGADA",
  cancelada_con_reembolso: "CANCELADA_CON_REEMBOLSO",
  cancelada_sin_reembolso: "CANCELADA_SIN_REEMBOLSO",
  finalizada: "FINALIZADA",
  expirada: "EXPIRADA",
};

const clave = (v: unknown) => (typeof v === "string" ? v.trim().toUpperCase() : "");

/** Un estado de día desconocido se lee como finalizado: es la lectura que no ofrece acciones. */
const aEstadoDia = (v: unknown): EstadoDia => ESTADOS_DIA[clave(v)] ?? "finalizada";

const aEstadoReserva = (v: unknown): EstadoReservaDia | null => ESTADOS_RESERVA[clave(v)] ?? null;

/** `LocalTime.toString()` manda "06:00" o "06:00:30". */
const aHora = (v: unknown) => (typeof v === "string" && /^\d{2}:\d{2}/.test(v) ? v.slice(0, 5) : "");

function aResumen(r: ResumenBackend): ResumenDia {
  return {
    actividadId: r.id ?? "",
    nombre: r.nombre ?? "",
    estadoDia: aEstadoDia(r.estadoDia),
    motivoEstado: typeof r.motivoEstadoDia === "string" ? r.motivoEstadoDia.trim() : "",
    cultivos: aCultivos(r.cultivos),
    establecimiento: r.nombreEstablecimiento ?? "",
    departamento: r.nombreDepartamento ?? "",
    fecha: typeof r.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.fecha) ? r.fecha : "",
    horaInicio: aHora(r.horaInicio),
    horaFin: aHora(r.horaFin),
    ingresoEstimado: aNumero(r.ingresoEstimadoDelDia),
    totalReservas: aNumero(r.cantidadTotalReservas),
  };
}

function aReserva(r: ReservaBackend): ReservaDia | null {
  const estado = aEstadoReserva(r.estadoReserva);
  if (typeof r.id !== "string" || !r.id || !estado) return null;
  const visitantes = objetos<VisitanteBackend>(r.visitantes).map((v) => ({
    nombre: v.nombreCompleto ?? "",
    tipo: v.tipo ?? "",
    edad: aNumero(v.edad),
  }));
  return {
    id: r.id,
    estado,
    personas: aNumero(r.cantidadTotalPersona) || visitantes.length,
    rangos: objetos<RangoBackend>(r.resumenRangoEtario)
      .map((g) => ({ rango: g.rango ?? "", cantidad: aNumero(g.cantidad) }))
      .filter((g) => g.rango && g.cantidad > 0),
    visitantes,
    total: aNumero(r.montoTotalReserva),
  };
}

/** Un día que no es de la actividad responde 404 con `actividadDiaNotFound`. */
function mensajeDe(e: unknown, porDefecto: string): never {
  if (e instanceof ApiError && e.status === 404) throw new Error("No encontramos ese día de la actividad. Puede que ya no exista.");
  throw e instanceof ApiError ? new Error(porDefecto) : e;
}

const SIN_SESION = "Necesitás iniciar sesión para ver las reservas";

/* ---- Lecturas ----------------------------------------------------------- */

/** GET .../dias/{diaId}/resumen: la actividad, el día y sus totales. */
export function useResumenDia(establecimientoId: string, actividadId: string, diaId: string): UseAsyncConToken<ResumenDia> {
  const k = establecimientoId && actividadId && diaId ? `resumen|${establecimientoId}|${actividadId}|${diaId}` : "";
  return useLecturaConToken<ResumenDia>(
    k,
    async (token) => {
      try {
        const r = await apiFetch<unknown>(`${diaPath(establecimientoId, actividadId, diaId)}/resumen`, { token });
        const env = comoEnvelope<ResumenBackend>(r);
        if (!env.ok || !env.data) throw new Error("No pudimos cargar el día");
        return aResumen(env.data);
      } catch (e) {
        return mensajeDe(e, "No pudimos cargar el día");
      }
    },
    SIN_SESION,
  );
}

/**
 * GET .../dias/{diaId}/reservas?estado&page&size. Filtro y paginado los
 * resuelve el backend; `estado` en `null` trae todos los estados visibles.
 */
export function useReservasDia(
  establecimientoId: string,
  actividadId: string,
  diaId: string,
  { estado, page, size }: { estado: EstadoReservaDia | null; page: number; size: number },
): UseAsyncConToken<Pagina<ReservaDia>> {
  const qs = new URLSearchParams({ page: String(page), size: String(size) });
  if (estado) qs.set("estado", ESTADO_RESERVA_BACKEND[estado]);
  const k = establecimientoId && actividadId && diaId ? `reservas|${establecimientoId}|${actividadId}|${diaId}|${qs}` : "";

  return useLecturaConToken<Pagina<ReservaDia>>(
    k,
    async (token) => {
      try {
        const r = await apiFetch<unknown>(`${diaPath(establecimientoId, actividadId, diaId)}/reservas?${qs}`, { token });
        const env = comoEnvelope<unknown>(r);
        if (!env.ok) throw new Error("No pudimos cargar las reservas");
        const pagina = comoPagina<ReservaBackend>(env.data);
        return { ...pagina, items: pagina.items.map(aReserva).filter((x): x is ReservaDia => x !== null) };
      } catch (e) {
        return mensajeDe(e, "No pudimos cargar las reservas");
      }
    },
    SIN_SESION,
  );
}

/** GET .../dias/{diaId}/reservas/estados: cuántas reservas hay en cada estado. */
export function useEstadosReservaDia(
  establecimientoId: string,
  actividadId: string,
  diaId: string,
): UseAsyncConToken<ConteoEstados> {
  const k = establecimientoId && actividadId && diaId ? `estados|${establecimientoId}|${actividadId}|${diaId}` : "";
  return useLecturaConToken<ConteoEstados>(
    k,
    async (token) => {
      const r = await apiFetch<unknown>(`${diaPath(establecimientoId, actividadId, diaId)}/reservas/estados`, { token });
      const env = comoEnvelope<unknown>(r);
      if (!env.ok) throw new Error("No pudimos cargar los estados");
      const conteo: ConteoEstados = {};
      for (const f of objetos<FiltroBackend>(env.data)) {
        const e = aEstadoReserva(f.valor);
        if (e) conteo[e] = aNumero(f.cantidad);
      }
      return conteo;
    },
    SIN_SESION,
  );
}

/* ---- Planilla del día --------------------------------------------------- */

/** Los que efectivamente vienen. Finalizada cubre un día ya cerrado. */
export const ESTADOS_PLANILLA: EstadoReservaDia[] = ["pagada", "finalizada"];

/** Tamaño de página para traer todo: pocas vueltas sin pedirle al backend una página enorme. */
const SIZE_PLANILLA = 100;

/** Todas las reservas del día en un estado, recorriendo las páginas. */
async function todasLasReservas(path: string, estado: EstadoReservaDia, token: string): Promise<ReservaDia[]> {
  const items: ReservaDia[] = [];
  for (let page = 0; ; page++) {
    const qs = new URLSearchParams({ page: String(page), size: String(SIZE_PLANILLA), estado: ESTADO_RESERVA_BACKEND[estado] });
    const env = comoEnvelope<unknown>(await apiFetch<unknown>(`${path}/reservas?${qs}`, { token }));
    if (!env.ok) throw new Error("No pudimos cargar las reservas");
    const pagina = comoPagina<ReservaBackend>(env.data);
    items.push(...pagina.items.map(aReserva).filter((x): x is ReservaDia => x !== null));
    if (page + 1 >= pagina.totalPages || pagina.items.length === 0) return items;
  }
}

/** Por qué no salió la planilla: de red, sesión y permiso se dice qué pasó; lo demás, genérico. */
function mensajePlanilla(e: unknown): string {
  const falla = clasificarError(e);
  switch (falla?.tipo) {
    case "red":
    case "sesion":
      return falla.mensaje;
    case "permiso":
      return "Tu rol no te permite descargar la planilla de este día.";
    case "noEncontrado":
      return "No encontramos ese día de la actividad. Puede que ya no exista.";
    default:
      return "No se pudo generar la planilla. Intentá nuevamente en unos minutos.";
  }
}

/**
 * Trae, al pedir la planilla, todas las reservas pagadas y finalizadas del día
 * (sin el paginado de la pantalla) y arma el archivo en el navegador.
 */
export function usePlanillaDia(establecimientoId: string, actividadId: string, diaId: string) {
  const [generando, setGenerando] = useState(false);

  async function generar(dia: ResumenDia, formato: FormatoExport): Promise<{ ok: boolean; mensaje?: string }> {
    setGenerando(true);
    try {
      const path = diaPath(establecimientoId, actividadId, diaId);
      const porEstado = await conToken((token) => Promise.all(ESTADOS_PLANILLA.map((e) => todasLasReservas(path, e, token))));
      const reservas = porEstado.flat();
      const contenido =
        formato === "csv" ? planillaACsv(dia, reservas)
        : formato === "xlsx" ? await planillaAXlsx(dia, reservas)
        : await planillaAPdf(dia, reservas);
      descargar(contenido, `${nombrePlanilla(dia)}.${formato}`, formato);
      return { ok: true };
    } catch (e) {
      return { ok: false, mensaje: mensajePlanilla(e) };
    } finally {
      setGenerando(false);
    }
  }

  return { generar, generando };
}

/* ---- Escrituras --------------------------------------------------------- */

export interface ResultadoDia {
  ok: boolean;
  code?: string;
}

/** Una escritura sobre el día. Las dos responden 200 sin cuerpo. */
async function escribirDia(path: string, init: { method: string; body: string; headers?: Record<string, string> }): Promise<ResultadoDia> {
  try {
    const r = await conToken((token) => apiFetch<unknown>(path, { ...init, token }));
    const env = comoEnvelope<unknown>(r);
    return env.ok ? { ok: true } : { ok: false, code: env.code };
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, code: e.code };
    // 2xx sin cuerpo: el cambio se hizo.
    if (e instanceof SyntaxError) return { ok: true };
    return { ok: false };
  }
}

/**
 * DELETE .../dias/{diaId}: cancela el día con su motivo. El backend cancela
 * además las reservas vigentes y emite el reembolso de las pagadas.
 *
 * El motivo viaja como texto plano: el endpoint lo recibe como
 * `@RequestBody String`, y en JSON se guardaría con las comillas.
 */
export function useCancelarDia(establecimientoId: string, actividadId: string, diaId: string) {
  const [cancelando, setCancelando] = useState(false);

  async function cancelar(motivo: string): Promise<ResultadoDia> {
    setCancelando(true);
    try {
      return await escribirDia(diaPath(establecimientoId, actividadId, diaId), {
        method: "DELETE",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: motivo,
      });
    } finally {
      setCancelando(false);
    }
  }

  return { cancelar, cancelando };
}

/**
 * POST .../dias/{diaId}/reprogramar: mueve el día a otra fecha u horario. El
 * backend rechaza con `A.diaNoReprogramable` tanto un día que no está activo
 * como una fecha fuera de los 120 días del pago más antiguo o ya ocupada.
 */
export function useReprogramarDia(establecimientoId: string, actividadId: string, diaId: string) {
  const [reprogramando, setReprogramando] = useState(false);

  async function reprogramar(r: Reprogramacion): Promise<ResultadoDia> {
    setReprogramando(true);
    try {
      return await escribirDia(`${diaPath(establecimientoId, actividadId, diaId)}/reprogramar`, {
        method: "POST",
        // El inicio viaja como `LocalDateTime` y el fin como `LocalTime`: el día termina la misma fecha.
        body: JSON.stringify({
          motivo: r.motivo,
          fechaHoraInicioReprogramada: `${r.fecha}T${r.horaInicio}:00`,
          horaFinReprogramada: r.horaFin,
        }),
      });
    } finally {
      setReprogramando(false);
    }
  }

  return { reprogramar, reprogramando };
}
