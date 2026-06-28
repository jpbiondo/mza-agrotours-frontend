"use client";

import { useEffect, useRef, useState } from "react";
import {
  MapPin, Plus, Minus, X, Grape, Send, AlertTriangle, XCircle, CheckCircle2,
  AlertCircle, WifiOff, Star,
} from "lucide-react";
import Photo from "@/components/landing/Photo";
import type { Reserva } from "@/types/reservas";

export interface ToastData {
  tone: "success" | "danger";
  title: string;
  msg: string;
}

const scrim: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 100, background: "rgba(42,38,32,.5)", backdropFilter: "blur(2px)",
  display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
};

/* ---- Mapa estilizado ---------------------------------------------------- */
export function LocationMap() {
  return (
    <div style={{ position: "relative", width: "100%", height: 240, borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--outline-variant)" }}>
      <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }} aria-hidden="true">
        <rect x="0" y="0" width="400" height="240" fill="#EDE7DA" />
        <g opacity="0.9">
          <rect x="-6" y="-6" width="150" height="104" fill="#D8E2C9" transform="rotate(-7 70 46)" />
          <rect x="150" y="-10" width="170" height="92" fill="#E5DCC4" transform="rotate(-7 235 36)" />
          <rect x="-10" y="120" width="180" height="140" fill="#E2E8D4" transform="rotate(-7 80 190)" />
          <rect x="186" y="118" width="240" height="150" fill="#D2DEC2" transform="rotate(-7 306 193)" />
        </g>
        <g stroke="#B7C6A2" strokeWidth="1.4" opacity="0.7">
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={"a" + i} x1={-10 + i * 18} y1="0" x2={-40 + i * 18} y2="100" transform="rotate(-7 70 46)" />
          ))}
        </g>
        <g stroke="#C7B48F" strokeWidth="1.4" opacity="0.55">
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={"b" + i} x1={196 + i * 20} y1="118" x2={170 + i * 20} y2="268" transform="rotate(-7 306 193)" />
          ))}
        </g>
        <path d="M -20 150 C 120 120, 200 170, 440 110" fill="none" stroke="#F4EFE4" strokeWidth="14" />
        <path d="M -20 150 C 120 120, 200 170, 440 110" fill="none" stroke="#D9CDB4" strokeWidth="2" strokeDasharray="2 7" />
        <path d="M 150 -10 C 168 80, 150 160, 196 260" fill="none" stroke="#F4EFE4" strokeWidth="10" />
        <g fill="#9FBE8A" opacity="0.85">
          <circle cx="60" cy="60" r="7" /><circle cx="74" cy="66" r="6" /><circle cx="50" cy="70" r="5" />
          <circle cx="330" cy="200" r="7" /><circle cx="344" cy="206" r="6" />
        </g>
      </svg>
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -100%)", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--green-800)", border: "3px solid #fff", boxShadow: "0 6px 14px rgba(45,90,39,.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
          <MapPin size={20} color="#fff" />
        </div>
        <div style={{ width: 2, height: 10, background: "var(--green-800)", marginTop: -2 }} />
        <div style={{ width: 12, height: 5, borderRadius: "50%", background: "rgba(45,90,39,.30)", marginTop: 1 }} />
      </div>
      <div style={{ position: "absolute", right: 12, top: 12, display: "flex", flexDirection: "column", borderRadius: 8, overflow: "hidden", border: "1px solid var(--outline-variant)", background: "var(--surface)" }}>
        <button type="button" style={mapBtn} aria-label="Acercar"><Plus size={15} color="var(--fg-2)" /></button>
        <div style={{ height: 1, background: "var(--outline-variant)" }} />
        <button type="button" style={mapBtn} aria-label="Alejar"><Minus size={15} color="var(--fg-2)" /></button>
      </div>
    </div>
  );
}
const mapBtn: React.CSSProperties = { width: 30, height: 30, border: "none", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };

