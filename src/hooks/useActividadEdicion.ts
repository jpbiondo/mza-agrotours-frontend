import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch, comoEnvelope } from "@/lib/api";
import { conToken } from "@/lib/sesion";
import { tarifasIniciales } from "@/data/actividad-form";
import { limpiarLista } from "@/lib/actividad-form";
import { aEstado } from "@/hooks/useActividades";
import type { ActividadEditarForm } from "@/app/panel/actividades/[id]/editar/schema";
import type { EstadoActividad } from "@/types/actividad-prod";
import type { FaqItem, TarifaFila } from "@/types/actividad-form";
import type { FotoActividad, FotoClaim } from "@/types/actividad-foto";

function editPath(establecimientoId: string, actividadId: string): string {
  return `/establecimientos/${encodeURIComponent(establecimientoId)}/actividades/edit/${encodeURIComponent(actividadId)}`;
}

/* ---- Lectura -------------------------------------------------------------
   Todos los campos del backend se tratan como opcionales: la pantalla nunca ve
   su vocabulario, y un campo que falte no debe tirar abajo el formulario. */

interface CultivoBackend {
  id?: string;
}

interface TarifaBackend {
  id?: string;
  nombre?: string;
  edadMinima?: unknown;
  edadMaxima?: unknown;
  precio?: unknown;
  esTarifaBase?: unknown;
}

interface FaqBackend {
  pregunta?: string;
  respuesta?: string;
}

/** DTOFotosResponse. Se lee defensivo: sin `key` la foto no se puede conservar. */
interface FotoBackend {
  key?: string;
  /** URL de descarga prefirmada. El backend la llama así, no `url`. */
  downloadUrl?: string;
  nombre?: string;
}

interface ActividadEditarBackend {
  id?: string;
  nombre?: string;
  descripcion?: string;
  cultivos?: unknown;
  fotosGuardadas?: unknown;
  rangosEtarios?: unknown;
  incluye?: unknown;
  noIncluye?: unknown;
  faqs?: unknown;
  estado?: unknown;
  advertencias?: unknown;
}

function aTextos(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((s): s is string => typeof s === "string").map((s) => s.trim()).filter(Boolean);
}

/** Los editores de listas necesitan al menos un renglón para dibujarse. */
function conRenglonVacio(items: string[]): string[] {
  return items.length ? items : [""];
}

function aIdsCultivo(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((c): c is CultivoBackend => !!c && typeof c === "object")
    .map((c) => (typeof c.id === "string" ? c.id.trim() : ""))
    .filter(Boolean);
}

/**
 * Los rangos guardados. `backendId` se conserva para que el POST actualice la
 * tarifa en vez de crear una nueva. El precio llega como número decimal y el
 * formulario trabaja con enteros en texto, igual que en el alta.
 */
function aTarifas(v: unknown): TarifaFila[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((t): t is TarifaBackend => !!t && typeof t === "object")
    .map((t, i) => ({
      id: `tar-srv-${typeof t.id === "string" ? t.id : i}`,
      backendId: typeof t.id === "string" ? t.id : undefined,
      nombre: t.nombre ?? "",
      min: String(Number(t.edadMinima) || 0),
      max: String(Number(t.edadMaxima) || 0),
      precio: String(Math.round(Number(t.precio) || 0)),
      on: true,
      base: t.esTarifaBase === true,
    }));
}

function aFaqs(v: unknown): FaqItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((f): f is FaqBackend => !!f && typeof f === "object")
    .map((f) => ({ q: f.pregunta ?? "", a: f.respuesta ?? "" }))
    .filter((f) => f.q || f.a);
}

/**
 * Las fotos que ya tiene la actividad, en el orden en que las devolvió el
 * backend (las trae ordenadas por `orden`). Entran al uploader como cualquier
 * otra: ya están en el bucket, así que arrancan en "lista".
 */
function aFotos(v: unknown): FotoActividad[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((f): f is FotoBackend => !!f && typeof f === "object")
    .map((f) => ({
      id: typeof f.key === "string" ? f.key : "",
      key: typeof f.key === "string" ? f.key : "",
      nombre: f.nombre ?? "",
      previewUrl: typeof f.downloadUrl === "string" ? f.downloadUrl : "",
      estado: "lista" as const,
    }))
    // Sin key no hay forma de decirle al backend que la conserve.
    .filter((f) => f.key !== "");
}

/**
 * El formulario sólo puede guardar en "publicado" o "borrador": dar de baja es
 * otra operación. Una actividad que ya está dada de baja cae en "borrador", que
 * es la lectura prudente —nunca decir "publicada" algo que no lo está—.
 */
function aEstadoEditable(v: unknown): "publicado" | "borrador" {
  return aEstado(v) === "publicado" ? "publicado" : "borrador";
}

function aActividadEditar(d: ActividadEditarBackend): ActividadEditarForm {
  const tarifas = aTarifas(d.rangosEtarios);
  const faqs = aFaqs(d.faqs);
  return {
    nombre: d.nombre ?? "",
    descripcion: d.descripcion ?? "",
    cultivos: aIdsCultivo(d.cultivos),
    // Una actividad sin rangos cargados arranca con la plantilla del alta, que
    // es más útil que una tabla vacía.
    tarifas: tarifas.length ? tarifas : tarifasIniciales(),
    incluye: conRenglonVacio(aTextos(d.incluye)),
    noIncluye: conRenglonVacio(aTextos(d.noIncluye)),
    faqs: faqs.length ? faqs : [{ q: "", a: "" }],
    estado: aEstadoEditable(d.estado),
  };
}

