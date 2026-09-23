import { useCallback, useEffect, useRef, useState } from "react";
import { pedirFirmas } from "@/lib/presign";
import { putPrefirmado } from "@/lib/storage";
import { extensionDe } from "@/data/establecimiento";
import { fmtBytes } from "@/lib/utils";
import type { FotoClaim } from "@/types/actividad-foto";
import type { ImagenEnEdicion, ImagenGuardada, LimitesImagen } from "@/types/imagen";

/**
 * Imagen única de una entidad: se sube al bucket apenas se elige y recién se
 * asocia cuando la pantalla guarda, mandando `{ key, nombre }` —o `null` para
 * quitarla— en el PUT/POST de la entidad.
 *
 * El endpoint de firma cambia por contexto (y con él el permiso y la carpeta,
 * que fija extensiones y peso), así que el path lo pone quien llama:
 *
 * - portada del establecimiento → `/establecimientos/{id}/archivos/presign`
 * - imagen del cultivo → `/admin/tipos-cultivo/archivos/presign`
 */

/**
 * Mide la imagen sin dibujarla. Es lo único que permite rechazar una imagen
 * demasiado chica antes de subirla: el peso no dice nada del tamaño en píxeles.
 */
function medir(url: string): Promise<{ ancho: number; alto: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ ancho: img.naturalWidth, alto: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Valida formato y peso. Devuelve el motivo, o `null` si pasa. */
function revisarArchivo(file: File, limites: LimitesImagen): string | null {
  const ext = extensionDe(file.name);
  const mime = file.type.trim().toLowerCase();
  const formatoOk =
    limites.extensiones.includes(ext) &&
    // El navegador puede no informar el tipo (drag & drop): ahí basta la extensión.
    (mime === "" || limites.mimes.includes(mime));
  if (!formatoOk) return `Formato no válido. Subí una imagen ${limites.formatosLabel}.`;
  if (file.size > limites.maxBytes) {
    return `La imagen pesa ${fmtBytes(file.size)} y supera los ${fmtBytes(limites.maxBytes)}. Reducí su peso e intentá de nuevo.`;
  }
  return null;
}

export interface UseImagenUnicaReturn {
  imagen: ImagenEnEdicion | null;
  /**
   * Valida, sube al bucket y la deja lista para guardar. Devuelve la imagen
   * nueva —o `null` si no se pudo— en vez de sólo dejarla en el estado: quien
   * llama puede necesitar persistirla en el acto, y el estado de React todavía
   * no se actualizó cuando la promesa resuelve.
   */
  elegir: (file: File) => Promise<ImagenEnEdicion | null>;
  /** La saca. Recién se borra de verdad cuando la pantalla guarda. */
  quitar: () => void;
  /** Lo que viaja al guardar: `null` le dice al backend que la quite. */
  claim: FotoClaim | null;
  subiendo: boolean;
  /** Motivo para mostrarle al usuario. `null` si no hay nada que avisar. */
  error: string | null;
  limpiarError: () => void;
  /** Si cambió respecto de la que vino del backend. */
  sucio: boolean;
}

export function useImagenUnica(
  presignPath: string,
  limites: LimitesImagen,
  inicial: ImagenGuardada | null,
): UseImagenUnicaReturn {
  const [imagen, setImagen] = useState<ImagenEnEdicion | null>(
    inicial && { key: inicial.key, nombre: inicial.nombre, previewUrl: inicial.downloadUrl },
  );
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sucio, setSucio] = useState(false);

  // Las object URL de las imágenes nuevas se revocan al desmontar. Van en un ref
  // porque el cleanup corre una sola vez y no puede depender del estado.
  const objectUrls = useRef<string[]>([]);
  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const elegir = useCallback(
    async (file: File): Promise<ImagenEnEdicion | null> => {
      const problema = revisarArchivo(file, limites);
      if (problema) {
        setError(problema);
        return null;
      }

      const url = URL.createObjectURL(file);
      objectUrls.current.push(url);

      const medida = await medir(url);
      if (!medida) {
        setError("No pudimos leer el archivo. Probá con otra imagen.");
        return null;
      }
      if (limites.anchoMinimo !== undefined && medida.ancho < limites.anchoMinimo) {
        setError(
          `La imagen mide ${medida.ancho}×${medida.alto} px. Para que se vea bien necesitamos al menos ${limites.anchoMinimo} px de ancho.`,
        );
        return null;
      }

      setError(null);
      setSubiendo(true);
      try {
        const firmas = await pedirFirmas(presignPath, [
          { filename: file.name, fileSize: file.size },
        ]);
        const firma = firmas?.[0];
        if (!firma) {
          setError("No pudimos preparar la subida. Probá de nuevo en unos minutos.");
          return null;
        }

        const motivo = await putPrefirmado(
          firma.uploadUrl,
          file,
          // El content type va firmado: hay que repetir el que mandó el backend.
          firma.contentType ?? file.type,
        );
        if (motivo !== null) {
          setError("No pudimos subir la imagen. Revisá tu conexión y probá de nuevo.");
          return null;
        }

        const nueva: ImagenEnEdicion = {
          key: firma.key,
          nombre: file.name,
          previewUrl: url,
          ancho: medida.ancho,
          alto: medida.alto,
          bytes: file.size,
        };
        setSucio(true);
        setImagen(nueva);
        return nueva;
      } finally {
        setSubiendo(false);
      }
    },
    [presignPath, limites],
  );

  const quitar = useCallback(() => {
    setSucio(true);
    setError(null);
    setImagen(null);
    // El objeto queda huérfano en el bucket hasta que lo barra el backend: una
    // URL de subida no sirve para borrar, y la key nunca se reclama.
  }, []);

  const limpiarError = useCallback(() => setError(null), []);

  return {
    imagen,
    elegir,
    quitar,
    claim: imagen ? { key: imagen.key, nombre: imagen.nombre } : null,
    subiendo,
    error,
    limpiarError,
    sucio,
  };
}
