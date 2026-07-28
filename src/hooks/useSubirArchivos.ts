import { useCallback, useState } from "react";
import { contentTypeDe } from "@/data/establecimiento";
import type {
  ArchivoFallido,
  ArchivoUploadResponse,
  ItemSubida,
  SubirArchivosResultado,
} from "@/types/establecimiento";

const SIN_URL = "El backend no devolvió URL de subida para este archivo";

/** Claves con las que un ArchivoUploadResponse puede matchear un File.name. */
function clavesDe(r: ArchivoUploadResponse): string[] {
  const nombre = (r.nombre ?? "").trim().toLowerCase();
  if (!nombre) return [];
  const ext = (r.extension ?? "").trim().toLowerCase().replace(/^\.+/, "");
  return ext && !nombre.endsWith(`.${ext}`) ? [nombre, `${nombre}.${ext}`] : [nombre];
}

/**
 * Empareja cada File con su respuesta por NOMBRE, nunca por índice (el backend
 * no garantiza el orden). `nombre` puede venir con o sin extensión y se compara
 * sin distinguir mayúsculas. Cada respuesta se consume al usarse, así dos
 * archivos homónimos no terminan apuntando a la misma URL.
 *
 * Exportada aparte para poder testearla.
 */
export function emparejar(
  files: File[],
  respuestas: ArchivoUploadResponse[],
): { pares: { file: File; upload: ArchivoUploadResponse }[]; sinUrl: File[] } {
  const usada = respuestas.map(() => false);
  const porClave = new Map<string, number[]>();
  respuestas.forEach((r, i) => {
    for (const c of clavesDe(r)) porClave.set(c, [...(porClave.get(c) ?? []), i]);
  });

  const pares: { file: File; upload: ArchivoUploadResponse }[] = [];
  const sinUrl: File[] = [];

  for (const file of files) {
    const candidatos = porClave.get(file.name.trim().toLowerCase()) ?? [];
    const i = candidatos.find((c) => !usada[c]);
    if (i === undefined) {
      sinUrl.push(file);
      continue;
    }
    usada[i] = true;
    pares.push({ file, upload: respuestas[i] });
  }

  return { pares, sinUrl };
}

function aItem(file: File, upload?: ArchivoUploadResponse): ItemSubida {
  return {
    nombre: file.name,
    file,
    uploadUrl: upload?.uploadUrl ?? null,
    storageKey: upload?.key ?? null,
    contentType: contentTypeDe(file),
  };
}

/**
 * PUT del archivo a su URL prefirmada. NO usa `apiFetch` a propósito: el destino
 * es el object storage, no el backend. `apiFetch` fuerza
 * `Content-Type: application/json`, adjunta el ID token de Firebase (filtrarlo a
 * un host de terceros sería un problema de seguridad) y hace `res.json()` sobre
 * el 200/204 vacío del storage, que rompería.
 *
 * Nunca lanza: devuelve el motivo del fallo, o `null` si salió bien.
 */
async function putArchivo(item: ItemSubida): Promise<string | null> {
  if (!item.uploadUrl) return SIN_URL;
  try {
    const res = await fetch(item.uploadUrl, {
      method: "PUT",
      // Único header: cualquier extra puede romper la firma V4.
      headers: { "Content-Type": item.contentType },
      body: item.file,
    });
    return res.ok ? null : `HTTP ${res.status}`;
  } catch (e) {
    // Incluye el TypeError opaco de CORS: el navegador no lo distingue de un fallo de red.
    return e instanceof Error ? e.message : "Error de red";
  }
}

interface UseSubirArchivosReturn {
  subir: (files: File[], respuestas: ArchivoUploadResponse[]) => Promise<SubirArchivosResultado>;
  reintentar: (fallidos: ArchivoFallido[]) => Promise<SubirArchivosResultado>;
  isLoading: boolean;
  /** Archivos terminados / totales de la tanda en curso. */
  progreso: { hechos: number; total: number };
}

/**
 * Sube archivos a URLs prefirmadas. Cada archivo falla por separado: la promesa
 * nunca rechaza y el resultado lista los fallidos con lo necesario para reintentar.
 */
export function useSubirArchivos(): UseSubirArchivosReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [progreso, setProgreso] = useState({ hechos: 0, total: 0 });

  const correr = useCallback(async (items: ItemSubida[]): Promise<SubirArchivosResultado> => {
    setIsLoading(true);
    setProgreso({ hechos: 0, total: items.length });
    try {
      // En paralelo: como máximo UPLOAD_MAX_FILES (10) y 30 MB en total, y domina
      // la latencia. `putArchivo` ya absorbe sus errores, así que `Promise.all`
      // alcanza (no hace falta `allSettled`).
      const motivos = await Promise.all(
        items.map(async (it) => {
          const motivo = await putArchivo(it);
          setProgreso((p) => ({ ...p, hechos: p.hechos + 1 }));
          return motivo;
        }),
      );
      // Se recompone por índice para conservar el orden de selección del usuario.
      const fallidos: ArchivoFallido[] = items
        .map((it, i) => ({ ...it, motivo: motivos[i] ?? "" }))
        .filter((it) => it.motivo !== "");
      return { subidos: items.length - fallidos.length, total: items.length, fallidos };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const subir = useCallback(
    (files: File[], respuestas: ArchivoUploadResponse[]) => {
      const { pares } = emparejar(files, respuestas);
      const porFile = new Map(pares.map((p) => [p.file, p.upload]));
      // Se recorre `files` para no alterar el orden original.
      return correr(files.map((f) => aItem(f, porFile.get(f))));
    },
    [correr],
  );

  const reintentar = useCallback(
    (fallidos: ArchivoFallido[]) => correr(fallidos.filter((f) => f.uploadUrl !== null)),
    [correr],
  );

  return { subir, reintentar, isLoading, progreso };
}
