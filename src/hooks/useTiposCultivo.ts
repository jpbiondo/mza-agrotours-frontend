import { useAsync } from "@/hooks/useAsync";
import { apiFetch, comoEnvelope } from "@/lib/api";
import type { CultivoRef } from "@/types/datos";

const TIPOS_CULTIVO = "/tipo-cultivo/short";

/** Identidad estable para el "todavía no hay nada": evita invalidar los `useMemo` de quien consume. */
const SIN_CULTIVOS: CultivoRef[] = [];

interface CultivoBackend {
  id?: string;
  nombre?: string;
}

/**
 * Cultivos con id y nombre. Se descarta el que no traiga id: es lo que viaja al
 * guardar, así que sin él no se podría ni conservar ni asociar.
 */
export function aCultivos(v: unknown): CultivoRef[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((c): c is CultivoBackend => !!c && typeof c === "object")
    .map((c) => ({
      id: typeof c.id === "string" ? c.id.trim() : "",
      nombre: c.nombre ?? "",
    }))
    .filter((c) => c.id !== "");
}

async function listarCultivos(): Promise<CultivoRef[]> {
  const env = comoEnvelope<CultivoBackend[]>(await apiFetch<unknown>(TIPOS_CULTIVO));
  if (!env.ok) throw new Error(env.code ?? "No pudimos cargar los cultivos");
  return aCultivos(env.data);
}

/**
 * GET /tipo-cultivo/short: los cultivos que se pueden asociar, a un
 * establecimiento, una actividad o una receta. `habilitado` deja pedirlo recién
 * cuando hace falta —al abrir un modal, por ejemplo— en vez de en cada carga de
 * pantalla.
 *
 * Va contra `/short` y no contra `/tipo-cultivo` a secas porque ese último pasó
 * a estar paginado: devuelve una `Page` con el resumen completo del cultivo,
 * mientras que acá sólo hacen falta id y nombre para llenar el selector.
 * `/short` devuelve la lista entera, sin paginar.
 *
 * Va **sin token**: `/tipo-cultivo/**` es público. No espera a que Firebase
 * restaure la sesión porque no tiene nada que esperar, y por eso tampoco puede
 * fallar por falta de sesión aunque lo usen pantallas que sí la exigen.
 */
export function useTiposCultivo(habilitado: boolean) {
  const { data, isLoading, error } = useAsync<CultivoRef[]>(
    () => (habilitado ? listarCultivos() : Promise.resolve(SIN_CULTIVOS)),
    [habilitado],
  );

  return {
    cultivos: data ?? SIN_CULTIVOS,
    // Deshabilitado no es "cargando": el consumidor no tiene nada que esperar.
    isLoading: habilitado && isLoading,
    error,
  };
}
