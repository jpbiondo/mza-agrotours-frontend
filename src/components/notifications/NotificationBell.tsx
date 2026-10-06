"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, ArrowUp, Bell, BellRing, CalendarX, Check, CheckCheck, FileCheck, FileClock, FileX, Loader, RotateCcw, Users,
  type LucideIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { NOTIF_TONE } from "@/data/notificaciones";
import { useNotificaciones } from "@/hooks/useNotificaciones";
import { usePermisoPush } from "@/hooks/usePush";
import { cn } from "@/lib/utils";
import type { Notificacion } from "@/types/notificaciones";

const ICON: Record<string, LucideIcon> = {
  "file-clock": FileClock, "file-check": FileCheck, "file-x": FileX,
  "calendar-x": CalendarX, users: Users, bell: Bell,
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  /**
   * Si la lista está scrolleada hasta arriba. Abierta y más abajo, las
   * notificaciones que llegan por push quedan en espera detrás de un aviso:
   * meterlas arriba correría lo que el usuario está leyendo (Chrome y Firefox
   * lo compensan solos, Safari no).
   */
  const enTope = useRef(true);
  const {
    notificaciones, noLeidas, isLoading, error, reload,
    hayMas, cargandoMas, errorMas, cargarMas, marcarLeida, marcarTodas,
    nuevasPendientes, nuevasDesbordan, mostrarNuevas,
  } = useNotificaciones(null, { retenerNuevas: () => open && !enTope.current });
  const push = usePermisoPush();
  const router = useRouter();
  const wrap = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  /**
   * Scroll infinito: al tocar el fondo se pide la página siguiente. Se puede
   * llamar en cada evento sin miedo: `cargarMas` ignora los pedidos mientras
   * hay uno en curso o si ya no quedan páginas.
   */
  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    enTope.current = el.scrollTop <= 0;
    // Volvió arriba por su cuenta: ya no hay nada que correr.
    if (enTope.current && nuevasPendientes > 0) mostrarNuevas();
    // Unos píxeles de tolerancia: con zoom el scroll queda en fracciones y
    // nunca llega a igualar el alto exacto.
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4) cargarMas();
  }

  function toggle() {
    // Al abrir, la lista arranca arriba de todo, así que lo que haya quedado
    // en espera de la vez anterior entra directo.
    if (!open) {
      enTope.current = true;
      mostrarNuevas();
    }
    setOpen((o) => !o);
  }

  function verNuevas() {
    mostrarNuevas();
    lista.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openNotif(n: Notificacion) {
    if (!n.leida) marcarLeida(n.id);
    setOpen(false);
    // Sin destino conocido la notificación sólo se marca como leída: el
    // `urlLink` del backend no siempre mapea a una ruta del front.
    if (n.href) router.push(n.href);
  }

  const listo = !isLoading && !error;
  // `marcarTodas` necesita la fecha de alguna notificación cargada.
  const puedeMarcarTodas = listo && noLeidas > 0 && notificaciones.length > 0;

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={listo && noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : "Notificaciones"}
        onClick={toggle}
        className={cn(
          "relative inline-flex size-9.5 cursor-pointer items-center justify-center rounded-md border border-outline-variant",
          open ? "bg-cream-tert" : "bg-surface",
        )}
      >
        <Bell className="size-4.5 text-fg-2" />
        {listo && noLeidas > 0 && (
          <span className="absolute -top-1.25 -right-1.25 box-content flex h-4.5 min-w-4.5 items-center justify-center rounded-[9px] border-2 border-cream-bg bg-green-800 px-1.25 text-[11px] leading-none font-bold text-white">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Notificaciones"
          className="pop absolute top-[calc(100%+10px)] right-0 z-60 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-[14px] border border-outline-variant bg-surface shadow-pop"
        >
          {/* Una sola fila que no puede partirse: el título trunca antes que
              nada, el pill y la acción no se encogen. La acción va como ícono
              —igual que el check de cada fila— porque con texto no entraba al
              lado del pill en el ancho del popover. */}
          <div className="flex items-center gap-2.5 border-b border-outline-variant bg-cream-tert py-3 pr-3 pl-4">
            <span className="min-w-0 truncate font-display text-[15.5px] font-bold text-fg-1">Notificaciones</span>
            {listo && noLeidas > 0 && (
              <span className="shrink-0 rounded-pill bg-brown-700 px-2 py-0.5 text-[11.5px] leading-[1.4] font-bold whitespace-nowrap text-white">
                {noLeidas} sin leer
              </span>
            )}
            {puedeMarcarTodas && (
              <button
                type="button"
                onClick={() => marcarTodas()}
                title="Marcar todas como leídas"
                aria-label="Marcar todas como leídas"
                className="ml-auto inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-green-300 bg-surface text-green-800 transition-colors hover:bg-green-050"
              >
                <CheckCheck className="size-4" />
              </button>
            )}
          </div>

          {/* Pedido de permiso desde un click: Firefox rechaza el diálogo si
              no. Sólo mientras el usuario no contestó; si lo negó, el
              navegador ya no deja volver a preguntar. */}
          {listo && push.estado === "default" && (
            <div className="flex items-center gap-2.5 border-b border-outline-variant px-4 py-2.5">
              <BellRing className="size-4 shrink-0 text-green-800" />
              <span className="min-w-0 flex-1 text-[12.5px] leading-snug text-fg-2">
                Activá los avisos del navegador para enterarte al momento.
              </span>
              <button
                type="button"
                onClick={() => push.activar()}
                disabled={push.activando}
                className="shrink-0 cursor-pointer rounded-pill border border-green-300 bg-surface px-3 py-1 text-xs font-semibold text-green-800 transition-colors hover:bg-green-050 disabled:cursor-default disabled:opacity-60"
              >
                Activar
              </button>
            </div>
          )}

          <div ref={lista} onScroll={onScroll} className="max-h-80 overflow-x-hidden overflow-y-auto">
            {/* Alto cero a propósito: aparecer no puede empujar la lista, que
                es justo lo que se quiere evitar al retener las nuevas. */}
            {nuevasPendientes > 0 && (
              <div className="sticky top-0 z-10 h-0">
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={verNuevas}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-pill bg-green-800 px-3 py-1.5 text-xs font-semibold text-white shadow-pop"
                  >
                    <ArrowUp className="size-3.5" />
                    {nuevasDesbordan
                      ? "Hay notificaciones nuevas"
                      : nuevasPendientes === 1
                        ? "1 notificación nueva"
                        : `${nuevasPendientes} notificaciones nuevas`}
                  </button>
                </div>
              </div>
            )}
            {isLoading ? (
              <div className="px-2.5 pt-2.5 pb-2">
                <BellSkeleton filas={4} />
              </div>
            ) : error ? (
              <div className="px-6 py-10 text-center text-fg-2">
                <div className="mb-3 inline-flex size-13 items-center justify-center rounded-full bg-danger-fill">
                  <AlertTriangle className="size-6 text-danger-fg" />
                </div>
                <div className="mb-3.5 text-sm leading-normal">No pudimos cargar tus notificaciones.</div>
                <button type="button" className="btn btn-neutral btn-sm" onClick={reload}>
                  <RotateCcw size={15} /> Reintentar
                </button>
              </div>
            ) : notificaciones.length === 0 ? (
              <div className="px-6 py-12 text-center text-fg-2">
                <div className="mb-3 inline-flex size-13 items-center justify-center rounded-full bg-cream-tert">
                  <Bell className="size-6 text-brown-700" />
                </div>
                <div className="text-sm leading-normal">No tenés notificaciones por ahora.</div>
              </div>
            ) : (
              <div className="px-2.5 pt-2.5 pb-2">
                <div className="flex flex-col gap-0.75">
                  {notificaciones.map((n) => {
                    const unread = !n.leida;
                    const tone = NOTIF_TONE[n.tone] ?? { bg: "bg-cream-tert", fg: "text-fg-2" };
                    const NIcon = ICON[n.icon] ?? Bell;
                    return (
                      <div
                        key={n.id}
                        role="menuitem"
                        tabIndex={0}
                        onClick={() => openNotif(n)}
                        className={cn(
                          "flex cursor-pointer items-start gap-2.75 rounded-[10px] p-2.5",
                          unread && "bg-cream-tert",
                        )}
                      >
                        <span className={cn("flex size-8.5 shrink-0 items-center justify-center rounded-[9px]", tone.bg)}>
                          <NIcon className={cn("size-4", tone.fg)} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.75">
                            {unread && <span className="size-1.75 shrink-0 rounded-full bg-green-800" />}
                            <div className={cn("truncate text-[13.5px] text-fg-1", unread ? "font-bold" : "font-medium")}>{n.title}</div>
                          </div>
                          <div className="mt-0.5 text-[12.5px] leading-[1.4] text-fg-2">{n.body}</div>
                          <div className="mt-1 text-[11.5px] text-fg-3">{n.time}</div>
                        </div>
                        <button
                          type="button"
                          title={unread ? "Marcar como leída" : "Leída"}
                          aria-label={unread ? "Marcar como leída" : "Leída"}
                          disabled={!unread}
                          onClick={(e) => { e.stopPropagation(); if (unread) marcarLeida(n.id); }}
                          className={cn(
                            "inline-flex size-7.5 shrink-0 items-center justify-center self-center rounded-full border text-green-800",
                            unread ? "cursor-pointer border-green-300 bg-surface" : "cursor-default border-outline-variant bg-green-050",
                          )}
                        >
                          <Check className="size-3.75" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {cargandoMas ? (
                  <div aria-busy="true" className="flex justify-center pt-2.5 pb-1 text-fg-3">
                    <Loader className="spin size-5" />
                    <span className="sr-only">Cargando más notificaciones…</span>
                  </div>
                ) : errorMas ? (
                  <div className="flex items-center justify-center gap-2 pt-2.5 pb-1 text-xs text-fg-2">
                    No pudimos cargar más.
                    <button type="button" onClick={cargarMas} className="cursor-pointer font-semibold text-green-800 hover:underline">
                      Reintentar
                    </button>
                  </div>
                ) : hayMas ? null : (
                  <div className="pt-2.5 pb-1 text-center text-xs text-fg-3">No hay más notificaciones</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Misma forma que una fila: ícono, título, dos líneas de cuerpo, hora y el check. */
function BellSkeleton({ filas }: { filas: number }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-0.75">
      <span className="sr-only">Cargando notificaciones…</span>
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="flex items-start gap-2.75 p-2.5">
          <Skeleton className="size-8.5 shrink-0 rounded-[9px]" />
          <div className="min-w-0 flex-1 space-y-1.75 pt-0.5">
            <Skeleton className={cn("h-3.5", i % 2 ? "w-1/2" : "w-3/5")} />
            <Skeleton className="h-3 w-full" />
            <Skeleton className={cn("h-3", i % 2 ? "w-2/3" : "w-4/5")} />
            <Skeleton className="h-2.5 w-16" />
          </div>
          <Skeleton className="size-7.5 shrink-0 self-center rounded-full" />
        </div>
      ))}
    </div>
  );
}
