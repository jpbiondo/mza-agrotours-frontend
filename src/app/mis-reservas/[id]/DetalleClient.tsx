"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight, ArrowLeft, MapPin, Download, MessageCircle, XCircle, ReceiptText,
  Map as MapIcon, CalendarDays, Clock, Users, Star,
} from "lucide-react";
import Photo from "@/components/landing/Photo";
import { ESTADO_TONE, ESTADO_LABEL, reservaTotal } from "@/data/reservas";
import type { EstadoReserva, Reserva } from "@/types/reservas";
import { descargarComprobante } from "./comprobante";
import { LocationMap, Toast, CancelarReservaModal, ValorarModal, ContactPanel, type ToastData } from "./DetalleParts";

const TONE_VARS: Record<string, { bg: string; fg: string }> = {
  warning: { bg: "var(--warning-fill)", fg: "var(--warning-fg)" },
  success: { bg: "var(--success-fill)", fg: "var(--success-fg)" },
  danger: { bg: "var(--danger-fill)", fg: "var(--danger-fg)" },
};

function Pill({ estado }: { estado: EstadoReserva }) {
  const t = TONE_VARS[ESTADO_TONE[estado]];
  return <span style={{ display: "inline-flex", alignItems: "center", borderRadius: "var(--radius-pill)", padding: "4px 12px", fontSize: 12, fontWeight: 700, background: t.bg, color: t.fg }}>{ESTADO_LABEL[estado]}</span>;
}

function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 9, minWidth: 0 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--cream-tert)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0, lineHeight: 1.2 }}>
        <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--fg-3)", fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 13.5, color: "var(--fg-1)", fontWeight: 500, marginTop: 3 }}>{value}</div>
      </div>
    </div>
  );
}

function Bloque({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 22px", borderBottom: "1px solid var(--cream-tert)" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--green-050)", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17, color: "var(--fg-1)", margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: 22 }}>{children}</div>
    </section>
  );
}

