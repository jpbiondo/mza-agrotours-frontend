"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, CheckCheck, Check, CalendarCheck, MessageCircle, Star, Clock, CalendarDays, CreditCard,
  CalendarX, Sprout, Users, Loader,
} from "lucide-react";
import { NOTIF_TONE } from "@/data/notificaciones";
import { useNotificaciones, useMarcarLeidas } from "@/hooks/useNotificaciones";
import type { Notificacion } from "@/types/notificaciones";

const ICON: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  "calendar-check": CalendarCheck, "message-circle": MessageCircle, star: Star, clock: Clock,
  "calendar-days": CalendarDays, "credit-card": CreditCard, "calendar-x": CalendarX, sprout: Sprout, users: Users,
};

const PAGE = 6;

const iconBtn: React.CSSProperties = { width: 36, height: 36, borderRadius: "var(--radius)", border: "1px solid var(--outline-variant)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" };
const badgeStyle: React.CSSProperties = { position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, padding: "0 5px", background: "var(--green-800)", color: "#fff", borderRadius: 9, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--cream-bg)", boxSizing: "content-box", lineHeight: 1 };

export default function NotificationBell() {
  const { data } = useNotificaciones();
  return <BellIsland key={data ? "ready" : "loading"} initial={data ?? []} loaded={!!data} />;
}

function BellIsland({ initial, loaded }: { initial: Notificacion[]; loaded: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<Set<string>>(new Set());
  const [count, setCount] = useState(PAGE);
  const wrap = useRef<HTMLDivElement>(null);
  const { marcar } = useMarcarLeidas();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const unreadCount = useMemo(() => initial.filter((n) => !read.has(n.id)).length, [initial, read]);

  function markOne(id: string) { setRead((s) => new Set(s).add(id)); marcar([id]); }
  function markAll() { setRead(new Set(initial.map((n) => n.id))); marcar(initial.map((n) => n.id)); }
  function openNotif(n: Notificacion) { markOne(n.id); setOpen(false); router.push(n.href); }

  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) setCount((c) => Math.min(initial.length, c + PAGE));
  }

  const visible = initial.slice(0, count);

  return (
    <div ref={wrap} style={{ position: "relative" }}>
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label="Notificaciones" onClick={() => { setOpen((o) => !o); setCount(PAGE); }} style={{ ...iconBtn, background: open ? "var(--cream-tert)" : "var(--surface)" }}>
        <Bell size={18} color="var(--fg-2)" />
        {loaded && unreadCount > 0 && <span style={badgeStyle}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {open && (
        <div className="pop" role="menu" style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, width: "min(360px, calc(100vw - 32px))", background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: 14, boxShadow: "var(--shadow-pop)", overflow: "hidden", zIndex: 60 }}>
          <div style={{ padding: "13px 14px 13px 16px", borderBottom: "1px solid var(--outline-variant)", background: "var(--cream-tert)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15.5, color: "var(--fg-1)" }}>Notificaciones</span>
              {unreadCount > 0 && <span style={{ fontSize: 11.5, fontWeight: 700, color: "#fff", background: "var(--brown-700)", borderRadius: 999, padding: "2px 8px", lineHeight: 1.4 }}>{unreadCount} sin leer</span>}
            </div>
            <button type="button" onClick={markAll} disabled={unreadCount === 0} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "transparent", cursor: unreadCount === 0 ? "default" : "pointer", padding: "4px 6px", borderRadius: 8, fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600, color: unreadCount === 0 ? "var(--fg-3)" : "var(--green-800)", whiteSpace: "nowrap" }}>
              <CheckCheck size={15} /> Marcar como leídas
            </button>
          </div>

          <div style={{ maxHeight: 460, overflowY: "auto", overflowX: "hidden" }} onScroll={onScroll}>
            {!loaded ? (
              <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--fg-3)" }}><Loader size={22} className="spin" /></div>
            ) : initial.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--fg-2)" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--cream-tert)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}><Bell size={24} color="var(--brown-700)" /></div>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>No tenés notificaciones por ahora.</div>
              </div>
            ) : (
              <div style={{ padding: "10px 10px 8px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {visible.map((n) => {
                    const unread = !read.has(n.id);
                    const tone = NOTIF_TONE[n.tone] ?? { bg: "var(--cream-tert)", fg: "var(--fg-2)" };
                    const NIcon = ICON[n.icon] ?? Bell;
                    return (
                      <div key={n.id} role="menuitem" tabIndex={0} onClick={() => openNotif(n)} style={{ display: "flex", gap: 11, padding: "10px 10px", borderRadius: 10, cursor: "pointer", alignItems: "flex-start", background: unread ? "var(--cream-tert)" : "transparent" }}>
                        <span style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: tone.bg }}><NIcon size={16} color={tone.fg} /></span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            {unread && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green-800)", flexShrink: 0 }} />}
                            <div style={{ fontSize: 13.5, fontWeight: unread ? 700 : 500, color: "var(--fg-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.title}</div>
                          </div>
                          <div style={{ fontSize: 12.5, color: "var(--fg-2)", marginTop: 2, lineHeight: 1.4 }}>{n.body}</div>
                          <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 4 }}>{n.time}</div>
                        </div>
                        <button type="button" title={unread ? "Marcar como leída" : "Leída"} aria-label={unread ? "Marcar como leída" : "Leída"} disabled={!unread} onClick={(e) => { e.stopPropagation(); if (unread) markOne(n.id); }} style={{ flexShrink: 0, alignSelf: "center", width: 30, height: 30, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: unread ? "pointer" : "default", border: "1px solid " + (unread ? "var(--green-300)" : "var(--outline-variant)"), background: unread ? "var(--surface)" : "var(--green-050)" }}>
                          <Check size={15} color="var(--green-800)" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div style={{ textAlign: "center", padding: "10px 0 4px", fontSize: 12, color: "var(--fg-3)" }}>{count < initial.length ? "Deslizá para ver más antiguas" : "No hay más notificaciones"}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
