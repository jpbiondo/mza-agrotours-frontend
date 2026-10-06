/* Service worker de Firebase Cloud Messaging.
 *
 * Recibe los push con la pestaña cerrada o en segundo plano. Con una pestaña
 * visible el SDK no muestra nada: le pasa el mensaje a la página, que lo toma
 * con `onMessage` (ver `src/hooks/usePush.ts`).
 *
 * La config de Firebase llega por query string al registrarlo: un archivo de
 * `public/` no pasa por el build, así que no puede leer el `.env`. Son los
 * mismos valores públicos que ya viajan en el bundle.
 */

// Tiene que ir ANTES de cargar el SDK. El SDK registra su propio
// `notificationclick`, corta la propagación y, como el backend no manda
// `fcmOptions.link`, no navega a ningún lado. Registrado primero, el nuestro
// corre antes y es el que decide a dónde ir.
self.addEventListener("notificationclick", (event) => {
  const payload = event.notification?.data?.FCM_MSG;
  if (!payload) return;
  event.stopImmediatePropagation();
  event.notification.close();
  event.waitUntil(abrir(rutaInterna(payload.data?.urlLink)));
});

/** Sólo rutas del propio sitio: `/algo`, nunca `//otro.com` ni absolutas. */
function rutaInterna(url) {
  return typeof url === "string" && url.startsWith("/") && !url.startsWith("//") ? url : "/";
}

/**
 * Si ya hay una pestaña del sitio, la enfoca y le pide a la página que navegue
 * con su router (sin recargar). Si no hay ninguna, abre una nueva en la ruta.
 *
 * No se usa `client.navigate()` porque sólo funciona sobre páginas que este SW
 * controla, y su scope es el de FCM, no el del sitio.
 */
async function abrir(ruta) {
  const ventanas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  const propia = ventanas.find((c) => new URL(c.url).origin === self.location.origin);
  if (!propia) return self.clients.openWindow(ruta);
  const enfocada = await propia.focus();
  enfocada.postMessage({ tipo: "agrotours:abrir", ruta });
}

// Misma versión que `firebase` en package.json: si se actualiza uno, el otro.
importScripts(
  "https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js",
);

const params = new URL(self.location.href).searchParams;
firebase.initializeApp({
  apiKey: params.get("apiKey"),
  projectId: params.get("projectId"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
});

// La notificación del sistema la muestra el SDK solo (el push trae
// `notification`). Acá sólo se avisa a las pestañas ocultas que hay algo
// nuevo, para que la campana se actualice antes de que el usuario vuelva.
firebase.messaging().onBackgroundMessage(async () => {
  const ventanas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  ventanas.forEach((c) => c.postMessage({ tipo: "agrotours:push" }));
});
