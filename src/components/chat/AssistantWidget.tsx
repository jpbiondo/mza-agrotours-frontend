"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sparkles, X, ChevronRight, FileText, Eye, Download, Send, MessageCircleQuestion, ArrowLeft,
  BookOpen, CalendarCheck, UserRound, Headset, Compass, Tractor,
} from "lucide-react";
import { genId } from "@/lib/id";
import { MANUALES, MENU_PRINCIPAL } from "@/data/chatbot";
import type { Manual, MenuOpcion } from "@/data/chatbot";

const ICON: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  "book-open": BookOpen, "calendar-check": CalendarCheck, "user-round": UserRound, headset: Headset,
  compass: Compass, tractor: Tractor, "arrow-left": ArrowLeft,
};

type Item =
  | { id: string; type: "typing" }
  | { id: string; type: "msg"; from: "bot" | "user"; text: string }
  | { id: string; type: "file"; manual: Manual }
  | { id: string; type: "options"; group: string; options: MenuOpcion[]; done?: boolean };

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type NewItem = DistributiveOmit<Item, "id">;

function BotAvatar({ size = 30 }: { size?: number }) {
  return <span style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: "var(--green-050)", border: "1px solid var(--green-300)", display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles size={size * 0.5} color="var(--green-800)" /></span>;
}

function Typing() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
      <BotAvatar />
      <div style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "16px 16px 16px 4px", padding: "13px 16px", display: "flex", gap: 4, alignItems: "center" }}>
        <span className="cb-dot" /><span className="cb-dot" /><span className="cb-dot" />
      </div>
    </div>
  );
}

function MsgBubble({ from, text }: { from: "bot" | "user"; text: string }) {
  const mine = from === "user";
  return (
    <div className="bubble-in" style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", gap: 10, alignItems: "flex-end" }}>
      {!mine && <BotAvatar />}
      <div style={{ maxWidth: "78%", background: mine ? "var(--green-800)" : "var(--surface)", color: mine ? "#fff" : "var(--fg-1)", border: mine ? "none" : "1px solid var(--outline-variant)", borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "12px 15px", fontSize: 15, lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}

function OptionButtons({ options, disabled, onPick }: { options: MenuOpcion[]; disabled?: boolean; onPick: (o: MenuOpcion) => void }) {
  return (
    <div className="bubble-in" style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 40 }}>
      {options.map((o) => {
        const I = o.icon ? ICON[o.icon] : null;
        return (
          <button key={o.id} type="button" disabled={disabled} onClick={() => onPick(o)} style={{ all: "unset", boxSizing: "border-box", width: "100%", cursor: disabled ? "default" : "pointer", display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", border: "1.5px solid " + (disabled ? "var(--outline-variant)" : "var(--green-300)"), borderRadius: "var(--radius)", padding: "12px 14px", opacity: disabled ? 0.55 : 1 }}
            onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.background = "var(--green-050)"; e.currentTarget.style.borderColor = "var(--green-800)"; } }}
            onMouseLeave={(e) => { if (!disabled) { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.borderColor = "var(--green-300)"; } }}>
            {I && <span style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: "var(--green-050)", display: "flex", alignItems: "center", justifyContent: "center" }}><I size={18} color="var(--green-800)" /></span>}
            <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontSize: 15, fontWeight: 600, color: "var(--fg-1)" }}>{o.label}</span>{o.desc && <span style={{ display: "block", fontSize: 12.5, color: "var(--fg-3)", marginTop: 1 }}>{o.desc}</span>}</span>
            <ChevronRight size={18} color={disabled ? "var(--fg-3)" : "var(--green-800)"} />
          </button>
        );
      })}
    </div>
  );
}

function FileCard({ manual }: { manual: Manual }) {
  return (
    <div className="bubble-in" style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
      <BotAvatar />
      <div style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "16px 16px 16px 4px", padding: 14, maxWidth: "82%", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 46, height: 46, borderRadius: 10, flexShrink: 0, background: "var(--danger-fill)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--danger)" }}><FileText size={24} color="var(--danger)" /></span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 13.5, fontWeight: 600, color: "var(--fg-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{manual.nombreArchivo}</div>
            <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>PDF · {manual.paginas} páginas · {manual.peso}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href={encodeURI(manual.file)} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textDecoration: "none", textAlign: "center", border: "1px solid var(--sand)", color: "var(--green-800)", background: "var(--surface)", borderRadius: "var(--radius)", padding: "10px 12px", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}><Eye size={16} /> Ver</a>
          <a href={encodeURI(manual.file)} download={manual.nombreArchivo} style={{ flex: 1, textDecoration: "none", textAlign: "center", background: "var(--green-800)", color: "#fff", boxShadow: "inset 0 -2px 0 rgba(0,0,0,.18)", borderRadius: "var(--radius)", padding: "10px 12px", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}><Download size={16} /> Descargar</a>
        </div>
      </div>
    </div>
  );
}

