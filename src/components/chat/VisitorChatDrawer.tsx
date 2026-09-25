"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle, ArrowLeft, Grape, Loader, MessageCircle, MessageCircleOff, RotateCcw, Send, X,
} from "lucide-react";
import {
  marcarChatLeido, useEnviarMensaje, useMensajes, useMisChats, type MensajeFallido,
} from "@/hooks/useChats";
import { useChatDrawer, type ChatAbierto } from "@/stores/chatDrawerStore";
import { cn } from "@/lib/utils";
import type { ChatResumen, MensajeChat } from "@/types/chats";

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

/* ---- Fechas -------------------------------------------------------------- */

function dosDigitos(n: number): string {
  return String(n).padStart(2, "0");
}

function hora(ts: number): string {
  const d = new Date(ts);
  return `${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}`;
}

/** Días calendario entre `ts` y hoy, en hora local: 0 es hoy, 1 es ayer. */
function diasAtras(ts: number): number {
  const d = new Date(ts);
  const hoy = new Date();
  const inicio = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  return Math.round((inicio(hoy) - inicio(d)) / 86_400_000);
}

/** Hora si es de hoy, "Ayer", o la fecha corta. */
function momentoCorto(ts: number): string {
  if (!ts) return "";
  const dias = diasAtras(ts);
  if (dias <= 0) return hora(ts);
  if (dias === 1) return "Ayer";
  const d = new Date(ts);
  return `${dosDigitos(d.getDate())}/${dosDigitos(d.getMonth() + 1)}`;
}

