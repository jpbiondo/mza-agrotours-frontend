"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User, Phone, BadgeCheck, CreditCard, Mail, Check, Trash2, ShieldAlert,
  CheckCircle2, CalendarClock, ArrowRight, ArrowLeft, RotateCcw, AlertOctagon, X, Loader,
  AlertCircle, UserCog, ShieldCheck, Lock,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import AsyncBoundary from "@/components/AsyncBoundary";
import { Field, TextInput, SelectInput, CountrySelect, DatePicker, PasswordMeter, passwordChecks, EyeToggle } from "@/app/registro/components/FormFields";
import { TIPOS_IDENTIFICACION } from "@/data/registro";
import { validarPerfil, condicionesEliminar, rolLabel } from "@/data/cuenta";
import type { CuentaSesion, Perfil } from "@/data/cuenta";
import { usePerfil, useGuardarPerfil, useEliminarCuenta, useCambiarPassword } from "@/hooks/usePerfil";
import { usePaises } from "@/hooks/usePaises";
import { Button, Card, Modal, Toast, Alert, IconCircle, SectionLabel } from "@/components/ui";
import type { ToastData } from "@/components/ui";

type ToastState = ToastData | null;

/* ---- Datos personales -------------------------------------------------- */
function DatosPersonalesForm({ inicial, onDelete, setToast }: { inicial: Perfil; onDelete: () => void; setToast: (t: ToastState) => void }) {
  const [v, setV] = useState<Perfil>(inicial);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const { guardar, isLoading } = useGuardarPerfil();
  const { paises } = usePaises();

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

  return (
    <form onSubmit={submit} noValidate>
      {submitted && hayErrores && (
        <Alert tone="danger" className="mb-[22px]">Revisá los campos marcados en rojo: hay datos obligatorios o inválidos.</Alert>
      )}
      <SectionLabel>Datos de la cuenta</SectionLabel>
      <div className="grid grid-cols-2 gap-x-5 gap-y-[18px]">
        <div className="col-span-2">
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
        <div className="col-span-2">
          <Field label="Correo electrónico" required error={show("email")} htmlFor="dp-email">
            <TextInput id="dp-email" icon={<Mail size={18} />} type="email" value={v.email} maxLength={100} placeholder="nombre@dominio.com" inputMode="email" autoComplete="email" error={show("email")} onChange={set("email")} />
          </Field>
        </div>
        <div className="col-span-2">
          <Field label="País" htmlFor="dp-pais">
            <CountrySelect id="dp-pais" value={v.paisIso2} options={paises} placeholder="Seleccioná tu país" onChange={set("paisIso2")} />
          </Field>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-cream-tert pt-[22px]">
        <Button type="submit" disabled={isLoading}>{isLoading ? <><Loader size={16} className="spin" /> Guardando…</> : <><Check size={16} /> Guardar cambios</>}</Button>
        <button type="button" onClick={onDelete} className="ml-auto inline-flex cursor-pointer items-center gap-2 rounded-md border border-danger bg-transparent px-4 py-2.5 font-sans text-sm font-semibold text-danger-fg">
          <Trash2 size={16} /> Eliminar cuenta
        </button>
      </div>
    </form>
  );
}

/* ---- Flujo de baja de cuenta ------------------------------------------- */
type Step = "warn" | "blocked" | "processing" | "success" | "error";

function CondRow({ met, label, detail }: { met: boolean; label: string; detail: string }) {
  return (
    <li className={`flex gap-3 rounded-md border p-[12px_14px] ${met ? "border-success bg-success-fill" : "border-danger bg-danger-fill"}`}>
      <span className={`mt-px flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full ${met ? "bg-success" : "bg-danger"}`}>
        {met ? <Check size={14} className="text-white" /> : <X size={14} className="text-white" />}
      </span>
      <div className="min-w-0">
        <div className={`text-sm font-semibold leading-[1.35] ${met ? "text-success-fg" : "text-danger-fg"}`}>{label}</div>
        <div className="mt-[3px] text-[13px] leading-[1.45] text-fg-2">{detail}</div>
      </div>
    </li>
  );
}

const modalTitle = "font-display text-[21px] font-semibold text-fg-1";
const modalLead = "text-sm leading-[1.5] text-fg-2";
const condList = "flex list-none flex-col gap-2.5 p-0";
const modalActions = "flex flex-wrap justify-end gap-3";