/* ---- Toast -------------------------------------------------------------- */
export function Toast({ toast, onClose }: { toast: ToastData | null; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, toast.tone === "danger" ? 7000 : 5500);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  const ok = toast.tone !== "danger";
  return (
    <div role="status" aria-live="polite" className="pop" style={{ position: "fixed", right: 24, bottom: 24, zIndex: 120, maxWidth: 380, display: "flex", alignItems: "flex-start", gap: 12, background: "var(--surface)", border: "1px solid var(--outline-variant)", borderLeft: "4px solid " + (ok ? "var(--success)" : "var(--danger)"), borderRadius: "var(--radius)", padding: "14px 16px", boxShadow: "var(--shadow-pop)" }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: ok ? "var(--success-fill)" : "var(--danger-fill)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {ok ? <CheckCircle2 size={18} color="var(--success-fg)" /> : <WifiOff size={18} color="var(--danger-fg)" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg-1)", marginBottom: 2 }}>{toast.title}</div>
        <div style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.45 }}>{toast.msg}</div>
      </div>
      <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--fg-3)", display: "inline-flex" }}><X size={15} /></button>
    </div>
  );
}

/* ---- Star rating -------------------------------------------------------- */
function StarShape({ filled, color, emptyColor, size }: { filled: boolean; color: string; emptyColor: string; size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: "block" }} aria-hidden="true">
      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" fill={filled ? color : emptyColor} stroke={filled ? color : emptyColor} strokeWidth="1.1" strokeLinejoin="round" style={{ transition: "fill .18s, stroke .18s" }} />
    </svg>
  );
}

