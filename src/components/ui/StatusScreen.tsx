"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, LogIn, RotateCcw, SearchX, ShieldAlert, WifiOff } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/Button";
import { MENSAJE_FALLA, type Falla } from "@/lib/errores";
import { rutaAcceso, rutaActual } from "@/lib/volver";
import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const FONDO: Record<Tone, string> = {
  success: "bg-success-fill text-success-fg",
  warning: "bg-warning-fill text-warning-fg",
  danger: "bg-danger-fill text-danger-fg",
  info: "bg-info-fill text-info-fg",
  neutral: "bg-cream-tert text-fg-3",
};

/**
 * Pantalla de estado: un ícono, un título, una línea de texto y un único CTA.
 * Es la base de las de abajo; una pantalla nueva no debería necesitarla directo.
 */
export function StatusScreen({
  tone,
  icon,
  title,
  children,
  action,
  framed = true,
  heading: Heading = "h1",
  className,
}: {
  /** `h2` cuando la pantalla ocupa sólo una sección (un error de carga dentro de una página). */
  heading?: "h1" | "h2";
  tone: Tone;
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  /** Con caja (dentro de una página) o suelta (pantalla entera, como el resultado del login). */
  framed?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-160 px-4 py-16 sm:px-7", className)}>
      <div
        className={cn(
          "flex flex-col items-center gap-3 text-center",
          framed && "rounded-lg border border-outline-variant bg-surface px-6 py-14 sm:px-8",
        )}
      >
        <div aria-hidden className={cn("flex size-16 items-center justify-center rounded-full [&_svg]:size-7", FONDO[tone])}>
          {icon}
        </div>
        <Heading className="m-0 font-display text-2xl font-bold text-fg-1">{title}</Heading>
        {children && <div className="max-w-110 text-[14.5px] leading-relaxed text-fg-2">{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}

/**
 * Sin permiso para la pantalla entera. Se queda en la URL para que se entienda
 * qué pasó. Para una acción sin permiso no va esto: va el botón deshabilitado
 * con `disabledReason`.
 */
export function ForbiddenScreen({
  motivo = MENSAJE_FALLA.permiso.mensaje,
  volver = { href: "/explorar", label: "Volver al inicio" },
}: {
  motivo?: string;
  volver?: { href: string; label: string };
}) {
  return (
    <StatusScreen
      tone="warning"
      icon={<ShieldAlert />}
      title="No tenés acceso a esta sección"
      action={<Link href={volver.href} className={buttonClasses()}>{volver.label}</Link>}
    >
      {motivo}
    </StatusScreen>
  );
}

/**
 * No existe lo que se pidió: una ruta inexistente, o un id inexistente o ajeno.
 * `cosa` va con artículo: "esta receta", "ese establecimiento".
 */
export function NotFoundScreen({
  cosa,
  motivo = MENSAJE_FALLA.noEncontrado.mensaje,
  volver = { href: "/", label: "Ir al inicio" },
}: {
  cosa?: string;
  motivo?: string;
  volver?: { href: string; label: string };
}) {
  return (
    <StatusScreen
      tone="neutral"
      icon={<SearchX />}
      title={cosa ? `No encontramos ${cosa}` : "No encontramos esta página"}
      action={<Link href={volver.href} className={buttonClasses()}>{volver.label}</Link>}
    >
      {motivo}
    </StatusScreen>
  );
}

/**
 * Falló una lectura. El texto sale del tipo de falla (`clasificarError`), nunca
 * del mensaje técnico: ése va a la consola.
 *
 * Con falla de sesión ofrece iniciar sesión (con vuelta a esta pantalla) en vez
 * de reintentar, que no serviría.
 */
export function ErrorScreen({
  falla,
  onRetry,
  framed = false,
}: {
  falla?: Falla | null;
  onRetry?: () => void;
  framed?: boolean;
}) {
  const tipo = falla?.tipo ?? "servidor";
  const base = tipo === "dominio" ? MENSAJE_FALLA.servidor : MENSAJE_FALLA[tipo];
  const mensaje = falla?.mensaje ?? base.mensaje;

  const action =
    tipo === "sesion" ? (
      // La ruta de vuelta se arma al tocar: en el render del servidor no hay `window`.
      <Button onClick={() => window.location.assign(rutaAcceso({ volver: rutaActual() }))}>
        <LogIn className="size-4" aria-hidden /> Iniciar sesión
      </Button>
    ) : onRetry ? (
      <Button onClick={onRetry}>
        <RotateCcw className="size-4" aria-hidden /> Reintentar
      </Button>
    ) : undefined;

  return (
    <StatusScreen
      tone="danger"
      icon={tipo === "red" ? <WifiOff /> : <AlertTriangle />}
      title={base.titulo}
      action={action}
      framed={framed}
      // Casi siempre reemplaza una sección, no la página: el h1 de la página sigue arriba.
      heading="h2"
    >
      {mensaje}
    </StatusScreen>
  );
}

/**
 * Termina un proceso que cambia de contexto: login, alta enviada, pago,
 * reprogramación. Un único CTA, que es a dónde sigue el usuario.
 */
export function ResultScreen({
  tone = "success",
  icon,
  title,
  children,
  action,
}: {
  tone?: "success" | "warning" | "danger";
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action: ReactNode;
}) {
  return (
    <StatusScreen
      tone={tone}
      icon={icon ?? (tone === "success" ? <CheckCircle2 /> : <AlertTriangle />)}
      title={title}
      action={action}
      framed={false}
    >
      {children}
    </StatusScreen>
  );
}
