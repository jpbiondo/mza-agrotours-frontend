import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch, comoEnvelope } from "@/lib/api";
import { conToken } from "@/lib/sesion";
import { contentTypeDe } from "@/data/establecimiento";
import { tarifasIniciales } from "@/data/actividad-form";
import { limpiarLista } from "@/lib/actividad-form";
import { aEstado } from "@/hooks/useActividades";
import type { ActividadEditarForm } from "@/app/panel/actividades/[id]/editar/schema";
import type { ArchivoGuardado } from "@/components/ui/uploader";
import type { EstadoActividad } from "@/types/actividad-prod";
import type { FaqItem, TarifaFila } from "@/types/actividad-form";
import type { ArchivoUploadResponse } from "@/types/establecimiento";

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
  url?: string;
  nombre?: string;
}

interface ActividadEditarBackend {
  id?: string;
  nombre?: string;
  descripcion?: string;
  cultivos?: unknown;
  fotosParaSubir?: unknown;
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

function aFotos(v: unknown): ArchivoGuardado[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((f): f is FotoBackend => !!f && typeof f === "object")
    .map((f) => ({
      key: typeof f.key === "string" ? f.key : "",
      url: typeof f.url === "string" ? f.url : "",
      nombre: f.nombre ?? "",
    }))
    // Sin key no hay forma de decirle al backend que la conserve.
    .filter((f) => f.key !== "");
}

/** URLs prefirmadas devueltas por el POST, para subir las fotos nuevas. */
function aSubidas(v: unknown): ArchivoUploadResponse[] {
  if (!Array.isArray(v)) return [];
  return v.filter(
    (r): r is ArchivoUploadResponse =>
      !!r && typeof r === "object" && typeof (r as ArchivoUploadResponse).uploadUrl === "string",
  );
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
    fotos: aFotos(d.fotosGuardadas),
    nuevas: [],
    incluye: conRenglonVacio(aTextos(d.incluye)),
    noIncluye: conRenglonVacio(aTextos(d.noIncluye)),
    faqs: faqs.length ? faqs : [{ q: "", a: "" }],
    estado: aEstado(d.estado),
  };
}

interface UseActividadEdicionReturn {
  data: ActividadEditarForm | null;
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
  const [res, setRes] = useState<{ clave: string; data: ActividadEditarForm | null; error: string | null }>(
    { clave: "", data: null, error: null },
  );

  useEffect(() => {
    if (!clave) return;
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        setRes({ clave, data: null, error: "Necesitás iniciar sesión para editar la actividad" });
        return;
      }
      try {
        const token = await user.getIdToken();
        const r = await apiFetch<unknown>(editPath(establecimientoId, actividadId), { token });
        if (!active) return;
        const env = comoEnvelope<ActividadEditarBackend>(r);
        setRes(
          env.ok && env.data
            ? { clave, data: aActividadEditar(env.data), error: null }
            : { clave, data: null, error: env.code ?? "No pudimos cargar la actividad" },
        );
      } catch (e) {
        if (active) setRes({ clave, data: null, error: e instanceof Error ? e.message : "Error inesperado" });
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

interface FotoNuevaDTO {
  filename: string;
  contentType: string;
  fileSize: number;
}

export interface EdicionActividadDTO {
  nombre: string;
  descripcion: string;
  cultivos: string[];
  fotosNuevas: FotoNuevaDTO[];
  /** Keys de las que se conservan: las que falten acá se borran. */
  fotosExistentes: string[];
  tarifas: TarifaEditDTO[];
  incluye: string[];
  noIncluye: string[];
  faqs: { pregunta: string; respuesta: string }[];
  estado: string;
}

export function aPayloadEdicion(v: ActividadEditarForm, estado: EstadoActividad): EdicionActividadDTO {
  return {
    nombre: v.nombre.trim(),
    descripcion: v.descripcion.trim(),
    cultivos: v.cultivos,
    fotosNuevas: v.nuevas.map((f) => ({
      filename: f.name,
      // La misma función que usa el PUT prefirmado sobre el mismo File: así el
      // content type firmado y el enviado no se pueden desincronizar.
      contentType: contentTypeDe(f),
      fileSize: f.size,
    })),
    fotosExistentes: v.fotos.map((f) => f.key),
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
  /** URLs prefirmadas de las fotos nuevas, para subirlas después del guardado. */
  subidas: ArchivoUploadResponse[];
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
  ): Promise<ResultadoEdicion> {
    setIsLoading(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(editPath(establecimientoId, actividadId), {
          method: "PUT",
          token,
          body: JSON.stringify(aPayloadEdicion(data, estado)),
        }),
      );
      const env = comoEnvelope<ActividadEditarBackend>(res);
      if (!env.ok) return { ok: false, code: env.code, subidas: [], advertencias: [] };
      return {
        ok: true,
        subidas: aSubidas(env.data?.fotosParaSubir),
        advertencias: aTextos(env.data?.advertencias),
      };
    } catch (e) {
      if (e instanceof ApiError) return { ok: false, code: e.code, subidas: [], advertencias: [] };
      // `apiFetch` sólo llega a res.json() con un 2xx: un error de parseo es una
      // edición hecha y contestada sin cuerpo. Sin cuerpo no hay URLs de subida.
      if (e instanceof SyntaxError) return { ok: true, subidas: [], advertencias: [] };
      return { ok: false, subidas: [], advertencias: [] };
    } finally {
      setIsLoading(false);
    }
  }

  return { guardar, isLoading };
}
