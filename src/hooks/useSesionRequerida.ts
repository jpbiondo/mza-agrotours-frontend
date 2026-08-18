import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";

interface UseSesionRequeridaReturn {
  /** Firebase todavía no resolvió el estado de sesión. */
  checking: boolean;
  /** No hay sesión: la pantalla debe redirigir a /acceso. */
  unauthenticated: boolean;
}

/**
 * Guard de sesión sin lectura de red: sólo espera a que Firebase resuelva el
 * estado de auth. Para pantallas protegidas que no cargan datos del usuario
 * (p. ej. el formulario de alta), donde `usePerfil` sería una request de más.
 */
export function useSesionRequerida(): UseSesionRequeridaReturn {
  const [estado, setEstado] = useState<"checking" | "in" | "out">("checking");

  useEffect(() => onAuthStateChanged(auth, (user) => setEstado(user ? "in" : "out")), []);

  return { checking: estado === "checking", unauthenticated: estado === "out" };
}
