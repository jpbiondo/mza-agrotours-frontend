"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { BackendProfile } from "@/types/auth";

interface ProfileResponse {
  ok: boolean;
  code?: string;
  data?: BackendProfile;
}

/**
 * Sincroniza el store con la fuente de verdad (la sesión de Firebase) y dispara
 * la rehidratación del store en el cliente (skipHydration evita el mismatch de SSR).
 *
 * - rehidrata el perfil cacheado en localStorage,
 * - si Firebase dice que no hay usuario (sesión expirada / cerró sesión), limpia
 *   el store para que el navbar no muestre datos obsoletos,
 * - si hay sesión, revalida el perfil contra el backend: los permisos viven en
 *   `tipoPermisos` y lo cacheado puede haber quedado viejo (p. ej. al aprobarse
 *   una solicitud, la cuenta pasa a ser productora). Un fallo acá se ignora en
 *   silencio: se sigue con lo cacheado antes que dejar al usuario sin navbar.
 */
export default function AuthSync() {
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
        const token = await user.getIdToken();
        const res = await apiFetch<ProfileResponse>("/usuario/me", { token });
        if (!active || !res.ok || !res.data) return;
        useAuthStore.getState().setSession({
          nombre: res.data.nombre,
          email: res.data.email,
          accesos: res.data.accesos ?? [],
        });
      } catch {
        // Backend caído o sin red: se conserva el perfil cacheado.
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  return null;
}
