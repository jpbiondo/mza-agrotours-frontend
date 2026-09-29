import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  increment, limitToLast, onValue, orderByChild, push, query, ref, serverTimestamp, set, update,
} from "firebase/database";
import { auth, rtdb } from "../../firebase.config";
import { ApiError, apiFetch } from "@/lib/api";
import { conToken } from "@/lib/sesion";
import type { ChatEstablecimientoResumen, ChatResumen, MensajeChat, TipoEmisor } from "@/types/chats";

/*
 * Chats entre visitantes y establecimientos. El alta pasa por el backend
 * —`chats/` y `establecimiento_miembros/` sólo los escribe el Admin SDK— y todo
 * lo demás va directo contra la Realtime Database, con las reglas como único
 * control: cada lado lee su inbox y los mensajes de sus chats, y agrega
 * mensajes actualizando de paso los dos inbox.
 *
 * El id del chat es `{uid del visitante}_{id del establecimiento}`: lo arma el
 * backend así y el front lo reconstruye, porque el alta no lo devuelve.
 */

/** Cuántos mensajes se traen por conversación. */
const MENSAJES_POR_CHAT = 200;

export function idDeChat(visitanteUid: string, establecimientoId: string): string {
  return `${visitanteUid}_${establecimientoId}`;
}

/* ---- Alta ---------------------------------------------------------------- */

type ResultadoIniciar = { ok: true; chatId: string } | { ok: false; code?: string };

/**
 * `POST /usuario/chats/iniciar/{establecimientoId}`. Que el chat ya exista no
 * es un error para esta pantalla: el backend lo rechaza con `validacionNegocio`
 * y acá se sigue igual, porque lo que quiere el visitante es abrirlo.
 */
export function useIniciarChat() {
  const [isLoading, setIsLoading] = useState(false);

  async function iniciar(establecimientoId: string): Promise<ResultadoIniciar> {
    setIsLoading(true);
    try {
      return await conToken(async (token) => {
        try {
          await apiFetch<unknown>(`/usuario/chats/iniciar/${encodeURIComponent(establecimientoId)}`, {
            method: "POST",
            token,
          });
        } catch (e) {
          // 200 sin cuerpo: es el caso feliz.
          const vacio = e instanceof SyntaxError;
          // TODO backend: "ya existe" viaja con el `validacionNegocio` genérico; un
          // código propio evitaría confundirlo con otra validación.
          const yaExiste = e instanceof ApiError && e.code === "validacionNegocio";
          if (!vacio && !yaExiste) throw e;
        }
        const uid = auth.currentUser?.uid;
        if (!uid) return { ok: false, code: "sinSesion" } as const;
        return { ok: true, chatId: idDeChat(uid, establecimientoId) } as const;
      });
    } catch (e) {
      return { ok: false, code: e instanceof ApiError ? e.code : undefined };
    } finally {
      setIsLoading(false);
    }
  }

  return { iniciar, isLoading };
}

/* ---- Inbox --------------------------------------------------------------- */

/** Nodo crudo de `chats_usuario/{uid}/{chatId}`. */
interface ChatUsuarioRtdb {
  establecimientoId?: unknown;
  titulo?: unknown;
  ultimoMensaje?: unknown;
  timestamp?: unknown;
  mensajesNoLeidos?: unknown;
}

