"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, MessageCircleOff, ArrowLeft, X, Send, Grape, Loader } from "lucide-react";
import { chatNow } from "@/data/chats";
import { genId } from "@/lib/id";
import { useVisitorChats, useEnviarMensaje } from "@/hooks/useChats";
import type { ChatMensaje, VisitorChat } from "@/types/chats";

const GRADS = [
  "linear-gradient(135deg,#7FA876,#2D5A27)", "linear-gradient(135deg,#C9A227,#805533)",
  "linear-gradient(135deg,#A6794F,#5C3B22)", "linear-gradient(135deg,#6F9E64,#1E5418)",
  "linear-gradient(135deg,#D99A4E,#A6794F)", "linear-gradient(135deg,#B86B4F,#5C3B22)",
];

function ActivityAvatar({ seed, size = 44, radius = 10 }: { seed: number; size?: number; radius?: number }) {
  return <div style={{ width: size, height: size, borderRadius: radius, background: GRADS[seed % GRADS.length], flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.85)" }}><Grape size={Math.round(size * 0.5)} /></div>;
}

function DaySeparator({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0 4px" }}>
      <div style={{ flex: 1, height: 1, background: "var(--cream-tert)" }} />
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--fg-3)", padding: "4px 10px", background: "var(--cream-tert)", borderRadius: 999 }}>{label}</div>
      <div style={{ flex: 1, height: 1, background: "var(--cream-tert)" }} />
    </div>
  );
}

