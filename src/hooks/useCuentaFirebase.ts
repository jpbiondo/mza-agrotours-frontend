import { useEffect, useState } from "react";
import { auth } from "../../firebase.config";

interface UseCuentaFirebaseReturn {
  /** Firebase todavía no resolvió el estado de sesión. */
  checking: boolean;
  /** Email de la cuenta con sesión iniciada; `null` si no hay sesión. */
  email: string | null;
}

/**
 * La cuenta de Firebase tal como está al entrar a la pantalla. Se lee una sola
 * vez a propósito: en el alta, el sign-up inicia sesión antes de que exista el
 * perfil, y eso no tiene que confundirse con una cuenta que ya venía sin él.
 */
export function useCuentaFirebase(): UseCuentaFirebaseReturn {
  const [estado, setEstado] = useState<UseCuentaFirebaseReturn>({
    checking: true,
    email: null,
  });

  useEffect(() => {
    let active = true;
    auth.authStateReady().then(() => {
      if (active) setEstado({ checking: false, email: auth.currentUser?.email ?? null });
    });
    return () => {
      active = false;
    };
  }, []);

  return estado;
}
