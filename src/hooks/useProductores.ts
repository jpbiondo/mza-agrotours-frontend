import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch, comoEnvelope } from "@/lib/api";
import { conToken } from "@/lib/sesion";
import type { Productor, RolProductor } from "@/types/productores";

/** Base del ABM de productores de un establecimiento. */
function productoresDe(establecimientoId: string): string {
  return `/establecimientos/${encodeURIComponent(establecimientoId)}/productores`;
}

/* ---- Listado de productores vigentes ------------------------------------- */

interface UseProductoresReturn {
  /** Siempre definido: `[]` significa "cargó y no hay ninguno". */
  productores: Productor[];
  isLoading: boolean;
  error: string | null;
  reload: () => void;
  /** Agrega el recién creado sin volver a pedir la lista entera. */
  agregar: (p: Productor) => void;
  /** Pisa el que devolvió una mutación, respetando su posición en la tabla. */
  reemplazar: (p: Productor) => void;
  /** Saca al dado de baja sin volver a pedir la lista entera. */
  quitar: (productorId: string) => void;
}

/**
 * Productores vigentes del establecimiento.
 *
 * Lo cargado se guarda junto a la clave de la petición que lo trajo —mismo
 * criterio que `useCatalogoRoles`—: mientras no coincidan, lo que hay en
 * pantalla es de otra petición y la pantalla está cargando. Sin eso, al cambiar
 * de establecimiento en el switcher se verían un frame los productores de la
 * finca anterior bajo el nombre de la nueva.
 *
 * Con el id vacío no se pide nada: es una cuenta sin establecimiento, o sin el
 * permiso de lectura, y el backend contestaría 403.
 */
