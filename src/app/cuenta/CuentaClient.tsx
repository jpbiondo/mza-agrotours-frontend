"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader, UserCog, ShieldCheck } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import AsyncBoundary from "@/components/AsyncBoundary";
import DatosPersonalesForm from "./components/DatosPersonalesForm";
import ChangePasswordForm from "./components/ChangePasswordForm";
import DeleteAccountFlow from "./components/DeleteAccountFlow";
import { rolLabel } from "@/data/cuenta";
import type { CuentaSesion, Perfil } from "@/data/cuenta";
import { usePerfil } from "@/hooks/usePerfil";
import { Card, Toast } from "@/components/ui";
import type { ToastData } from "@/components/ui";

type ToastState = ToastData | null;
type Tab = "datos" | "seguridad";

function Inner({
  cuenta,
  perfil,
  initialTab,
}: {
  cuenta: CuentaSesion;
  perfil: Perfil;
  initialTab: Tab;
}) {
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [tab, setTab] = useState<Tab>(initialTab);

  function notify(t: ToastState) {
    setToast(t);
    if (t) setTimeout(() => setToast((cur) => (cur === t ? null : cur)), 4000);
  }

  const tabBtn = (id: Tab, label: string, Icon: typeof UserCog) => {
    const on = tab === id;
    return (
      <button
        type="button"
        onClick={() => setTab(id)}
        className={`-mb-px inline-flex cursor-pointer items-center gap-2 border-b-2 bg-transparent p-[12px_14px] font-sans text-[14.5px] ${on ? "border-green-800 font-semibold text-green-800" : "border-transparent font-medium text-fg-2"}`}
      >
        <Icon size={16} /> {label}
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-[820px] p-[40px_28px_80px]">
      <div className="mb-[26px]">
        <div className="mb-4 inline-flex items-center gap-2 rounded-pill border border-sand bg-cream-tert p-[6px_13px] text-[12.5px] font-semibold text-brown-700">
          <UserCog size={14} /> {rolLabel(cuenta.rol)}
        </div>
        <h1 className="m-0 font-display text-[32px] font-bold tracking-[-0.01em] text-fg-1">
          Mi cuenta
        </h1>
        <p className="mt-2.5 text-[15.5px] leading-[1.5] text-fg-2">
          Actualizá tus datos personales, cambiá tu contraseña o gestioná la baja de tu cuenta.
        </p>
      </div>

      <nav className="mb-[22px] flex gap-1 border-b border-outline-variant">
        {tabBtn("datos", "Datos personales", UserCog)}
        {tabBtn("seguridad", "Acceso y seguridad", ShieldCheck)}
      </nav>

      {tab === "datos" ? (
        <Card className="p-[28px_30px]">
          <DatosPersonalesForm
            inicial={perfil}
            onDelete={() => setDeleting(true)}
            setToast={notify}
          />
        </Card>
      ) : (
        <ChangePasswordForm setToast={notify} />
      )}

      {deleting && (
        <DeleteAccountFlow cuenta={cuenta} onClose={() => setDeleting(false)} />
      )}
      {toast && <Toast {...toast} />}
    </div>
  );
}

export default function CuentaClient({ initialTab = "datos" }: { initialTab?: Tab }) {
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
        <AsyncBoundary
          loading={isLoading}
          error={error}
          onRetry={reload}
          loadingLabel="Cargando tu cuenta…"
        >
          {cuenta && perfil && (
            <Inner cuenta={cuenta} perfil={perfil} initialTab={initialTab} />
          )}
        </AsyncBoundary>
      )}
    </>
  );
}
