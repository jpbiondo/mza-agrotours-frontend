import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch, comoEnvelope, comoPagina } from "@/lib/api";
import { conToken } from "@/lib/sesion";
import { NOTIF_PRESENTACION, NOTIF_PRESENTACION_DEFAULT } from "@/data/notificaciones";
import { etiquetaFecha, rutaDeNotificacion } from "@/lib/notificaciones";
import type { Notificacion } from "@/types/notificaciones";

/** Lo que trae cada página. El orden (`fechaHoraAlta` desc) lo pone el backend. */
const TAMANIO_PAGINA = 10;

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

const urlPagina = (path: string, page: number) => `${path}?page=${page}&size=${TAMANIO_PAGINA}`;

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
    // Crudo a propósito, sin pasar por `Date`: `marcarTodas` lo devuelve tal
    // cual al backend, y `Date` lo truncaría a milisegundos.
    ts,
    time: etiquetaFecha(ts),
    href: rutaDeNotificacion(n.urlLink),
    // Sólo `true` la marca leída: ante un valor raro conviene mostrarla sin
    // leer y que el usuario la cierre, no esconderle un aviso.
    leida: n.leida === true,
    establecimientoId: n.establecimientoId ?? null,
  };
}

/** Una página ya mapeada, más si quedan otras detrás. */
function aPagina(res: unknown, page: number): { items: Notificacion[]; hayMas: boolean } | { code?: string } {
  const env = comoEnvelope<unknown>(res);
  if (!env.ok) return { code: env.code };
  const pagina = comoPagina<NotificacionBackend>(env.data);
  return {
    // El offset en el índice evita que dos fallbacks `sin-id-*` de páginas
    // distintas choquen.
    items: pagina.items.map((n, i) => aNotificacion(n, page * TAMANIO_PAGINA + i)),
    // Una página vacía corta aunque los contadores digan otra cosa: si no, el
    // scroll infinito pediría para siempre.
    hayMas: pagina.items.length > 0 && pagina.page + 1 < pagina.totalPages,
  };
}

/** Pega una página al final, salteando las que ya están. */
function agregar(previas: Notificacion[], nuevas: Notificacion[]): Notificacion[] {
  // La paginación es por offset: si entra una notificación nueva entre dos
  // pedidos, todo se corre un lugar y la primera de la página siguiente es la
  // última de la anterior. Por eso hay que deduplicar.
  const vistas = new Set(previas.map((n) => n.id));
  return [...previas, ...nuevas.filter((n) => !vistas.has(n.id))];
}

/** El `data` de los contadores es un número suelto, no un objeto. */
function comoCantidad(res: unknown): number | null {
  const env = comoEnvelope<unknown>(res);
  return env.ok && typeof env.data === "number" && Number.isFinite(env.data) ? env.data : null;
}

interface Cargado {
  clave: string;
  notificaciones: Notificacion[];
  /** Última página pedida con éxito. */
  pagina: number;
  hayMas: boolean;
  noLeidas: number;
  error: string | null;
}

type Resultado = { ok: boolean; code?: string };

interface UseNotificacionesReturn {
  /** Las páginas cargadas hasta ahora, en orden. `[]` es "cargó y no hay". */
  notificaciones: Notificacion[];
  /** Sin leer según el backend: es lo que pinta el globo de la campana. */
  noLeidas: number;
  /** Sólo la primera página. Las siguientes se reportan en `cargandoMas`. */
  isLoading: boolean;
  error: string | null;
  reload: () => void;
  hayMas: boolean;
  cargandoMas: boolean;
  /** Falló la página siguiente. Lo ya cargado sigue en pantalla. */
  errorMas: boolean;
  /** Trae la página siguiente y la pega al final. Ignora llamadas repetidas. */
  cargarMas: () => void;
  marcarLeida: (id: string) => Promise<Resultado>;
  /** Marca como leídas todas las no leídas hasta la más nueva cargada. */
  marcarTodas: () => Promise<Resultado>;
}

