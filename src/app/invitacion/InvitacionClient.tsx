"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin, ShieldCheck, User, Clock, BadgeCheck, Check, X, XCircle, Info, PartyPopper, MailX,
  Tractor, AlertCircle, ArrowLeft, Loader,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { fincaInitials } from "@/data/invitaciones";
import { useInvitacion, useResponderInvitacion } from "@/hooks/useInvitacion";
import type { EstadoInvitacion, Invitacion } from "@/types/invitaciones";

const GRADS = ["linear-gradient(135deg,#7FA876,#2D5A27)", "linear-gradient(135deg,#C9A227,#805533)", "linear-gradient(135deg,#A6794F,#5C3B22)", "linear-gradient(135deg,#6F9E64,#1E5418)", "linear-gradient(135deg,#D99A4E,#A6794F)", "linear-gradient(135deg,#B86B4F,#5C3B22)"];

function DetailRow({ icon, label, children, last }: { icon: React.ReactNode; label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 0", borderBottom: last ? "none" : "1px solid var(--cream-tert)" }}>
      <span style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: "var(--cream-tert)", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="t-label" style={{ marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 15.5, color: "var(--fg-1)", lineHeight: 1.45 }}>{children}</div>
      </div>
    </div>
  );
}

function InviteCard({ inv, busy, onAccept, onAskReject }: { inv: Invitacion; busy: boolean; onAccept: () => void; onAskReject: () => void }) {
  return (
    <div className="card-in" style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: 18, overflow: "hidden", boxShadow: "0px 4px 12px rgba(45,90,39,0.06)" }}>
      <div style={{ position: "relative", height: 150, background: GRADS[inv.seed % GRADS.length] }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(21,66,18,.55), rgba(21,66,18,.05))" }} />
        <div style={{ position: "absolute", left: 22, bottom: 16, right: 22, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 11, background: "rgba(255,255,255,.92)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--green-800)", fontSize: 16 }}>{fincaInitials(inv.finca)}</span>
          <div style={{ color: "#fff", flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{inv.finca}</div>
            <div style={{ fontSize: 13, opacity: 0.92, marginTop: 3, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{inv.location}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "30px 34px 34px" }}>
        <div className="t-label" style={{ color: "var(--brown-700)" }}>Invitación para gestionar</div>
        <h1 style={{ margin: "10px 0 0", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 30, lineHeight: 1.18, color: "var(--fg-1)", letterSpacing: "-.01em" }}>{inv.invitedBy} te invitó a sumarte como productor/a</h1>
        <p style={{ margin: "12px 0 0", color: "var(--fg-2)", fontSize: 16.5, lineHeight: 1.55, maxWidth: 560 }}>Vas a poder ayudar a gestionar <strong style={{ color: "var(--fg-1)", fontWeight: 600 }}>{inv.finca}</strong> dentro del panel del productor, según el rol que te asignaron. Revisá los datos y decidí si querés participar.</p>

        <div style={{ marginTop: 24, border: "1px solid var(--outline-variant)", borderRadius: 14, padding: "4px 20px", background: "var(--cream-bg)" }}>
          <DetailRow icon={<MapPin size={19} color="var(--brown-700)" />} label="Establecimiento">{inv.finca} · {inv.location}</DetailRow>
          <DetailRow icon={<ShieldCheck size={19} color="var(--brown-700)" />} label="Rol asignado">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--green-050)", border: "1px solid var(--green-300)", borderRadius: "var(--radius-pill)", padding: "5px 12px", fontSize: 14, color: "var(--green-800)", fontWeight: 600 }}><ShieldCheck size={15} color="var(--green-700)" /> {inv.rol}</span>
            <div style={{ fontSize: 14, color: "var(--fg-3)", marginTop: 8, lineHeight: 1.45 }}>{inv.rolDesc}</div>
          </DetailRow>
          <DetailRow icon={<User size={19} color="var(--brown-700)" />} label="Te invitó">{inv.invitedBy} <span style={{ color: "var(--fg-3)" }}>· {inv.invitedByRole}</span></DetailRow>
          <DetailRow icon={<Clock size={19} color="var(--brown-700)" />} label="Enviada el" last><span style={{ fontFamily: "var(--font-mono)", fontSize: 14.5 }}>{inv.sentAt}</span></DetailRow>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18, padding: "12px 16px", background: "var(--info-fill)", borderRadius: 12, fontSize: 14, color: "var(--info-fg)", lineHeight: 1.45 }}>
          <BadgeCheck size={18} color="var(--info-fg)" style={{ flexShrink: 0 }} />
          <span>Esta invitación está asociada a tu cuenta <strong style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{inv.email}</strong>. Al aceptar, sumás el rol sin volver a registrarte.</span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 26 }}>
          <button type="button" className="btn btn-primary btn-lg" onClick={onAccept} disabled={busy} style={{ flex: "1 1 240px", justifyContent: "center" }}>{busy ? <Loader size={18} className="spin" /> : <Check size={18} />} Aceptar invitación</button>
          <button type="button" className="btn btn-neutral btn-lg" onClick={onAskReject} disabled={busy} style={{ flex: "0 1 200px", justifyContent: "center" }}><X size={18} /> Rechazar</button>
        </div>
        <p style={{ margin: "16px 0 0", fontSize: 13.5, color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 7 }}><Info size={15} color="var(--fg-3)" /> Si no esperabas esta invitación, podés rechazarla sin problema.</p>
      </div>
    </div>
  );
}

