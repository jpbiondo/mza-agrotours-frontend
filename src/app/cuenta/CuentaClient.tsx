"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User, Phone, BadgeCheck, CreditCard, Mail, Check, Trash2, AlertTriangle, ShieldAlert,
  CheckCircle2, CalendarClock, ArrowRight, ArrowLeft, RotateCcw, AlertOctagon, X, Loader,
  AlertCircle, UserCog, ShieldCheck,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { Field, TextInput, SelectInput, CountrySelect, DatePicker } from "@/app/registro/components/FormFields";
import { PAISES, TIPOS_IDENTIFICACION } from "@/data/registro";
import { validarPerfil, condicionesEliminar, rolLabel } from "@/data/cuenta";
import type { CuentaSesion, Perfil } from "@/data/cuenta";
import { usePerfil, useGuardarPerfil, useEliminarCuenta } from "@/hooks/usePerfil";

type Toast = { tone: "success" | "danger"; title: string; sub?: string } | null;

/* ---- Datos personales -------------------------------------------------- */
function DatosPersonalesForm({ inicial, onDelete, setToast }: { inicial: Perfil; onDelete: () => void; setToast: (t: Toast) => void }) {
  const [v, setV] = useState<Perfil>(inicial);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const { guardar, isLoading } = useGuardarPerfil();

  const errors = validarPerfil(v);
  const show = (k: keyof Perfil) => ((touched[k] || submitted) && errors[k]) || "";
  const set = (k: keyof Perfil) => (val: string | Date) => { setV((s) => ({ ...s, [k]: val })); setTouched((t) => ({ ...t, [k]: true })); };
  const hayErrores = Object.keys(errors).length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (hayErrores) return;
    const r = await guardar(v);
    if (r.ok) setToast({ tone: "success", title: "Cambios guardados exitosamente" });
    else setToast({ tone: "danger", title: "No se pudieron guardar los cambios", sub: "Error: ERR_DB_TIMEOUT" });
  }

  const sectionLbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--brown-700)", marginBottom: 16 };

  return (
    <form onSubmit={submit} noValidate>
      {submitted && hayErrores && (
        <div className="pop" style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "13px 15px", borderRadius: "var(--radius)", background: "var(--danger-fill)", border: "1px solid var(--danger)", marginBottom: 22 }}>
          <AlertCircle size={18} color="var(--danger-fg)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13.5, color: "var(--danger-fg)", lineHeight: 1.45, fontWeight: 500 }}>Revisá los campos marcados en rojo: hay datos obligatorios o inválidos.</div>
        </div>
      )}
      <div style={sectionLbl}>Datos de la cuenta</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 20px" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Nombre y apellido" required error={show("nombre")} htmlFor="dp-nombre" hint={!show("nombre") ? `${(v.nombre || "").length}/40 caracteres` : undefined}>
            <TextInput id="dp-nombre" icon={<User size={18} />} value={v.nombre} maxLength={40} placeholder="Ej.: Camila Ríos" autoComplete="name" error={show("nombre")} onChange={set("nombre")} />
          </Field>
        </div>
        <Field label="Fecha de nacimiento" required error={show("fechaNac")} htmlFor="dp-fnac" hint={!show("fechaNac") ? "No mayor a 120 años" : undefined}>
          <DatePicker value={v.fechaNac} onChange={set("fechaNac")} error={show("fechaNac")} placeholder="dd/mm/aaaa" />
        </Field>
        <Field label="Teléfono" required error={show("telefono")} htmlFor="dp-tel" hint={!show("telefono") ? "Solo números (7 a 16 dígitos)" : undefined}>
          <TextInput id="dp-tel" icon={<Phone size={18} />} value={v.telefono} maxLength={16} inputMode="numeric" placeholder="Ej.: 2615558842" autoComplete="tel" error={show("telefono")} onChange={(x) => set("telefono")(x.replace(/\D/g, ""))} />
        </Field>
        <Field label="Tipo de identificación" required error={show("tipoIdent")} htmlFor="dp-tipo">
          <SelectInput id="dp-tipo" icon={<BadgeCheck size={18} />} value={v.tipoIdent} options={TIPOS_IDENTIFICACION} placeholder="Seleccioná un tipo" error={show("tipoIdent")} onChange={set("tipoIdent")} />
        </Field>
        <Field label="Identificación" required error={show("identificacion")} htmlFor="dp-ident" hint={!show("identificacion") ? `${(v.identificacion || "").length}/20 caracteres` : undefined}>
          <TextInput id="dp-ident" icon={<CreditCard size={18} />} value={v.identificacion} maxLength={20} placeholder="Ej.: 38.422.190" error={show("identificacion")} onChange={set("identificacion")} />
        </Field>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Correo electrónico" required error={show("email")} htmlFor="dp-email">
            <TextInput id="dp-email" icon={<Mail size={18} />} type="email" value={v.email} maxLength={100} placeholder="nombre@dominio.com" inputMode="email" autoComplete="email" error={show("email")} onChange={set("email")} />
          </Field>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="País" htmlFor="dp-pais">
            <CountrySelect id="dp-pais" value={v.pais} options={PAISES} placeholder="Seleccioná tu país" onChange={set("pais")} />
          </Field>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginTop: 28, paddingTop: 22, borderTop: "1px solid var(--cream-tert)" }}>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? <><Loader size={16} className="spin" /> Guardando…</> : <><Check size={16} /> Guardar cambios</>}</button>
        <button type="button" onClick={onDelete} style={{ display: "inline-flex", alignItems: "center", gap: 8, marginLeft: "auto", background: "transparent", border: "1px solid var(--danger)", color: "var(--danger-fg)", borderRadius: "var(--radius)", padding: "10px 16px", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600 }}>
          <Trash2 size={16} color="var(--danger-fg)" /> Eliminar cuenta
        </button>
      </div>
    </form>
  );
}

