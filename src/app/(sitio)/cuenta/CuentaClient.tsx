"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserCog, ShieldCheck } from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import DatosPersonalesForm from "./components/DatosPersonalesForm";
import ChangePasswordForm from "./components/ChangePasswordForm";
import DeleteAccountFlow from "./components/DeleteAccountFlow";
import type { CuentaSesion, Perfil } from "@/data/cuenta";
import { usePerfil } from "@/hooks/usePerfil";
import { ordenarRoles } from "@/lib/roles";
import { Card, Skeleton } from "@/components/ui";

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
  const [tab, setTab] = useState<Tab>(initialTab);

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
        <div className="flex flex-row gap-1 mb-4">
          {ordenarRoles(cuenta.roles).map((rol) => (
            <div
              className="inline-flex items-center gap-2 rounded-pill border border-sand bg-cream-tert p-[6px_13px] text-[12.5px] font-semibold text-brown-700"
              key={rol}
            >
              <UserCog size={14} /> {rol}
            </div>
          ))}
        </div>
        <h1 className="m-0 font-display text-[32px] font-bold tracking-[-0.01em] text-fg-1">
          Mi cuenta
        </h1>
        <p className="mt-2.5 text-[15.5px] leading-[1.5] text-fg-2">
          Actualizá tus datos personales, cambiá tu contraseña o gestioná la
          baja de tu cuenta.
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
          />
        </Card>
      ) : (
        <ChangePasswordForm />
      )}

      {deleting && (
        <DeleteAccountFlow
          nombre={cuenta.nombre}
          onClose={() => setDeleting(false)}
        />
      )}
    </div>
  );
}

function CamposSkeleton({ n }: { n: number }) {
  return (
    <Card className="flex flex-col gap-5 p-[28px_30px]">
      {Array.from({ length: n }, (_, i) => (
        <div key={i}>
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="mt-2 h-11" />
        </div>
      ))}
    </Card>
  );
}

/** Misma caja que `Inner`, para que la pantalla no salte al llegar la cuenta. */
function CuentaSkeleton({ tab }: { tab: Tab }) {
  return (
    <div role="status" aria-busy aria-label="Cargando tu cuenta…" className="mx-auto max-w-[820px] p-[40px_28px_80px]">
      <div className="mb-[26px]">
        <Skeleton className="mb-4 h-7 w-28 rounded-pill" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-3 h-4 w-3/4" />
      </div>
      <div className="mb-[22px] flex gap-4 border-b border-outline-variant pb-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-5 w-40" />
      </div>
      {tab === "datos" ? (
        <CamposSkeleton n={4} />
      ) : (
        // Como `ChangePasswordForm`: el formulario y la tarjeta de consejos al costado.
        <div className="grid grid-cols-1 items-start gap-7 min-[681px]:grid-cols-[minmax(0,1fr)_280px]">
          <CamposSkeleton n={3} />
          <Card className="flex flex-col gap-3 p-5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3.5" />
            <Skeleton className="h-3.5 w-4/5" />
          </Card>
        </div>
      )}
    </div>
  );
}

export default function CuentaClient({
  initialTab = "datos",
}: {
  initialTab?: Tab;
}) {
  const router = useRouter();
  const { cuenta, perfil, isLoading, error, unauthenticated, reload } =
    usePerfil();

  // Ruta protegida: sin sesión, a la pantalla de login. Sólo si la cuenta no
  // llegó a cargarse: la baja cierra la sesión apenas se confirma, y el modal
  // de "cuenta eliminada" tiene que seguir a la vista hasta que se cierre.
  const sinSesion = unauthenticated && !cuenta;
  useEffect(() => {
    if (sinSesion) router.replace("/acceso");
  }, [sinSesion, router]);

  return (
    <>
      {/* Mientras redirige no se dibuja nada, como en los guards de sesión. */}
      {sinSesion ? null : (
        <AsyncBoundary
          loading={isLoading}
          error={error}
          onRetry={reload}
          skeleton={<CuentaSkeleton tab={initialTab} />}
        >
          {cuenta && perfil && (
            <Inner cuenta={cuenta} perfil={perfil} initialTab={initialTab} />
          )}
        </AsyncBoundary>
      )}
    </>
  );
}