function ResolvedCard({ inv, status, onPanel }: { inv: Invitacion; status: EstadoInvitacion; onPanel: () => void }) {
  const accepted = status === "aceptada";
  return (
    <div className="card-in" style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: 18, overflow: "hidden", boxShadow: "0px 4px 12px rgba(45,90,39,0.06)", textAlign: "center", padding: "44px 34px 38px" }}>
      <span style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", background: accepted ? "var(--green-050)" : "var(--cream-tert)", border: "1px solid " + (accepted ? "var(--green-300)" : "var(--outline-variant)") }}>{accepted ? <PartyPopper size={34} color="var(--green-800)" /> : <MailX size={34} color="var(--fg-3)" />}</span>
      <h1 style={{ margin: "20px 0 0", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, color: "var(--fg-1)", lineHeight: 1.2 }}>{accepted ? `¡Listo! Ya sos parte de ${inv.finca}` : "Rechazaste la invitación"}</h1>
      <p style={{ margin: "12px auto 0", color: "var(--fg-2)", fontSize: 16, lineHeight: 1.55, maxWidth: 460 }}>
        {accepted ? <>Te sumamos como <strong style={{ color: "var(--green-800)", fontWeight: 600 }}>{inv.rol}</strong>. Entrá al panel del productor para empezar a gestionar la finca.</> : <>Le avisamos a <strong style={{ color: "var(--fg-1)" }}>{inv.invitedBy}</strong> que no aceptaste sumarte a {inv.finca}. Tu cuenta de visitante sigue igual que siempre.</>}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 28 }}>
        {accepted ? (
          <>
            <button type="button" className="btn btn-primary btn-lg" onClick={onPanel} style={{ justifyContent: "center" }}><Tractor size={18} /> Ir al panel del productor</button>
            <Link href="/mis-reservas" className="btn btn-neutral btn-lg" style={{ textDecoration: "none", justifyContent: "center" }}>Volver a mis reservas</Link>
          </>
        ) : (
          <Link href="/mis-reservas" className="btn btn-primary btn-lg" style={{ textDecoration: "none", justifyContent: "center" }}>Volver a mis reservas</Link>
        )}
      </div>
    </div>
  );
}

function NotFoundCard() {
  return (
    <div className="card-in" style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: 18, padding: "44px 34px", textAlign: "center" }}>
      <span style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cream-tert)" }}><AlertCircle size={30} color="var(--fg-3)" /></span>
      <h1 style={{ margin: "18px 0 0", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "var(--fg-1)" }}>No encontramos la invitación</h1>
      <p style={{ margin: "10px auto 0", color: "var(--fg-2)", fontSize: 15.5, maxWidth: 420, lineHeight: 1.5 }}>El enlace puede haber vencido o ya fue usado. Pedile al productor que te envíe una nueva invitación.</p>
      <div style={{ marginTop: 24 }}><Link href="/mis-reservas" className="btn btn-primary btn-lg" style={{ textDecoration: "none" }}>Volver a mis reservas</Link></div>
    </div>
  );
}

export default function InvitacionClient({ invId }: { invId?: string }) {
  const router = useRouter();
  const { data, notFound, isLoading } = useInvitacion(invId);
  const { responder, isLoading: responding } = useResponderInvitacion();
  const [status, setStatus] = useState<EstadoInvitacion | null>(null);
  const [confirming, setConfirming] = useState(false);

  const estado = status ?? data?.estado ?? "pendiente";

  async function accept() {
    if (!data) return;
    await responder(data.id, "aceptada");
    setStatus("aceptada");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function reject() {
    if (!data) return;
    await responder(data.id, "rechazada");
    setStatus("rechazada");
    setConfirming(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <SiteHeader />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 90px" }}>
        <Link href="/mis-reservas" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--fg-3)", fontSize: 14, textDecoration: "none", marginBottom: 18 }}><ArrowLeft size={16} color="var(--fg-3)" /> Volver a mis reservas</Link>

        {isLoading ? (
          <div style={{ padding: "100px 28px", textAlign: "center", color: "var(--fg-3)" }}><Loader size={26} className="spin" /><div style={{ marginTop: 12, fontSize: 14 }}>Cargando invitación…</div></div>
        ) : notFound || !data ? (
          <NotFoundCard />
        ) : estado === "pendiente" ? (
          <InviteCard inv={data} busy={responding} onAccept={accept} onAskReject={() => setConfirming(true)} />
        ) : (
          <ResolvedCard inv={data} status={estado} onPanel={() => router.push("/panel/datos")} />
        )}
      </div>

      {confirming && data && (
        <div onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirming(false); }} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(42,38,32,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(2px)" }}>
          <div className="pop" style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-pop)", width: "min(460px, 100%)", padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <span style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--danger-fill)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><XCircle size={23} color="var(--danger)" /></span>
              <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 21, color: "var(--fg-1)" }}>Rechazar la invitación</h3>
            </div>
            <p style={{ margin: "0 0 22px", color: "var(--fg-2)", fontSize: 15.5, lineHeight: 1.55 }}>Le vamos a avisar a <strong style={{ color: "var(--fg-1)" }}>{data.invitedBy}</strong> que no aceptaste sumarte a <strong style={{ color: "var(--fg-1)" }}>{data.finca}</strong>. Si más adelante querés participar, va a tener que invitarte de nuevo.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button type="button" className="btn btn-neutral" onClick={() => setConfirming(false)} disabled={responding}>No, volver</button>
              <button type="button" className="btn" onClick={reject} disabled={responding} style={{ background: "var(--danger)", color: "#fff", boxShadow: "inset 0 -2px 0 var(--danger-fg)" }}>{responding ? <Loader size={17} className="spin" /> : <X size={17} />} Sí, rechazar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
