"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader, MessagesSquare, Search, SearchX } from "lucide-react";
import ConversacionChat, { momentoCorto } from "@/components/chat/ConversacionChat";
import { useChatsEstablecimiento, marcarChatLeidoEstablecimiento } from "@/hooks/useChats";
import { useEstablecimientos } from "@/hooks/useEstablecimientos";
import { cn } from "@/lib/utils";
import type { ChatEstablecimientoResumen } from "@/types/chats";

/** Tope de caracteres por respuesta, como en el diseño. */
const MAX = 500;

type Filtro = "todos" | "no-leidos";

/** Monograma del visitante: las iniciales de sus dos primeras palabras. */
function iniciales(nombre: string): string {
  return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function Avatar({ nombre, size, activo }: { nombre: string; size: "sm" | "md"; activo?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        size === "md" ? "size-11 text-base" : "size-10 text-sm",
        activo
          ? "bg-green-800 shadow-[inset_0_-2px_0_var(--green-900)]"
          : "bg-brown-700 shadow-[inset_0_-2px_0_var(--brown-800)]",
      )}
    >
      {iniciales(nombre)}
    </div>
  );
}

function FilaChat({ chat, activo, onOpen }: { chat: ChatEstablecimientoResumen; activo: boolean; onOpen: (id: string) => void }) {
  const conNuevos = chat.noLeidos > 0;
  return (
    <button
      type="button"
      onClick={() => onOpen(chat.id)}
      aria-current={activo || undefined}
      className={cn(
        "flex w-full cursor-pointer items-start gap-3 border-b border-cream-tert px-4 py-[13px] text-left transition-colors",
        activo ? "bg-green-050 shadow-[inset_3px_0_0_var(--green-800)]" : "hover:bg-cream-tert",
      )}
    >
      <Avatar nombre={chat.titulo} size="md" activo={activo} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="min-w-0 truncate text-sm font-semibold text-fg-1">{chat.titulo}</div>
          <div className={cn("shrink-0 text-[11.5px]", conNuevos ? "font-semibold text-green-800" : "font-medium text-fg-3")}>
            {momentoCorto(chat.timestamp)}
          </div>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className={cn("min-w-0 flex-1 truncate text-[13px]", conNuevos ? "font-medium text-fg-1" : "text-fg-2", !chat.ultimoMensaje && "italic text-fg-3")}>
            {chat.ultimoMensaje || "Todavía no hay mensajes"}
          </div>
          {conNuevos && (
            <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-pill bg-green-800 px-1.5 font-mono text-[11px] font-bold text-white">
              {chat.noLeidos}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function Hilo({ chat, establecimientoId, onBack }: {
  chat: ChatEstablecimientoResumen;
  establecimientoId: string;
  onBack: () => void;
}) {
  // Abrir la conversación (o recibir algo con ella abierta) la da por leída.
  useEffect(() => {
    if (chat.noLeidos > 0) void marcarChatLeidoEstablecimiento(establecimientoId, chat.id);
  }, [establecimientoId, chat.id, chat.noLeidos]);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-outline-variant bg-surface px-[18px] py-3">
        {/* En angosto la lista y el hilo no entran juntos: se vuelve a la lista. */}
        <button type="button" onClick={onBack} aria-label="Volver al listado" className="inline-flex cursor-pointer rounded-md p-1.5 text-fg-2 hover:bg-cream-tert md:hidden">
          <ArrowLeft size={20} />
        </button>
        <Avatar nombre={chat.titulo} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-base leading-tight font-bold text-fg-1">{chat.titulo}</div>
          <div className="mt-0.5 text-[12.5px] text-fg-3">Consulta de un visitante</div>
        </div>
        {/* TODO backend: el chat no guarda desde qué actividad ni reserva se inició;
            el diseño muestra la actividad, el código de reserva y las personas. */}
      </div>
      <ConversacionChat
        key={chat.id}
        chat={{ id: chat.id, establecimientoId, visitanteId: chat.visitanteId }}
        emisor="ESTABLECIMIENTO"
        vacio="El visitante todavía no escribió nada."
        placeholder="Escribí tu respuesta…"
        max={MAX}
      />
    </div>
  );
}

function Bandeja({ establecimientoId }: { establecimientoId: string }) {
  const { chats, isLoading, error } = useChatsEstablecimiento(establecimientoId);
  const [activoId, setActivoId] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const totalNoLeidos = chats.reduce((s, c) => s + c.noLeidos, 0);
  const q = busqueda.trim().toLowerCase();
  const visibles = chats.filter((c) => {
    if (filtro === "no-leidos" && c.noLeidos === 0) return false;
    return !q || c.titulo.toLowerCase().includes(q);
  });
  const activo = chats.find((c) => c.id === activoId) ?? null;

  return (
    // A ancho y alto completos debajo de la barra de cuenta del shell (`h-16`):
    // la lista y el hilo scrollean cada uno por su lado, no la página.
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 overflow-hidden bg-surface">
      <div className={cn("flex min-h-0 w-[372px] shrink-0 flex-col border-r border-outline-variant max-md:w-full max-md:border-r-0", activo && "max-md:hidden")}>
        <div className="shrink-0 px-4 pt-5 pb-2.5">
          <h1 className="m-0 font-display text-2xl leading-[1.3] font-semibold text-fg-1">Chats</h1>
          <p className="mt-1 mb-4 text-[13.5px] leading-[1.45] text-pretty text-fg-2">
            Consultas de los visitantes a tu establecimiento.
          </p>
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-3" aria-hidden />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por visitante"
              aria-label="Buscar por visitante"
              className="h-10 w-full rounded-md border border-sand bg-surface pl-9 font-sans text-sm text-fg-1 outline-none focus:border-green-700"
            />
          </div>
          <div className="mt-3 flex gap-2">
            {([{ id: "todos", label: "Todos", count: 0 }, { id: "no-leidos", label: "No leídos", count: totalNoLeidos }] as const).map((t) => {
              const on = filtro === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFiltro(t.id)}
                  aria-pressed={on}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-[7px] rounded-pill border px-[13px] py-1.5 font-sans text-[13px] font-semibold",
                    on ? "border-green-800 bg-green-800 text-white" : "border-outline-variant bg-surface text-fg-2",
                  )}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span className={cn("inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-pill px-[5px] text-[11px] leading-none font-bold text-white", on ? "bg-white/22" : "bg-brown-700")}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="px-6 py-10 text-center text-fg-3"><Loader size={22} className="spin inline" aria-label="Cargando chats" /></div>
          ) : error ? (
            <div className="px-6 py-10 text-center text-[13.5px] leading-normal text-danger">{error}</div>
          ) : visibles.length === 0 ? (
            <div className="px-6 py-10 text-center text-fg-2">
              <div className="mb-3 inline-flex size-[52px] items-center justify-center rounded-full bg-cream-tert">
                {chats.length === 0 ? <MessagesSquare size={24} className="text-brown-700" /> : <SearchX size={24} className="text-brown-700" />}
              </div>
              <div className="mb-1 font-display text-[15.5px] font-semibold text-fg-1">
                {chats.length === 0 ? "Todavía no hay consultas" : "Sin resultados"}
              </div>
              <div className="text-[13px] leading-normal">
                {chats.length === 0
                  ? "Cuando un visitante contacte al establecimiento, la conversación aparece acá."
                  : "No hay conversaciones que coincidan con el filtro."}
              </div>
            </div>
          ) : (
            visibles.map((c) => <FilaChat key={c.id} chat={c} activo={c.id === activoId} onOpen={setActivoId} />)
          )}
        </div>
      </div>

      {activo ? (
        <Hilo chat={activo} establecimientoId={establecimientoId} onBack={() => setActivoId(null)} />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3.5 bg-cream-bg p-8 text-center text-fg-2 max-md:hidden">
          <div className="flex size-16 items-center justify-center rounded-full bg-cream-tert">
            <MessagesSquare size={28} className="text-brown-700" />
          </div>
          <div className="font-display text-lg font-bold text-fg-1">Elegí una conversación</div>
          <div className="max-w-[300px] text-[13.5px] leading-normal">
            Seleccioná un chat de la izquierda para ver los mensajes y responderle al visitante.
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Bandeja de chats del establecimiento activo. El acceso lo deciden las reglas
 * de la RTDB (`establecimiento_miembros`), no un permiso del front: si la cuenta
 * no figura como miembro, la lectura falla y se muestra el error.
 */
export default function EstChatsClient() {
  const { activo, listo } = useEstablecimientos();

  if (!listo) {
    return <div className="p-10 text-center text-fg-3"><Loader size={22} className="spin inline" aria-label="Cargando" /></div>;
  }
  if (!activo) {
    return <div className="p-10 text-center text-[15px] text-fg-2">Tu cuenta no tiene establecimientos asignados.</div>;
  }
  // Al cambiar de establecimiento en el switcher se arranca de cero: sin chat
  // abierto ni búsqueda de la finca anterior.
  return <Bandeja key={activo.id} establecimientoId={activo.id} />;
}
