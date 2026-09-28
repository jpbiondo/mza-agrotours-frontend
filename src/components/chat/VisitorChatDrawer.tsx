"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { auth } from "../../../firebase.config";
import { ArrowLeft, Grape, Loader, MessageCircle, MessageCircleOff, X } from "lucide-react";
import ConversacionChat, { momentoCorto } from "@/components/chat/ConversacionChat";
import { marcarChatLeido, useMisChats } from "@/hooks/useChats";
import { useChatDrawer, type ChatAbierto } from "@/stores/chatDrawerStore";
import { cn } from "@/lib/utils";
import type { ChatResumen } from "@/types/chats";

/** Tope de caracteres por mensaje, como en el diseño. */
const MAX = 300;

const GRADIENTES = [
  "bg-[linear-gradient(135deg,#7FA876,#2D5A27)]",
  "bg-[linear-gradient(135deg,#C9A227,#805533)]",
  "bg-[linear-gradient(135deg,#A6794F,#5C3B22)]",
  "bg-[linear-gradient(135deg,#6F9E64,#1E5418)]",
  "bg-[linear-gradient(135deg,#D99A4E,#A6794F)]",
  "bg-[linear-gradient(135deg,#B86B4F,#5C3B22)]",
];

/** El mismo establecimiento siempre con el mismo color. */
function gradienteDe(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return GRADIENTES[h % GRADIENTES.length];
}

/* ---- Piezas -------------------------------------------------------------- */

function AvatarEstablecimiento({ id, size }: { id: string; size: "sm" | "md" }) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[10px] text-white/85",
        size === "md" ? "size-11" : "size-10",
        gradienteDe(id),
      )}
    >
      <Grape size={size === "md" ? 22 : 20} />
    </div>
  );
}

function BotonCerrar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Cerrar"
      className="inline-flex size-[34px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-outline-variant bg-cream-bg text-fg-2 hover:bg-cream-tert"
    >
      <X size={18} />
    </button>
  );
}

