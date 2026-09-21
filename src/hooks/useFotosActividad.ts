import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { pedirFirmas } from "@/lib/presign";
import { putPrefirmado } from "@/lib/storage";
import type { FotoActividad, FotoClaim } from "@/types/actividad-foto";

/**
 * Fotos de una actividad, subidas apenas se sueltan en el uploader.
 *
 * El recorrido de cada foto es firmar → subir → reclamar:
 *
 * 1. `POST /establecimientos/{id}/actividades/archivos/presign` devuelve una
 *    `uploadUrl`, la `key` y el `contentType` por archivo.
 * 2. El navegador hace el PUT derecho al bucket. Los bytes nunca pasan por el
 *    backend.
 * 3. Al guardar la actividad se le manda `claims` y el backend reclama esas
 *    keys: verifica que las haya emitido él, que nadie las haya usado antes y
 *    que el objeto esté realmente en el bucket.
 *
 * **El orden lo define la posición en `claims`**, no el orden en que se
 * subieron: el backend numera `orden` con el índice del arreglo que recibe. Por
 * eso los PUT salen en paralelo (son hasta 10 imágenes de 5 MB y manda la
 * latencia) y el reordenamiento posterior no obliga a resubir nada.
 */

function presignPath(establecimientoId: string): string {
  return `/establecimientos/${encodeURIComponent(establecimientoId)}/actividades/archivos/presign`;
}

const SIN_FIRMA = "El backend no devolvió URL de subida para este archivo";

interface UseFotosActividadReturn {
  fotos: FotoActividad[];
  /** Agrega archivos al final y arranca su subida. */
  agregar: (files: File[]) => Promise<void>;
  quitar: (id: string) => void;
  /** Mueve una foto de una posición a otra. Es lo que define el orden final. */
  mover: (desde: number, hasta: number) => void;
  /** Vuelve a intentar la subida de una que falló, reusando el mismo File. */
  reintentar: (id: string) => Promise<void>;
  /** Lo que se le manda al backend al guardar, en orden y sólo lo que llegó. */
  claims: FotoClaim[];
  /** Hay al menos una subida en curso: conviene no dejar guardar todavía. */
  subiendo: boolean;
  /** Cuántas quedaron en error. Con alguna, guardar perdería esas fotos. */
  conError: number;
  /** Si se tocó algo desde que se montó. Sirve para el aviso de salir sin guardar. */
  sucio: boolean;
}

/**
 * `inicial` son las fotos que ya tenía la actividad (sólo al editar). Se usa
 * como estado inicial y nada más: la pantalla de edición monta el formulario
 * recién con los datos cargados, así que no hace falta resincronizar después.
 */