function Bubble({ msg, mine, sending }: { msg: ChatMensaje; mine: boolean; sending?: boolean }) {
  return (
    <div className="bubble-in" style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", maxWidth: "82%", alignSelf: mine ? "flex-end" : "flex-start" }}>
      <div style={{ background: mine ? "var(--green-800)" : "var(--surface)", color: mine ? "#fff" : "var(--fg-1)", border: `1px solid ${mine ? "transparent" : "var(--outline-variant)"}`, padding: "10px 14px", borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px", fontSize: 13.5, lineHeight: 1.45, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.text}</div>
      <div style={{ marginTop: 4, fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>{sending ? "Enviando…" : msg.time}</div>
    </div>
  );
}

function ChatRow({ chat, onOpen }: { chat: VisitorChat; onOpen: (c: VisitorChat) => void }) {
  const hasUnread = chat.unread > 0;
  const sendLabel = chat.lastFrom === "visitor" ? "Vos" : null;
  return (
    <button onClick={() => onOpen(chat)} style={{ all: "unset", cursor: "pointer", boxSizing: "border-box", width: "100%", display: "flex", gap: 12, padding: "14px 20px", borderBottom: "1px solid var(--cream-tert)", alignItems: "flex-start" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--cream-tert)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
      <ActivityAvatar seed={chat.activity.seed} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 14.5, fontWeight: 600, color: "var(--fg-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{chat.activity.title}</div>
          <div style={{ fontSize: 11.5, color: hasUnread ? "var(--green-800)" : "var(--fg-3)", fontWeight: hasUnread ? 600 : 500, flexShrink: 0 }}>{chat.lastTime}</div>
        </div>
        <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{chat.activity.finca}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
          <div style={{ flex: 1, fontSize: 13, color: hasUnread ? "var(--fg-1)" : "var(--fg-2)", fontWeight: hasUnread ? 500 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sendLabel && <span style={{ color: "var(--fg-3)", fontWeight: 500 }}>{sendLabel}: </span>}{chat.lastText}</div>
          {hasUnread && <span style={{ minWidth: 20, height: 20, padding: "0 6px", borderRadius: 999, background: "var(--green-800)", color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{chat.unread}</span>}
        </div>
      </div>
    </button>
  );
}

function Conversation({ chat, pending, busy, onBack, onSend }: { chat: VisitorChat; pending: ChatMensaje | null; busy: boolean; onBack: () => void; onSend: (t: string) => void }) {
  const [draft, setDraft] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const MAX = 300;
  const charsLeft = MAX - draft.length;
  const canSend = draft.trim().length > 0 && draft.length <= MAX && !busy;

  useEffect(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }, [chat.id, chat.days, pending]);

  const submit = () => { if (!canSend) return; onSend(draft.trim()); setDraft(""); };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px 14px 12px", borderBottom: "1px solid var(--outline-variant)", background: "var(--surface)" }}>
        <button onClick={onBack} aria-label="Volver al listado" style={{ all: "unset", cursor: "pointer", padding: 6, borderRadius: 8, display: "inline-flex", color: "var(--fg-2)" }}><ArrowLeft size={20} /></button>
        <ActivityAvatar seed={chat.activity.seed} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, color: "var(--fg-1)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{chat.activity.title}</div>
          <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><strong style={{ color: "var(--fg-2)", fontWeight: 600 }}>{chat.activity.finca}</strong> · {chat.activity.loc}</div>
        </div>
      </div>

      <div ref={scroller} style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", background: "var(--cream-bg)", display: "flex", flexDirection: "column", gap: 8 }}>
        {chat.days.map((day) => (
          <div key={day.date} style={{ display: "contents" }}>
            <DaySeparator label={day.label} />
            {day.messages.map((m) => <Bubble key={m.id} msg={m} mine={m.from === "visitor"} />)}
          </div>
        ))}
        {pending && <Bubble msg={pending} mine sending />}
      </div>

      <div style={{ borderTop: "1px solid var(--outline-variant)", background: "var(--surface)", padding: "12px 14px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, background: "var(--cream-bg)", border: "1px solid var(--sand)", borderRadius: 14, padding: "8px 8px 8px 14px" }}>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value.slice(0, MAX))} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }} placeholder="Ingrese su consulta…" rows={1} aria-label="Mensaje" style={{ flex: 1, resize: "none", border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--fg-1)", lineHeight: 1.45, padding: "6px 0", maxHeight: 110, minHeight: 24 }} />
          <button onClick={submit} disabled={!canSend} aria-label="Enviar mensaje" style={{ width: 38, height: 38, borderRadius: 10, background: canSend ? "var(--green-800)" : "var(--cream-tert)", color: canSend ? "#fff" : "var(--fg-3)", border: "none", cursor: canSend ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: canSend ? "inset 0 -2px 0 var(--green-900, #0d2a0b)" : "none", flexShrink: 0 }}>{busy ? <Loader size={17} className="spin" /> : <Send size={17} />}</button>
        </div>
        <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>
          <span>Enter para enviar · Shift+Enter salto de línea</span>
          <span style={{ color: charsLeft < 30 ? "var(--warning-fg)" : "var(--fg-3)", fontWeight: charsLeft < 30 ? 600 : 400 }}>{draft.length} / {MAX}</span>
        </div>
      </div>
    </>
  );
}

export default function VisitorChatDrawer() {
  const { data } = useVisitorChats();
  // Remonta al llegar los datos (siembra useState sin efecto de escritura).
  return <DrawerIsland key={data ? "ready" : "loading"} initial={data ?? []} loaded={!!data} />;
}

function DrawerIsland({ initial, loaded }: { initial: VisitorChat[]; loaded: boolean }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "conversation">("list");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, setPending] = useState<ChatMensaje | null>(null);
  const { enviar, isLoading } = useEnviarMensaje();
  const [chats, setChats] = useState<VisitorChat[]>(initial);

  const seeded = loaded ? chats : null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const totalUnread = useMemo(() => (seeded ? seeded.reduce((s, c) => s + c.unread, 0) : 0), [seeded]);
  const active = seeded?.find((c) => c.id === activeId) || null;

  function openChat(c: VisitorChat) {
    setActiveId(c.id);
    setView("conversation");
    setPending(null);
    setChats((arr) => arr.map((x) => (x.id === c.id ? { ...x, unread: 0 } : x)));
  }

  async function sendMessage(text: string) {
    if (!activeId) return;
    const time = chatNow();
    setPending({ id: "pending", from: "visitor", text, time });
    await enviar(activeId, text);
    const n = new Date();
    const todayStr = `${String(n.getDate()).padStart(2, "0")}/${String(n.getMonth() + 1).padStart(2, "0")}/${n.getFullYear()}`;
    setChats((arr) => arr.map((c) => {
      if (c.id !== activeId) return c;
      const days = c.days.map((d) => ({ ...d, messages: [...d.messages] }));
      const msg: ChatMensaje = { id: genId("v"), from: "visitor", text, time };
      const last = days[days.length - 1];
      if (last && last.label === "Hoy") last.messages.push(msg);
      else days.push({ label: "Hoy", date: todayStr, messages: [msg] });
      return { ...c, days, lastFrom: "visitor", lastText: text, lastTime: time };
    }));
    setPending(null);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Mis chats" title="Mis chats" className="btn btn-neutral btn-sm" style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 10px", height: 36 }}>
        <MessageCircle size={16} />
        {totalUnread > 0 && <span style={{ position: "absolute", top: -6, right: -6, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999, background: "var(--green-800)", color: "#fff", fontSize: 10.5, fontWeight: 700, fontFamily: "var(--font-mono)", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--cream-bg)" }}>{totalUnread}</span>}
      </button>

      {open && (
        <>
          <div onMouseDown={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 190, background: "rgba(42,38,32,.4)", backdropFilter: "blur(2px)" }} />
          <aside role="dialog" aria-label="Chats" className="pop" style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 200, width: "min(420px, 100%)", background: "var(--cream-bg)", borderLeft: "1px solid var(--outline-variant)", boxShadow: "-8px 0 30px rgba(45,90,39,.12)", display: "flex", flexDirection: "column" }}>
            {view === "list" || !active ? (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--outline-variant)", background: "var(--surface)" }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--fg-1)", lineHeight: 1.1 }}>Mis chats</div>
                    <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 4 }}>Ordenados del más reciente al más antiguo</div>
                  </div>
                  <button onClick={() => setOpen(false)} aria-label="Cerrar" style={{ all: "unset", cursor: "pointer", color: "var(--fg-2)", width: 34, height: 34, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--outline-variant)", background: "var(--cream-bg)" }}><X size={18} /></button>
                </div>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {!seeded ? (
                    <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--fg-3)" }}><Loader size={22} className="spin" /></div>
                  ) : seeded.length === 0 ? (
                    <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--fg-2)" }}>
                      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--cream-tert)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}><MessageCircleOff size={26} color="var(--brown-700)" /></div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17, color: "var(--fg-1)", marginBottom: 6 }}>Todavía no tenés chats</div>
                      <div style={{ fontSize: 13.5, color: "var(--fg-2)", maxWidth: 280, margin: "0 auto", lineHeight: 1.5 }}>Cuando inicies una conversación con un establecimiento, vas a verla acá.</div>
                    </div>
                  ) : (
                    <>
                      {totalUnread > 0 && <div style={{ padding: "10px 20px", fontSize: 12, color: "var(--fg-3)", borderBottom: "1px solid var(--cream-tert)", background: "var(--cream-tert)" }}><strong style={{ color: "var(--green-800)" }}>{totalUnread}</strong> {totalUnread === 1 ? "mensaje nuevo" : "mensajes nuevos"}</div>}
                      {seeded.map((c) => <ChatRow key={c.id} chat={c} onOpen={openChat} />)}
                    </>
                  )}
                </div>
              </>
            ) : (
              <Conversation chat={active} pending={pending} busy={isLoading} onBack={() => { setView("list"); setPending(null); }} onSend={sendMessage} />
            )}
          </aside>
        </>
      )}
    </>
  );
}
