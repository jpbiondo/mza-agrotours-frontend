import { apiFetch, comoEnvelope } from "@/lib/api";
import { aDias, aEstado } from "@/hooks/useActividades";
import { aDia, aNumero, objetos, type DiaBackend } from "@/hooks/useGestionDias";
import { useLecturaConToken, type UseAsyncConToken } from "@/hooks/useLecturaConToken";
import { aCultivos } from "@/hooks/useTiposCultivo";
import type { CalendarioActividad } from "@/types/calendario-actividad";
import type { DiaProgramado } from "@/types/gestion-dias";

/** `DTOMetricasReservasGlobales`: personas, no reservas. */
interface MetricasBackend {
  personasPendientes?: unknown;
  personasPagadas?: unknown;
  personasFinalizadas?: unknown;
}

/** `DTOCalendarioActividadDiaResponse`. Todo opcional: defensivo. */
interface CalendarioActividadBackend {
  id?: string;
  nombre?: string;
  estado?: unknown;
  diasYHorasDisponibles?: unknown;
  cultivos?: unknown;
  nombreEstablecimiento?: string;
  nombreDepartamento?: string;
  metricas?: MetricasBackend | null;
  diasDelMes?: unknown;
}

function aCalendario(c: CalendarioActividadBackend): CalendarioActividad {
  return {
    id: c.id ?? "",
    nombre: c.nombre ?? "",
    estado: aEstado(c.estado),
    establecimiento: c.nombreEstablecimiento ?? "",
    departamento: c.nombreDepartamento ?? "",
    cultivos: aCultivos(c.cultivos),
    dias: aDias(c.diasYHorasDisponibles),
    metricas: {
      pagadas: aNumero(c.metricas?.personasPagadas),
      pendientes: aNumero(c.metricas?.personasPendientes),
      finalizadas: aNumero(c.metricas?.personasFinalizadas),
    },
    diasDelMes: objetos<DiaBackend>(c.diasDelMes)
      .map(aDia)
      .filter((d): d is DiaProgramado => d !== null),
  };
}

/**
 * GET /establecimientos/{id}/actividades/{actividadId}/dias?mes&anio. `mes` va
 * de 1 a 12. Trae la cabecera de la actividad, las métricas globales de
 * reservas y los días del mes con sus cupos. El backend rechaza años anteriores
 * al actual (`A.calendarioAnioInvalido`).
 */
export function useCalendarioActividad(
  establecimientoId: string,
  actividadId: string,
  anio: number,
  mes: number,
): UseAsyncConToken<CalendarioActividad> {
  const qs = new URLSearchParams({ mes: String(mes), anio: String(anio) });
  const clave = establecimientoId && actividadId ? `${establecimientoId}|${actividadId}|${qs}` : "";

  return useLecturaConToken<CalendarioActividad>(
    clave,
    async (token) => {
      const r = await apiFetch<unknown>(
        `/establecimientos/${encodeURIComponent(establecimientoId)}/actividades/${encodeURIComponent(actividadId)}/dias?${qs}`,
        { token },
      );
      const env = comoEnvelope<CalendarioActividadBackend>(r);
      if (!env.ok || !env.data) throw new Error(env.code ?? "No pudimos cargar el calendario");
      return aCalendario(env.data);
    },
    "Necesitás iniciar sesión para ver el calendario",
  );
}