export function useFotosActividad(
  establecimientoId: string,
  inicial: FotoActividad[] = [],
): UseFotosActividadReturn {
  const [fotos, setFotos] = useState<FotoActividad[]>(inicial);
  const [sucio, setSucio] = useState(false);

  // Espejo de `fotos` para leerlas desde un handler sin cerrar sobre el render
  // en que se creó. No sirve el updater de `setFotos`: React no lo corre en el
  // momento de llamarlo, así que leer de ahí devuelve `undefined`.
  const fotosRef = useRef(fotos);
  useEffect(() => {
    fotosRef.current = fotos;
  }, [fotos]);

  // Las object URL de las fotos nuevas se revocan al desmontar. Se llevan en un
  // ref porque el cleanup corre una sola vez y no puede depender del estado.
  const objectUrls = useRef<string[]>([]);
  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  /** Parche puntual sobre una foto, respetando su posición en la lista. */
  const parchear = useCallback((id: string, cambios: Partial<FotoActividad>) => {
    setFotos((prev) => prev.map((f) => (f.id === id ? { ...f, ...cambios } : f)));
  }, []);

  /** El PUT propiamente dicho, más el paso de la foto a `lista` o `error`. */
  const subirUna = useCallback(
    async (foto: FotoActividad) => {
      if (!foto.uploadUrl || !foto.file) {
        parchear(foto.id, { estado: "error", motivo: SIN_FIRMA });
        return;
      }
      const motivo = await putPrefirmado(
        foto.uploadUrl,
        foto.file,
        // El backend siempre lo manda; el fallback es por las dudas y usa el
        // tipo que informó el navegador.
        foto.contentType ?? foto.file.type,
      );
      parchear(
        foto.id,
        motivo === null ? { estado: "lista", motivo: undefined } : { estado: "error", motivo },
      );
    },
    [parchear],
  );

  const agregar = useCallback(
    async (files: File[]) => {
      if (files.length === 0 || !establecimientoId) return;
      setSucio(true);

      // Los tiles aparecen antes de que vuelva el presign: soltar una foto y no
      // ver nada hasta que el backend conteste se siente como que se perdió.
      const nuevas: FotoActividad[] = files.map((file) => {
        const previewUrl = URL.createObjectURL(file);
        objectUrls.current.push(previewUrl);
        return {
          id: crypto.randomUUID(),
          nombre: file.name,
          key: null,
          previewUrl,
          estado: "subiendo",
          file,
        };
      });
      setFotos((prev) => [...prev, ...nuevas]);

      const firmas = await pedirFirmas(
        presignPath(establecimientoId),
        files.map((f) => ({ filename: f.name, fileSize: f.size })),
      );

      if (firmas === null) {
        setFotos((prev) =>
          prev.map((f) =>
            nuevas.some((n) => n.id === f.id)
              ? { ...f, estado: "error", motivo: "No se pudo firmar la subida" }
              : f,
          ),
        );
        return;
      }

      // Se empareja por índice y no por nombre: el presign mapea el arreglo
      // entrante uno a uno, y dos archivos homónimos —algo habitual al arrastrar
      // desde dos carpetas— colapsarían en la misma URL si se matcheara por nombre.
      const listas = nuevas.map((foto, i) => {
        const firma = firmas[i];
        if (!firma) return { ...foto, estado: "error" as const, motivo: SIN_FIRMA };
        return {
          ...foto,
          key: firma.key,
          uploadUrl: firma.uploadUrl,
          contentType: firma.contentType,
        };
      });
      setFotos((prev) => prev.map((f) => listas.find((l) => l.id === f.id) ?? f));

      await Promise.all(listas.filter((f) => f.estado === "subiendo").map(subirUna));
    },
    [establecimientoId, subirUna],
  );

  const quitar = useCallback((id: string) => {
    setSucio(true);
    setFotos((prev) => {
      const foto = prev.find((f) => f.id === id);
      // Sólo las nuevas tienen object URL propia; la de una guardada es una
      // downloadUrl del backend y revocarla no haría nada bueno.
      if (foto?.file) {
        URL.revokeObjectURL(foto.previewUrl);
        objectUrls.current = objectUrls.current.filter((u) => u !== foto.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
    // El objeto queda huérfano en el bucket hasta que lo limpie el backend: no
    // hay forma de borrarlo con una URL de subida, y nunca se reclama.
  }, []);

  const mover = useCallback((desde: number, hasta: number) => {
    setSucio(true);
    setFotos((prev) => {
      if (desde === hasta || desde < 0 || hasta < 0 || desde >= prev.length || hasta >= prev.length) {
        return prev;
      }
      const copia = [...prev];
      const [movida] = copia.splice(desde, 1);
      copia.splice(hasta, 0, movida);
      return copia;
    });
  }, []);

  const reintentar = useCallback(
    async (id: string) => {
      const foto = fotosRef.current.find((f) => f.id === id);
      if (!foto || foto.estado !== "error" || !foto.file) return;
      parchear(id, { estado: "subiendo", motivo: undefined });

      // Con firma previa se reusa tal cual: la URL sigue viva (TTL del backend)
      // y la key nunca se llegó a reclamar.
      if (foto.uploadUrl) {
        await subirUna(foto);
        return;
      }

      // Sin firma previa —falló el presign— hay que pedir una nueva.
      const firmas = await pedirFirmas(presignPath(establecimientoId), [
        { filename: foto.file.name, fileSize: foto.file.size },
      ]);
      const firma = firmas?.[0];
      if (!firma) {
        parchear(id, { estado: "error", motivo: "No se pudo firmar la subida" });
        return;
      }
      // Se guarda la firma ANTES del PUT: si el usuario recarga o vuelve a
      // reintentar, la key ya está asociada al tile.
      parchear(id, { key: firma.key, uploadUrl: firma.uploadUrl, contentType: firma.contentType });
      await subirUna({
        ...foto,
        key: firma.key,
        uploadUrl: firma.uploadUrl,
        contentType: firma.contentType,
      });
    },
    [establecimientoId, parchear, subirUna],
  );

  const claims = useMemo(
    (): FotoClaim[] =>
      fotos
        .filter((f): f is FotoActividad & { key: string } => f.estado === "lista" && !!f.key)
        .map((f) => ({ key: f.key, nombre: f.nombre })),
    [fotos],
  );

  const subiendo = fotos.some((f) => f.estado === "subiendo");
  const conError = fotos.filter((f) => f.estado === "error").length;

  return { fotos, agregar, quitar, mover, reintentar, claims, subiendo, conError, sucio };
}
