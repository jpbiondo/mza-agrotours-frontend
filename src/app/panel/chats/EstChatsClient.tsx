"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Grape, Search, SearchX, Send, MessagesSquare, Mail, Loader } from "lucide-react";
import ProducerShell from "@/components/panel/ProducerShell";
import { FINCAS } from "@/data/panel";
import { chatNow } from "@/data/chats";
import { genId } from "@/lib/id";
import { useEstChats, useEnviarMensaje } from "@/hooks/useChats";
import type { ChatMensaje, EstChat } from "@/types/chats";

function Avatar({ initials, size = 44, active }: { initials: string; size?: number; active?: boolean }) {
  return <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: active ? "var(--green-800)" : "var(--brown-700)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: size * 0.36, boxShadow: active ? "inset 0 -2px 0 var(--green-900, #0d2a0b)" : "inset 0 -2px 0 var(--brown-800)" }}>{initials}</div>;
}

function DayDivider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "10px 0 6px" }}>
      <div style={{ flex: 1, height: 1, background: "var(--cream-tert)" }} />
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--fg-3)", padding: "4px 10px", background: "var(--cream-tert)", borderRadius: 999 }}>{label}</div>
      <div style={{ flex: 1, height: 1, background: "var(--cream-tert)" }} />
    </div>
  );
}

function Bubble({ msg }: { msg: ChatMensaje }) {
  const mine = msg.from === "productor";
  return (
    <div className="bubble-in" style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", maxWidth: "76%", alignSelf: mine ? "flex-end" : "flex-start" }}>
      <div style={{ background: mine ? "var(--green-800)" : "var(--surface)", color: mine ? "#fff" : "var(--fg-1)", border: `1px solid ${mine ? "transparent" : "var(--outline-variant)"}`, padding: "10px 14px", borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px", fontSize: 13.5, lineHeight: 1.45, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.text}</div>
      <div style={{ marginTop: 4, fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>{msg.time}</div>
    </div>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone: "neutral" | "success" }) {
  const map = { neutral: { bg: "var(--cream-tert)", fg: "var(--fg-2)", bd: "var(--outline-variant)" }, success: { bg: "var(--success-fill)", fg: "var(--success-fg)", bd: "var(--success)" } }[tone];
  return <span style={{ display: "inline-flex", alignItems: "center", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: map.bg, color: map.fg, border: `1px solid ${map.bd}`, whiteSpace: "nowrap" }}>{children}</span>;
}

function Composer({ onSend, busy }: { onSend: (t: string) => void; busy: boolean }) {
  const [draft, setDraft] = useState("");
  const MAX = 500;
  const canSend = draft.trim().length > 0 && draft.length <= MAX && !busy;
  const submit = () => { if (!canSend) return; onSend(draft.trim()); setDraft(""); };
  return (
    <div style={{ borderTop: "1px solid var(--outline-variant)", background: "var(--surface)", padding: "12px 16px 14px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, background: "var(--cream-bg)", border: "1px solid var(--sand)", borderRadius: 14, padding: "8px 8px 8px 14px" }}>
        <textarea value={draft} onChange={(e) => setDraft(e.target.value.slice(0, MAX))} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }} placeholder="Escribí tu respuesta…" rows={1} aria-label="Mensaje" style={{ flex: 1, resize: "none", border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--fg-1)", lineHeight: 1.45, padding: "6px 0", maxHeight: 120, minHeight: 24 }} />
        <button onClick={submit} disabled={!canSend} aria-label="Enviar mensaje" style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: canSend ? "var(--green-800)" : "var(--cream-tert)", color: canSend ? "#fff" : "var(--fg-3)", border: "none", cursor: canSend ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: canSend ? "inset 0 -2px 0 var(--green-900, #0d2a0b)" : "none" }}>{busy ? <Loader size={17} className="spin" /> : <Send size={17} />}</button>
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>Enter para enviar · Shift+Enter salto de línea</div>
    </div>
  );
}

function Thread({ chat, onSend, busy }: { chat: EstChat | null; onSend: (t: string) => void; busy: boolean }) {
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }, [chat?.id, chat?.days]);

  if (!chat) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, color: "var(--fg-2)", background: "var(--cream-bg)", padding: 32, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--cream-tert)", display: "flex", alignItems: "center", justifyContent: "center" }}><MessagesSquare size={28} color="var(--brown-700)" /></div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--fg-1)" }}>Elegí una conversación</div>
        <div style={{ fontSize: 13.5, maxWidth: 300, lineHeight: 1.5 }}>Seleccioná un mensaje de la izquierda para ver el detalle y responder a los visitantes.</div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: "1px solid var(--outline-variant)", background: "var(--surface)", flexShrink: 0 }}>
        <Avatar initials={chat.visitor.initials} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "var(--fg-1)", lineHeight: 1.2 }}>{chat.visitor.name}</div>
          <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 2, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            <Grape size={13} color="var(--brown-700)" /><span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{chat.activity.title}</span><span style={{ color: "var(--outline-variant)" }}>·</span><span style={{ fontFamily: "var(--font-mono)" }}>{chat.activity.date}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Pill tone="neutral"><span style={{ fontFamily: "var(--font-mono)" }}>{chat.reservaCode}</span></Pill>
          <Pill tone="success">{chat.personas} {chat.personas === 1 ? "persona" : "personas"}</Pill>
        </div>
      </div>
      <div ref={scroller} style={{ flex: 1, overflowY: "auto", padding: "16px 18px 10px", background: "var(--cream-bg)", display: "flex", flexDirection: "column", gap: 8 }}>
        {chat.days.map((day) => (
          <div key={day.date} style={{ display: "contents" }}>
            <DayDivider label={day.label} />
            {day.messages.map((m) => <Bubble key={m.id} msg={m} />)}
          </div>
        ))}
      </div>
      <Composer onSend={onSend} busy={busy} />
    </div>
  );
}

