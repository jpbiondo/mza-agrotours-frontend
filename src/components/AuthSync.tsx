"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { cargarPerfil } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/authStore";
import { RUTA_COMPLETAR_REGISTRO } from "@/data/auth";

/**
 * Sincroniza el store con la fuente de verdad (la sesión de Firebase) y dispara
 * la rehidratación del store en el cliente (skipHydration evita el mismatch de SSR).
 *
 * - rehidrata el perfil cacheado en localStorage,
 * - si Firebase dice que no hay usuario (sesión expirada / cerró sesión), limpia
 *   el store para que el navbar no muestre datos obsoletos,
 * - si hay sesión, revalida el perfil contra el backend: los permisos viven en
 *   `tipoPermisos` y lo cacheado puede haber quedado viejo (p. ej. al aprobarse
 *   una solicitud, la cuenta pasa a ser productora). Un fallo técnico acá se
 *   ignora en silencio: se sigue con lo cacheado antes que dejar al usuario sin
 *   navbar.
 * - si hay sesión pero no perfil (el alta se cortó entre Firebase y el backend),
 *   lleva a completar el registro. En `/registro*` no: ahí el alta está en curso
 *   —el sign-up de Firebase dispara este listener antes de que exista el perfil—
 *   o ya se está completando.
 */
export default function AuthSync() {
  const router = useRouter();

  useEffect(() => {
    useAuthStore.persist.rehydrate();

    // Sólo en desarrollo: expone el store para las pruebas e2e del navbar.
    // Next reemplaza process.env.NODE_ENV, así que esto se elimina en producción.
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __authStore?: typeof useAuthStore }).__authStore = useAuthStore;
    }

    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        useAuthStore.getState().clear();
        return;
      }
      try {
        const perfil = await cargarPerfil(await user.getIdToken());
        if (!active || perfil.estado !== "sinPerfil") return;
        if (window.location.pathname.startsWith("/registro")) return;
        useAuthStore.getState().clear();
        router.replace(RUTA_COMPLETAR_REGISTRO);
      } catch {
        // Sin red al pedir el token: se conserva el perfil cacheado.
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [router]);

  return null;
}