/* ---- Flujo de baja de cuenta ------------------------------------------- */
type Step = "warn" | "blocked" | "processing" | "success" | "error";

function CondRow({ met, label, detail }: { met: boolean; label: string; detail: string }) {
  return (
    <li style={{ display: "flex", gap: 12, padding: "12px 14px", borderRadius: "var(--radius)", background: met ? "var(--success-fill)" : "var(--danger-fill)", border: "1px solid " + (met ? "var(--success)" : "var(--danger)") }}>
      <span style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 1, background: met ? "var(--success)" : "var(--danger)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{met ? <Check size={14} color="#fff" /> : <X size={14} color="#fff" />}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: met ? "var(--success-fg)" : "var(--danger-fg)", lineHeight: 1.35 }}>{label}</div>
        <div style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 3, lineHeight: 1.45 }}>{detail}</div>
      </div>
    </li>
  );
}

const box: React.CSSProperties = { position: "relative", background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--outline-variant)", boxShadow: "var(--shadow-pop)", width: 468, maxWidth: "100%", padding: "28px 28px 24px" };
const iconCircle = (bg: string): React.CSSProperties => ({ width: 52, height: 52, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 });
const titleStyle: React.CSSProperties = { margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 21, color: "var(--fg-1)" };
const leadStyle: React.CSSProperties = { margin: "0 0 20px", fontSize: 14, color: "var(--fg-2)", lineHeight: 1.5 };
const listStyle: React.CSSProperties = { listStyle: "none", margin: "0 0 24px", padding: 0, display: "flex", flexDirection: "column", gap: 10 };
const actionsStyle: React.CSSProperties = { display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" };

function DeleteAccountFlow({ cuenta, onClose }: { cuenta: CuentaSesion; onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("warn");
  const [bajaTs, setBajaTs] = useState<string | null>(null);
  const { procesar } = useEliminarCuenta();
  const cond = condicionesEliminar(cuenta);
  const allMet = !cond.adminBlock && cond.items.every((i) => i.met);
  const scrim = (): React.CSSProperties => ({ position: "fixed", inset: 0, background: "rgba(42,38,32,.48)", zIndex: 140, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(2px)" });
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  async function confirmar() {
    if (!allMet) { setStep("blocked"); return; }
    setStep("processing");
    const r = await procesar();
    if (r.ok) { setBajaTs(r.ts); setStep("success"); } else setStep("error");
  }

  if (step === "warn") {
    return (
      <div style={scrim()} onMouseDown={onClose}>
        <div className="pop" style={box} onMouseDown={stop} role="dialog" aria-modal="true">
          <div style={iconCircle("var(--danger-fill)")}><Trash2 size={26} color="var(--danger-fg)" /></div>
          <h3 style={titleStyle}>¿Querés eliminar tu cuenta?</h3>
          <p style={leadStyle}>Vas a dar de baja la cuenta de <strong style={{ color: "var(--fg-1)" }}>{cuenta.nombre}</strong> ({rolLabel(cuenta.rol)}).</p>
          <div style={{ display: "flex", gap: 11, padding: "12px 14px", borderRadius: "var(--radius)", background: "var(--warning-fill)", border: "1px solid var(--warning)", marginBottom: 18 }}>
            <AlertTriangle size={18} color="var(--warning-fg)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 13, color: "var(--warning-fg)", lineHeight: 1.45, fontWeight: 500 }}>Esta acción <strong>no se puede deshacer</strong>. Perderás el acceso a tu historial, reservas y mensajes.</div>
          </div>
          <div style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.45, marginBottom: 10 }}>{cond.intro}</div>
          <ul style={listStyle}>{cond.items.map((it, i) => <CondRow key={i} {...it} />)}</ul>
          {allMet && (
            <div style={{ display: "flex", gap: 9, alignItems: "center", padding: "10px 13px", marginBottom: 18, borderRadius: "var(--radius)", background: "var(--green-050)", border: "1px solid var(--green-300)" }}>
              <CheckCircle2 size={16} color="var(--green-800)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: "var(--green-800)", fontWeight: 600 }}>Cumplís las condiciones para dar de baja tu cuenta.</div>
            </div>
          )}
          <div style={actionsStyle}>
            <button type="button" className="btn btn-neutral" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn" onClick={confirmar} style={{ background: "var(--danger)", color: "#fff", boxShadow: "inset 0 -2px 0 var(--danger-fg)" }}><Trash2 size={16} /> Confirmo eliminar mi cuenta</button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "blocked") {
    return (
      <div style={scrim()} onMouseDown={onClose}>
        <div className="pop" style={box} onMouseDown={stop} role="dialog" aria-modal="true">
          <div style={iconCircle("var(--danger-fill)")}><ShieldAlert size={26} color="var(--danger-fg)" /></div>
          <h3 style={titleStyle}>{cond.adminBlock ? "No es posible eliminar esta cuenta" : "Todavía no podés eliminar tu cuenta"}</h3>
          <p style={leadStyle}>{cond.adminBlock ? cond.intro : "Para poder dar de baja tu cuenta, primero tenés que cumplir con la siguiente condición:"}</p>
          <ul style={{ ...listStyle, marginBottom: 22 }}>{cond.items.map((it, i) => <CondRow key={i} {...it} />)}</ul>
          <div style={actionsStyle}><button type="button" className="btn btn-primary" onClick={onClose}><ArrowLeft size={16} /> Entendido</button></div>
        </div>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div style={scrim()}>
        <div className="pop" style={{ ...box, textAlign: "center", padding: "40px 28px" }} role="dialog" aria-modal="true">
          <Loader size={46} className="spin" color="var(--green-800)" style={{ margin: "0 auto 18px", display: "block" }} />
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, color: "var(--fg-1)" }}>Procesando la baja…</div>
          <div style={{ fontSize: 13.5, color: "var(--fg-2)", marginTop: 6 }}>Estamos gestionando tu solicitud.</div>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div style={scrim()}>
        <div className="pop" style={{ ...box, textAlign: "center" }} role="dialog" aria-modal="true">
          <div style={{ ...iconCircle("var(--success-fill)"), margin: "0 auto 18px" }}><Check size={28} color="var(--success-fg)" /></div>
          <h3 style={{ ...titleStyle, textAlign: "center" }}>Tu cuenta ha sido eliminada</h3>
          <p style={{ ...leadStyle, textAlign: "center" }}>La cuenta de <strong style={{ color: "var(--fg-1)" }}>{cuenta.nombre}</strong> fue dada de baja correctamente.</p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "10px 16px", marginBottom: 24, borderRadius: "var(--radius)", background: "var(--cream-tert)", border: "1px solid var(--outline-variant)" }}>
            <CalendarClock size={17} color="var(--brown-700)" />
            <span style={{ fontSize: 13, color: "var(--fg-2)" }}>Fecha y hora de baja:</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--fg-1)" }}>{bajaTs}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button type="button" className="btn btn-primary" onClick={() => router.push("/explorar")}>Continuar <ArrowRight size={16} /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={scrim()} onMouseDown={onClose}>
      <div className="pop" style={{ ...box, textAlign: "center" }} onMouseDown={stop} role="dialog" aria-modal="true">
        <div style={{ ...iconCircle("var(--danger-fill)"), margin: "0 auto 18px" }}><AlertOctagon size={26} color="var(--danger-fg)" /></div>
        <h3 style={{ ...titleStyle, textAlign: "center" }}>No se pudo eliminar la cuenta</h3>
        <p style={{ ...leadStyle, textAlign: "center" }}>Ocurrió un error al procesar la baja y tu cuenta sigue activa. No se asignó fecha de baja. Volvé a intentarlo en unos minutos.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button type="button" className="btn btn-neutral" onClick={onClose}>Cerrar</button>
          <button type="button" className="btn" onClick={() => setStep("warn")} style={{ background: "var(--danger)", color: "#fff", boxShadow: "inset 0 -2px 0 var(--danger-fg)" }}><RotateCcw size={16} /> Reintentar</button>
        </div>
      </div>
    </div>
  );
}

