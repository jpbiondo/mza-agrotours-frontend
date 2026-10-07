"use client";

import { usePushSync } from "@/hooks/usePush";

/** Conecta los push de FCM con la app. Va una sola vez, en el layout raíz. */
export default function PushSync() {
  usePushSync();
  return null;
}
