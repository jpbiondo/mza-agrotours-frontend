"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User, Phone, BadgeCheck, CreditCard, Mail, Check, Trash2, AlertTriangle, ShieldAlert,
  CheckCircle2, CalendarClock, ArrowRight, ArrowLeft, RotateCcw, AlertOctagon, X, Loader,
  AlertCircle, UserCog, ShieldCheck, Lock,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { Field, TextInput, SelectInput, CountrySelect, DatePicker, PasswordMeter, passwordChecks, EyeToggle } from "@/app/registro/components/FormFields";
import { PAISES, TIPOS_IDENTIFICACION } from "@/data/registro";
import { validarPerfil, condicionesEliminar, rolLabel } from "@/data/cuenta";
import type { CuentaSesion, Perfil } from "@/data/cuenta";
import { usePerfil, useGuardarPerfil, useEliminarCuenta, useCambiarPassword } from "@/hooks/usePerfil";

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

/* ---- Cambiar contraseña ------------------------------------------------ */
function PasswordField({ id, label, value, error, autoComplete, forgot, onChange }: { id: string; label: string; value: string; error: string; autoComplete?: string; forgot?: React.ReactNode; onChange: (v: string) => void }) {
  const [shown, setShown] = useState(false);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
        <label htmlFor={id} style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg-1)" }}>{label} <span style={{ color: "var(--danger)" }}>*</span></label>
        {forgot}
      </div>
      <TextInput id={id} icon={<Lock size={18} />} type={shown ? "text" : "password"} value={value} autoComplete={autoComplete} error={error} onChange={onChange} rightSlot={<EyeToggle shown={shown} onToggle={() => setShown((s) => !s)} />} />
      {error && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--danger-fg)", marginTop: 7 }}><AlertCircle size={14} /> {error}</div>}
    </div>
  );
}

function ChangePasswordForm({ setToast }: { setToast: (t: Toast) => void }) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [actualError, setActualError] = useState<string | null>(null);
  const { cambiar, isLoading } = useCambiarPassword();

  const checks = passwordChecks(nueva);
  const nuevaOk = checks.length && checks.special;
  const errors: Record<string, string> = {};
  if (!actual) errors.actual = "Este campo es obligatorio";
  else if (actualError) errors.actual = actualError;
  if (!nueva) errors.nueva = "Este campo es obligatorio";
  else if (!nuevaOk) errors.nueva = "La contraseña no cumple los requisitos.";
  if (!confirm) errors.confirm = "Este campo es obligatorio";
  else if (confirm !== nueva) errors.confirm = "Las contraseñas no coinciden.";

  const show = (k: string) => ((touched[k] || submitted) && errors[k]) || "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (errors.actual || errors.nueva || errors.confirm) return;
    const r = await cambiar(actual, nueva);
    if (!r.ok) { setActualError("La contraseña actual ingresada es incorrecta"); return; }
    setActual(""); setNueva(""); setConfirm(""); setTouched({}); setSubmitted(false); setActualError(null);
    setToast({ tone: "success", title: "Contraseña actualizada correctamente" });
  }

  const tips = ["Mínimo 8 caracteres.", "Al menos un carácter especial.", "Evitá datos fáciles de adivinar.", "No la reutilices de otros sitios."];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 280px", gap: 28, alignItems: "start" }} className="cuenta-sec-grid">
      <div className="card" style={{ padding: "28px 30px" }}>
        <div style={{ marginBottom: 22 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20, margin: 0, color: "var(--fg-1)" }}>Cambiar contraseña</h2>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.5 }}>Por tu seguridad, vas a necesitar tu contraseña actual para definir una nueva.</p>
        </div>
        <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <PasswordField id="cp-actual" label="Contraseña actual" value={actual} error={show("actual")} autoComplete="current-password"
            forgot={<Link href="/acceso/recuperar" style={{ fontSize: 13, color: "var(--green-800)", fontWeight: 600, textDecoration: "none" }}>¿Olvidaste tu contraseña?</Link>}
            onChange={(x) => { setActual(x); setTouched((t) => ({ ...t, actual: true })); setActualError(null); }} />

          <div style={{ height: 1, background: "var(--cream-tert)", margin: "2px 0" }} />

          <div>
            <PasswordField id="cp-nueva" label="Nueva contraseña" value={nueva} error={show("nueva")} autoComplete="new-password"
              onChange={(x) => { setNueva(x); setTouched((t) => ({ ...t, nueva: true })); }} />
            {nueva && <PasswordMeter value={nueva} />}
          </div>
          <PasswordField id="cp-confirm" label="Repetí la nueva contraseña" value={confirm} error={show("confirm")} autoComplete="new-password"
            onChange={(x) => { setConfirm(x); setTouched((t) => ({ ...t, confirm: true })); }} />

          <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? <><Loader size={16} className="spin" /> Guardando…</> : <><Check size={16} /> Guardar</>}</button>
          </div>
        </form>
      </div>

      <aside className="card" style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
          <ShieldCheck size={18} color="var(--green-800)" />
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--fg-1)" }}>Una buena contraseña</div>
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
          {tips.map((t) => <li key={t} style={{ display: "flex", gap: 9, fontSize: 13, color: "var(--fg-2)", lineHeight: 1.4 }}><Check size={15} color="var(--green-800)" style={{ flexShrink: 0, marginTop: 1 }} />{t}</li>)}
        </ul>
      </aside>
    </div>
  );
}