function aTexto(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function aNumero(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function aResumen(id: string, v: ChatUsuarioRtdb | null): ChatResumen {
  return {
    id,
    establecimientoId: aTexto(v?.establecimientoId),
    titulo: aTexto(v?.titulo) || "Establecimiento",
    ultimoMensaje: aTexto(v?.ultimoMensaje),
    timestamp: aNumero(v?.timestamp),
    noLeidos: aNumero(v?.mensajesNoLeidos),
  };
}

interface UseMisChatsReturn {
  /** Del más reciente al más viejo. */
  chats: ChatResumen[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Inbox del visitante en tiempo real. Escucha mientras el componente esté
 * montado, así que el contador del header se actualiza solo.
 */
export function useMisChats(): UseMisChatsReturn {
  const [estado, setEstado] = useState<{ chats: ChatResumen[]; error: string | null } | null>(null);

  useEffect(() => {
    let dejarDeEscuchar: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      dejarDeEscuchar?.();
      dejarDeEscuchar = undefined;
      if (!user) {
        setEstado({ chats: [], error: null });
        return;
      }
      const q = query(ref(rtdb(), `chats_usuario/${user.uid}`), orderByChild("timestamp"));
      dejarDeEscuchar = onValue(
        q,
        (snap) => {
          const chats: ChatResumen[] = [];
          snap.forEach((hijo) => {
            if (hijo.key) chats.push(aResumen(hijo.key, hijo.val() as ChatUsuarioRtdb | null));
          });
          // `orderByChild` ordena ascendente; el inbox va del más nuevo al más viejo.
          setEstado({ chats: chats.reverse(), error: null });
        },
        () => setEstado({ chats: [], error: "No pudimos cargar tus chats" }),
      );
    });

    return () => {
      unsubAuth();
      dejarDeEscuchar?.();
    };
  }, []);

  return { chats: estado?.chats ?? [], isLoading: estado === null, error: estado?.error ?? null };
}

/**
 * Pone en cero los no leídos del visitante. Sólo tiene sentido con algún
 * mensaje en el chat: las reglas piden `ultimoMensaje` en el nodo, y un chat
 * recién creado todavía no lo tiene.
 */
export async function marcarChatLeido(chatId: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  try {
    await set(ref(rtdb(), `chats_usuario/${uid}/${chatId}/mensajesNoLeidos`), 0);
  } catch {
    // Un contador que no bajó no justifica un cartel: se reintenta al volver a abrir.
  }
}

/* ---- Inbox del establecimiento ------------------------------------------ */

/** Nodo crudo de `chats_establecimiento/{establecimientoId}/{chatId}`. */
interface ChatEstablecimientoRtdb {
  visitanteId?: unknown;
  titulo?: unknown;
  ultimoMensaje?: unknown;
  timestamp?: unknown;
  mensajesNoLeidos?: unknown;
}

function aResumenEstablecimiento(id: string, v: ChatEstablecimientoRtdb | null): ChatEstablecimientoResumen {
  return {
    id,
    visitanteId: aTexto(v?.visitanteId),
    titulo: aTexto(v?.titulo) || "Visitante",
    ultimoMensaje: aTexto(v?.ultimoMensaje),
    timestamp: aNumero(v?.timestamp),
    noLeidos: aNumero(v?.mensajesNoLeidos),
  };
}

interface UseChatsEstablecimientoReturn {
  /** Del más reciente al más viejo. */
  chats: ChatEstablecimientoResumen[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Inbox compartido de un establecimiento, en tiempo real. Lo ve cualquier
 * miembro: las reglas miran `establecimiento_miembros/{id}/{uid}`, no permisos.
 * Con `establecimientoId` en `null` —el switcher todavía no resolvió— no escucha.
 */
export function useChatsEstablecimiento(establecimientoId: string | null): UseChatsEstablecimientoReturn {
  // Guardado con el establecimiento que lo trajo: al cambiar en el switcher, lo
  // que hay es de la finca anterior y la pantalla está cargando.
  const [estado, setEstado] = useState<{
    establecimientoId: string;
    chats: ChatEstablecimientoResumen[];
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (!establecimientoId) return;
    let dejarDeEscuchar: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      dejarDeEscuchar?.();
      dejarDeEscuchar = undefined;
      if (!user) {
        setEstado({ establecimientoId, chats: [], error: "Necesitás iniciar sesión para ver los chats" });
        return;
      }
      const q = query(ref(rtdb(), `chats_establecimiento/${establecimientoId}`), orderByChild("timestamp"));
      dejarDeEscuchar = onValue(
        q,
        (snap) => {
          const chats: ChatEstablecimientoResumen[] = [];
          snap.forEach((hijo) => {
            if (hijo.key) chats.push(aResumenEstablecimiento(hijo.key, hijo.val() as ChatEstablecimientoRtdb | null));
          });
          setEstado({ establecimientoId, chats: chats.reverse(), error: null });
        },
        // Lo típico acá es PERMISSION_DENIED: la cuenta no figura como miembro.
        () => setEstado({ establecimientoId, chats: [], error: "No pudimos cargar los chats del establecimiento" }),
      );
    });

    return () => {
      unsubAuth();
      dejarDeEscuchar?.();
    };
  }, [establecimientoId]);

  const alDia = !!establecimientoId && estado?.establecimientoId === establecimientoId;
  return {
    chats: alDia ? estado.chats : [],
    isLoading: !!establecimientoId && !alDia,
    error: alDia ? estado.error : null,
  };
}

/** Pone en cero los no leídos del establecimiento en un chat. */
export async function marcarChatLeidoEstablecimiento(establecimientoId: string, chatId: string): Promise<void> {
  try {
    await set(ref(rtdb(), `chats_establecimiento/${establecimientoId}/${chatId}/mensajesNoLeidos`), 0);
  } catch {
    // Un contador que no bajó no justifica un cartel: se reintenta al volver a abrir.
  }
}

/* ---- Mensajes ------------------------------------------------------------ */

/** Nodo crudo de `mensajes/{chatId}/{mensajeId}`. */
interface MensajeRtdb {
  remitenteId?: unknown;
  tipoEmisor?: unknown;
  texto?: unknown;
  timestamp?: unknown;
}

function aMensaje(id: string, v: MensajeRtdb | null): MensajeChat {
  const tipo: TipoEmisor = v?.tipoEmisor === "ESTABLECIMIENTO" ? "ESTABLECIMIENTO" : "VISITANTE";
  return {
    id,
    remitenteId: aTexto(v?.remitenteId),
    tipoEmisor: tipo,
    texto: aTexto(v?.texto),
    timestamp: aNumero(v?.timestamp),
  };
}

interface UseMensajesReturn {
  /** Del más viejo al más nuevo. */
  mensajes: MensajeChat[];
  isLoading: boolean;
  error: string | null;
}

/** Los últimos mensajes de un chat, en tiempo real. */
export function useMensajes(chatId: string | null): UseMensajesReturn {
  // Se guarda con el chat que lo trajo: al cambiar de conversación, lo que hay
  // es de la anterior y la pantalla está cargando.
  const [estado, setEstado] = useState<{ chatId: string; mensajes: MensajeChat[]; error: string | null } | null>(null);

  useEffect(() => {
    if (!chatId) return;
    let dejarDeEscuchar: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      dejarDeEscuchar?.();
      dejarDeEscuchar = undefined;
      if (!user) {
        setEstado({ chatId, mensajes: [], error: "Necesitás iniciar sesión para ver el chat" });
        return;
      }
      const q = query(ref(rtdb(), `mensajes/${chatId}`), orderByChild("timestamp"), limitToLast(MENSAJES_POR_CHAT));
      dejarDeEscuchar = onValue(
        q,
        (snap) => {
          const mensajes: MensajeChat[] = [];
          snap.forEach((hijo) => {
            if (hijo.key) mensajes.push(aMensaje(hijo.key, hijo.val() as MensajeRtdb | null));
          });
          setEstado({ chatId, mensajes, error: null });
        },
        () => setEstado({ chatId, mensajes: [], error: "No pudimos cargar la conversación" }),
      );
    });

    return () => {
      unsubAuth();
      dejarDeEscuchar?.();
    };
  }, [chatId]);

  const alDia = !!chatId && estado?.chatId === chatId;
  return {
    mensajes: alDia ? estado.mensajes : [],
    isLoading: !!chatId && !alDia,
    error: alDia ? estado.error : null,
  };
}

