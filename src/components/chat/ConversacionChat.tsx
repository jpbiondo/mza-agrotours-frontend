"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, Info, Loader, Lock, RotateCcw, Send, X } from "lucide-react";
import { auth } from "../../../firebase.config";
import { SkeletonMensajes } from "@/components/chat/ChatSkeletons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useAutoresMensajes, useChatDeBaja, useEnviarMensaje, useMensajes,
  type AutorMensaje, type ChatDestino, type MensajeFallido,
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

/** Fecha y hora completas: `dd/mm/aaaa · hh:mm`. */
function fechaYHora(ts: number): string {
  const d = new Date(ts);
  return `${dosDigitos(d.getDate())}/${dosDigitos(d.getMonth() + 1)}/${d.getFullYear()} · ${hora(ts)}`;
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

/**
 * Ícono de info de un mensaje propio del establecimiento: al pasar por encima
 * (o al tocarlo) muestra quién lo mandó y cuándo. El nombre se pide recién al
 * abrir, con `onAbrir`.
 */
function InfoMensaje({ autor, propio, momento, onAbrir }: {
  autor: AutorMensaje | undefined;
  /** Si lo mandó la cuenta en sesión. */
  propio: boolean;
  momento: string;
  onAbrir: () => void;
}) {
  return (
    <Popover onOpenChange={(open) => { if (open) onAbrir(); }}>
      <PopoverTrigger
        openOnHover
        delay={150}
        aria-label="Información del mensaje"
        className="inline-flex cursor-pointer rounded-full text-fg-3 outline-none hover:text-green-800 focus-visible:ring-2 focus-visible:ring-green-700 data-popup-open:text-green-800"
      >
        <Info size={14} />
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={8}
        className="w-auto gap-0 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-left whitespace-nowrap text-fg-1 shadow-[0px_8px_24px_rgba(45,90,39,0.12)] ring-0"
      >
        <div className="text-[10.5px] font-semibold uppercase tracking-[.08em] text-fg-3">Enviado por</div>
        <div className="mt-0.5 text-[13px] font-semibold text-fg-1">
          {autor?.estado === "listo" ? (
            `${autor.nombre}${propio ? " (vos)" : ""}`
          ) : autor?.estado === "error" ? (
            <span className="font-normal text-danger">No pudimos obtener el autor</span>
          ) : (
            <Skeleton className="my-[3px] h-3.5 w-28" />
          )}
        </div>
        <div className="mt-0.5 font-mono text-xs text-fg-2">{momento}</div>
      </PopoverContent>
    </Popover>
  );
}

type EstadoBurbuja = "enviado" | "enviando" | "error";

function Burbuja({
  texto, mine, momento, estado, code, info, onReintentar, onDescartar,
}: {
  texto: string;
  mine: boolean;
  momento: string;
  estado: EstadoBurbuja;
  code?: string;
  /** Junto a la hora, con el mensaje ya enviado. */
  info?: ReactNode;
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
          <>
            <span>{momento}</span>
            {info}
          </>
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
  /** Texto con el que arranca el composer, con el cursor al final. */
  borradorInicial?: string;
  /**
   * Con el chat todavía sin crear: se llama antes del primer envío y el mensaje
   * sale sólo si devuelve true. Mientras tanto no se escucha nada del chat.
   */
  iniciar?: () => Promise<boolean>;
}

export default function ConversacionChat({
  chat, emisor, vacio, placeholder, max, autoFocus, borradorInicial, iniciar,
}: ConversacionChatProps) {
  // Un chat sin crear no tiene mensajes ni baja, y las reglas rechazarían leerlos.
  const existe = !iniciar;
  const { mensajes, isLoading, error } = useMensajes(existe ? chat.id : null);
  const { enviar, enviando, fallidos, descartar } = useEnviarMensaje(emisor);
  // Dado de baja, el chat queda de sólo lectura: se ve el historial, no se escribe.
  const deBaja = useChatDeBaja(existe ? chat.id : null);
  // Sólo el establecimiento ve quién de su equipo mandó cada mensaje.
  const { autores, pedirAutor } = useAutoresMensajes(chat.establecimientoId);
  const uid = auth.currentUser?.uid;
  const [borrador, setBorrador] = useState(borradorInicial ?? "");
  const [iniciando, setIniciando] = useState(false);
  const [falloInicio, setFalloInicio] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);

  // Con un borrador precargado, el cursor va al final para seguir escribiendo.
  useEffect(() => {
    const el = textarea.current;
    if (!autoFocus || !el || !borradorInicial) return;
    el.setSelectionRange(el.value.length, el.value.length);
  }, [autoFocus, borradorInicial]);

  // Un textarea no crece solo: se lo lleva al alto del contenido hasta el
  // `max-h` del CSS (5 líneas de 20px + padding). La barra de scroll se muestra
  // recién al pasar el tope: antes le comía ancho al texto, que se reacomodaba
  // y dejaba una línea vacía. Se mide antes de pintar para que no se vea el salto.
  useLayoutEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = "auto";
    const alto = el.scrollHeight;
    el.style.height = `${alto}px`;
    el.style.overflowY = alto > el.clientHeight ? "auto" : "hidden";
  }, [borrador]);

  const items: Item[] = [
    ...mensajes.map((m) => ({ tipo: "mensaje" as const, m })),
    ...fallidos.filter((f) => f.chatId === chat.id).map((m) => ({ tipo: "fallido" as const, m })),
  ].sort((a, b) => a.m.timestamp - b.m.timestamp);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [items.length]);

  const puedeEnviar = !deBaja && !iniciando && borrador.trim().length > 0 && borrador.length <= max;

  async function submit() {
    if (!puedeEnviar) return;
    const texto = borrador.trim();
    if (iniciar) {
      // Si el alta falla, el borrador queda para reintentar. Si anda pero el
      // mensaje no, el chat ya existe y el mensaje queda como fallido.
      setIniciando(true);
      setFalloInicio(false);
      const ok = await iniciar();
      setIniciando(false);
      if (!ok) {
        setFalloInicio(true);
        return;
      }
    }
    setBorrador("");
    void enviar(chat, texto);
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
                    info={emisor === "ESTABLECIMIENTO" && it.m.tipoEmisor === "ESTABLECIMIENTO" && (
                      <InfoMensaje
                        autor={autores[it.m.remitenteId]}
                        propio={it.m.remitenteId === uid}
                        momento={fechaYHora(it.m.timestamp)}
                        onAbrir={() => void pedirAutor(it.m.remitenteId)}
                      />
                    )}
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
        {falloInicio && (
          <p role="alert" className="mb-2.5 flex items-center gap-2 text-[12.5px] leading-snug text-danger">
            <AlertCircle size={14} className="shrink-0" aria-hidden />
            No pudimos iniciar el chat. Probá de nuevo en un rato.
          </p>
        )}
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
                void submit();
              }
            }}
            placeholder={deBaja ? "Chat dado de baja" : placeholder}
            ref={textarea}
            rows={1}
            maxLength={max}
            aria-label="Mensaje"
            autoFocus={autoFocus}
            disabled={deBaja}
            className="box-border max-h-[112px] min-h-8 flex-1 resize-none overflow-y-hidden border-none bg-transparent py-1.5 font-sans text-[13.5px] leading-5 text-fg-1 outline-none disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!puedeEnviar}
            aria-label="Enviar mensaje"
            className="flex size-[38px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-green-800 text-white shadow-[var(--btn-tactile-primary)] transition-colors disabled:cursor-not-allowed disabled:bg-cream-tert disabled:text-fg-3 disabled:shadow-none"
          >
            {iniciando ? <Loader size={17} className="spin" aria-hidden /> : <Send size={17} />}
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
