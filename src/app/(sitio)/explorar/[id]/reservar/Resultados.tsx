"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Check, Compass, Ticket, X, XCircle } from "lucide-react";

const scrim: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 110, background: "rgba(42,38,32,.5)", backdropFilter: "blur(3px)",
  display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
};
const modalCard: React.CSSProperties = {
  width: 420, maxWidth: "94vw", background: "var(--surface)", borderRadius: 16, padding: 28,
  boxShadow: "var(--shadow-pop)", border: "1px solid var(--outline-variant)",
};

/** Se abre al pasar al checkout de Mercado Pago: el pago sigue en la otra pestaña. */
export function SuccessModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div style={scrim}>
      <div className="pop" style={modalCard}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--success-fill)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <Check size={30} color="var(--success-fg)" />
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, textAlign: "center", margin: "0 0 6px", color: "var(--fg-1)" }}>¡Reserva iniciada!</h2>
        <p style={{ textAlign: "center", color: "var(--fg-2)", fontSize: 14.5, lineHeight: 1.55, margin: "0 0 6px" }}>
          Si todavía no lo hiciste, continúa el proceso de pago desde la pestaña abierta en tu navegador.
        </p>
        <p style={{ textAlign: "center", color: "var(--fg-2)", fontSize: 14.5, lineHeight: 1.55, margin: "0 0 6px" }}>
          Recibirás una notificación de recordatorio cerca de la fecha de la actividad. Vas a poder ver tu reserva en la sección «Mis reservas».
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/mis-reservas" className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }}>
            <Ticket size={20} /> Ir a mis reservas
          </Link>
          <Link href="/explorar" className="btn btn-neutral" style={{ width: "100%", justifyContent: "center" }}>
            <Compass size={18} /> Seguir explorando
          </Link>
          <button type="button" className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

export function CancelToast({ open, onClose, message }: { open: boolean; onClose: () => void; message: string }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 4200);
    return () => clearTimeout(t);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div style={{ position: "fixed", right: 24, bottom: 24, zIndex: 120 }} className="pop">
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "var(--fg-1)", color: "var(--fg-on-dark)", borderRadius: 12, boxShadow: "var(--shadow-pop)", maxWidth: 360 }}>
        <XCircle size={18} color="#fff" />
        <span style={{ fontSize: 14, fontWeight: 500 }}>{message}</span>
        <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,.7)", display: "flex", marginLeft: 4 }}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