export function useProductores(establecimientoId: string): UseProductoresReturn {
  const [nonce, setNonce] = useState(0);
  const [cargado, setCargado] = useState<{
    clave: string;
    productores: Productor[];
    error: string | null;
  } | null>(null);

  const clave = establecimientoId ? `${nonce}|${establecimientoId}` : "";
  const alDia = !!clave && cargado?.clave === clave;

  useEffect(() => {
    if (!establecimientoId) return;
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      const fin = (productores: Productor[], error: string | null) =>
        setCargado({ clave, productores, error });

      if (!user) {
        fin([], "Necesitás iniciar sesión para ver los productores");
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await apiFetch<unknown>(productoresDe(establecimientoId), { token });
        if (!active) return;
        const env = comoEnvelope<Productor[]>(res);
        if (!env.ok) {
          fin([], env.code ?? "No pudimos cargar los productores");
          return;
        }
        // Envelope ok sin `data` es lista vacía, no error: el estado vacío tiene
        // que ser distinguible de un fallo de carga.
        fin(Array.isArray(env.data) ? env.data : [], null);
      } catch (e) {
        if (active) fin([], e instanceof Error ? e.message : "Error inesperado");
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [clave, establecimientoId]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  // Las mutaciones locales van sobre lo cargado sin tocar su clave: si mientras
  // tanto cambió el establecimiento, `alDia` ya es false y no se muestra.
  const mutar = useCallback((fn: (lista: Productor[]) => Productor[]) => {
    setCargado((c) => (c ? { ...c, productores: fn(c.productores) } : c));
  }, []);

  const agregar = useCallback((p: Productor) => mutar((l) => [...l, p]), [mutar]);
  const reemplazar = useCallback(
    (p: Productor) => mutar((l) => l.map((x) => (x.id === p.id ? p : x))),
    [mutar],
  );
  const quitar = useCallback(
    (productorId: string) => mutar((l) => l.filter((x) => x.id !== productorId)),
    [mutar],
  );

  return {
    productores: alDia ? cargado.productores : [],
    isLoading: !!establecimientoId && !alDia,
    error: alDia ? cargado.error : null,
    reload,
    agregar,
    reemplazar,
    quitar,
  };
}

/* ---- Roles asignables ---------------------------------------------------- */

/**
 * Roles que se le pueden dar a un productor de este establecimiento. El backend
 * ya excluye el de Productor Líder: no se reparte por ABM.
 */
export function useRolesProductores(establecimientoId: string): {
  roles: RolProductor[];
  isLoading: boolean;
  error: string | null;
} {
  const [cargado, setCargado] = useState<{
    clave: string;
    roles: RolProductor[];
    error: string | null;
  } | null>(null);

  const clave = establecimientoId;
  const alDia = !!clave && cargado?.clave === clave;

  useEffect(() => {
    if (!establecimientoId) return;
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      const fin = (roles: RolProductor[], error: string | null) =>
        setCargado({ clave, roles, error });

      if (!user) {
        fin([], "Necesitás iniciar sesión para ver los roles");
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await apiFetch<unknown>(
          `${productoresDe(establecimientoId)}/roles`,
          { token },
        );
        if (!active) return;
        const env = comoEnvelope<RolProductor[]>(res);
        if (!env.ok) {
          fin([], env.code ?? "No pudimos cargar los roles");
          return;
        }
        fin(Array.isArray(env.data) ? env.data : [], null);
      } catch (e) {
        if (active) fin([], e instanceof Error ? e.message : "No pudimos cargar los roles");
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [clave, establecimientoId]);

  return {
    roles: alDia ? cargado.roles : [],
    isLoading: !!establecimientoId && !alDia,
    error: alDia ? cargado.error : null,
  };
}

/* ---- Alta, cambio de rol, baja y suspensión ------------------------------ */

/** Resultado de una mutación. `code` es el del enum `ProductorError`. */
export interface ResultadoProductor {
  ok: boolean;
  code?: string;
  /** El productor actualizado, en las acciones que lo devuelven. */
  productor?: Productor;
}

interface AccionesProductor {
  crear: (email: string, rolId: string) => Promise<ResultadoProductor>;
  actualizar: (productorId: string, rolId: string) => Promise<ResultadoProductor>;
  eliminar: (productorId: string) => Promise<ResultadoProductor>;
  /** `fechaHoraFinPrevista` es un LocalDateTime; ver `finDelDia`. */
  suspender: (
    productorId: string,
    motivo: string,
    fechaHoraFinPrevista: string,
  ) => Promise<ResultadoProductor>;
  levantar: (productorId: string, motivo: string) => Promise<ResultadoProductor>;
  /** Alta y cambio de rol. */
  guardando: boolean;
  borrando: boolean;
  /** Suspensión y levantamiento. */
  moderando: boolean;
}

/**
 * Las cinco mutaciones sobre los productores de un establecimiento, con un
 * estado de "ocupado" por familia de acciones: quien las dispara está en un
 * diálogo distinto en cada caso y no tiene por qué bloquear a los otros.
 */
export function useProductorAcciones(establecimientoId: string): AccionesProductor {
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [moderando, setModerando] = useState(false);

  const base = productoresDe(establecimientoId);
  const url = (productorId: string) => `${base}/${encodeURIComponent(productorId)}`;

  async function llamar(
    setBusy: (v: boolean) => void,
    path: string,
    method: string,
    body?: unknown,
  ): Promise<{ ok: boolean; code?: string; data?: unknown }> {
    setBusy(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(path, {
          method,
          token,
          body: body === undefined ? undefined : JSON.stringify(body),
        }),
      );
      const env = comoEnvelope<unknown>(res);
      // El code viaja tanto en el envelope 2xx como en el ApiError de un 4xx.
      return env.ok ? { ok: true, data: env.data } : { ok: false, code: env.code };
    } catch (e) {
      if (e instanceof ApiError) return { ok: false, code: e.code };
      // `apiFetch` sólo llega a res.json() con un 2xx, así que un error de
      // parseo significa que la acción se hizo y el backend contestó sin cuerpo
      // (204). Un fallo de red tira TypeError antes y cae abajo.
      if (e instanceof SyntaxError) return { ok: true };
      return { ok: false };
    } finally {
      setBusy(false);
    }
  }

  /** Las acciones que devuelven el productor actualizado comparten esta forma. */
  const conProductor = (r: { ok: boolean; code?: string; data?: unknown }) =>
    r.ok ? { ok: true, productor: r.data as Productor } : { ok: false, code: r.code };

  return {
    crear: async (email, rolId) =>
      conProductor(
        await llamar(setGuardando, base, "POST", { emailUsuario: email, rolId }),
      ),

    // El productorId va en la URL; el cuerpo sólo lleva el rol nuevo.
    actualizar: async (productorId, rolId) =>
      conProductor(await llamar(setGuardando, url(productorId), "PUT", { rolId })),

    // La baja contesta un booleano, no el productor: sólo interesa si salió bien.
    eliminar: async (productorId) => {
      const r = await llamar(setBorrando, url(productorId), "DELETE");
      return r.ok ? { ok: true } : { ok: false, code: r.code };
    },

    suspender: async (productorId, motivo, fechaHoraFinPrevista) =>
      conProductor(
        await llamar(setModerando, `${url(productorId)}/suspension`, "POST", {
          motivo,
          fechaHoraFinPrevista,
        }),
      ),

    // El motivo del levantamiento también es obligatorio: queda registrado en el
    // tramo de estado que se cierra.
    levantar: async (productorId, motivo) =>
      conProductor(
        await llamar(setModerando, `${url(productorId)}/suspension`, "DELETE", { motivo }),
      ),

    guardando,
    borrando,
    moderando,
  };
}
