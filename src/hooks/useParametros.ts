import { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch, comoEnvelope } from "@/lib/api";
import { MENSAJE_FALLA, clasificarError } from "@/lib/errores";
import { conToken } from "@/lib/sesion";
import { useLecturaConToken } from "@/hooks/useLecturaConToken";
import type { DatosParametros, ParametroKey, Parametros } from "@/types/parametros";

const PATH = "/admin/parametros";

/** `data` crudo de GET/PUT /admin/parametros. Opcionales por defensivo. */
interface ParametrosBackend {
  diasMaxCrearActividad?: unknown;
  diasMinReembolso?: unknown;
  ttlReserva?: unknown;
  /** Fracción: 0.1 es 10 %. BigDecimal, así que puede venir como string. */
  porcentajeComision?: unknown;
  diasImpagoReserva?: unknown;
}

/** Campo del DTO → el nuestro, para ubicar cada mensaje de `validationError`. */
const CAMPO: Record<string, ParametroKey> = {
  diasMaxCrearActividad: "diasMaxActividad",
  diasMinReembolso: "diasMinReembolso",
  ttlReserva: "ttlReserva",
  porcentajeComision: "comision",
  diasImpagoReserva: "diasImpago",
};

function aNumero(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

function aParametros(p: ParametrosBackend): Parametros {
  const fraccion = aNumero(p.porcentajeComision);
  return {
    // Redondeado a centésimas: 0.1225 * 100 da 12.250000000000002.
    comision: fraccion === null ? null : Math.round(fraccion * 10000) / 100,
    diasMaxActividad: aNumero(p.diasMaxCrearActividad),
    diasMinReembolso: aNumero(p.diasMinReembolso),
    ttlReserva: aNumero(p.ttlReserva),
    diasImpago: aNumero(p.diasImpagoReserva),
  };
}

function aBackend(d: DatosParametros): ParametrosBackend {
  return {
    diasMaxCrearActividad: d.diasMaxActividad,
    diasMinReembolso: d.diasMinReembolso,
    ttlReserva: d.ttlReserva,
    // Cuatro decimales en la fracción son los dos del porcentaje; toFixed saca el ruido de punto flotante.
    porcentajeComision: Number((d.comision / 100).toFixed(4)),
    diasImpagoReserva: d.diasImpago,
  };
}

/** Los parámetros del sistema (GET /admin/parametros). Un 403 llega como error y lo pinta `AsyncView`. */
export function useParametros() {
  return useLecturaConToken<Parametros>(
    "parametros",
    async (token) => {
      const env = comoEnvelope<ParametrosBackend>(await apiFetch<unknown>(PATH, { token }));
      if (!env.ok) throw new Error(env.code ?? "No pudimos cargar los parámetros");
      return aParametros(env.data ?? {});
    },
    "Iniciá sesión para ver los parámetros.",
  );
}

/* ---- Guardar ------------------------------------------------------------ */

export interface ResultadoGuardarParametros {
  ok: boolean;
  /** Sólo si `ok`: lo que quedó guardado, o `null` si vino sin un cuerpo legible. */
  parametros?: Parametros | null;
  code?: string;
  status?: number;
  /** Si no `ok`: el texto para el usuario. Falta en un `validationError` que cae entero en campos. */
  mensaje?: string;
  /** En `validationError`: el mensaje de cada campo que rechazó. */
  errores?: Partial<Record<ParametroKey, string>>;
}

/**
 * Los mensajes de `validationError` son los default de Bean Validation (el DTO
 * no declara los suyos), así que no se muestran tal cual. El formulario ya
 * valida lo mismo: esto sólo aparece si las reglas se desfasan.
 */
const RECHAZO_CAMPO = "El servidor no aceptó este valor. Revisalo e intentá de nuevo.";

function comoRechazo(status: number | undefined, body: unknown): ResultadoGuardarParametros {
  const b = (body ?? {}) as { code?: unknown; data?: unknown };
  const code = typeof b.code === "string" ? b.code : undefined;
  if (code === "validationError") {
    const data = b.data && typeof b.data === "object" ? (b.data as Record<string, unknown>) : {};
    const errores: ResultadoGuardarParametros["errores"] = {};
    let otros = false;
    for (const campo of Object.keys(data)) {
      const nuestro = CAMPO[campo];
      if (nuestro) errores[nuestro] = RECHAZO_CAMPO;
      else otros = true;
    }
    const enCampos = Object.keys(errores).length > 0;
    return {
      ok: false, code, status, errores,
      mensaje: otros || !enCampos ? "El servidor rechazó los datos. Revisá los valores e intentá de nuevo." : undefined,
    };
  }
  if (status === 403 && (!code || code === "accessDenied")) {
    return { ok: false, code, status, mensaje: "Tu rol no te permite modificar los parámetros del sistema." };
  }
  return { ok: false, code, status, mensaje: "No pudimos guardar los parámetros. Probá de nuevo en unos minutos." };
}

/**
 * Reemplaza los parámetros (PUT /admin/parametros). Es un reemplazo completo:
 * siempre va el objeto entero, también lo que no se tocó.
 */
export function useGuardarParametros() {
  const [isLoading, setIsLoading] = useState(false);

  async function guardar(datos: DatosParametros): Promise<ResultadoGuardarParametros> {
    setIsLoading(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(PATH, { method: "PUT", token, body: JSON.stringify(aBackend(datos)) }),
      );
      const env = comoEnvelope<ParametrosBackend>(res);
      if (!env.ok) return comoRechazo(undefined, res);
      return { ok: true, parametros: env.data && typeof env.data === "object" ? aParametros(env.data) : null };
    } catch (e) {
      if (e instanceof ApiError) return comoRechazo(e.status, e.body);
      // `apiFetch` sólo llega a res.json() con un 2xx: un error de parseo es un
      // guardado contestado sin cuerpo.
      if (e instanceof SyntaxError) return { ok: true, parametros: null };
      return { ok: false, mensaje: clasificarError(e)?.mensaje ?? MENSAJE_FALLA.servidor.mensaje };
    } finally {
      setIsLoading(false);
    }
  }

  return { guardar, isLoading };
}

/* ---- Reautenticación ---------------------------------------------------- */

export type FallaReautenticacion = "badPass" | "demasiados" | "red" | "error";

const MENSAJE_REAUTENTICACION: Record<FallaReautenticacion, string> = {
  badPass: "La contraseña no es correcta.",
  demasiados: "Hiciste demasiados intentos. Esperá unos minutos y volvé a probar.",
  red: MENSAJE_FALLA.red.mensaje,
  error: "No pudimos verificar tu identidad. Probá de nuevo en unos minutos.",
};

/**
 * Reconfirma la identidad con la contraseña antes de editar los parámetros
 * (`reauthenticateWithCredential`). La cuenta es siempre de email y
 * contraseña: el sitio no ofrece otro proveedor.
 */
export function useReautenticar() {
  const [isLoading, setIsLoading] = useState(false);

  async function reautenticar(
    pass: string,
  ): Promise<{ ok: boolean; code?: FallaReautenticacion; mensaje?: string }> {
    const falla = (code: FallaReautenticacion) => ({ ok: false, code, mensaje: MENSAJE_REAUTENTICACION[code] });
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user?.email) return falla("error");
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, pass));
      return { ok: true };
    } catch (e) {
      if (e instanceof FirebaseError) {
        if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") return falla("badPass");
        if (e.code === "auth/too-many-requests") return falla("demasiados");
        if (e.code === "auth/network-request-failed") return falla("red");
      }
      return falla("error");
    } finally {
      setIsLoading(false);
    }
  }

  return { reautenticar, isLoading };
}
