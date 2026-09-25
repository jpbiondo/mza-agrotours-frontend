import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  increment, limitToLast, onValue, orderByChild, push, query, ref, serverTimestamp, set, update,
} from "firebase/database";
import { auth, rtdb } from "../../firebase.config";
import { useAsync } from "@/hooks/useAsync";
import { ApiError, apiFetch } from "@/lib/api";
import { conToken } from "@/lib/sesion";
import { EST_CHATS } from "@/data/chats";
import type { ChatResumen, EstChat, MensajeChat, TipoEmisor } from "@/types/chats";

/*
 * Chats del visitante. El alta pasa por el backend —`chats/` sólo lo escribe el
 * Admin SDK— y todo lo demás va directo contra la Realtime Database, con las
 * reglas como único control: el visitante lee su inbox y los mensajes de sus
 * chats, y agrega mensajes actualizando de paso los dos inbox.
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

/**
 * Envía como visitante. Es una sola escritura multi-ruta —el mensaje y los dos
 * inbox—, así que o entra todo o nada.
 *
 * El SDK muestra la escritura en `useMensajes` antes de que el servidor la
 * confirme, y si la rechaza la retira. Por eso `enviando` sólo marca cuáles
 * siguen sin confirmar, y un rechazo pasa a `fallidos`: la base ya no lo tiene.
 */
export function useEnviarMensaje() {
  const [enviando, setEnviando] = useState<ReadonlySet<string>>(new Set());
  const [fallidos, setFallidos] = useState<MensajeFallido[]>([]);

  const enviar = useCallback(async (chat: Pick<ChatResumen, "id" | "establecimientoId">, texto: string) => {
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
    const inboxUsuario = `chats_usuario/${uid}/${chat.id}`;
    try {
      await update(ref(db), {
        [`mensajes/${chat.id}/${id}`]: { remitenteId: uid, tipoEmisor: "VISITANTE", texto, timestamp: ahora },
        [`${inboxUsuario}/ultimoMensaje`]: texto,
        [`${inboxUsuario}/timestamp`]: ahora,
        [`${inboxEst}/ultimoMensaje`]: texto,
        [`${inboxEst}/timestamp`]: ahora,
        [`${inboxEst}/mensajesNoLeidos`]: increment(1),
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
  }, []);

  const descartar = useCallback((id: string) => setFallidos((f) => f.filter((m) => m.id !== id)), []);

  return { enviar, enviando, fallidos, descartar };
}

/* ---- Lado productor (todavía mock) --------------------------------------- */

/** Bandeja de chats del establecimiento (lado productor). */
export function useEstChats() {
  return useAsync<EstChat[]>(mockEst);
}

// MOCK — reemplazar por `chats_establecimiento/{id}` en la RTDB.
// TODO backend: nadie escribe todavía `establecimiento_miembros`, y sin eso las
// reglas no le dejan leer nada al productor.
async function mockEst(): Promise<EstChat[]> {
  await new Promise<void>((res) => setTimeout(res, 500));
  return EST_CHATS.map((c) => ({ ...c, days: c.days.map((d) => ({ ...d, messages: [...d.messages] })) }));
}

/** Respuesta del productor. Resuelve ok/err para modelar el estado de envío. */
export function useResponderChat() {
  const [isLoading, setIsLoading] = useState(false);
  async function enviar(_chatId: string, _text: string): Promise<{ ok: boolean }> {
    setIsLoading(true);
    try {
      await new Promise<void>((res) => setTimeout(res, 700));
      // MOCK — reemplazar por una escritura en `mensajes/{chatId}` con tipoEmisor ESTABLECIMIENTO.
      return { ok: true };
    } finally { setIsLoading(false); }
  }
  return { enviar, isLoading };
}
