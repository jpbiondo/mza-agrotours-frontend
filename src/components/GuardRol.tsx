"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ForbiddenScreen } from "@/components/ui/StatusScreen";
import type { Permiso } from "@/lib/permisos";
import { tienePermiso, tieneTipoPermiso } from "@/lib/roles";
import { rutaAcceso, rutaActual } from "@/lib/volver";
import { useAuthStore } from "@/stores/authStore";
import type { Rol } from "@/types/auth";

const MOTIVO: Record<Rol, string> = {
  admin: "Esta sección es sólo para administradores del sistema.",
  productor:
    "Esta sección es sólo para productores. Si diste de alta un establecimiento, vas a poder entrar cuando se apruebe la solicitud.",
  visitante: "Necesitás una cuenta para ver esta sección.",
};

/** Tiene el rol pero no el permiso fino: el motivo es otro. */
const SIN_PERMISO =
  "Tu rol no incluye acceso a esta sección. Pedile a un administrador que te lo habilite.";

/**
 * El aviso no dibuja chrome: lo pone el layout que envuelve al guard. Antes acá
 * se renderizaba el <SiteHeader>, y como /admin y /panel montan el guard en su
 * layout, la primera pintura de esas rutas era la barra del sitio público antes
 * de saltar al sidebar que corresponde.
 *
 * Se exporta para las pantallas que no pueden resolver el acceso en la ruta: los
 * permisos de PRODUCTOR valen por establecimiento, y cuál está activo lo sabe
 * recién el cliente, cuando rehidrata el store del switcher.
 *
 * @deprecated Es un alias de `<ForbiddenScreen>` (`components/ui/StatusScreen`);
 * en código nuevo, usar ése.
 */
export function SinPermiso({ motivo }: { motivo: string }) {
  return <ForbiddenScreen motivo={motivo} />;
}

/**
 * Deja pasar sólo si la cuenta en sesión tiene `rol` y, si se pide, el permiso
 * fino. Sin sesión redirige a /acceso con `?volver=`, para regresar acá después
 * del login; con sesión pero sin acceso muestra el aviso sin sacar al usuario
 * de la URL, para que entienda qué pasó.
 *
 * Es control de navegación, no de seguridad: los accesos salen del store
 * persistido y se pueden editar desde el navegador. La barrera real es que el
 * backend rechace los requests (ver `tieneTipoPermiso`).
 */
export default function GuardRol({
  rol,
  permiso,
  children,
}: {
  rol: Rol;
  /** Permiso adicional, p. ej. `PermisoAdmin.LEER_ADMIN`. Sin él alcanza con el rol. */
  permiso?: Permiso;
  children: ReactNode;
}) {
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const nombre = useAuthStore((s) => s.nombre);
  const roles = useAuthStore((s) => s.roles);
  const accesos = useAuthStore((s) => s.accesos);

  const sinSesion = hasHydrated && !nombre;

  useEffect(() => {
    // La ruta se lee de `window` y no de `useSearchParams`: este guard vive en
    // layouts que se prerenderizan, y ese hook exigiría un <Suspense> alrededor.
    if (sinSesion) router.replace(rutaAcceso({ volver: rutaActual() }));
  }, [sinSesion, router]);

  // Los dos estados de espera no dibujan nada. Antes de rehidratar no se sabe
  // nada de la sesión, pero eso dura el frame que va entre pintar y leer
  // localStorage: un cartel que aparece y desaparece se lee como que algo
  // tardó, y el vacío se lee como instantáneo. Sin sesión pasa lo mismo, con la
  // navegación a /acceso ya en curso.
  //
  // Mostrar el aviso de sin acceso acá tampoco serviría: parpadearía en cada
  // carga incluso para quien sí tiene acceso.
  if (!hasHydrated || sinSesion) return null;
  if (!tieneTipoPermiso(roles, rol)) return <SinPermiso motivo={MOTIVO[rol]} />;
  if (permiso && !tienePermiso(accesos, permiso))
    return <SinPermiso motivo={SIN_PERMISO} />;

  return <>{children}</>;
}
