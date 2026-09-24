import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch, comoEnvelope } from "@/lib/api";
import { conToken } from "@/lib/sesion";
import { NOTIF_PRESENTACION, NOTIF_PRESENTACION_DEFAULT } from "@/data/notificaciones";
import { etiquetaFecha, rutaDeNotificacion } from "@/lib/notificaciones";
import type { Notificacion } from "@/types/notificaciones";

/**
 * Las notificaciones personales cuelgan de `/notificacion`; las de un
 * establecimiento, de `/establecimientos/{id}/notificacion`. Es el mismo
 * handler del backend con distinta base, y la consulta las separa: la personal
 * trae sólo las que **no** tienen establecimiento, así que una lista nunca
 * incluye a la otra.
 */
function basePath(establecimientoId?: string | null): string {
  return establecimientoId
    ? `/establecimientos/${encodeURIComponent(establecimientoId)}/notificacion`
    : "/notificacion";
}

/** Item crudo del listado. Campos opcionales: defensivo. */
interface NotificacionBackend {
  id?: string;
  tipo?: string;
  titulo?: string;
  mensaje?: string;
  urlLink?: string;
  /** `unknown`: si el backend la serializara como array/objeto, se descarta. */
  fechaHoraAlta?: unknown;
  leida?: unknown;
  establecimientoId?: string | null;
}

function aNotificacion(n: NotificacionBackend, i: number): Notificacion {
  const tipo = typeof n.tipo === "string" ? n.tipo.trim() : "";
  const pres = NOTIF_PRESENTACION[tipo] ?? NOTIF_PRESENTACION_DEFAULT;
  const ts =
    typeof n.fechaHoraAlta === "string" && n.fechaHoraAlta.trim() ? n.fechaHoraAlta : null;

  return {
    // El `id` sólo faltaría si cambiara el contrato; el fallback evita keys
    // duplicadas en React en ese caso.
    id: n.id ?? `sin-id-${i}`,
    tipo,
    icon: pres.icon,
    tone: pres.tone,
    // Título y mensaje vienen ya armados del backend (los compone con la
    // plantilla de `TipoNotificacionNombre`), así que el front no los arma.
    title: n.titulo ?? "",
    body: n.mensaje ?? "",
    ts,
    time: etiquetaFecha(ts),
    href: rutaDeNotificacion(n.urlLink),
    // Sólo `true` la marca leída: ante un valor raro conviene mostrarla sin
    // leer y que el usuario la cierre, no esconderle un aviso.
    leida: n.leida === true,
    establecimientoId: n.establecimientoId ?? null,
  };
}

