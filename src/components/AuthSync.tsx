"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { useAuthStore } from "@/stores/authStore";

/**
 * Sincroniza el store con la fuente de verdad (la sesión de Firebase) y dispara
 * la rehidratación del store en el cliente (skipHydration evita el mismatch de SSR).
 *
 * - rehidrata el perfil cacheado en localStorage,
 * - si Firebase dice que no hay usuario (sesión expirada / cerró sesión), limpia
 *   el store para que el navbar no muestre datos obsoletos.
 */
export default function AuthSync() {
  useEffect(() => {
    useAuthStore.persist.rehydrate();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) useAuthStore.getState().clear();
    });
    return () => unsub();
  }, []);

  return null;
}