/* ---- Envío --------------------------------------------------------------- */

/** Mensaje que la base rechazó. Queda sólo en esta pestaña, para reintentarlo. */
export interface MensajeFallido {
  id: string;
  chatId: string;
  texto: string;
  timestamp: number;
  code: string;
}

/** Datos de un chat que hacen falta para escribir en él. */
export interface ChatDestino {
  id: string;
  establecimientoId: string;
  /** UID de Firebase del visitante: es la clave de su inbox. */
  visitanteId: string;
}

/**
 * Envía un mensaje como `emisor`. Es una sola escritura multi-ruta —el mensaje y
 * los dos inbox, sumándole un no leído al que recibe—, así que o entra todo o nada.
 *
 * El SDK muestra la escritura en `useMensajes` antes de que el servidor la
 * confirme, y si la rechaza la retira. Por eso `enviando` sólo marca cuáles
 * siguen sin confirmar, y un rechazo pasa a `fallidos`: la base ya no lo tiene.
 */
export function useEnviarMensaje(emisor: TipoEmisor) {
  const [enviando, setEnviando] = useState<ReadonlySet<string>>(new Set());
  const [fallidos, setFallidos] = useState<MensajeFallido[]>([]);

  const enviar = useCallback(async (chat: ChatDestino, texto: string) => {
    const uid = auth.currentUser?.uid;
    const db = rtdb();
    const id = push(ref(db, `mensajes/${chat.id}`)).key;
    if (!id) return;

    if (!uid) {
      setFallidos((f) => [...f, { id, chatId: chat.id, texto, timestamp: Date.now(), code: "SIN_SESION" }]);
      return;
    }

    setEnviando((s) => new Set(s).add(id));
    const ahora = serverTimestamp();
    const inboxEst = `chats_establecimiento/${chat.establecimientoId}/${chat.id}`;
    const inboxUsuario = `chats_usuario/${chat.visitanteId}/${chat.id}`;
    const inboxDestino = emisor === "VISITANTE" ? inboxEst : inboxUsuario;
    try {
      await update(ref(db), {
        [`mensajes/${chat.id}/${id}`]: { remitenteId: uid, tipoEmisor: emisor, texto, timestamp: ahora },
        [`${inboxUsuario}/ultimoMensaje`]: texto,
        [`${inboxUsuario}/timestamp`]: ahora,
        [`${inboxEst}/ultimoMensaje`]: texto,
        [`${inboxEst}/timestamp`]: ahora,
        [`${inboxDestino}/mensajesNoLeidos`]: increment(1),
      });
    } catch (e) {
      // Los errores del SDK traen el motivo en `code` ("PERMISSION_DENIED"…).
      const code = (e as { code?: unknown })?.code;
      setFallidos((f) => [
        ...f,
        { id, chatId: chat.id, texto, timestamp: Date.now(), code: typeof code === "string" ? code.toUpperCase() : "ERROR_DESCONOCIDO" },
      ]);
    } finally {
      setEnviando((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  }, [emisor]);

  const descartar = useCallback((id: string) => setFallidos((f) => f.filter((m) => m.id !== id)), []);

  return { enviar, enviando, fallidos, descartar };
}