/* ---- Página ------------------------------------------------------------ */
function Inner({ cuenta, perfil }: { cuenta: CuentaSesion; perfil: Perfil }) {
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  function notify(t: Toast) { setToast(t); if (t) setTimeout(() => setToast((cur) => (cur === t ? null : cur)), 4000); }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "40px 28px 80px" }}>
      <div style={{ marginBottom: 26 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 600, color: "var(--brown-700)", background: "var(--cream-tert)", border: "1px solid var(--sand)", borderRadius: 999, padding: "6px 13px", marginBottom: 16 }}><UserCog size={14} /> {rolLabel(cuenta.rol)}</div>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--fg-1)", letterSpacing: "-.01em" }}>Mi cuenta</h1>
        <p style={{ margin: "10px 0 0", color: "var(--fg-2)", fontSize: 15.5, lineHeight: 1.5 }}>Actualizá tus datos personales o gestioná la baja de tu cuenta.</p>
      </div>

      <nav style={{ display: "flex", gap: 4, marginBottom: 22, borderBottom: "1px solid var(--outline-variant)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 4px", marginBottom: -1, borderBottom: "2px solid var(--green-800)", color: "var(--green-800)", fontSize: 14.5, fontWeight: 600 }}><UserCog size={16} /> Datos personales</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 14px", color: "var(--fg-3)", fontSize: 14.5, fontWeight: 500 }} title="Próximamente"><ShieldCheck size={16} /> Acceso y seguridad</span>
      </nav>

      <div className="card" style={{ padding: "28px 30px" }}>
        <DatosPersonalesForm inicial={perfil} onDelete={() => setDeleting(true)} setToast={notify} />
      </div>

      {deleting && <DeleteAccountFlow cuenta={cuenta} onClose={() => setDeleting(false)} />}
      {toast && (
        <div className="pop" style={{ position: "fixed", right: 24, bottom: 24, zIndex: 150, maxWidth: 400, background: toast.tone === "danger" ? "var(--danger)" : "var(--green-800)", color: "#fff", borderRadius: "var(--radius)", padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 11, boxShadow: "var(--shadow-pop)" }}>
          {toast.tone === "danger" ? <AlertTriangle size={19} color="#fff" style={{ flexShrink: 0, marginTop: 1 }} /> : <CheckCircle2 size={19} color="#fff" style={{ flexShrink: 0, marginTop: 1 }} />}
          <div><div style={{ fontWeight: 600, fontSize: 14.5 }}>{toast.title}</div>{toast.sub && <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2, fontFamily: "var(--font-mono)" }}>{toast.sub}</div>}</div>
        </div>
      )}
    </div>
  );
}

export default function CuentaClient() {
  const { cuenta, perfil, isLoading } = usePerfil();
  return (
    <>
      <SiteHeader />
      {isLoading || !cuenta || !perfil ? (
        <div style={{ padding: "120px 28px", textAlign: "center", color: "var(--fg-3)" }}><Loader size={26} className="spin" /><div style={{ marginTop: 12, fontSize: 14 }}>Cargando tu cuenta…</div></div>
      ) : (
        <Inner cuenta={cuenta} perfil={perfil} />
      )}
    </>
  );
}
