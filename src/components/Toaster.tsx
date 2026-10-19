"use client";

import { useEffect, useRef, useState } from "react";
import { ToastCard } from "@/components/ui/Toast";
import { useToastStore, type ToastItem } from "@/stores/toastStore";

/**
 * Dibuja la cola de `notify.*`: abajo a la derecha, el más nuevo abajo de todo.
 * Se monta una sola vez, en el layout raíz.
 */
export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const cerrar = useToastStore((s) => s.cerrar);
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 left-4 z-150 flex flex-col items-end gap-2.5 sm:right-6 sm:bottom-6 sm:left-auto">
      {toasts.map((t) => (
        <ToastConTiempo key={t.id} toast={t} onClose={() => cerrar(t.id)} />
      ))}
    </div>
  );
}

/**
 * Un toast con su cuenta regresiva. Con el mouse encima o el foco adentro se
 * pausa: si alguien está por tocar "Deshacer", no se le va de las manos.
 */
function ToastConTiempo({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const [pausado, setPausado] = useState(false);
  const restante = useRef(toast.duracion);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (pausado) return;
    const inicio = Date.now();
    const t = setTimeout(() => onCloseRef.current(), restante.current);
    return () => {
      clearTimeout(t);
      restante.current = Math.max(0, restante.current - (Date.now() - inicio));
    };
  }, [pausado]);

  return (
    <div
      className="pointer-events-auto w-full sm:w-auto"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <ToastCard tone={toast.tone} title={toast.title} sub={toast.sub} action={toast.action} onClose={onClose} />
    </div>
  );
}
