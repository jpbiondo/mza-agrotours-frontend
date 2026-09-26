import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch, comoEnvelope } from "@/lib/api";
import { cargarPerfil } from "@/hooks/useAuth";
import { CODIGO_PERFIL_EXISTENTE } from "@/data/auth";
import type { FormData } from "@/types/registro";

/**
 * `code` puede ser del backend (`PHONE_NUMBER_ALREADY_EXISTS`…) o de Firebase
 * Auth (`auth/email-already-in-use`, `auth/password-does-not-meet-requirements`…).
 * Sin `code` es un fallo técnico.
 */
export interface RegistroResult {
  ok: boolean;
  code?: string;
}

interface UseRegistroReturn {
  /** Alta completa: cuenta en Firebase + perfil en el backend. */
  register: (data: FormData) => Promise<RegistroResult>;
  /** Sólo el perfil, para una cuenta de Firebase que ya tiene la sesión iniciada. */
  completar: (data: FormData) => Promise<RegistroResult>;
  isLoading: boolean;
}

const CREATE_PATH = "/usuario/create";

/**
 * Payload de /usuario/create. La contraseña no pasa por el backend: va directo
 * de la UI a Firebase. El backend identifica al usuario por el UID del token.
 * TODO backend: el email todavía se lee del body; va a pasar a salir del token.
 * Mientras tanto se manda el de la cuenta de Firebase.
 */
function toPayload(email: string, d: FormData) {
  return {
    nombre: d.nombre.trim(),
    email: email.trim().toLowerCase(),
    telefono: d.telefono.trim(),
    identificacion: d.numeroId.trim(),
    tipoIdentificacion: d.tipoId,
    // iso2 del país seleccionado (no el nombre).
    paisIso2: d.pais,
    fechaNacimiento: d.fecha ? d.fecha.toISOString() : null,
  };
}

/**
 * La cuenta de Firebase para el alta. Si ya hay una sesión con ese mismo email
 * es un reintento tras un alta a medias (falló el POST del perfil): se reusa,
 * porque crearla de nuevo fallaría con email-already-in-use.
 */
async function cuentaFirebase(email: string, password: string): Promise<User> {
  const actual = auth.currentUser;
  if (actual && actual.email?.toLowerCase() === email.toLowerCase()) return actual;
  // Cambió el email entre intentos: la cuenta anterior queda sin perfil.
  if (actual) await signOut(auth);
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/**
 * POST del perfil con el ID token. Que el perfil ya exista (409 o 2xx con
 * `USR.alreadyExists`) no es un error: el alta ya se había completado.
 * Después carga el perfil en el store, para llegar al destino ya logueado; si
 * eso falla, AuthSync lo vuelve a pedir al navegar.
 */
async function crearPerfil(user: User, d: FormData): Promise<RegistroResult> {
  try {
    const env = comoEnvelope(
      await apiFetch<unknown>(CREATE_PATH, {
        method: "POST",
        token: await user.getIdToken(),
        body: JSON.stringify(toPayload(user.email ?? d.email, d)),
      }),
    );
    if (!env.ok && env.code !== CODIGO_PERFIL_EXISTENTE) {
      return { ok: false, code: env.code };
    }
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.code !== CODIGO_PERFIL_EXISTENTE) return { ok: false, code: e.code };
    } else if (!(e instanceof SyntaxError)) {
      // SyntaxError = 2xx con cuerpo vacío: es un éxito.
      return { ok: false };
    }
  }

  await cargarPerfil(await user.getIdToken()).catch(() => undefined);
  return { ok: true };
}

/**
 * Alta de cuenta en dos pasos: (1) Firebase crea la cuenta con email y
 * contraseña, (2) el backend crea el perfil. Si (2) falla, la cuenta queda
 * autenticada sin perfil —estado normal— y se completa con `completar`.
 *
 * Devuelve `{ ok, code }`: el llamador decide el texto y dónde mostrarlo.
 */
export function useRegistro(): UseRegistroReturn {
  const [isLoading, setIsLoading] = useState(false);

  async function conCarga(fn: () => Promise<RegistroResult>) {
    setIsLoading(true);
    try {
      return await fn();
    } finally {
      setIsLoading(false);
    }
  }

  function register(data: FormData) {
    return conCarga(async () => {
      let user: User;
      try {
        user = await cuentaFirebase(data.email.trim(), data.password);
      } catch (e) {
        return e instanceof FirebaseError ? { ok: false, code: e.code } : { ok: false };
      }
      return crearPerfil(user, data);
    });
  }

  function completar(data: FormData) {
    return conCarga(async () => {
      const user = auth.currentUser;
      if (!user) return { ok: false };
      return crearPerfil(user, data);
    });
  }

  return { register, completar, isLoading };
}
