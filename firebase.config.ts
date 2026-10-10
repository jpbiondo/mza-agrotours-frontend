import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

/**
 * Realtime Database de los chats. Se pide recién al usarla y no al cargar el
 * módulo: sin `NEXT_PUBLIC_FIREBASE_DATABASE_URL`, `getDatabase` tira, y este
 * archivo lo importa media app —el build incluido—.
 */
export function rtdb(): Database {
  return getDatabase(app);
}

/**
 * Cloud Messaging, o `null` si el navegador no soporta push (Safari sin PWA,
 * modo privado de Firefox, SSR). También se pide recién al usarla: `getMessaging`
 * tira en un navegador sin soporte.
 */
export async function mensajeria(): Promise<Messaging | null> {
  if (typeof window === "undefined" || !(await isSupported())) return null;
  return getMessaging(app);
}

/** La config que necesita el service worker de FCM, que no puede leer el `.env`. */
export const configSw = {
  apiKey: firebaseConfig.apiKey ?? "",
  projectId: firebaseConfig.projectId ?? "",
  messagingSenderId: firebaseConfig.messagingSenderId ?? "",
  appId: firebaseConfig.appId ?? "",
};