interface UseNotificacionesReturn {
  /** Siempre definido y ya ordenado desc por el backend. `[]` es "cargó y no hay". */
  notificaciones: Notificacion[];
  /** Sin leer según el backend: es lo que pinta el globo de la campana. */
  noLeidas: number;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Lectura de las notificaciones de la cuenta (o de un establecimiento, si se le
 * pasa el id). Sale al montar la pantalla, así que va por `onAuthStateChanged`:
 * con `auth.currentUser` el pedido saldría sin token.
 *
 * TODO backend: no hay tiempo real todavía. La lista se refresca al montar y
 * con `reload`; cuando exista el push habrá que enganchar la invalidación acá.
 */
export function useNotificaciones(establecimientoId?: string | null): UseNotificacionesReturn {
  const path = basePath(establecimientoId);
  const [nonce, setNonce] = useState(0);
  /**
   * Lo cargado, con la clave de la petición que lo trajo. Guardar la clave
   * junto a los datos evita el estado de carga imperativo: mientras no coincida
   * con la clave actual, lo que hay en mano es de otra petición.
   */
  const [cargado, setCargado] = useState<{
    clave: string;
    notificaciones: Notificacion[];
    noLeidas: number;
    error: string | null;
  } | null>(null);

  const clave = `${nonce}|${path}`;
  const alDia = cargado?.clave === clave;

  useEffect(() => {
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      const fin = (
        datos: Partial<{ notificaciones: Notificacion[]; noLeidas: number; error: string }>,
      ) => setCargado({ clave, notificaciones: [], noLeidas: 0, error: null, ...datos });

      if (!user) {
        fin({ error: "Necesitás iniciar sesión para ver tus notificaciones" });
        return;
      }
      try {
        const token = await user.getIdToken();
        const [resLista, resCantidad] = await Promise.all([
          apiFetch<unknown>(path, { token }),
          // El contador es un lujo al lado de la lista: si falla, no se cae la
          // campana entera; se deduce de la lista más abajo.
          apiFetch<unknown>(`${path}/no-leidas/cantidad`, { token }).catch(() => null),
        ]);
        if (!active) return;

        const envLista = comoEnvelope<NotificacionBackend[]>(resLista);
        if (!envLista.ok) {
          fin({ error: envLista.code ?? "No pudimos cargar las notificaciones" });
          return;
        }
        // Envelope ok sin `data` es lista vacía, no error.
        const notificaciones = Array.isArray(envLista.data) ? envLista.data.map(aNotificacion) : [];

        // El `data` del contador es un número suelto, no un objeto.
        const envCantidad = comoEnvelope<number>(resCantidad);
        const delBackend =
          resCantidad !== null && envCantidad.ok && typeof envCantidad.data === "number"
            ? envCantidad.data
            : null;

        fin({
          notificaciones,
          noLeidas: delBackend ?? notificaciones.filter((n) => !n.leida).length,
        });
      } catch (e) {
        if (active) fin({ error: e instanceof Error ? e.message : "Error inesperado" });
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [clave, path]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return {
    notificaciones: alDia ? cargado.notificaciones : [],
    noLeidas: alDia ? cargado.noLeidas : 0,
    isLoading: !alDia,
    error: alDia ? cargado.error : null,
    reload,
  };
}

export interface AccionesNotificaciones {
  /** Marca una o varias como leídas. La dispara el usuario, así que va con `conToken`. */
  marcar: (ids: string[]) => Promise<{ ok: boolean; code?: string }>;
  marcando: boolean;
}

/** El `PATCH /{id}/leer`, sobre la misma base que la lectura. */
export function useMarcarLeidas(establecimientoId?: string | null): AccionesNotificaciones {
  const [marcando, setMarcando] = useState(false);
  const path = basePath(establecimientoId);

  async function marcarUna(id: string): Promise<{ ok: boolean; code?: string }> {
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(`${path}/${encodeURIComponent(id)}/leer`, { method: "PATCH", token }),
      );
      // La respuesta trae la notificación actualizada; lo único nuevo en ella
      // es que quedó leída, que es justo lo que la pantalla ya asumió.
      const env = comoEnvelope<unknown>(res);
      return env.ok ? { ok: true } : { ok: false, code: env.code };
    } catch (e) {
      // 404 `notificacionNotFound` es el único código de dominio de este PATCH.
      if (e instanceof ApiError) return { ok: false, code: e.code };
      // `apiFetch` sólo llega a res.json() con un 2xx: un error de parseo es un
      // 2xx sin cuerpo, o sea que la marca se hizo.
      if (e instanceof SyntaxError) return { ok: true };
      return { ok: false };
    }
  }

  async function marcar(ids: string[]): Promise<{ ok: boolean; code?: string }> {
    if (ids.length === 0) return { ok: true };
    setMarcando(true);
    try {
      // TODO backend: no hay endpoint para marcar varias de una, así que
      // "marcar todas como leídas" se abre en un PATCH por notificación.
      const rs = await Promise.all(ids.map(marcarUna));
      // Alcanza con el primer fallo: la campana muestra un mensaje, no un
      // detalle por notificación.
      return rs.find((r) => !r.ok) ?? { ok: true };
    } finally {
      setMarcando(false);
    }
  }

  return { marcar, marcando };
}
