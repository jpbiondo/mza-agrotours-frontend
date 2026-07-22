"use client";

import { useEffect, useState } from "react";
import {
  Trash2, ShieldAlert, Check, X, CheckCircle2, ArrowLeft, Loader,
  CalendarClock, ArrowRight, AlertOctagon, RotateCcw,
} from "lucide-react";
import { Modal, Alert, Button, IconCircle } from "@/components/ui";
import { condicionIncumplidaMsg, esBloqueoAdmin, rolLabel } from "@/data/cuenta";
import type { CondicionIncumplida, CuentaSesion } from "@/data/cuenta";
import { useEliminarCuenta, useVerificarCondicionesBaja } from "@/hooks/usePerfil";
import { cerrarSesion } from "@/hooks/useAuth";

type Step = "checking" | "warn" | "blocked" | "processing" | "success" | "error";

/** Fila de una condición incumplida (siempre en rojo: son las que faltan). */
function CondRow({ label, detail }: { label: string; detail: string }) {
  return (
    <li className="flex gap-3 rounded-md border border-danger bg-danger-fill p-[12px_14px]">
      <span className="mt-px flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-danger">
        <X size={14} className="text-white" />
      </span>
      <div className="min-w-0">
        <div className="text-sm font-semibold leading-[1.35] text-danger-fg">{label}</div>
        <div className="mt-[3px] text-[13px] leading-[1.45] text-fg-2">{detail}</div>
      </div>
    </li>
  );
}

const modalTitle = "font-display text-[21px] font-semibold text-fg-1";
const modalLead = "text-sm leading-[1.5] text-fg-2";
const condList = "flex list-none flex-col gap-2.5 p-0";
const modalActions = "flex flex-wrap justify-end gap-3";

export default function DeleteAccountFlow({ cuenta, onClose }: { cuenta: CuentaSesion; onClose: () => void }) {
  const [step, setStep] = useState<Step>("checking");
  const [bajaTs, setBajaTs] = useState<string | null>(null);
  const [condiciones, setCondiciones] = useState<CondicionIncumplida[]>([]);
  const { verificar } = useVerificarCondicionesBaja();
  const { procesar } = useEliminarCuenta();

  function aplicar(res: { ok: boolean; condiciones: CondicionIncumplida[] }) {
    if (res.ok) {
      setStep("warn");
    } else {
      setCondiciones(res.condiciones);
      setStep("blocked");
    }
  }

  // Al abrir, el backend decide si la cuenta cumple las condiciones para la baja.
  useEffect(() => {
    let active = true;
    verificar()
      .then((res) => { if (active) aplicar(res); })
      .catch(() => { if (active) setStep("error"); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reintentarCheck() {
    setStep("checking");
    verificar()
      .then(aplicar)
      .catch(() => setStep("error"));
  }

  async function confirmar() {
    setStep("processing");
    const r = await procesar();
    if (r.ok) { setBajaTs(r.ts); setStep("success"); } else setStep("error");
  }

  if (step === "checking") {
    return (
      <Modal dismissable={false} padding="p-[40px_28px]" className="text-center">
        <Loader size={46} className="spin mx-auto mb-[18px] block text-green-800" />
        <div className="font-display text-[18px] font-semibold text-fg-1">Verificando condiciones…</div>
        <div className="mt-1.5 text-[13.5px] text-fg-2">Estamos comprobando si tu cuenta puede darse de baja.</div>
      </Modal>
    );
  }

  if (step === "warn") {
    return (
      <Modal onClose={onClose}>
        <IconCircle tone="danger" className="mb-[18px]"><Trash2 size={26} className="text-danger-fg" /></IconCircle>
        <h3 className={`mb-2 ${modalTitle}`}>¿Querés eliminar tu cuenta?</h3>
        <p className={`mb-5 ${modalLead}`}>Vas a dar de baja la cuenta de <strong className="text-fg-1">{cuenta.nombre}</strong> ({rolLabel(cuenta.rol)}).</p>
        <Alert tone="warning" className="mb-[18px]">Esta acción <strong>no se puede deshacer</strong>. Perderás el acceso a tu historial, reservas y mensajes.</Alert>
        <div className="mb-[18px] flex items-center gap-[9px] rounded-md border border-green-300 bg-green-050 p-[10px_13px]">
          <CheckCircle2 size={16} className="shrink-0 text-green-800" />
          <div className="text-[13px] font-semibold text-green-800">Cumplís las condiciones para dar de baja tu cuenta.</div>
        </div>
        <div className={modalActions}>
          <Button variant="neutral" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" onClick={confirmar}><Trash2 size={16} /> Confirmo eliminar mi cuenta</Button>
        </div>
      </Modal>
    );
  }

  if (step === "blocked") {
    const adminBlock = esBloqueoAdmin(condiciones);
    const varias = condiciones.length > 1;
    return (
      <Modal onClose={onClose}>
        <IconCircle tone="danger" className="mb-[18px]"><ShieldAlert size={26} className="text-danger-fg" /></IconCircle>
        <h3 className={`mb-2 ${modalTitle}`}>{adminBlock ? "No es posible eliminar esta cuenta" : "Todavía no podés eliminar tu cuenta"}</h3>
        <p className={`mb-5 ${modalLead}`}>
          {adminBlock
            ? "Las cuentas con rol de administrador no pueden darse de baja a sí mismas."
            : varias
              ? "Para poder dar de baja tu cuenta, primero tenés que cumplir con estas condiciones:"
              : "Para poder dar de baja tu cuenta, primero tenés que cumplir con la siguiente condición:"}
        </p>
        <ul className={`mb-[22px] ${condList}`}>
          {condiciones.map((c, i) => {
            const m = condicionIncumplidaMsg(c);
            return <CondRow key={i} label={m.label} detail={m.detail} />;
          })}
        </ul>
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
          <Button onClick={() => cerrarSesion("/explorar")}>Continuar <ArrowRight size={16} /></Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} className="text-center">
      <IconCircle tone="danger" className="mx-auto mb-[18px]"><AlertOctagon size={26} className="text-danger-fg" /></IconCircle>
      <h3 className={`mb-2 text-center ${modalTitle}`}>No se pudo completar la operación</h3>
      <p className={`mb-5 text-center ${modalLead}`}>Ocurrió un error y tu cuenta sigue activa. Volvé a intentarlo en unos minutos.</p>
      <div className="flex justify-center gap-3">
        <Button variant="neutral" onClick={onClose}>Cerrar</Button>
        <Button variant="danger" onClick={reintentarCheck}><RotateCcw size={16} /> Reintentar</Button>
      </div>
    </Modal>
  );
}