interface UseActividadEdicionReturn {
  data: ActividadEditarForm | null;
  /**
   * Las fotos van aparte del formulario: tienen estado de subida propio y las
   * administra `useFotosActividad`, no react-hook-form.
   */
  fotos: FotoActividad[];
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * GET /establecimientos/{estId}/actividades/edit/{actividadId}.
 *
 * Sale al montar la pantalla, así que espera a `onAuthStateChanged`: en ese
 * momento `auth.currentUser` todavía está vacío y el pedido iría sin token.
 */
export function useActividadEdicion(
  establecimientoId: string,
  actividadId: string,
): UseActividadEdicionReturn {
  const [nonce, setNonce] = useState(0);
  // Sin establecimiento no hay a quién pedirle: la pantalla muestra su propio
  // aviso y no debe quedar girando.
  const clave = establecimientoId && actividadId ? `${nonce}|${establecimientoId}|${actividadId}` : "";

  // La carga se deriva de si el resultado guardado corresponde a la clave
  // actual, en vez de prenderla con un setState adentro del efecto.
  const [res, setRes] = useState<{
    clave: string;
    data: ActividadEditarForm | null;
    fotos: FotoActividad[];
    error: string | null;
  }>({ clave: "", data: null, fotos: [], error: null });

  useEffect(() => {
    if (!clave) return;
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        setRes({ clave, data: null, fotos: [], error: "Necesitás iniciar sesión para editar la actividad" });
        return;
      }
      try {
        const token = await user.getIdToken();
        const r = await apiFetch<unknown>(editPath(establecimientoId, actividadId), { token });
        if (!active) return;
        const env = comoEnvelope<ActividadEditarBackend>(r);
        setRes(
          env.ok && env.data
            ? {
                clave,
                data: aActividadEditar(env.data),
                fotos: aFotos(env.data.fotosGuardadas),
                error: null,
              }
            : { clave, data: null, fotos: [], error: env.code ?? "No pudimos cargar la actividad" },
        );
      } catch (e) {
        if (active) {
          setRes({ clave, data: null, fotos: [], error: e instanceof Error ? e.message : "Error inesperado" });
        }
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [clave, establecimientoId, actividadId]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const isLoading = clave !== "" && res.clave !== clave;

  return {
    data: isLoading ? null : res.data,
    fotos: isLoading ? [] : res.fotos,
    error: isLoading ? null : res.error,
    isLoading,
    reload,
  };
}

/* ---- Guardado ------------------------------------------------------------ */

interface TarifaEditDTO {
  /** Ausente en las filas que el productor agregó recién. */
  id?: string;
  nombre: string;
  precio: number;
  edadMinima: number;
  edadMaxima: number;
  esTarifaBase: boolean;
}

export interface EdicionActividadDTO {
  nombre: string;
  descripcion: string;
  cultivos: string[];
  /**
   * TODAS las fotos que la actividad tiene que quedar teniendo, EN ORDEN: las
   * que ya estaban y las recién subidas, mezcladas. El backend reordena las
   * conocidas con el índice de este arreglo, reclama las que no conoce y borra
   * las que no aparezcan.
   */
  fotos: FotoClaim[];
  tarifas: TarifaEditDTO[];
  incluye: string[];
  noIncluye: string[];
  faqs: { pregunta: string; respuesta: string }[];
  estado: string;
}

export function aPayloadEdicion(
  v: ActividadEditarForm,
  estado: EstadoActividad,
  fotos: FotoClaim[] = [],
): EdicionActividadDTO {
  return {
    nombre: v.nombre.trim(),
    descripcion: v.descripcion.trim(),
    cultivos: v.cultivos,
    fotos,
    tarifas: v.tarifas
      .filter((r) => r.on)
      .map((r) => ({
        ...(r.backendId ? { id: r.backendId } : {}),
        nombre: r.nombre.trim(),
        // Un rango sin cargo (infantes, por lo general) es 0, no un error.
        precio: Number(r.precio) || 0,
        edadMinima: Number(r.min) || 0,
        edadMaxima: Number(r.max) || 0,
        esTarifaBase: r.base,
      })),
    incluye: limpiarLista(v.incluye),
    noIncluye: limpiarLista(v.noIncluye),
    faqs: v.faqs
      .filter((f) => f.q.trim() && f.a.trim())
      .map((f) => ({ pregunta: f.q.trim(), respuesta: f.a.trim() })),
    estado: estado === "publicado" ? "PUBLICADO" : "BORRADOR",
  };
}

export interface ResultadoEdicion {
  ok: boolean;
  code?: string;
  /** Avisos del backend (huecos de edad, por ejemplo). No impiden guardar. */
  advertencias: string[];
}

export function useGuardarEdicion() {
  const [isLoading, setIsLoading] = useState(false);

  /** POST /establecimientos/{estId}/actividades/edit/{actividadId} */
  async function guardar(
    establecimientoId: string,
    actividadId: string,
    data: ActividadEditarForm,
    estado: EstadoActividad,
    fotos: FotoClaim[] = [],
  ): Promise<ResultadoEdicion> {
    setIsLoading(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(editPath(establecimientoId, actividadId), {
          method: "PUT",
          token,
          body: JSON.stringify(aPayloadEdicion(data, estado, fotos)),
        }),
      );
      const env = comoEnvelope<ActividadEditarBackend>(res);
      if (!env.ok) return { ok: false, code: env.code, advertencias: [] };
      return { ok: true, advertencias: aTextos(env.data?.advertencias) };
    } catch (e) {
      if (e instanceof ApiError) return { ok: false, code: e.code, advertencias: [] };
      // `apiFetch` sólo llega a res.json() con un 2xx: un error de parseo es una
      // edición hecha y contestada sin cuerpo.
      if (e instanceof SyntaxError) return { ok: true, advertencias: [] };
      return { ok: false, advertencias: [] };
    } finally {
      setIsLoading(false);
    }
  }

  return { guardar, isLoading };
}
