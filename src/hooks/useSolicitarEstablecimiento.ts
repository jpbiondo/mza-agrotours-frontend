import { useCallback, useRef, useState } from "react";
import { auth } from "../../firebase.config";
import { apiFetch, ApiError } from "@/lib/api";
import { pedirFirmas } from "@/lib/presign";
import { putPrefirmado } from "@/lib/storage";
import { contentTypeDe } from "@/data/establecimiento";
import { emparejar } from "@/hooks/useSubirArchivos";
import type { SolicitarAltaForm } from "@/app/(sitio)/mis-solicitudes/nueva/schema";
import type { ArchivoFallido, SolicitudEstablecimientoCreateResp } from "@/types/establecimiento";
import type { FotoClaim } from "@/types/actividad-foto";

/** Cualquier usuario autenticado puede firmar: todavía no tiene establecimiento. */
const PRESIGN = "/solicitudes-establecimiento/archivos/presign";

interface CreateResponse {
  ok: boolean;
  code?: string;
  data?: SolicitudEstablecimientoCreateResp;
  /**
   * Archivos que no llegaron al bucket. Si hay alguno, la solicitud **no se
   * creó**: el backend reclama cada key con un `headObject` y rechaza el alta
   * entera si un objeto no está.
   */
  fallidos: ArchivoFallido[];
}

/** Metadatos de cada archivo para pedir su firma (DTO PresignedUrlRequest). */
function aItems(files: File[]) {
  return files.map((f) => ({ filename: f.name, fileSize: f.size }));
}

/** Payload de POST /solicitudes-establecimiento/create. */
function toPayload(f: SolicitarAltaForm, archivos: FotoClaim[]) {
  return {
    nombreEstablecimiento: f.nombre.trim(),
    razonSocial: f.razonSocial.trim(),
    cuit: f.cuit.trim(),
    descripcion: f.descripcion.trim(),
    domicilioLegal: f.domicilio.trim(),
    departamento: f.departamento,
    telefono: f.telefono.trim(),
    email: f.email.trim().toLowerCase(),
    cvu: f.cvu.trim(),
    // Sólo las keys: los bytes ya están en el bucket.
    archivos,
  };
}

/**
 * Alta de una solicitud de establecimiento.
 *
 * El orden importa y es al revés que antes: **primero se suben las pruebas al
 * bucket y recién después se crea la solicitud** con la lista de keys
 * (`ArchivoClaimRequest`). Antes el POST devolvía las URLs prefirmadas y la
 * subida iba después, lo que dejaba solicitudes creadas con documentación
 * incompleta; ahora, si un archivo no llega, la solicitud directamente no se
 * crea y el usuario puede reintentar sin haber ensuciado nada.
 *
 * Los objetos de un intento fallido quedan huérfanos en el bucket —nunca se
 * reclaman— hasta que los barra el backend.
 */
export function useSolicitarEstablecimiento() {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Keys ya confirmadas, por File. Un reintento no vuelve a subir lo que ya
   * llegó: se firma y se sube sólo lo que falta.
   */
  const subidas = useRef(new Map<File, FotoClaim>());

  /** Sube los que todavía no tienen key. Devuelve los que fallaron. */
  const subirPendientes = useCallback(async (files: File[]): Promise<ArchivoFallido[]> => {
    const pendientes = files.filter((f) => !subidas.current.has(f));
    if (pendientes.length === 0) return [];

    const firmas = await pedirFirmas(PRESIGN, aItems(pendientes));
    if (firmas === null) {
      // Sin firmas no hay a dónde subir: se listan todos como fallidos sin URL,
      // que es lo que la pantalla lee para saber que no puede reintentar sola.
      return pendientes.map((file) => ({
        nombre: file.name,
        file,
        uploadUrl: null,
        storageKey: null,
        contentType: contentTypeDe(file),
        motivo: "No se pudo firmar la subida",
      }));
    }

    // Por nombre y no por índice: es lo que ya hacía este flujo, y el presign
    // consume cada respuesta una sola vez.
    const { pares } = emparejar(pendientes, firmas);
    const porFile = new Map(pares.map((p) => [p.file, p.upload]));

    const fallidos: ArchivoFallido[] = [];
    await Promise.all(
      pendientes.map(async (file) => {
        const firma = porFile.get(file);
        const contentType = firma?.contentType ?? contentTypeDe(file);
        const motivo = firma
          ? await putPrefirmado(firma.uploadUrl, file, contentType)
          : "El backend no devolvió URL de subida para este archivo";
        if (motivo === null && firma) {
          subidas.current.set(file, { key: firma.key, nombre: file.name });
          return;
        }
        fallidos.push({
          nombre: file.name,
          file,
          uploadUrl: firma?.uploadUrl ?? null,
          storageKey: firma?.key ?? null,
          contentType,
          motivo: motivo ?? "",
        });
      }),
    );
    return fallidos;
  }, []);

  async function solicitar(data: SolicitarAltaForm, files: File[]): Promise<CreateResponse> {
    setIsLoading(true);
    try {
      if (!auth.currentUser) return { ok: false, fallidos: [] };

      const fallidos = await subirPendientes(files);
      if (fallidos.length > 0) return { ok: false, fallidos };

      // Se recorre `files` para conservar el orden en que los eligió el usuario.
      const archivos = files
        .map((f) => subidas.current.get(f))
        .filter((c): c is FotoClaim => c !== undefined);

      const token = await auth.currentUser.getIdToken();
      try {
        const res = await apiFetch<CreateResponse>("/solicitudes-establecimiento/create", {
          method: "POST",
          token,
          body: JSON.stringify(toPayload(data, archivos)),
        });
        return res.ok
          ? { ok: true, data: res.data, fallidos: [] }
          : { ok: false, code: res.code, fallidos: [] };
      } catch (e) {
        if (e instanceof ApiError) return { ok: false, code: e.code, fallidos: [] };
        return { ok: false, fallidos: [] };
      }
    } finally {
      setIsLoading(false);
    }
  }

  return { solicitar, isLoading };
}