function DeleteAccountFlow({ cuenta, onClose }: { cuenta: CuentaSesion; onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("warn");
  const [bajaTs, setBajaTs] = useState<string | null>(null);
  const { procesar } = useEliminarCuenta();
  const cond = condicionesEliminar(cuenta);
  const allMet = !cond.adminBlock && cond.items.every((i) => i.met);

  async function confirmar() {
    if (!allMet) { setStep("blocked"); return; }
    setStep("processing");
    const r = await procesar();
    if (r.ok) { setBajaTs(r.ts); setStep("success"); } else setStep("error");
  }

  if (step === "warn") {
    return (
      <Modal onClose={onClose}>
        <IconCircle tone="danger" className="mb-[18px]"><Trash2 size={26} className="text-danger-fg" /></IconCircle>
        <h3 className={`mb-2 ${modalTitle}`}>¿Querés eliminar tu cuenta?</h3>
        <p className={`mb-5 ${modalLead}`}>Vas a dar de baja la cuenta de <strong className="text-fg-1">{cuenta.nombre}</strong> ({rolLabel(cuenta.rol)}).</p>
        <Alert tone="warning" className="mb-[18px]">Esta acción <strong>no se puede deshacer</strong>. Perderás el acceso a tu historial, reservas y mensajes.</Alert>
        <div className="mb-2.5 text-[13px] leading-[1.45] text-fg-2">{cond.intro}</div>
        <ul className={`mb-6 ${condList}`}>{cond.items.map((it, i) => <CondRow key={i} {...it} />)}</ul>
        {allMet && (
          <div className="mb-[18px] flex items-center gap-[9px] rounded-md border border-green-300 bg-green-050 p-[10px_13px]">
            <CheckCircle2 size={16} className="shrink-0 text-green-800" />
            <div className="text-[13px] font-semibold text-green-800">Cumplís las condiciones para dar de baja tu cuenta.</div>
          </div>
        )}
        <div className={modalActions}>
          <Button variant="neutral" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" onClick={confirmar}><Trash2 size={16} /> Confirmo eliminar mi cuenta</Button>
        </div>
      </Modal>
    );
  }

  if (step === "blocked") {
    return (
      <Modal onClose={onClose}>
        <IconCircle tone="danger" className="mb-[18px]"><ShieldAlert size={26} className="text-danger-fg" /></IconCircle>
        <h3 className={`mb-2 ${modalTitle}`}>{cond.adminBlock ? "No es posible eliminar esta cuenta" : "Todavía no podés eliminar tu cuenta"}</h3>
        <p className={`mb-5 ${modalLead}`}>{cond.adminBlock ? cond.intro : "Para poder dar de baja tu cuenta, primero tenés que cumplir con la siguiente condición:"}</p>
        <ul className={`mb-[22px] ${condList}`}>{cond.items.map((it, i) => <CondRow key={i} {...it} />)}</ul>
        <div className={modalActions}><Button onClick={onClose}><ArrowLeft size={16} /> Entendido</Button></div>
      </Modal>
    );
  }

  if (step === "processing") {
    return (
      <Modal dismissable={false} padding="p-[40px_28px]" className="text-center">
        <Loader size={46} className="spin mx-auto mb-[18px] block text-green-800" />
        <div className="font-display text-[18px] font-semibold text-fg-1">Procesando la baja…</div>
        <div className="mt-1.5 text-[13.5px] text-fg-2">Estamos gestionando tu solicitud.</div>
      </Modal>
    );
  }

  if (step === "success") {
    return (
      <Modal dismissable={false} className="text-center">
        <IconCircle tone="success" className="mx-auto mb-[18px]"><Check size={28} className="text-success-fg" /></IconCircle>
        <h3 className={`mb-2 text-center ${modalTitle}`}>Tu cuenta ha sido eliminada</h3>
        <p className={`mb-5 text-center ${modalLead}`}>La cuenta de <strong className="text-fg-1">{cuenta.nombre}</strong> fue dada de baja correctamente.</p>
        <div className="mb-6 inline-flex items-center gap-[9px] rounded-md border border-outline-variant bg-cream-tert p-[10px_16px]">
          <CalendarClock size={17} className="text-brown-700" />
          <span className="text-[13px] text-fg-2">Fecha y hora de baja:</span>
          <span className="font-mono text-[13px] font-semibold text-fg-1">{bajaTs}</span>
        </div>
        <div className="flex justify-center">
          <Button onClick={() => router.push("/explorar")}>Continuar <ArrowRight size={16} /></Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} className="text-center">
      <IconCircle tone="danger" className="mx-auto mb-[18px]"><AlertOctagon size={26} className="text-danger-fg" /></IconCircle>
      <h3 className={`mb-2 text-center ${modalTitle}`}>No se pudo eliminar la cuenta</h3>
      <p className={`mb-5 text-center ${modalLead}`}>Ocurrió un error al procesar la baja y tu cuenta sigue activa. No se asignó fecha de baja. Volvé a intentarlo en unos minutos.</p>
      <div className="flex justify-center gap-3">
        <Button variant="neutral" onClick={onClose}>Cerrar</Button>
        <Button variant="danger" onClick={() => setStep("warn")}><RotateCcw size={16} /> Reintentar</Button>
      </div>
    </Modal>
  );
}

/* ---- Cambiar contraseña ------------------------------------------------ */
function PasswordField({ id, label, value, error, autoComplete, forgot, onChange }: { id: string; label: string; value: string; error: string; autoComplete?: string; forgot?: React.ReactNode; onChange: (v: string) => void }) {
  const [shown, setShown] = useState(false);
  return (
    <div>
      <div className="mb-[7px] flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13.5px] font-semibold text-fg-1">{label} <span className="text-danger">*</span></label>
        {forgot}
      </div>
      <TextInput id={id} icon={<Lock size={18} />} type={shown ? "text" : "password"} value={value} autoComplete={autoComplete} error={error} onChange={onChange} rightSlot={<EyeToggle shown={shown} onToggle={() => setShown((s) => !s)} />} />
      {error && <div className="mt-[7px] flex items-center gap-1.5 text-[12.5px] text-danger-fg"><AlertCircle size={14} /> {error}</div>}
    </div>
  );
}

function ChangePasswordForm({ setToast }: { setToast: (t: ToastState) => void }) {
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
    if (!r.ok) {
      if (r.code === "badActual") setActualError("La contraseña actual ingresada es incorrecta");
      else setToast({ tone: "danger", title: "No se pudo cambiar la contraseña", sub: "Intentá de nuevo en unos minutos." });
      return;
    }
    setActual(""); setNueva(""); setConfirm(""); setTouched({}); setSubmitted(false); setActualError(null);
    setToast({ tone: "success", title: "Contraseña actualizada correctamente" });
  }

  const tips = ["Mínimo 8 caracteres.", "Al menos un carácter especial.", "Evitá datos fáciles de adivinar.", "No la reutilices de otros sitios."];

  return (
    <div className="cuenta-sec-grid grid grid-cols-[minmax(0,1fr)_280px] items-start gap-7">
      <Card className="p-[28px_30px]">
        <div className="mb-[22px]">
          <h2 className="m-0 font-display text-xl font-semibold text-fg-1">Cambiar contraseña</h2>
          <p className="mt-1.5 text-[13.5px] leading-[1.5] text-fg-2">Por tu seguridad, vas a necesitar tu contraseña actual para definir una nueva.</p>
        </div>
        <form onSubmit={submit} noValidate className="flex flex-col gap-[18px]">
          <PasswordField id="cp-actual" label="Contraseña actual" value={actual} error={show("actual")} autoComplete="current-password"
            forgot={<Link href="/acceso/recuperar" className="text-[13px] font-semibold text-green-800 no-underline">¿Olvidaste tu contraseña?</Link>}
            onChange={(x) => { setActual(x); setTouched((t) => ({ ...t, actual: true })); setActualError(null); }} />

          <div className="my-0.5 h-px bg-cream-tert" />

          <div>
            <PasswordField id="cp-nueva" label="Nueva contraseña" value={nueva} error={show("nueva")} autoComplete="new-password"
              onChange={(x) => { setNueva(x); setTouched((t) => ({ ...t, nueva: true })); }} />
            {nueva && <PasswordMeter value={nueva} />}
          </div>
          <PasswordField id="cp-confirm" label="Repetí la nueva contraseña" value={confirm} error={show("confirm")} autoComplete="new-password"
            onChange={(x) => { setConfirm(x); setTouched((t) => ({ ...t, confirm: true })); }} />

          <div className="mt-1.5 flex gap-3">
            <Button type="submit" disabled={isLoading}>{isLoading ? <><Loader size={16} className="spin" /> Guardando…</> : <><Check size={16} /> Guardar</>}</Button>
          </div>
        </form>
      </Card>

      <aside className="rounded-lg border border-outline-variant bg-surface p-[20px_22px]">
        <div className="mb-3.5 flex items-center gap-[9px]">
          <ShieldCheck size={18} className="text-green-800" />
          <div className="font-display text-[15px] font-semibold text-fg-1">Una buena contraseña</div>
        </div>
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {tips.map((t) => <li key={t} className="flex gap-[9px] text-[13px] leading-[1.4] text-fg-2"><Check size={15} className="mt-px shrink-0 text-green-800" />{t}</li>)}
        </ul>
      </aside>
    </div>
  );
}

