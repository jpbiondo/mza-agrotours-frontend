"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Lock, MapPin, CalendarDays, Check, AlertTriangle, RotateCcw, Compass, Ticket, X, XCircle } from "lucide-react";
import { moneyAr } from "@/lib/format";
import { useProcesarPago, type Outcome } from "@/hooks/useCheckout";
import type { ActividadDetalle } from "@/types/catalogo";

export type { Outcome };

const scrim: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 110, background: "rgba(42,38,32,.5)", backdropFilter: "blur(3px)",
  display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
};
const modalCard: React.CSSProperties = {
  width: 420, maxWidth: "94vw", background: "var(--surface)", borderRadius: 16, padding: 28,
  boxShadow: "var(--shadow-pop)", border: "1px solid var(--outline-variant)",
};

export function PaymentSheet({
  monto, actividad, fecha, viajeros, codigo, onResolve,
}: {
  monto: number; actividad: ActividadDetalle; fecha: string | null;
  viajeros: number; codigo: string | null; onResolve: (o: Outcome) => void;
}) {
  const { procesar, isLoading } = useProcesarPago();
  const run = (o: Outcome) => { procesar(o).then(onResolve); };

  return (
    <div style={scrim}>
      <div className="pop" style={{ width: 460, maxWidth: "94vw", background: "var(--surface)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-pop)", border: "1px solid var(--outline-variant)" }}>
        <div style={{ background: "var(--info)", color: "#fff", padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Lock size={17} color="#fff" />
            <span style={{ fontWeight: 600, fontSize: 15 }}>Pago seguro · Mercado Pago</span>
          </div>
          <span style={{ fontSize: 11, opacity: 0.85, border: "1px solid rgba(255,255,255,.5)", borderRadius: 999, padding: "2px 8px" }}>Simulación</span>
        </div>

        <div style={{ padding: 24 }}>
          <div className="t-label">Total a pagar</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 36, fontWeight: 700, color: "var(--fg-1)", margin: "4px 0 2px" }}>{moneyAr(monto)}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-3)" }}>{codigo} · pendiente</div>

          <div style={{ marginTop: 18, padding: 16, background: "var(--cream-tert)", borderRadius: 12, fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.6 }}>
            <div style={{ fontWeight: 600, color: "var(--fg-1)", marginBottom: 4 }}>{actividad.titulo}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}><MapPin size={14} color="var(--fg-3)" /> {actividad.finca} · {actividad.loc}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}><CalendarDays size={14} color="var(--fg-3)" /> {fecha} · {viajeros} {viajeros === 1 ? "visitante" : "visitantes"}</div>
          </div>

          {isLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "26px 0 12px", color: "var(--info)" }}>
              <span className="spin" style={{ width: 22, height: 22, borderRadius: "50%", border: "3px solid var(--info-fill)", borderTopColor: "var(--info)", display: "inline-block" }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Procesando el pago…</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
              <button type="button" className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }} onClick={() => run("success")}>
                <Check size={20} /> Pagar {moneyAr(monto)}
              </button>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" className="btn btn-neutral" style={{ flex: 1, justifyContent: "center" }} onClick={() => run("cancel")}>Cancelar pago</button>
                <button type="button" className="btn btn-neutral" style={{ flex: 1, justifyContent: "center", color: "var(--danger-fg)" }} onClick={() => run("fail")}>Simular fallo</button>
              </div>
              <p style={{ fontSize: 11.5, color: "var(--fg-3)", textAlign: "center", margin: "4px 0 0" }}>
                Pantalla de demostración del servicio de pagos. Elegí un resultado para continuar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SuccessModal({ open, codigo }: { open: boolean; codigo: string | null }) {
  if (!open) return null;
  return (
    <div style={scrim}>
      <div className="pop" style={modalCard}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--success-fill)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <Check size={30} color="var(--success-fg)" />
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, textAlign: "center", margin: "0 0 6px", color: "var(--fg-1)" }}>¡Reserva exitosa!</h2>
        <p style={{ textAlign: "center", color: "var(--fg-2)", fontSize: 14.5, lineHeight: 1.55, margin: "0 0 6px" }}>
          Recibirás una notificación de recordatorio cerca de la fecha de la actividad. Vas a poder ver tu reserva en la sección «Mis reservas».
        </p>
        <div style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-3)", marginBottom: 20 }}>
          {codigo} · <span style={{ color: "var(--success-fg)", fontWeight: 600 }}>Pagada</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/mis-reservas" className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }}>
            <Ticket size={20} /> Ir a mis reservas
          </Link>
          <Link href="/explorar" className="btn btn-neutral" style={{ width: "100%", justifyContent: "center" }}>
            <Compass size={18} /> Seguir explorando
          </Link>
        </div>
      </div>
    </div>
  );
}

export function FailModal({ open, onRetry, onClose }: { open: boolean; onRetry: () => void; onClose: () => void }) {
  if (!open) return null;
  return (
    <div style={scrim}>
      <div className="pop" style={modalCard}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--danger-fill)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <AlertTriangle size={28} color="var(--danger)" />
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, textAlign: "center", margin: "0 0 6px", color: "var(--fg-1)" }}>Hubo un fallo durante el pago</h2>
        <p style={{ textAlign: "center", color: "var(--fg-2)", fontSize: 14.5, lineHeight: 1.55, margin: "0 0 22px" }}>
          Intentá nuevamente o comunicate con soporte. Tu reserva quedó expirada y no se realizó ningún cobro.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button type="button" className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }} onClick={onRetry}>
            <RotateCcw size={20} /> Intentar nuevamente
          </button>
          <button type="button" className="btn btn-neutral" style={{ width: "100%", justifyContent: "center" }} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

export function CancelToast({ open, onClose }: { open: boolean; onClose: () => void }) {
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
        <span style={{ fontSize: 14, fontWeight: 500 }}>Cancelaste la transacción de pago</span>
        <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,.7)", display: "flex", marginLeft: 4 }}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