export default function DetalleClient({ reserva }: { reserva: Reserva }) {
  const [chat, setChat] = useState(false);
  const [valorando, setValorando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [estado, setEstado] = useState<EstadoReserva>(reserva.estado);
  const [toast, setToast] = useState<ToastData | null>(null);

  const finalizada = estado === "finalizada";
  const cancelable = estado === "pendiente";
  const total = reservaTotal(reserva);
  const r = reserva;

  return (
    <div style={{ maxWidth: 1160, margin: "0 auto", padding: "32px 28px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13, marginBottom: 14 }}>
        <Link href="/" style={{ color: "var(--fg-3)", textDecoration: "none" }}>Inicio</Link>
        <ChevronRight size={14} />
        <Link href="/mis-reservas" style={{ color: "var(--fg-2)", textDecoration: "none" }}>Mis reservas</Link>
        <ChevronRight size={14} />
        <span style={{ color: "var(--fg-2)", fontWeight: 500 }}>Detalle de la reserva</span>
      </div>

      <Link href="/mis-reservas" className="btn btn-neutral btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 16 }}>
        <ArrowLeft size={16} /> Volver a mis reservas
      </Link>

      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 34, color: "var(--fg-1)", margin: "0 0 24px", letterSpacing: "-.01em" }}>Detalle de la reserva</h1>

      {/* Bloque superior */}
      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
        <div style={{ position: "relative" }}>
          <Photo seed={r.seed} height={150} radius={0} caption={r.photo} />
          <span style={{ position: "absolute", top: 14, left: 16, fontFamily: "var(--font-mono)", fontSize: 12, color: "#fff", background: "rgba(0,0,0,.35)", padding: "4px 10px", borderRadius: 999, letterSpacing: ".04em" }}>{r.id}</span>
        </div>
        <div style={{ padding: "20px 24px 22px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div style={{ minWidth: 240, flex: 1 }}>
            <div style={{ marginBottom: 10 }}><Pill estado={estado} /></div>
            <Link href="/explorar" style={{ display: "inline-block", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 25, lineHeight: 1.2, color: "var(--green-800)", textDecoration: "none", borderBottom: "2px solid transparent" }}>{r.titulo}</Link>
            <div style={{ marginTop: 10, fontSize: 14.5, color: "var(--fg-2)", display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
              <MapPin size={16} color="var(--brown-700)" />
              <Link href="/establecimientos" style={{ color: "var(--green-800)", fontWeight: 600, textDecoration: "none" }}>{r.finca}</Link>
              <span style={{ color: "var(--fg-3)" }}>· {r.loc}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
            <button type="button" className="btn btn-neutral" onClick={() => descargarComprobante(r)}><Download size={17} /> Descargar comprobante</button>
            <button type="button" className="btn btn-neutral" onClick={() => setChat(true)} style={{ borderColor: "var(--brown-500)", color: "var(--brown-800)" }}><MessageCircle size={17} /> Contactar establecimiento</button>
            {cancelable && (
              <button type="button" className="btn" onClick={() => setCancelando(true)} style={{ background: "var(--surface)", color: "var(--danger)", border: "1px solid var(--danger)", boxShadow: "inset 0 -2px 0 rgba(168,46,46,.18)", cursor: "pointer" }}>
                <XCircle size={17} color="var(--danger)" /> Cancelar reserva
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info principal + Mapa */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24, alignItems: "start" }} className="det-grid">
        <Bloque icon={<ReceiptText size={17} color="var(--green-800)" />} title="Información principal">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 14, paddingBottom: 20, borderBottom: "1px solid var(--cream-tert)" }}>
            <MetaItem icon={<CalendarDays size={15} color="var(--green-800)" />} label="Fecha" value={r.fechaLabel} />
            <MetaItem icon={<Clock size={15} color="var(--green-800)" />} label="Horario" value={r.horario} />
            <MetaItem icon={<Users size={15} color="var(--green-800)" />} label="Personas" value={`${r.personas} ${r.personas === 1 ? "persona" : "personas"}`} />
          </div>

          {r.participantes.length > 0 && (
            <div style={{ paddingTop: 20, borderBottom: "1px solid var(--cream-tert)", paddingBottom: 4 }}>
              <div className="t-label" style={{ marginBottom: 12 }}>PARTICIPANTES</div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {r.participantes.map((p, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 8, borderBottom: i < r.participantes.length - 1 ? "1px solid var(--cream-tert)" : "none" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--green-050)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, color: "var(--green-800)" }}>
                      {p.nombre.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div style={{ fontSize: 14, color: "var(--fg-1)" }}>
                      <span style={{ fontWeight: 500 }}>{p.nombre}</span>
                      <span style={{ color: "var(--fg-3)" }}> ({p.categoria})</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="t-label" style={{ margin: "20px 0 12px" }}>DESGLOSE DE PAGO</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {r.desglose.map((g, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--cream-tert)" }}>
                <div>
                  <div style={{ fontSize: 14, color: "var(--fg-1)", fontWeight: 500 }}>{g.grupo}</div>
                  <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2, fontFamily: "var(--font-mono)" }}>{g.cantidad} × $ {g.precio.toLocaleString("es-AR")}</div>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 14.5, fontWeight: 600, color: "var(--fg-1)" }}>$ {(g.cantidad * g.precio).toLocaleString("es-AR")}</div>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, padding: "14px 18px", background: "var(--green-050)", borderRadius: "var(--radius)" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>Total</div>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 22, color: "var(--green-800)" }}>$ {total.toLocaleString("es-AR")}</div>
            </div>
          </div>
        </Bloque>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <Bloque icon={<MapIcon size={17} color="var(--green-800)" />} title="Mapa y ubicación">
            <LocationMap />
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--cream-tert)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><MapPin size={16} color="var(--green-800)" /></div>
              <div style={{ lineHeight: 1.4 }}>
                <div style={{ fontSize: 14.5, color: "var(--fg-1)", fontWeight: 600 }}>{r.finca}</div>
                <div style={{ fontSize: 13.5, color: "var(--fg-2)", marginTop: 2 }}>{r.direccion}</div>
              </div>
            </div>
          </Bloque>

          <section className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Star size={18} color="var(--brown-700)" />
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "var(--fg-1)" }}>Valorar actividad</div>
            </div>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.5 }}>
              {finalizada ? "Contanos cómo fue tu experiencia. Tu valoración ayuda a otros visitantes y al establecimiento." : "Vas a poder valorar la actividad una vez que esté finalizada."}
            </p>
            <button type="button" className="btn btn-primary" disabled={!finalizada} onClick={() => finalizada && setValorando(true)} style={{ width: "100%", justifyContent: "center" }}>
              <Star size={18} /> Valorar actividad
            </button>
          </section>
        </div>
      </div>

      {chat && <ContactPanel r={r} onClose={() => setChat(false)} />}
      {cancelando && (
        <CancelarReservaModal
          r={r}
          onClose={() => setCancelando(false)}
          onConfirm={() => { setCancelando(false); setEstado("cancelada"); setToast({ tone: "success", title: "Reserva cancelada", msg: "Reserva cancelada exitosamente. Hemos devuelto tu dinero." }); }}
        />
      )}
      {valorando && (
        <ValorarModal r={r} onCancel={() => setValorando(false)} onResult={(t) => { setValorando(false); setToast(t); }} />
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />

      <style>{`@media (max-width: 880px) { .det-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
