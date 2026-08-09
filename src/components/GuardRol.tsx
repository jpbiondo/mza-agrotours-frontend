"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader, ShieldAlert } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { puede, tieneRol } from "@/lib/roles";
import { useAuthStore } from "@/stores/authStore";
import type { Rol } from "@/types/auth";

const MOTIVO: Record<Rol, string> = {
  admin: "Esta sección es sólo para administradores del sistema.",
  productor:
    "Esta sección es sólo para productores. Si diste de alta un establecimiento, vas a poder entrar cuando se apruebe la solicitud.",
  visitante: "Necesitás una cuenta para ver esta sección.",
};

/** Tiene el rol pero no el permiso fino: el motivo es otro. */
const SIN_PERMISO = "Tu rol no incluye acceso a esta sección. Pedile a un administrador que te lo habilite.";

function Centrado({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-bg">
      <SiteHeader />
      {children}
    </div>
  );
}

function Cargando({ texto }: { texto: string }) {
  return (
    <Centrado>
      <div className="px-7 py-[120px] text-center text-fg-3">
        <Loader size={26} className="spin" />
        <div className="mt-3 text-sm">{texto}</div>
      </div>
    </Centrado>
  );
}

function SinPermiso({ motivo }: { motivo: string }) {
  return (
    <Centrado>
      <div className="mx-auto max-w-[640px] px-7 pt-16 pb-24">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-outline-variant bg-surface px-8 py-14 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-warning-fill">
            <ShieldAlert className="size-7 text-warning-fg" />
          </div>
          <h1 className="font-display text-[24px] font-bold text-fg-1">
            No tenés acceso a esta sección
          </h1>
          <p className="max-w-[440px] text-[14.5px] leading-relaxed text-fg-2">{motivo}</p>
          <Link href="/explorar" className="btn btn-primary mt-2 inline-flex no-underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    </Centrado>
  );
}

/**
 * Deja pasar sólo si la cuenta en sesión tiene `rol` y, si se pide, el permiso
 * fino. Sin sesión redirige a /acceso; con sesión pero sin acceso muestra el
 * aviso sin sacar al usuario de la URL, para que entienda qué pasó.
 *
 * Es control de navegación, no de seguridad: los accesos salen del store
 * persistido y se pueden editar desde el navegador. La barrera real es que el
 * backend rechace los requests (ver `tieneRol`).
 */
export default function GuardRol({
  rol,
  permiso,
  children,
}: {
  rol: Rol;
  /** Permiso adicional, p. ej. "LEER_ADMIN". Sin él alcanza con el rol. */
  permiso?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const nombre = useAuthStore((s) => s.nombre);
  const roles = useAuthStore((s) => s.roles);
  const accesos = useAuthStore((s) => s.accesos);

  const sinSesion = hasHydrated && !nombre;

  useEffect(() => {
    if (sinSesion) router.replace("/acceso");
  }, [sinSesion, router]);

  // Antes de rehidratar no se sabe nada: mostrar el aviso acá haría que parpadee
  // en cada carga incluso para quien sí tiene acceso.
  if (!hasHydrated) return <Cargando texto="Verificando tu sesión…" />;
  if (sinSesion) return <Cargando texto="Redirigiendo…" />;
  if (!tieneRol(roles, rol)) return <SinPermiso motivo={MOTIVO[rol]} />;
  if (permiso && !puede(accesos, permiso)) return <SinPermiso motivo={SIN_PERMISO} />;

  return <>{children}</>;
}
