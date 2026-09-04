import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { apiFetch, comoEnvelope } from "@/lib/api";
import type { CultivoRef } from "@/types/datos";

const TIPOS_CULTIVO = "/tipos-cultivo";

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

/**
 * GET /tipos-cultivo: los cultivos que se pueden asociar, a un establecimiento
 * o a una actividad. `habilitado` deja pedirlo recién cuando hace falta —al
 * abrir un modal, por ejemplo— en vez de en cada carga de pantalla.
 */
export function useTiposCultivo(habilitado: boolean) {
  const [cultivos, setCultivos] = useState<CultivoRef[]>([]);
  // Arranca en carga si ya está habilitado: prenderlo desde el efecto sería un
  // render de más y un setState sincrónico adentro del efecto.
  const [isLoading, setIsLoading] = useState(habilitado);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!habilitado) return;
    let active = true;

    // Se espera a que Firebase restaure la sesión en vez de leer
    // `auth.currentUser` de una: cuando el pedido sale al montar la pantalla,
    // todavía no está poblado y el catálogo quedaba vacío sin decir por qué.
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        setError("Necesitás iniciar sesión para ver los cultivos");
        setIsLoading(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await apiFetch<unknown>(TIPOS_CULTIVO, { token });
        if (!active) return;
        const env = comoEnvelope<CultivoBackend[]>(res);
        if (!env.ok) {
          setError(env.code ?? "No pudimos cargar los cultivos");
          return;
        }
        setCultivos(aCultivos(env.data));
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Error inesperado");
      } finally {
        if (active) setIsLoading(false);
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [habilitado]);

  return { cultivos, isLoading, error };
}
