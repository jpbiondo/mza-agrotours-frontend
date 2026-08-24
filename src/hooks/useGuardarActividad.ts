import { useState } from "react";
import { ApiError, apiFetch, comoEnvelope } from "@/lib/api";
import { conToken } from "@/lib/sesion";
import { DIAS } from "@/data/actividad-form";
import type { ActividadFormData, DiaKey } from "@/types/actividad-form";

export type EstadoGuardado = "publicado" | "borrador";

/* ---- Traducción al DTO ---------------------------------------------------
   Privada al hook: el formulario trabaja con su propio modelo y nunca ve el
   vocabulario del backend. */

/** Los días viajan en mayúsculas y sin tilde. */
const DIA_BACKEND: Record<DiaKey, string> = {
  lunes: "LUNES",
  martes: "MARTES",
  miercoles: "MIERCOLES",
  jueves: "JUEVES",
  viernes: "VIERNES",
  sabado: "SABADO",
  domingo: "DOMINGO",
};

/**
 * Los tres tramos del formulario, con los rangos de edad que la propia pantalla
 * declara ("18 años o más", "3 a 17", "0 a 2"). El DTO pide un rango explícito,
 * así que la convención vive acá y en un solo lugar.
 *
 * TODO backend: `edadMaxima` de adultos va en 120 y no en null, que es lo único
 * que funciona igual si la columna admite nulos y si no.
 */
const TRAMOS = [
  { key: "adultos", nombre: "Adultos", edadMinima: 18, edadMaxima: 120, base: true },
  { key: "menores", nombre: "Menores", edadMinima: 3, edadMaxima: 17, base: false },
  { key: "infantes", nombre: "Infantes", edadMinima: 0, edadMaxima: 2, base: false },
] as const;

interface TarifaDTO {
  nombre: string;
  precio: number;
  edadMinima: number;
  edadMaxima: number;
  esTarifaBase: boolean;
}

interface DiaDTO {
  dia: string;
  horaInicio: string;
  horaFin: string;
}

interface FaqDTO {
  pregunta: string;
  respuesta: string;
}

export interface AltaActividadDTO {
  nombre: string;
  descripcion: string;
  cultivos: string[];
  estado: string;
  fotos: string[];
  incluye: string[];
  noIncluye: string[];
  faqs: FaqDTO[];
  cuposMax: number;
  tarifas: TarifaDTO[];
  fechaDesde: string;
  fechaHasta: string;
  diasDisponibles: DiaDTO[];
}

/** Adultos va siempre; los otros dos sólo si se habilitaron. */
function aTarifas(ages: ActividadFormData["ages"]): TarifaDTO[] {
  return TRAMOS.filter((t) => t.base || ages[t.key].on).map((t) => ({
    nombre: t.nombre,
    // Infantes suelen ir sin cargo, así que un precio vacío es 0, no un error.
    precio: Number(ages[t.key].price) || 0,
    edadMinima: t.edadMinima,
    edadMaxima: t.edadMaxima,
    esTarifaBase: t.base,
  }));
}

/** Sólo los días habilitados y con las dos horas cargadas. */
function aDias(days: ActividadFormData["days"]): DiaDTO[] {
  return DIAS.filter((d) => days[d.key].on && days[d.key].desde && days[d.key].hasta).map((d) => ({
    dia: DIA_BACKEND[d.key],
    horaInicio: days[d.key].desde,
    horaFin: days[d.key].hasta,
  }));
}

/** Quita los renglones en blanco que deja el editor de listas. */
function limpiar(items: string[]): string[] {
  return items.map((t) => t.trim()).filter(Boolean);
}

export function aPayload(v: ActividadFormData, estado: EstadoGuardado): AltaActividadDTO {
  return {
    nombre: v.nombre.trim(),
    descripcion: v.descripcion.trim(),
    cultivos: v.cultivos,
    estado: estado === "publicado" ? "PUBLICADO" : "BORRADOR",
    // TODO backend: las fotos todavía no se suben.
    fotos: [],
    incluye: limpiar(v.incluye),
    noIncluye: limpiar(v.noIncluye),
    faqs: v.faqs
      .filter((f) => f.q.trim() && f.a.trim())
      .map((f) => ({ pregunta: f.q.trim(), respuesta: f.a.trim() })),
    cuposMax: Number(v.cupos) || 0,
    tarifas: aTarifas(v.ages),
    fechaDesde: v.fechaDesde,
    fechaHasta: v.fechaHasta,
    diasDisponibles: aDias(v.days),
  };
}

/* ---- Alta ---------------------------------------------------------------- */

export function useGuardarActividad() {
  const [isLoading, setIsLoading] = useState(false);

  /** POST /establecimientos/{id}/actividades/alta */
  async function guardar(
    establecimientoId: string,
    data: ActividadFormData,
    estado: EstadoGuardado,
  ): Promise<{ ok: boolean; code?: string }> {
    setIsLoading(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(
          `/establecimientos/${encodeURIComponent(establecimientoId)}/actividades/alta`,
          { method: "POST", token, body: JSON.stringify(aPayload(data, estado)) },
        ),
      );
      const env = comoEnvelope<unknown>(res);
      return env.ok ? { ok: true } : { ok: false, code: env.code };
    } catch (e) {
      if (e instanceof ApiError) return { ok: false, code: e.code };
      // `apiFetch` sólo llega a res.json() con un 2xx: un error de parseo es un
      // alta hecha y contestada sin cuerpo.
      if (e instanceof SyntaxError) return { ok: true };
      return { ok: false };
    } finally {
      setIsLoading(false);
    }
  }

  return { guardar, isLoading };
}