/* ---- Página ------------------------------------------------------------ */
function Inner({ cuenta, perfil }: { cuenta: CuentaSesion; perfil: Perfil }) {
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [tab, setTab] = useState<"datos" | "seguridad">("datos");

  function notify(t: Toast) { setToast(t); if (t) setTimeout(() => setToast((cur) => (cur === t ? null : cur)), 4000); }
  const tabBtn = (id: "datos" | "seguridad", label: string, Icon: typeof UserCog) => {
    const on = tab === id;
    return (
      <button type="button" onClick={() => setTab(id)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 14px", marginBottom: -1, background: "transparent", border: "none", cursor: "pointer", borderBottom: "2px solid " + (on ? "var(--green-800)" : "transparent"), color: on ? "var(--green-800)" : "var(--fg-2)", fontSize: 14.5, fontWeight: on ? 600 : 500, fontFamily: "var(--font-sans)" }}>
        <Icon size={16} /> {label}
      </button>
    );
  };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "40px 28px 80px" }}>
      <div style={{ marginBottom: 26 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 600, color: "var(--brown-700)", background: "var(--cream-tert)", border: "1px solid var(--sand)", borderRadius: 999, padding: "6px 13px", marginBottom: 16 }}><UserCog size={14} /> {rolLabel(cuenta.rol)}</div>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--fg-1)", letterSpacing: "-.01em" }}>Mi cuenta</h1>
        <p style={{ margin: "10px 0 0", color: "var(--fg-2)", fontSize: 15.5, lineHeight: 1.5 }}>Actualizá tus datos personales, cambiá tu contraseña o gestioná la baja de tu cuenta.</p>
      </div>

      <nav style={{ display: "flex", gap: 4, marginBottom: 22, borderBottom: "1px solid var(--outline-variant)" }}>
        {tabBtn("datos", "Datos personales", UserCog)}
        {tabBtn("seguridad", "Acceso y seguridad", ShieldCheck)}
      </nav>

      {tab === "datos" ? (
        <div className="card" style={{ padding: "28px 30px" }}>
          <DatosPersonalesForm inicial={perfil} onDelete={() => setDeleting(true)} setToast={notify} />
        </div>
      ) : (
        <ChangePasswordForm setToast={notify} />
      )}

      {deleting && <DeleteAccountFlow cuenta={cuenta} onClose={() => setDeleting(false)} />}
      {toast && (
        <div className="pop" style={{ position: "fixed", right: 24, bottom: 24, zIndex: 150, maxWidth: 400, background: toast.tone === "danger" ? "var(--danger)" : "var(--green-800)", color: "#fff", borderRadius: "var(--radius)", padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 11, boxShadow: "var(--shadow-pop)" }}>
          {toast.tone === "danger" ? <AlertTriangle size={19} color="#fff" style={{ flexShrink: 0, marginTop: 1 }} /> : <CheckCircle2 size={19} color="#fff" style={{ flexShrink: 0, marginTop: 1 }} />}
          <div><div style={{ fontWeight: 600, fontSize: 14.5 }}>{toast.title}</div>{toast.sub && <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2, fontFamily: "var(--font-mono)" }}>{toast.sub}</div>}</div>
        </div>
      )}
      <style>{`@media (max-width: 680px){ .cuenta-sec-grid{ grid-template-columns: 1fr !important; } }`}</style>
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