function etiquetaDia(ts: number): string {
  const dias = diasAtras(ts);
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Ayer";
  const d = new Date(ts);
  return `${dosDigitos(d.getDate())}/${dosDigitos(d.getMonth() + 1)}/${d.getFullYear()}`;
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

function SeparadorDia({ label }: { label: string }) {
  return (
    <div className="mt-2 mb-1 flex items-center gap-3">
      <div className="h-px flex-1 bg-cream-tert" />
      <div className="rounded-pill bg-cream-tert px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[.08em] text-fg-3">{label}</div>
      <div className="h-px flex-1 bg-cream-tert" />
    </div>
  );
}

type EstadoBurbuja = "enviado" | "enviando" | "error";

function Burbuja({
  texto, mine, momento, estado, code, onReintentar, onDescartar,
}: {
  texto: string;
  mine: boolean;
  momento: string;
  estado: EstadoBurbuja;
  code?: string;
  onReintentar?: () => void;
  onDescartar?: () => void;
}) {
  return (
    <div className={cn("pop flex max-w-[82%] flex-col", mine ? "items-end self-end" : "items-start self-start")}>
      <div
        className={cn(
          "whitespace-pre-wrap break-words border px-3.5 py-2.5 text-[13.5px] leading-[1.45]",
          mine
            ? "rounded-[16px_16px_4px_16px] border-transparent bg-green-800 text-white"
            : "rounded-[16px_16px_16px_4px] border-outline-variant bg-surface text-fg-1",
          estado === "error" && "opacity-70",
        )}
      >
        {texto}
      </div>
      <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-fg-3">
        {estado === "enviando" ? (
          <span className="inline-flex items-center gap-1">
            Enviando <Loader size={11} className="spin" aria-hidden />
          </span>
        ) : estado === "error" ? (
          <span className="flex flex-wrap items-center gap-2">
            <AlertCircle size={14} className="text-danger" aria-hidden />
            <span className="font-sans text-[11.5px] text-danger">No se pudo enviar el mensaje</span>
            {code && <span title="Código del error">{code}</span>}
            <button type="button" onClick={onReintentar} aria-label="Reintentar envío" className="inline-flex cursor-pointer text-fg-2 hover:text-fg-1">
              <RotateCcw size={14} />
            </button>
            <button type="button" onClick={onDescartar} aria-label="Descartar mensaje" className="inline-flex cursor-pointer text-fg-3 hover:text-fg-1">
              <X size={14} />
            </button>
          </span>
        ) : (
          <span>{momento}</span>
        )}
      </div>
    </div>
  );
}

/* ---- Conversación -------------------------------------------------------- */

/** Lo que se dibuja en el hilo: lo confirmado por la base más lo que falló acá. */
type Item =
  | { tipo: "mensaje"; m: MensajeChat }
  | { tipo: "fallido"; m: MensajeFallido };

function Conversacion({ chat, noLeidos, onBack, onClose }: {
  chat: ChatAbierto;
  noLeidos: number;
  onBack: () => void;
  onClose: () => void;
}) {
  const { mensajes, isLoading, error } = useMensajes(chat.id);
  const { enviar, enviando, fallidos, descartar } = useEnviarMensaje();
  const [borrador, setBorrador] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  // Abrir la conversación (o recibir algo con ella abierta) la da por leída.
  useEffect(() => {
    if (noLeidos > 0) void marcarChatLeido(chat.id);
  }, [chat.id, noLeidos]);

  const items: Item[] = [
    ...mensajes.map((m) => ({ tipo: "mensaje" as const, m })),
    ...fallidos.filter((f) => f.chatId === chat.id).map((m) => ({ tipo: "fallido" as const, m })),
  ].sort((a, b) => a.m.timestamp - b.m.timestamp);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [items.length]);

  const puedeEnviar = borrador.trim().length > 0 && borrador.length <= MAX;

  function submit() {
    if (!puedeEnviar) return;
    void enviar(chat, borrador.trim());
    setBorrador("");
  }

  function reintentar(f: MensajeFallido) {
    descartar(f.id);
    void enviar(chat, f.texto);
  }

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

      <div ref={scroller} className="flex flex-1 flex-col gap-2 overflow-y-auto bg-cream-bg px-4 pt-4 pb-2">
        {isLoading ? (
          <div className="m-auto text-fg-3"><Loader size={22} className="spin" aria-label="Cargando mensajes" /></div>
        ) : error ? (
          <div className="m-auto max-w-[280px] text-center text-[13.5px] text-danger">{error}</div>
        ) : items.length === 0 ? (
          <div className="m-auto max-w-[280px] text-center text-[13.5px] leading-normal text-fg-2">
            Escribí tu consulta y el establecimiento te va a responder por acá.
          </div>
        ) : (
          items.map((it, i) => {
            const dia = etiquetaDia(it.m.timestamp);
            const nuevoDia = i === 0 || etiquetaDia(items[i - 1].m.timestamp) !== dia;
            return (
              <div key={it.m.id} className="contents">
                {nuevoDia && <SeparadorDia label={dia} />}
                {it.tipo === "mensaje" ? (
                  <Burbuja
                    texto={it.m.texto}
                    mine={it.m.tipoEmisor === "VISITANTE"}
                    momento={hora(it.m.timestamp)}
                    estado={enviando.has(it.m.id) ? "enviando" : "enviado"}
                  />
                ) : (
                  <Burbuja
                    texto={it.m.texto}
                    mine
                    momento={hora(it.m.timestamp)}
                    estado="error"
                    code={it.m.code}
                    onReintentar={() => reintentar(it.m as MensajeFallido)}
                    onDescartar={() => descartar(it.m.id)}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-outline-variant bg-surface px-3.5 pt-3 pb-3.5">
        <div className="flex items-end gap-2.5 rounded-[14px] border border-sand bg-cream-bg py-2 pr-2 pl-3.5 focus-within:border-green-700">
          <textarea
            value={borrador}
            onChange={(e) => setBorrador(e.target.value.slice(0, MAX))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ingrese su consulta…"
            rows={1}
            maxLength={MAX}
            aria-label="Mensaje"
            autoFocus
            className="max-h-[110px] min-h-6 flex-1 resize-none border-none bg-transparent py-1.5 font-sans text-[13.5px] leading-[1.45] text-fg-1 outline-none"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!puedeEnviar}
            aria-label="Enviar mensaje"
            className="flex size-[38px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-green-800 text-white shadow-[var(--btn-tactile-primary)] transition-colors disabled:cursor-not-allowed disabled:bg-cream-tert disabled:text-fg-3 disabled:shadow-none"
          >
            <Send size={17} />
          </button>
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[11px] text-fg-3">
          <span>Enter para enviar · Shift+Enter salto de línea</span>
          <span className={cn(MAX - borrador.length < 30 && "font-semibold text-warning-fg")}>{borrador.length} / {MAX}</span>
        </div>
      </div>
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

