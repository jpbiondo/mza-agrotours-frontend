import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { getToken, onMessage } from "firebase/messaging";
import { auth, configSw, mensajeria } from "../../firebase.config";
import { apiFetch } from "@/lib/api";
import { conToken } from "@/lib/sesion";
import { useNotificacionesStore } from "@/stores/notificacionesStore";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/**
 * El scope que usa el SDK cuando registra el SW él solo. Con el scope por
 * defecto (`/`) el SW pasaría a controlar todas las páginas del sitio, y no
 * tiene nada que hacer con ellas.
 */
const SCOPE_SW = "/firebase-cloud-messaging-push-scope";

export type PermisoPush = NotificationPermission | "unsupported";

/** Qué dijo el usuario sobre las notificaciones del navegador. */
function leerPermiso(): PermisoPush {
  if (
    !VAPID_KEY ||
    typeof window === "undefined" ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * Espera a que el SW esté activo. `register` resuelve apenas lo descarga, con
 * el worker todavía instalándose, y suscribirse al push sin un worker activo
 * falla ("no active Service Worker"). El SDK hace esta espera cuando registra
 * el SW él solo, pero no cuando se le pasa un registro propio, como acá.
 */
function swActivo(registro: ServiceWorkerRegistration): Promise<ServiceWorkerRegistration> {
  if (registro.active) return Promise.resolve(registro);
  const entrante = registro.installing ?? registro.waiting;
  if (!entrante) return Promise.reject(new Error("El service worker de FCM no se instaló"));
  return new Promise((resolve, reject) => {
    const limite = setTimeout(() => reject(new Error("El service worker de FCM no se activó a tiempo")), 10_000);
    entrante.addEventListener("statechange", () => {
      if (entrante.state === "activated") {
        clearTimeout(limite);
        resolve(registro);
      } else if (entrante.state === "redundant") {
        clearTimeout(limite);
        reject(new Error("El service worker de FCM se descartó al instalarse"));
      }
    });
  });
}

/** En desarrollo, los fallos del push se ven en la consola en vez de perderse. */
function avisarFallo(que: string, e: unknown): void {
  if (process.env.NODE_ENV !== "production") console.warn(`[push] ${que}`, e);
}

/**
 * Token de FCM de este navegador, o `null` si no hay permiso o soporte. Nunca
 * pide permiso: eso tiene que salir de un click (Firefox rechaza el pedido si
 * no) y lo hace `usePermisoPush`.
 */
async function tokenDelDispositivo(): Promise<string | null> {
  if (leerPermiso() !== "granted") return null;
  const m = await mensajeria();
  if (!m) return null;
  // Se registra a mano para pasarle la config por query string; `register`
  // con la misma URL devuelve el registro existente.
  const registro = await navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${new URLSearchParams(configSw)}`,
    { scope: SCOPE_SW },
  );
  return getToken(m, { vapidKey: VAPID_KEY, serviceWorkerRegistration: await swActivo(registro) });
}

/**
 * Asocia este navegador a la cuenta para recibir push. El backend pide
 * llamarlo en cada inicio de sesión: es un upsert, y si otra cuenta usó antes
 * este navegador, el token pasa a la actual.
 */
async function registrarDispositivo(): Promise<{ ok: boolean }> {
  try {
    const token = await tokenDelDispositivo();
    if (!token) return { ok: false };
    await conToken((t) =>
      apiFetch<unknown>("/notificacion/dispositivos/alta", {
        method: "POST",
        token: t,
        body: JSON.stringify({ token }),
      }),
    );
    return { ok: true };
  } catch (e) {
    // Sin push la app sigue andando: la campana se refresca igual al volver a
    // la pestaña. No vale la pena interrumpir al usuario por esto.
    avisarFallo("No se pudo registrar el dispositivo", e);
    return { ok: false };
  }
}

/**
 * Desasocia este navegador de la cuenta. Va antes del `signOut`: necesita el
 * ID token, y sin la baja la cuenta seguiría recibiendo push en un navegador
 * del que ya salió.
 *
 * Con techo de tiempo: si la red no contesta, cerrar sesión no puede quedar
 * colgado. Lo peor que pasa es algún push de más, y se corta solo cuando otra
 * cuenta inicie sesión en este navegador.
 */
export async function darDeBajaDispositivo(): Promise<void> {
  const baja = (async () => {
    const token = await tokenDelDispositivo();
    if (!token) return;
    await conToken((t) =>
      apiFetch<unknown>("/notificacion/dispositivos/baja", {
        method: "POST",
        token: t,
        body: JSON.stringify({ token }),
      }),
    );
  })().catch((e) => avisarFallo("No se pudo dar de baja el dispositivo", e));
  await Promise.race([baja, new Promise<void>((res) => setTimeout(res, 2500))]);
}

/** Mensajes que manda `public/firebase-messaging-sw.js` a las pestañas. */
type MensajeSw = { tipo: "agrotours:push" } | { tipo: "agrotours:abrir"; ruta: string };

function esMensajeSw(d: unknown): d is MensajeSw {
  const tipo = (d as { tipo?: unknown } | null)?.tipo;
  return tipo === "agrotours:push" || tipo === "agrotours:abrir";
}

/**
 * Todo lo que conecta el push con la app, montado una sola vez por
 * `<PushSync>`:
 *
 * - registra el navegador al haber sesión (si ya hay permiso);
 * - un push con la pestaña visible no muestra nada en el sistema operativo:
 *   llega por `onMessage` y sólo avisa a la campana;
 * - con la pestaña oculta, lo muestra el SW y avisa por `postMessage`;
 * - el click en una notificación del sistema llega del SW con la ruta, y se
 *   navega con el router para no recargar;
 * - al volver a la pestaña también se avisa, por si se perdió algún push (sin
 *   permiso, o con el SW dormido).
 */
export function usePushSync(): void {
  const router = useRouter();
  const avisar = useNotificacionesStore((s) => s.avisar);

  useEffect(
    () => onAuthStateChanged(auth, (user) => { if (user) void registrarDispositivo(); }),
    [],
  );

  useEffect(() => {
    let active = true;
    let unsub: (() => void) | undefined;
    mensajeria().then((m) => {
      if (m && active) unsub = onMessage(m, () => avisar());
    });
    return () => {
      active = false;
      unsub?.();
    };
  }, [avisar]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const sw = navigator.serviceWorker;
    // Por este canal también pasan los mensajes internos del SDK; se filtran
    // por `tipo` y se ignora el resto.
    const onMensaje = (e: MessageEvent) => {
      if (!esMensajeSw(e.data)) return;
      if (e.data.tipo === "agrotours:push") avisar();
      else if (e.data.ruta.startsWith("/") && !e.data.ruta.startsWith("//")) router.push(e.data.ruta);
    };
    sw.addEventListener("message", onMensaje);
    return () => sw.removeEventListener("message", onMensaje);
  }, [avisar, router]);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible") avisar(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [avisar]);
}

/**
 * Permiso de notificaciones del navegador, para ofrecer activarlas. `activar`
 * tiene que llamarse desde un click: es lo que muestra el diálogo del
 * navegador.
 */
export function usePermisoPush(): { estado: PermisoPush; activando: boolean; activar: () => Promise<void> } {
  // Inicial perezoso, leído en el cliente. Quien lo use no debe dibujarlo en
  // el HTML del servidor (allá siempre es "unsupported"): la campana lo usa
  // sólo dentro del popover, que arranca cerrado.
  const [estado, setEstado] = useState<PermisoPush>(leerPermiso);
  const [activando, setActivando] = useState(false);

  async function activar() {
    if (leerPermiso() !== "default") return;
    setActivando(true);
    try {
      if ((await Notification.requestPermission()) === "granted") await registrarDispositivo();
    } finally {
      setEstado(leerPermiso());
      setActivando(false);
    }
  }

  return { estado, activando, activar };
}