function StarRating({ value, onChange, size = 40, error = false }: { value: number; onChange: (v: number) => void; size?: number; error?: boolean }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  const fillColor = error && !value ? "var(--danger)" : "#E0A422";
  const emptyColor = error && !value ? "var(--danger)" : "var(--sand)";
  return (
    <div role="radiogroup" aria-label="Calificación" style={{ display: "inline-flex", gap: 8, alignItems: "center" }} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} ${i === 1 ? "estrella" : "estrellas"}`}
          onMouseEnter={() => setHover(i)}
          onClick={() => onChange(i)}
          style={{ background: "transparent", border: "none", cursor: "pointer", lineHeight: 0, padding: 1, transform: hover === i ? "scale(1.1)" : "scale(1)", transition: "transform .16s" }}
        >
          <StarShape filled={i <= active} color={fillColor} emptyColor={emptyColor} size={size} />
        </button>
      ))}
    </div>
  );
}

/* ---- Modal: cancelar reserva ------------------------------------------- */
export function CancelarReservaModal({ r, onClose, onConfirm }: { r: Reserva; onClose: () => void; onConfirm: () => void }) {
  const [sending, setSending] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !sending) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sending, onClose]);

  const handle = () => { if (sending) return; setSending(true); setTimeout(onConfirm, 700); };

  return (
    <div style={scrim} onMouseDown={(e) => { if (e.target === e.currentTarget && !sending) onClose(); }}>
      <div className="pop" role="dialog" aria-modal="true" style={{ width: "100%", maxWidth: 480, background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-pop)" }}>
        <div style={{ padding: "24px 24px 4px", display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--danger-fill)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AlertTriangle size={22} color="var(--danger-fg)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, color: "var(--fg-1)", margin: 0, lineHeight: 1.25 }}>¿Querés cancelar esta reserva?</h2>
            <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.5 }}>
              Vas a cancelar <strong style={{ color: "var(--fg-1)" }}>{r.titulo}</strong> en <strong style={{ color: "var(--fg-1)" }}>{r.finca}</strong>. Esta acción no se puede deshacer.
            </p>
          </div>
        </div>

        <div style={{ margin: "16px 24px 0", padding: "12px 14px", background: "var(--cream-tert)", borderRadius: "var(--radius)", display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--fg-2)" }}>
          <div>{r.fechaLabel} · {r.horario}</div>
          <div style={{ fontFamily: "var(--font-mono)" }}>{r.id}</div>
        </div>

        <div style={{ margin: "16px 24px 0", padding: "13px 15px", background: "var(--success-fill)", border: "1px solid var(--success)", borderLeft: "4px solid var(--success)", borderRadius: "var(--radius)", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <CheckCircle2 size={18} color="var(--success-fg)" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--success-fg)", fontWeight: 500 }}>
            Estás cancelando con más de 3 días de anticipación. Tu dinero será devuelto en su totalidad. ¿Deseás continuar?
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, padding: "20px 24px" }}>
          <button type="button" className="btn btn-neutral" style={{ flex: 1, justifyContent: "center" }} onClick={() => !sending && onClose()} disabled={sending}>No, volver</button>
          <button type="button" className="btn" style={{ flex: 1, justifyContent: "center", background: "var(--danger)", color: "#fff", border: "1px solid var(--danger)", boxShadow: sending ? "none" : "inset 0 -2px 0 rgba(0,0,0,.18)", cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.85 : 1 }} onClick={handle} disabled={sending}>
            {sending ? (<><span className="spin" style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.45)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block" }} /> Cancelando…</>) : (<><XCircle size={17} /> Sí, cancelar reserva</>)}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Modal: valorar actividad ------------------------------------------ */
export function ValorarModal({ r, onCancel, onResult }: { r: Reserva; onCancel: () => void; onResult: (t: ToastData) => void }) {
  const [general, setGeneral] = useState(0);
  const [comentario, setComentario] = useState("");
  const [showError, setShowError] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !sending) onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sending, onCancel]);

  const enviar = () => {
    if (sending) return;
    if (!general) { setShowError(true); return; }
    setSending(true);
    setTimeout(() => onResult({ tone: "success", title: "Valoración enviada", msg: "Muchas gracias por tu valoración. Tu opinión fue enviada exitosamente." }), 1000);
  };

  return (
    <div style={{ ...scrim, overflowY: "auto" }} onMouseDown={(e) => { if (e.target === e.currentTarget && !sending) onCancel(); }}>
      <div className="pop" role="dialog" aria-modal="true" style={{ width: "100%", maxWidth: 560, background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-pop)", margin: "auto", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 48px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 14px", borderBottom: "1px solid var(--cream-tert)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--green-050)", display: "flex", alignItems: "center", justifyContent: "center" }}><Star size={17} color="var(--brown-700)" /></div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--fg-1)", margin: 0 }}>Valorar actividad</h2>
          </div>
          <button type="button" onClick={() => !sending && onCancel()} aria-label="Cerrar" style={{ background: "var(--cream-bg)", border: "1px solid var(--outline-variant)", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--fg-2)" }}><X size={18} /></button>
        </div>

        <div style={{ padding: "20px 24px 4px", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 76, height: 76, flexShrink: 0 }}><Photo seed={r.seed} height={76} radius={12} /></div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, color: "var(--fg-1)", margin: 0, lineHeight: 1.22 }}>{r.titulo}</h3>
              <div style={{ marginTop: 6, fontSize: 13.5, color: "var(--fg-2)", display: "flex", alignItems: "center", gap: 6 }}><MapPin size={14} color="var(--brown-700)" /> {r.finca}</div>
              <div style={{ marginTop: 4, fontSize: 13, color: "var(--fg-3)" }}>{r.personas} {r.personas === 1 ? "participante" : "participantes"}</div>
            </div>
          </div>

          <div style={{ height: 1, background: "var(--cream-tert)", margin: "20px 0" }} />

          <div className="t-label" style={{ marginBottom: 12 }}>CALIFICACIÓN GENERAL</div>
          <div style={{ display: "inline-flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <StarRating value={general} onChange={(v) => { setGeneral(v); setShowError(false); }} error={showError} />
              {general > 0 && <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, color: "var(--fg-2)" }}>{general}/5</span>}
            </div>
            {showError && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--danger)", fontSize: 13, fontWeight: 500 }}>
                <AlertCircle size={15} color="var(--danger)" /> La calificación es requerida
              </div>
            )}
          </div>

          <div className="t-label" style={{ margin: "26px 0 10px" }}>TU COMENTARIO</div>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Contales a otros tu experiencia"
            rows={4}
            aria-label="Tu comentario"
            style={{ width: "100%", resize: "vertical", minHeight: 96, lineHeight: 1.5, padding: 14, fontFamily: "var(--font-sans)", fontSize: 14.5, color: "var(--fg-1)", borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid var(--sand)", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ display: "flex", gap: 12, padding: "16px 24px 18px", borderTop: "1px solid var(--cream-tert)" }}>
          <button type="button" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={enviar} disabled={sending}>
            {sending ? (<><span className="spin" style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.45)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block" }} /> Enviando…</>) : (<><Send size={18} /> Enviar</>)}
          </button>
          <button type="button" className="btn btn-neutral" style={{ flex: "0 0 auto", justifyContent: "center", minWidth: 130 }} onClick={() => !sending && onCancel()} disabled={sending}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

/* ---- Panel lateral: chat del establecimiento --------------------------- */
interface Msg { from: "yo" | "est"; text: string; time: string }

export function ContactPanel({ r, onClose }: { r: Reserva; onClose: () => void }) {
  const [draft, setDraft] = useState("");
  const [extra, setExtra] = useState<Msg[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }, [extra]);

  const base: Msg[] = [
    { from: "est", text: `¡Hola! Soy ${r.productor.split(" ")[0]}, de ${r.finca}. ¿En qué te puedo ayudar con tu reserva ${r.id}?`, time: "10:42" },
    { from: "yo", text: "Hola, quería consultar si puedo llegar 15 minutos antes del horario.", time: "10:45" },
    { from: "est", text: `¡Claro! Te esperamos desde las ${r.horario.split(" — ")[0]}. Cualquier cosa, escribinos por acá.`, time: "10:47" },
  ];
  const msgs = base.concat(extra);
  const send = () => {
    const t = draft.trim();
    if (!t) return;
    setExtra((p) => p.concat([{ from: "yo", text: t, time: "11:0" + (p.length + 2) }]));
    setDraft("");
  };
  const initials = r.finca.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <div onMouseDown={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(42,38,32,.4)", backdropFilter: "blur(2px)" }} />
      <aside role="dialog" aria-label={`Chat con ${r.finca}`} className="pop" style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 101, width: 400, maxWidth: "92vw", background: "var(--cream-bg)", borderLeft: "1px solid var(--outline-variant)", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-pop)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: "1px solid var(--outline-variant)", background: "var(--surface)" }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "linear-gradient(135deg,#7FA876,#2D5A27)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15.5, color: "var(--fg-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.finca}</div>
            <div style={{ fontSize: 12, color: "var(--success)", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} /> En línea
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ cursor: "pointer", color: "var(--fg-2)", width: 34, height: 34, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--outline-variant)", background: "var(--cream-bg)" }}><X size={18} /></button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", background: "var(--cream-tert)", borderBottom: "1px solid var(--outline-variant)", fontSize: 12.5, color: "var(--fg-2)" }}>
          <Grape size={15} color="var(--green-800)" />
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Reserva <strong style={{ color: "var(--fg-1)" }}>{r.titulo}</strong></span>
        </div>

        <div ref={scroller} style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
          {msgs.map((m, i) => {
            const mine = m.from === "yo";
            return (
              <div key={i} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "82%", display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>
                <div style={{ background: mine ? "var(--green-800)" : "var(--surface)", color: mine ? "#fff" : "var(--fg-1)", border: "1px solid " + (mine ? "transparent" : "var(--outline-variant)"), padding: "10px 14px", borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px", fontSize: 13.5, lineHeight: 1.45 }}>{m.text}</div>
                <div style={{ marginTop: 4, fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>{m.time}</div>
              </div>
            );
          })}
        </div>

        <div style={{ borderTop: "1px solid var(--outline-variant)", padding: "12px 14px 14px", background: "var(--surface)" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, background: "var(--cream-bg)", border: "1px solid var(--sand)", borderRadius: 14, padding: "8px 8px 8px 14px" }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 300))}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Escribí un mensaje al establecimiento…"
              rows={1}
              aria-label="Mensaje"
              style={{ flex: 1, resize: "none", border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--fg-1)", lineHeight: 1.45, padding: "6px 0", maxHeight: 110, minHeight: 24 }}
            />
            <button type="button" onClick={send} disabled={!draft.trim()} aria-label="Enviar" style={{ width: 38, height: 38, borderRadius: 10, background: draft.trim() ? "var(--green-800)" : "var(--cream-tert)", color: draft.trim() ? "#fff" : "var(--fg-3)", border: "none", cursor: draft.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Send size={17} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