function ConvListItem({ chat, active, onOpen }: { chat: EstChat; active: boolean; onOpen: (id: string) => void }) {
  const [hover, setHover] = useState(false);
  const hasUnread = chat.unread > 0;
  const fromLabel = chat.lastFrom === "productor" ? "Vos" : chat.visitor.name.split(" ")[0];
  return (
    <button onClick={() => onOpen(chat.id)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ all: "unset", cursor: "pointer", boxSizing: "border-box", width: "100%", display: "flex", gap: 12, padding: "13px 16px", alignItems: "flex-start", borderBottom: "1px solid var(--cream-tert)", background: active ? "var(--green-050)" : hover ? "var(--cream-tert)" : "transparent", boxShadow: active ? "inset 3px 0 0 var(--green-800)" : "none" }}>
      <Avatar initials={chat.visitor.initials} size={44} active={active} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{chat.visitor.name}</div>
          <div style={{ fontSize: 11.5, color: hasUnread ? "var(--green-800)" : "var(--fg-3)", fontWeight: hasUnread ? 600 : 500, flexShrink: 0 }}>{chat.lastTime}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, color: "var(--fg-3)", fontSize: 12, minWidth: 0 }}>
          <Grape size={13} color="var(--brown-700)" /><span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{chat.activity.title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
          <div style={{ flex: 1, fontSize: 13, color: hasUnread ? "var(--fg-1)" : "var(--fg-2)", fontWeight: hasUnread ? 500 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}><span style={{ color: "var(--fg-3)" }}>{fromLabel}:</span> {chat.lastText}</div>
          {hasUnread && <span style={{ minWidth: 20, height: 20, padding: "0 6px", borderRadius: 999, flexShrink: 0, background: "var(--green-800)", color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{chat.unread}</span>}
        </div>
      </div>
    </button>
  );
}

function Inner({ initial }: { initial: EstChat[] }) {
  const [chats, setChats] = useState<EstChat[]>(initial);
  const [activeId, setActiveId] = useState<string | null>(initial[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"todos" | "no-leidos">("todos");
  const { enviar, isLoading } = useEnviarMensaje();

  const totalUnread = useMemo(() => chats.reduce((s, c) => s + c.unread, 0), [chats]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return chats.filter((c) => {
      if (filter === "no-leidos" && c.unread === 0) return false;
      if (!q) return true;
      return c.visitor.name.toLowerCase().includes(q) || c.activity.title.toLowerCase().includes(q);
    });
  }, [chats, query, filter]);
  const active = chats.find((c) => c.id === activeId) || null;

  function openChat(id: string) {
    setActiveId(id);
    setChats((arr) => arr.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  }

  async function sendMessage(text: string) {
    if (!activeId) return;
    await enviar(activeId, text);
    const time = chatNow();
    const n = new Date();
    const todayStr = `${String(n.getDate()).padStart(2, "0")}/${String(n.getMonth() + 1).padStart(2, "0")}/${n.getFullYear()}`;
    setChats((arr) => arr.map((c) => {
      if (c.id !== activeId) return c;
      const days = c.days.map((d) => ({ ...d, messages: [...d.messages] }));
      const msg: ChatMensaje = { id: genId("s"), from: "productor", text, time };
      const last = days[days.length - 1];
      if (last && last.label === "Hoy") last.messages.push(msg);
      else days.push({ label: "Hoy", date: todayStr, messages: [msg] });
      return { ...c, days, lastFrom: "productor", lastText: text, lastTime: time };
    }));
  }

  return (
    <div style={{ height: "calc(100vh - 72px)", padding: "22px 28px 28px", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 18, flexShrink: 0 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 30, color: "var(--fg-1)", letterSpacing: "-.01em" }}>Chats</h1>
          <p style={{ margin: "6px 0 0", color: "var(--fg-2)", fontSize: 15 }}>Consultas de los visitantes sobre las actividades de tu establecimiento.</p>
        </div>
        {totalUnread > 0 && <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: "var(--radius)", background: "var(--green-050)", color: "var(--green-800)", fontSize: 13.5, fontWeight: 600, flexShrink: 0 }}><Mail size={16} color="var(--green-800)" />{totalUnread} {totalUnread === 1 ? "mensaje sin leer" : "mensajes sin leer"}</div>}
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex", background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ width: 372, flexShrink: 0, borderRight: "1px solid var(--outline-variant)", display: "flex", flexDirection: "column", minHeight: 0 }} className="chat-list-col">
          <div style={{ padding: "14px 16px 10px", flexShrink: 0 }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", display: "inline-flex", color: "var(--fg-3)" }}><Search size={16} /></span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por visitante o actividad" style={{ width: "100%", paddingLeft: 36, height: 40, fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--fg-1)", borderRadius: "var(--radius)", border: "1px solid var(--sand)", background: "var(--surface)", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {([{ id: "todos", label: "Todos", count: 0 }, { id: "no-leidos", label: "No leídos", count: totalUnread }] as const).map((t) => {
                const on = filter === t.id;
                return (
                  <button key={t.id} onClick={() => setFilter(t.id)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 13px", borderRadius: 999, cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, border: `1px solid ${on ? "var(--green-800)" : "var(--outline-variant)"}`, background: on ? "var(--green-800)" : "var(--surface)", color: on ? "#fff" : "var(--fg-2)" }}>
                    {t.label}
                    {t.count > 0 && <span style={{ minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999, background: on ? "rgba(255,255,255,.22)" : "var(--brown-700)", color: "#fff", fontSize: 11, fontWeight: 700, lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{t.count}</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
            {visible.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--fg-2)" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--cream-tert)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}><SearchX size={24} color="var(--brown-700)" /></div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15.5, color: "var(--fg-1)", marginBottom: 4 }}>Sin resultados</div>
                <div style={{ fontSize: 13, lineHeight: 1.5 }}>No hay conversaciones que coincidan con el filtro.</div>
              </div>
            ) : visible.map((c) => <ConvListItem key={c.id} chat={c} active={c.id === activeId} onOpen={openChat} />)}
          </div>
        </div>
        <Thread chat={active} onSend={sendMessage} busy={isLoading} />
      </div>
    </div>
  );
}

export default function EstChatsClient() {
  const [fincaId, setFincaId] = useState(FINCAS[0].id);
  const { data, isLoading } = useEstChats();
  return (
    <>
      <ProducerShell active="chats" fincas={FINCAS} activeFincaId={fincaId} onFincaChange={setFincaId} />
      {isLoading || !data ? (
        <div style={{ padding: "120px 28px", textAlign: "center", color: "var(--fg-3)" }}><Loader size={26} className="spin" /><div style={{ marginTop: 12, fontSize: 14 }}>Cargando chats…</div></div>
      ) : (
        <Inner initial={data} />
      )}
      <style>{`@media (max-width: 720px){ .chat-list-col{ width: 100% !important; } }`}</style>
    </>
  );
}