/**
 * Las notificaciones de la cuenta (o de un establecimiento, si se le pasa el
 * id), paginadas para el scroll infinito de la campana, con sus dos marcas.
 * Va todo en un hook porque las marcas cambian la misma lista y el mismo
 * contador que la lectura.
 *
 * La primera página sale al montar, así que va por `onAuthStateChanged`; las
 * siguientes y las marcas las dispara el usuario y van con `conToken`.
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
   * con la clave actual, lo que hay en mano es de otra petición. Lo mismo vale
   * para las páginas siguientes y las marcas: si al volver la clave cambió
   * (hubo un `reload`), su resultado se descarta.
   */
  const [cargado, setCargado] = useState<Cargado | null>(null);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [errorMas, setErrorMas] = useState(false);
  // El estado llega un render tarde: dos avisos seguidos del scroll pedirían
  // la misma página dos veces. La ref corta el segundo en el acto.
  const pidiendoMas = useRef(false);

  const clave = `${nonce}|${path}`;
  const alDia = cargado?.clave === clave;

  useEffect(() => {
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      const fin = (datos: Partial<Omit<Cargado, "clave">>) =>
        setCargado({ clave, notificaciones: [], pagina: 0, hayMas: false, noLeidas: 0, error: null, ...datos });

      if (!user) {
        fin({ error: "Necesitás iniciar sesión para ver tus notificaciones" });
        return;
      }
      try {
        const token = await user.getIdToken();
        const [resLista, resCantidad] = await Promise.all([
          apiFetch<unknown>(urlPagina(path, 0), { token }),
          // El contador es un lujo al lado de la lista: si falla, no se cae la
          // campana entera; se deduce de la página más abajo.
          apiFetch<unknown>(`${path}/no-leidas/cantidad`, { token }).catch(() => null),
        ]);
        if (!active) return;

        const pagina = aPagina(resLista, 0);
        if (!("items" in pagina)) {
          fin({ error: pagina.code ?? "No pudimos cargar las notificaciones" });
          return;
        }
        fin({
          notificaciones: pagina.items,
          hayMas: pagina.hayMas,
          // Deducido de la primera página se queda corto si hay no leídas más
          // atrás, pero es mejor que un globo en cero.
          noLeidas: comoCantidad(resCantidad) ?? pagina.items.filter((n) => !n.leida).length,
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

  /** Aplica `fn` sólo si lo cargado sigue siendo de la petición `de`. */
  const actualizar = useCallback((de: string, fn: (c: Cargado) => Cargado) => {
    setCargado((c) => (c && c.clave === de ? fn(c) : c));
  }, []);

  const reload = useCallback(() => {
    setErrorMas(false);
    setNonce((n) => n + 1);
  }, []);

  async function cargarMas() {
    if (!alDia || !cargado.hayMas || cargado.error || pidiendoMas.current) return;
    const de = clave;
    const siguiente = cargado.pagina + 1;

    pidiendoMas.current = true;
    setCargandoMas(true);
    setErrorMas(false);
    try {
      const res = await conToken((token) => apiFetch<unknown>(urlPagina(path, siguiente), { token }));
      const pagina = aPagina(res, siguiente);
      if (!("items" in pagina)) {
        setErrorMas(true);
        return;
      }
      actualizar(de, (c) => ({
        ...c,
        notificaciones: agregar(c.notificaciones, pagina.items),
        pagina: siguiente,
        hayMas: pagina.hayMas,
      }));
    } catch {
      setErrorMas(true);
    } finally {
      pidiendoMas.current = false;
      setCargandoMas(false);
    }
  }

  /**
   * Pone `leida` en las notificaciones dadas y descuenta del contador. Devuelve
   * cómo deshacerlo, para el caso en que el backend rechace la marca.
   */
  function marcarLocal(de: string, ids: Set<string>, descontar: number): () => void {
    actualizar(de, (c) => ({
      ...c,
      notificaciones: c.notificaciones.map((n) => (ids.has(n.id) ? { ...n, leida: true } : n)),
      noLeidas: Math.max(0, c.noLeidas - descontar),
    }));
    return () =>
      actualizar(de, (c) => ({
        ...c,
        notificaciones: c.notificaciones.map((n) => (ids.has(n.id) ? { ...n, leida: false } : n)),
        noLeidas: c.noLeidas + descontar,
      }));
  }

  async function marcarLeida(id: string): Promise<Resultado> {
    if (!alDia) return { ok: false };
    const n = cargado.notificaciones.find((x) => x.id === id);
    if (!n || n.leida) return { ok: true };

    const de = clave;
    const deshacer = marcarLocal(de, new Set([id]), 1);
    const r = await patch(`${path}/${encodeURIComponent(id)}/leer`);
    if (!r.ok) deshacer();
    return r;
  }

  async function marcarTodas(): Promise<Resultado> {
    if (!alDia) return { ok: false };
    const noLeidas = cargado.notificaciones.filter((n) => !n.leida);
    // La lista viene desc, así que la primera no leída es la más nueva. Se
    // marca hasta su fecha y no hasta "ahora": una notificación que llegue
    // mientras la campana está abierta no la vio nadie y tiene que quedar sin
    // leer. Si las no leídas están en páginas que todavía no se pidieron, sirve
    // la más nueva cargada: es posterior a todas ellas y el usuario la vio.
    const hasta = noLeidas[0]?.ts ?? cargado.notificaciones[0]?.ts;
    if (!hasta) return { ok: true };

    const de = clave;
    // De la marca se sabe cuántas quedan leídas recién con la respuesta: puede
    // haber no leídas más viejas en páginas que todavía no se pidieron. Hasta
    // entonces se descuentan las que están a la vista.
    const deshacer = marcarLocal(de, new Set(noLeidas.map((n) => n.id)), noLeidas.length);
    try {
      const res = await conToken((token) =>
        // El string del backend tal cual: el filtro es `fechaHoraAlta <= hasta`
        // y con un redondeo a milisegundos la más nueva quedaría afuera.
        apiFetch<unknown>(`${path}/leerHasta/${encodeURIComponent(hasta)}`, { method: "PATCH", token }),
      );
      const env = comoEnvelope<unknown>(res);
      if (!env.ok) {
        deshacer();
        return { ok: false, code: env.code };
      }
      const marcadas = comoCantidad(res);
      // Corrige el descuento optimista con lo que de verdad marcó el backend.
      if (marcadas !== null) {
        actualizar(de, (c) => ({ ...c, noLeidas: Math.max(0, c.noLeidas + noLeidas.length - marcadas) }));
      }
      return { ok: true };
    } catch (e) {
      // 2xx sin cuerpo: la marca se hizo, sólo no sabemos cuántas fueron.
      if (e instanceof SyntaxError) return { ok: true };
      deshacer();
      return e instanceof ApiError ? { ok: false, code: e.code } : { ok: false };
    }
  }

  return {
    notificaciones: alDia ? cargado.notificaciones : [],
    noLeidas: alDia ? cargado.noLeidas : 0,
    isLoading: !alDia,
    error: alDia ? cargado.error : null,
    reload,
    hayMas: alDia ? cargado.hayMas : false,
    cargandoMas,
    errorMas,
    cargarMas,
    marcarLeida,
    marcarTodas,
  };
}

/** Un PATCH sin cuerpo que sólo interesa saber si salió bien. */
async function patch(url: string): Promise<Resultado> {
  try {
    const res = await conToken((token) => apiFetch<unknown>(url, { method: "PATCH", token }));
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