const manualOptions = (): MenuOpcion[] => MANUALES.map((m) => ({ id: m.id, label: m.titulo, desc: m.desc, icon: m.icon }));

function AssistantWindow({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<Item[]>([{ id: "seed", type: "typing" }]);
  const [busy, setBusy] = useState(true);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const push = (item: NewItem) => setItems((prev) => [...prev, { id: genId("cb"), ...item } as Item]);
  const lockOptions = () => setItems((prev) => prev.map((it) => (it.type === "options" ? { ...it, done: true } : it)));

  function botReply(fn: () => void, delay = 650) {
    setBusy(true);
    push({ type: "typing" });
    const t = setTimeout(() => {
      setItems((prev) => prev.filter((it) => it.type !== "typing"));
      fn();
      setBusy(false);
    }, delay);
    timers.current.push(t);
  }

  // Saludo inicial (el timeout no dispara setState sincrónico en el efecto).
  useEffect(() => {
    const t = setTimeout(() => {
      setItems([
        { id: genId("cb"), type: "msg", from: "bot", text: "¡Hola! Soy el asistente de Mendoza AgroTours. ¿En qué te puedo ayudar?" },
        { id: genId("cb"), type: "options", group: "menu", options: MENU_PRINCIPAL },
      ]);
      setBusy(false);
    }, 500);
    const list = timers.current;
    list.push(t);
    return () => { list.forEach(clearTimeout); };
  }, []);

  useEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, [items, busy]);

  function showMenu() {
    botReply(() => { push({ type: "msg", from: "bot", text: "¿Con qué más te puedo ayudar?" }); push({ type: "options", group: "menu", options: MENU_PRINCIPAL }); });
  }

  function handlePick(group: string, opt: MenuOpcion) {
    if (busy) return;
    lockOptions();
    push({ type: "msg", from: "user", text: opt.label });

    if (group === "menu") {
      if (opt.id === "manuales") {
        botReply(() => { push({ type: "msg", from: "bot", text: "Estos son los manuales disponibles en la plataforma. ¿Cuál querés consultar?" }); push({ type: "options", group: "manuales", options: manualOptions() }); });
      } else if (opt.id === "soporte") {
        botReply(() => { push({ type: "msg", from: "bot", text: "Escribinos a soporte@mendozaagrotours.com y te respondemos dentro de las 24 horas hábiles." }); push({ type: "options", group: "back", options: [{ id: "menu", label: "Volver al menú", icon: "arrow-left" }] }); });
      } else {
        botReply(() => { push({ type: "msg", from: "bot", text: "Para esa consulta te recomiendo revisar el manual de usuario, donde está explicado paso a paso." }); push({ type: "options", group: "nav", options: [{ id: "manuales", label: "Ver manuales de usuario", icon: "book-open" }, { id: "menu", label: "Volver al menú", icon: "arrow-left" }] }); });
      }
    } else if (group === "manuales") {
      const manual = MANUALES.find((m) => m.id === opt.id);
      if (!manual) return;
      botReply(() => { push({ type: "msg", from: "bot", text: `Acá tenés el ${manual.titulo.toLowerCase()}. Podés verlo en el navegador o descargarlo.` }); push({ type: "file", manual }); push({ type: "options", group: "nav", options: [{ id: "manuales", label: "Ver otro manual", icon: "book-open" }, { id: "menu", label: "Volver al menú", icon: "arrow-left" }] }); }, 850);
    } else {
      if (opt.id === "manuales") botReply(() => { push({ type: "msg", from: "bot", text: "¿Cuál manual querés consultar?" }); push({ type: "options", group: "manuales", options: manualOptions() }); });
      else showMenu();
    }
  }

  function handleSend() {
    const t = draft.trim();
    if (!t || busy) return;
    setDraft("");
    lockOptions();
    push({ type: "msg", from: "user", text: t });
    botReply(() => { push({ type: "msg", from: "bot", text: "Por ahora puedo ayudarte con estas opciones:" }); push({ type: "options", group: "menu", options: MENU_PRINCIPAL }); });
  }

  return (
    <section className="pop" role="dialog" aria-label="Asistente de ayuda" style={{ width: "min(380px, calc(100vw - 32px))", height: "min(560px, calc(100vh - 130px))", background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-pop)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <header style={{ background: "var(--green-800)", color: "#fff", padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <span style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Sparkles size={22} color="#fff" /></span>
        <div style={{ flex: 1, lineHeight: 1.25 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16.5 }}>Asistente AgroTours</div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.82)", display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#9FE08A", display: "inline-block" }} />En línea · responde al instante</div>
        </div>
        <button onClick={onClose} aria-label="Cerrar asistente" style={{ width: 36, height: 36, borderRadius: "var(--radius)", border: "none", cursor: "pointer", background: "rgba(255,255,255,.14)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={20} color="#fff" /></button>
      </header>

      <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "18px 16px", display: "flex", flexDirection: "column", gap: 12, background: "var(--cream-bg)" }}>
        {items.map((it) => {
          if (it.type === "typing") return <Typing key={it.id} />;
          if (it.type === "msg") return <MsgBubble key={it.id} from={it.from} text={it.text} />;
          if (it.type === "file") return <FileCard key={it.id} manual={it.manual} />;
          return <OptionButtons key={it.id} options={it.options} disabled={it.done} onPick={(o) => handlePick(it.group, o)} />;
        })}
      </div>

      <footer style={{ flexShrink: 0, borderTop: "1px solid var(--outline-variant)", padding: 12, background: "var(--surface)", display: "flex", gap: 8 }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }} placeholder="Escribí tu consulta…" style={{ flex: 1, border: "1px solid var(--sand)", borderRadius: "var(--radius)", padding: "11px 13px", fontFamily: "var(--font-sans)", fontSize: 14.5, outline: "none", background: "var(--surface)", color: "var(--fg-1)" }} />
        <button onClick={handleSend} aria-label="Enviar" disabled={!draft.trim() || busy} style={{ width: 44, borderRadius: "var(--radius)", border: "none", cursor: draft.trim() ? "pointer" : "default", background: draft.trim() ? "var(--green-800)" : "var(--cream-tert)", color: draft.trim() ? "#fff" : "var(--fg-3)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: draft.trim() ? "inset 0 -2px 0 rgba(0,0,0,.18)" : "none" }}><Send size={18} /></button>
      </footer>
    </section>
  );
}

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState(true);

  return (
    <div style={{ position: "fixed", right: 24, bottom: 24, zIndex: 120, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 14 }}>
      {open && <AssistantWindow onClose={() => setOpen(false)} />}

      {!open && hint && (
        <div className="pop" style={{ position: "relative", maxWidth: 230, background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: 14, padding: "12px 30px 12px 14px", boxShadow: "var(--shadow-pop)", fontSize: 13.5, color: "var(--fg-1)", lineHeight: 1.45 }}>
          <button onClick={() => setHint(false)} aria-label="Cerrar" style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, border: "none", background: "transparent", cursor: "pointer", color: "var(--fg-3)", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
          ¿Necesitás ayuda? Consultá el <strong style={{ color: "var(--green-800)" }}>manual de usuario</strong> acá.
        </div>
      )}

      <button onClick={() => { setOpen((o) => !o); setHint(false); }} aria-label={open ? "Cerrar asistente" : "Abrir asistente de ayuda"} style={{ width: 62, height: 62, borderRadius: "50%", border: "none", cursor: "pointer", background: "var(--green-800)", color: "#fff", boxShadow: open ? "var(--shadow-pop)" : "0 6px 18px rgba(45,90,39,.32), inset 0 -3px 0 rgba(0,0,0,.22)", display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "flex-end" }}>
        {open ? <X size={28} color="#fff" /> : <MessageCircleQuestion size={28} color="#fff" />}
      </button>

      <style>{`
        .cb-dot{width:7px;height:7px;border-radius:50%;background:var(--fg-3);display:inline-block;animation:cbBlink 1.2s infinite ease-in-out}
        .cb-dot:nth-child(2){animation-delay:.2s}
        .cb-dot:nth-child(3){animation-delay:.4s}
        @keyframes cbBlink{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-2px)}}
      `}</style>
    </div>
  );
}
