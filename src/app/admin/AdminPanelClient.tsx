"use client";

import Link from "next/link";
import { UserCog, ShieldCheck, Warehouse, Ban, ArrowRight } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { buttonClasses } from "@/components/ui/Button";
import AsyncBoundary from "@/components/AsyncBoundary";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminResumen } from "@/hooks/useAdminResumen";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

function Stat({ icon, value, label, danger }: { icon: React.ReactNode; value: number; label: string; danger?: boolean }) {
  return (
    <Card className="flex items-center gap-3.5 px-[22px] py-5">
      <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl", danger ? "bg-danger-fill" : "bg-green-050")}>{icon}</span>
      <span>
        <span className="block font-mono text-[28px] leading-none font-bold text-fg-1">{value}</span>
        <span className="mt-[5px] block text-[14.5px] text-fg-2">{label}</span>
      </span>
    </Card>
  );
}

function AccessCard({ icon, title, desc, href, cta }: { icon: React.ReactNode; title: string; desc: string; href: string; cta: string }) {
  return (
    <Link
      href={href}
      className="flex h-full flex-col rounded-lg border border-outline-variant bg-surface p-[26px] no-underline transition-[box-shadow,border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-sand hover:shadow-hover"
    >
      <span className="mb-4 flex size-[52px] items-center justify-center rounded-[13px] border border-green-300 bg-green-050">{icon}</span>
      <h3 className="m-0 font-display text-[21px] font-bold text-fg-1">{title}</h3>
      <p className="mt-2 mb-[18px] flex-1 text-[15.5px] leading-[1.55] text-fg-2">{desc}</p>
      <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-green-800">{cta} <ArrowRight size={17} className="text-green-800" /></span>
    </Link>
  );
}

/** Misma grilla que el contenido, para que nada salte cuando llegan los números. */
function ResumenSkeleton() {
  return (
    <div aria-busy aria-label="Cargando el resumen…">
      <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[90px] rounded-lg" />)}
      </div>
      <Skeleton className="mt-8 mb-4 h-7 w-64" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[230px] rounded-lg" />)}
      </div>
    </div>
  );
}

export default function AdminPanelClient() {
  const { data, isLoading, error, reload } = useAdminResumen();
  const nombre = useAuthStore((s) => s.nombre);
  // El saludo va por el nombre de pila; hasta que rehidrate la sesión, sin nombre.
  const primerNombre = nombre?.trim().split(/\s+/)[0];

  return (
    <div className="mx-auto max-w-[1180px] px-7 pt-8 pb-20">
      {/* La cabecera no depende del resumen: se pinta desde el primer frame. */}
      <div className="mb-7">
        <div className="t-label mb-2.5 text-brown-700">Panel del sistema</div>
        <h1 className="m-0 font-display text-[38px] font-bold tracking-[-0.01em] text-fg-1">{primerNombre ? `Hola, ${primerNombre}` : "Hola"}</h1>
        <p className="mt-2.5 mb-0 max-w-[680px] text-[17px] leading-normal text-fg-2">Este es el estado general de la plataforma. Desde acá gestionás el equipo de administración, sus permisos y los establecimientos.</p>
      </div>

      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} skeleton={<ResumenSkeleton />}>
        {data && (
          <>
            <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
              <Stat icon={<UserCog size={22} className="text-green-800" />} value={data.adminCount} label="Administradores activos" />
              <Stat icon={<ShieldCheck size={22} className="text-green-800" />} value={data.rolesActivos} label="Roles de administrador" />
              <Stat icon={<Warehouse size={22} className="text-green-800" />} value={data.estActivos} label="Establecimientos activos" />
              <Stat icon={<Ban size={22} className={data.estSusp > 0 ? "text-danger" : "text-green-800"} />} value={data.estSusp} label="Establecimientos suspendidos" danger={data.estSusp > 0} />
            </div>

            {data.estSusp > 0 && (
              <Alert tone="warning" className="mb-8">
                <div className="font-semibold">{data.estSusp === 1 ? "Hay 1 establecimiento suspendido" : `Hay ${data.estSusp} establecimientos suspendidos`}</div>
                {data.suspendidos.length > 0 && (
                  <div className="mt-[3px] break-words">{data.suspendidos.map((e) => e.nombre).join(" · ")}</div>
                )}
                <Link href="/admin/establecimientos" className={buttonClasses({ variant: "text", className: "mt-2" })}>Revisar <ArrowRight size={16} /></Link>
              </Alert>
            )}

            <h2 className={cn("mb-4 font-display text-2xl font-bold text-fg-1", data.estSusp > 0 ? "mt-0" : "mt-8")}>Gestiones del sistema</h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
              <AccessCard icon={<UserCog size={25} className="text-green-800" />} title="Administradores" desc={`${data.adminCount} activos. Sumá personas al equipo, cambiá su rol o dalas de baja.`} href="/admin/administradores" cta="Gestionar administradores" />
              <AccessCard icon={<ShieldCheck size={25} className="text-green-800" />} title="Roles de administrador" desc={`${data.rolesActivos} roles activos. Definí qué puede hacer cada administrador dentro del sistema.`} href="/admin/roles" cta="Gestionar roles" />
              <AccessCard icon={<Warehouse size={25} className="text-green-800" />} title="Establecimientos" desc={`${data.estActivos} activos. Supervisá la plataforma y suspendé los que incumplan las normas.`} href="/admin/establecimientos" cta="Ver establecimientos" />
            </div>
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}