/* ---- Página ------------------------------------------------------------ */
function Inner({ cuenta, perfil, initialTab }: { cuenta: CuentaSesion; perfil: Perfil; initialTab: "datos" | "seguridad" }) {
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [tab, setTab] = useState<"datos" | "seguridad">(initialTab);

  function notify(t: ToastState) { setToast(t); if (t) setTimeout(() => setToast((cur) => (cur === t ? null : cur)), 4000); }
  const tabBtn = (id: "datos" | "seguridad", label: string, Icon: typeof UserCog) => {
    const on = tab === id;
    return (
      <button type="button" onClick={() => setTab(id)} className={`-mb-px inline-flex cursor-pointer items-center gap-2 border-b-2 bg-transparent p-[12px_14px] font-sans text-[14.5px] ${on ? "border-green-800 font-semibold text-green-800" : "border-transparent font-medium text-fg-2"}`}>
        <Icon size={16} /> {label}
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-[820px] p-[40px_28px_80px]">
      <div className="mb-[26px]">
        <div className="mb-4 inline-flex items-center gap-2 rounded-pill border border-sand bg-cream-tert p-[6px_13px] text-[12.5px] font-semibold text-brown-700"><UserCog size={14} /> {rolLabel(cuenta.rol)}</div>
        <h1 className="m-0 font-display text-[32px] font-bold tracking-[-0.01em] text-fg-1">Mi cuenta</h1>
        <p className="mt-2.5 text-[15.5px] leading-[1.5] text-fg-2">Actualizá tus datos personales, cambiá tu contraseña o gestioná la baja de tu cuenta.</p>
      </div>

      <nav className="mb-[22px] flex gap-1 border-b border-outline-variant">
        {tabBtn("datos", "Datos personales", UserCog)}
        {tabBtn("seguridad", "Acceso y seguridad", ShieldCheck)}
      </nav>

      {tab === "datos" ? (
        <Card className="p-[28px_30px]">
          <DatosPersonalesForm inicial={perfil} onDelete={() => setDeleting(true)} setToast={notify} />
        </Card>
      ) : (
        <ChangePasswordForm setToast={notify} />
      )}

      {deleting && <DeleteAccountFlow cuenta={cuenta} onClose={() => setDeleting(false)} />}
      {toast && <Toast {...toast} />}
      <style>{`@media (max-width: 680px){ .cuenta-sec-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

export default function CuentaClient({ initialTab = "datos" }: { initialTab?: "datos" | "seguridad" }) {
  const router = useRouter();
  const { cuenta, perfil, isLoading, error, unauthenticated, reload } = usePerfil();

  // Ruta protegida: sin sesión, a la pantalla de login.
  useEffect(() => {
    if (unauthenticated) router.replace("/acceso");
  }, [unauthenticated, router]);

  return (
    <>
      <SiteHeader />
      {unauthenticated ? (
        <div className="p-[120px_28px] text-center text-fg-3">
          <Loader size={26} className="spin" />
          <div className="mt-3 text-sm">Redirigiendo…</div>
        </div>
      ) : (
        <AsyncBoundary loading={isLoading} error={error} onRetry={reload} loadingLabel="Cargando tu cuenta…">
          {cuenta && perfil && <Inner cuenta={cuenta} perfil={perfil} initialTab={initialTab} />}
        </AsyncBoundary>
      )}
    </>
  );
}
