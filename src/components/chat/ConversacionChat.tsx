"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader, Lock, RotateCcw, Send, X } from "lucide-react";
import { SkeletonMensajes } from "@/components/chat/ChatSkeletons";
import {
  useChatDeBaja, useEnviarMensaje, useMensajes, type ChatDestino, type MensajeFallido,
} from "@/hooks/useChats";
import { cn } from "@/lib/utils";
import type { MensajeChat, TipoEmisor } from "@/types/chats";

/*
 * Hilo de mensajes + composer, compartido por el drawer del visitante y la
 * bandeja del productor. Cada pantalla pone su encabezado alrededor y decide
 * cuándo marcar el chat como leído; esto sólo lee, dibuja y envía.
 */

/* ---- Fechas -------------------------------------------------------------- */

function dosDigitos(n: number): string {
  return String(n).padStart(2, "0");
}

export function hora(ts: number): string {
  const d = new Date(ts);
  return `${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}`;
}

/** Días calendario entre `ts` y hoy, en hora local: 0 es hoy, 1 es ayer. */
function diasAtras(ts: number): number {
  const inicio = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  return Math.round((inicio(new Date()) - inicio(new Date(ts))) / 86_400_000);
}

/** Para los listados: hora si es de hoy, "Ayer", o la fecha corta. */
export function momentoCorto(ts: number): string {
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
            {onReintentar && (
              <button type="button" onClick={onReintentar} aria-label="Reintentar envío" className="inline-flex cursor-pointer text-fg-2 hover:text-fg-1">
                <RotateCcw size={14} />
              </button>
            )}
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

interface ConversacionChatProps {
  chat: ChatDestino;
  /** Desde qué lado se escribe: define qué burbujas son propias y a quién se le suma el no leído. */
  emisor: TipoEmisor;
  /** Texto del hilo vacío. */
  vacio: string;
  placeholder: string;
  /** Tope de caracteres por mensaje. */
  max: number;
  /** Foco en el composer al montar: en el drawer sí, en una bandeja con lista no. */
  autoFocus?: boolean;
}

export default function ConversacionChat({ chat, emisor, vacio, placeholder, max, autoFocus }: ConversacionChatProps) {
  const { mensajes, isLoading, error } = useMensajes(chat.id);
  const { enviar, enviando, fallidos, descartar } = useEnviarMensaje(emisor);
  // Dado de baja, el chat queda de sólo lectura: se ve el historial, no se escribe.
  const deBaja = useChatDeBaja(chat.id);
  const [borrador, setBorrador] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  const items: Item[] = [
    ...mensajes.map((m) => ({ tipo: "mensaje" as const, m })),
    ...fallidos.filter((f) => f.chatId === chat.id).map((m) => ({ tipo: "fallido" as const, m })),
  ].sort((a, b) => a.m.timestamp - b.m.timestamp);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [items.length]);

  const puedeEnviar = !deBaja && borrador.trim().length > 0 && borrador.length <= max;

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
      <div ref={scroller} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-cream-bg px-4 pt-4 pb-2">
        {isLoading ? (
          <SkeletonMensajes />
        ) : error ? (
          <div className="m-auto max-w-[280px] text-center text-[13.5px] text-danger">{error}</div>
        ) : items.length === 0 ? (
          <div className="m-auto max-w-[280px] text-center text-[13.5px] leading-normal text-fg-2">{vacio}</div>
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
                    mine={it.m.tipoEmisor === emisor}
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
                    onReintentar={deBaja ? undefined : () => reintentar(it.m as MensajeFallido)}
                    onDescartar={() => descartar(it.m.id)}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="shrink-0 border-t border-outline-variant bg-surface px-3.5 pt-3 pb-3.5">
        {deBaja && (
          <p role="status" className="mb-2.5 flex items-center gap-2 text-[12.5px] leading-snug text-fg-2">
            <Lock size={14} className="shrink-0 text-fg-3" aria-hidden />
            Este chat fue dado de baja. Podés leer la conversación, pero ya no se pueden enviar mensajes.
          </p>
        )}
        <div className={cn(
          "flex items-center gap-2.5 rounded-[14px] border border-sand bg-cream-bg py-2 pr-2 pl-3.5 focus-within:border-green-700",
          deBaja && "opacity-60",
        )}>
          <textarea
            value={borrador}
            onChange={(e) => setBorrador(e.target.value.slice(0, max))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={deBaja ? "Chat dado de baja" : placeholder}
            rows={1}
            maxLength={max}
            aria-label="Mensaje"
            autoFocus={autoFocus}
            disabled={deBaja}
            className="max-h-[110px] min-h-6 flex-1 resize-none border-none bg-transparent py-1.5 font-sans text-[13.5px] leading-[1.45] text-fg-1 outline-none disabled:cursor-not-allowed"
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
        {!deBaja && (
          <div className="mt-1.5 flex justify-between font-mono text-[11px] text-fg-3">
            <span>Enter para enviar · Shift+Enter salto de línea</span>
            <span className={cn(max - borrador.length < 30 && "font-semibold text-warning-fg")}>{borrador.length} / {max}</span>
          </div>
        )}
      </div>
    </>
  );
}
