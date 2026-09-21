import { useCallback, useEffect, useRef, useState } from "react";
import { pedirFirmas } from "@/lib/presign";
import { putPrefirmado } from "@/lib/storage";
import {
  PORTADA_ANCHO_MINIMO,
  PORTADA_EXTENSIONES,
  PORTADA_MAX_BYTES,
  PORTADA_MIMES,
} from "@/data/datos";
import { extensionDe } from "@/data/establecimiento";
import { fmtBytes } from "@/lib/utils";
import type { FotoClaim } from "@/types/actividad-foto";
import type { FotoPortada } from "@/types/datos";

/**
 * Portada del establecimiento: una sola imagen, que se sube al bucket apenas se
 * elige y recién se asocia cuando la pantalla guarda (PUT /establecimientos/{id}
 * con `foto: { key, nombre }`).
 *
 * El endpoint de firma es el del establecimiento —`/archivos/presign`, sólo para
 * el titular—, distinto del de actividades; la carpeta la decide el backend.
 */

function presignPath(establecimientoId: string): string {
  return `/establecimientos/${encodeURIComponent(establecimientoId)}/archivos/presign`;
}

/** Lo que se muestra en la tarjeta mientras se edita. */
export interface PortadaEnEdicion {
  key: string;
  nombre: string;
  /** Object URL local si es nueva, `downloadUrl` del backend si ya estaba. */
  previewUrl: string;
  /** Sólo las nuevas: el navegador ya las midió. La guardada no las informa. */
  ancho?: number;
  alto?: number;
  /** Sólo las nuevas. La guardada no trae el peso. */
  bytes?: number;
}

/**
 * Mide la imagen sin dibujarla. Es lo único que permite rechazar una portada
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
function revisarArchivo(file: File): string | null {
  const ext = extensionDe(file.name);
  const mime = file.type.trim().toLowerCase();
  const formatoOk =
    PORTADA_EXTENSIONES.includes(ext as (typeof PORTADA_EXTENSIONES)[number]) &&
    // El navegador puede no informar el tipo (drag & drop): ahí basta la extensión.
    (mime === "" || PORTADA_MIMES.includes(mime as (typeof PORTADA_MIMES)[number]));
  if (!formatoOk) return "Formato no válido. Subí una imagen JPG o PNG.";
  if (file.size > PORTADA_MAX_BYTES) {
    return `La imagen pesa ${fmtBytes(file.size)} y supera los ${fmtBytes(PORTADA_MAX_BYTES)}. Reducí su peso e intentá de nuevo.`;
  }
  return null;
}

interface UseFotoPortadaReturn {
  portada: PortadaEnEdicion | null;
  /**
   * Valida, sube al bucket y deja la portada lista para guardar. Devuelve la
   * portada nueva —o `null` si no se pudo— en vez de sólo dejarla en el estado:
   * quien llama necesita persistirla en el acto, y el estado de React todavía no
   * se actualizó cuando la promesa resuelve.
   */
  elegir: (file: File) => Promise<PortadaEnEdicion | null>;
  /** La saca. Recién se borra de verdad cuando la pantalla guarda. */
  quitar: () => void;
  /** Lo que viaja en el PUT: `null` le dice al backend que la quite. */
  claim: FotoClaim | null;
  subiendo: boolean;
  /** Motivo para mostrarle al usuario. `null` si no hay nada que avisar. */
  error: string | null;
  limpiarError: () => void;
  /** Si cambió respecto de la que vino del backend. */
  sucio: boolean;
}

export function useFotoPortada(
  establecimientoId: string,
  inicial: FotoPortada | null,
): UseFotoPortadaReturn {
  const [portada, setPortada] = useState<PortadaEnEdicion | null>(
    inicial && { key: inicial.key, nombre: inicial.nombre, previewUrl: inicial.downloadUrl },
  );
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sucio, setSucio] = useState(false);

  // Las object URL de las portadas nuevas se revocan al desmontar. Van en un ref
  // porque el cleanup corre una sola vez y no puede depender del estado.
  const objectUrls = useRef<string[]>([]);
  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const elegir = useCallback(
    async (file: File): Promise<PortadaEnEdicion | null> => {
      if (!establecimientoId) return null;

      const problema = revisarArchivo(file);
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
      // Una portada angosta se ve pixelada en el perfil público y en las
      // tarjetas de búsqueda, que la muestran a todo el ancho.
      if (medida.ancho < PORTADA_ANCHO_MINIMO) {
        setError(
          `La imagen mide ${medida.ancho}×${medida.alto} px. Para que se vea bien necesitamos al menos ${PORTADA_ANCHO_MINIMO} px de ancho.`,
        );
        return null;
      }

      setError(null);
      setSubiendo(true);
      try {
        const firmas = await pedirFirmas(presignPath(establecimientoId), [
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

        const nueva: PortadaEnEdicion = {
          key: firma.key,
          nombre: file.name,
          previewUrl: url,
          ancho: medida.ancho,
          alto: medida.alto,
          bytes: file.size,
        };
        setSucio(true);
        setPortada(nueva);
        return nueva;
      } finally {
        setSubiendo(false);
      }
    },
    [establecimientoId],
  );

  const quitar = useCallback(() => {
    setSucio(true);
    setError(null);
    setPortada(null);
    // El objeto queda huérfano en el bucket hasta que lo barra el backend: una
    // URL de subida no sirve para borrar, y la key nunca se reclama.
  }, []);

  const limpiarError = useCallback(() => setError(null), []);

  return {
    portada,
    elegir,
    quitar,
    claim: portada ? { key: portada.key, nombre: portada.nombre } : null,
    subiendo,
    error,
    limpiarError,
    sucio,
  };
}