function FilaChat({ chat, onOpen }: { chat: ChatResumen; onOpen: (c: ChatResumen) => void }) {
  const conNuevos = chat.noLeidos > 0;
  return (
    <button
      type="button"
      onClick={() => onOpen(chat)}
      className="flex w-full cursor-pointer items-start gap-3 border-b border-cream-tert px-5 py-3.5 text-left transition-colors hover:bg-cream-tert"
    >
      <AvatarEstablecimiento id={chat.establecimientoId} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="min-w-0 truncate font-display text-[14.5px] font-semibold text-fg-1">{chat.titulo}</div>
          <div className={cn("shrink-0 text-[11.5px]", conNuevos ? "font-semibold text-green-800" : "font-medium text-fg-3")}>
            {momentoCorto(chat.timestamp)}
          </div>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className={cn("flex-1 truncate text-[13px]", conNuevos ? "font-medium text-fg-1" : "text-fg-2", !chat.ultimoMensaje && "italic text-fg-3")}>
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

function Conversacion({ chat, noLeidos, onBack, onClose }: {
  chat: ChatAbierto;
  noLeidos: number;
  onBack: () => void;
  onClose: () => void;
}) {
  // Abrir la conversación (o recibir algo con ella abierta) la da por leída.
  useEffect(() => {
    if (noLeidos > 0) void marcarChatLeido(chat.id);
  }, [chat.id, noLeidos]);

  return (
    <>
      <div className="flex items-center gap-3 border-b border-outline-variant bg-surface py-3.5 pr-4 pl-3">
        <button type="button" onClick={onBack} aria-label="Volver al listado" className="inline-flex cursor-pointer rounded-md p-1.5 text-fg-2 hover:bg-cream-tert">
          <ArrowLeft size={20} />
        </button>
        <AvatarEstablecimiento id={chat.establecimientoId} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[15px] leading-tight font-semibold text-fg-1">{chat.titulo}</div>
          <div className="mt-0.5 truncate text-xs text-fg-3">Consulta al establecimiento</div>
        </div>
        <BotonCerrar onClick={onClose} />
      </div>

      <ConversacionChat
        // Del lado del visitante, el inbox propio es el de la cuenta en sesión.
        chat={{ ...chat, visitanteId: auth.currentUser?.uid ?? "" }}
        emisor="VISITANTE"
        vacio="Escribí tu consulta y el establecimiento te va a responder por acá."
        placeholder="Ingrese su consulta…"
        max={MAX}
        autoFocus
      />
    </>
  );
}

/* ---- Drawer -------------------------------------------------------------- */

/**
 * Botón de chats del header y el drawer que abre. El inbox se escucha siempre
 * —así el contador está al día—; los mensajes, sólo con una conversación abierta.
 */
export default function VisitorChatDrawer() {
  const { chats, isLoading, error } = useMisChats();
  const { abierto, chat, abrir, volver, cerrar } = useChatDrawer();
  const totalNoLeidos = chats.reduce((s, c) => s + c.noLeidos, 0);
  // Del inbox sale lo que el store no sabe: los no leídos, y el título si ya llegó.
  const enInbox = chat ? chats.find((c) => c.id === chat.id) : undefined;

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") cerrar(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [abierto, cerrar]);

  // Al cerrar sesión el drawer desaparece del header, pero el store queda.
  useEffect(() => () => cerrar(), [cerrar]);

  return (
    <>
      <button
        type="button"
        onClick={() => abrir()}
        aria-label="Mis chats"
        title="Mis chats"
        className={cn(
          "relative inline-flex size-[38px] cursor-pointer items-center justify-center rounded-md border border-outline-variant",
          abierto ? "bg-cream-tert" : "bg-surface",
        )}
      >
        <MessageCircle size={18} className="text-fg-2" />
        {totalNoLeidos > 0 && (
          <span className="absolute -top-[5px] -right-[5px] box-content inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[9px] border-2 border-cream-bg bg-green-800 px-[5px] text-[11px] leading-none font-bold text-white">
            {totalNoLeidos}
          </span>
        )}
      </button>

      {/* Portal al body: el header tiene `backdrop-filter`, que vuelve al header
          el contenedor de sus hijos `fixed`, y el drawer quedaba del alto del header.
          `abierto` sólo pasa a true con un click, así que acá ya hay `document`. */}
      {abierto && createPortal(
        <>
          <div onMouseDown={cerrar} className="fixed inset-0 z-[190] bg-[rgba(42,38,32,.32)] backdrop-blur-[2px]" />
          <aside
            role="dialog"
            aria-label="Chats"
            className="pop fixed inset-y-0 right-0 z-[200] flex w-[min(420px,100%)] flex-col border-l border-outline-variant bg-surface shadow-[0px_8px_32px_rgba(45,90,39,.18)]"
          >
            {chat ? (
              <Conversacion
                key={chat.id}
                chat={enInbox ? { ...chat, titulo: enInbox.titulo } : chat}
                noLeidos={enInbox?.noLeidos ?? 0}
                onBack={volver}
                onClose={cerrar}
              />
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-outline-variant bg-surface px-5 py-4">
                  <div>
                    <div className="font-display text-lg leading-[1.1] font-bold text-fg-1">Mis chats</div>
                    <div className="mt-1 text-xs text-fg-3">Ordenados del más reciente al más antiguo</div>
                  </div>
                  <BotonCerrar onClick={cerrar} />
                </div>
                <div className="flex-1 overflow-y-auto">
                  {isLoading ? (
                    <div className="px-6 py-12 text-center text-fg-3"><Loader size={22} className="spin inline" aria-label="Cargando chats" /></div>
                  ) : error ? (
                    <div className="px-6 py-12 text-center text-[13.5px] text-danger">{error}</div>
                  ) : chats.length === 0 ? (
                    <div className="px-6 py-12 text-center text-fg-2">
                      <div className="mb-3 inline-flex size-14 items-center justify-center rounded-full bg-cream-tert">
                        <MessageCircleOff size={26} className="text-brown-700" />
                      </div>
                      <div className="mb-1.5 font-display text-[17px] font-semibold text-fg-1">Todavía no tenés chats</div>
                      <div className="mx-auto max-w-[280px] text-[13.5px] leading-normal">
                        Cuando inicies una conversación con un establecimiento, vas a verla acá.
                      </div>
                    </div>
                  ) : (
                    <>
                      {totalNoLeidos > 0 && (
                        <div className="border-b border-cream-tert bg-cream-tert px-5 py-2.5 text-xs text-fg-3">
                          <strong className="text-green-800">{totalNoLeidos}</strong>{" "}
                          {totalNoLeidos === 1 ? "mensaje nuevo" : "mensajes nuevos"}
                        </div>
                      )}
                      {chats.map((c) => <FilaChat key={c.id} chat={c} onOpen={abrir} />)}
                    </>
                  )}
                </div>
              </>
            )}
          </aside>
        </>,
        document.body,
      )}
    </>
  );
}

