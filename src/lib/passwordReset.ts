import {
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "../../firebase.config";

/**
 * Flujo de recuperación de contraseña (Option A: la acción vuelve a nuestra web).
 * Firebase manda un enlace a nuestra página con `?oobCode=...`; nosotros
 * verificamos el código, mostramos NUESTRO formulario (con nuestras reglas de
 * fortaleza) y confirmamos el cambio. La contraseña nunca se setea en la página
 * hosteada por Firebase.
 */

export type ResetCode = "invalidEmail" | "expired" | "error";

function esCodigoVencido(err: unknown): boolean {
  return (
    err instanceof FirebaseError &&
    (err.code === "auth/expired-action-code" || err.code === "auth/invalid-action-code")
  );
}

/**
 * Envía el correo de recuperación. Por privacidad (no filtrar qué correos
 * existen), un correo inexistente también resuelve como ok.
 */
export async function enviarResetEmail(email: string): Promise<{ ok: boolean; code?: ResetCode }> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { ok: true };
  } catch (err) {
    if (err instanceof FirebaseError && err.code === "auth/user-not-found") {
      return { ok: true };
    }
    if (err instanceof FirebaseError && err.code === "auth/invalid-email") {
      return { ok: false, code: "invalidEmail" };
    }
    return { ok: false, code: "error" };
  }
}

/** Verifica el oobCode del enlace y devuelve el email asociado. */
export async function verificarResetCode(
  oobCode: string,
): Promise<{ ok: boolean; email?: string; code?: ResetCode }> {
  try {
    const email = await verifyPasswordResetCode(auth, oobCode);
    return { ok: true, email };
  } catch (err) {
    return { ok: false, code: esCodigoVencido(err) ? "expired" : "error" };
  }
}

/** Confirma la nueva contraseña usando el oobCode ya verificado. */
export async function confirmarResetPassword(
  oobCode: string,
  nueva: string,
): Promise<{ ok: boolean; code?: ResetCode }> {
  try {
    await confirmPasswordReset(auth, oobCode, nueva);
    return { ok: true };
  } catch (err) {
    return { ok: false, code: esCodigoVencido(err) ? "expired" : "error" };
  }
}
