"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { UserX } from "lucide-react";
import { fmtFecha } from "@/lib/format";
import { useEstablecimientos } from "@/hooks/useEstablecimientos";
import type { EstablecimientoAcceso } from "@/lib/roles";

function AccesoSuspendido({
  establecimiento,
  otros,
  onElegir,
}: {
  establecimiento: EstablecimientoAcceso;
  /** Establecimientos donde sí puede trabajar, para ofrecerle el cambio. */
  otros: EstablecimientoAcceso[];
  onElegir: (id: string) => void;
}) {
  return (
    <div className="mx-auto max-w-[640px] px-7 pt-16 pb-24">
      <div className="flex flex-col items-center gap-3 rounded-lg border border-outline-variant bg-surface px-8 py-14 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-danger-fill">
          <UserX className="size-7 text-danger-fg" />
        </div>
        <h1 className="font-display text-[24px] font-bold text-fg-1">
          Tu acceso está suspendido
        </h1>
        <p className="max-w-[440px] text-[14.5px] leading-relaxed text-fg-2">
          No podés ver ni gestionar los datos de{" "}
          <strong className="font-semibold text-fg-1">{establecimiento.nombre}</strong> hasta el{" "}
          <strong className="font-semibold text-fg-1">
            {fmtFecha(establecimiento.suspension?.fechaHoraFin ?? null)}
          </strong>
          .
        </p>
        <p className="max-w-[440px] text-[13.5px] leading-relaxed text-fg-3">
          Seguís formando parte del establecimiento y conservás tu rol: el acceso se restablece
          solo cuando termina la suspensión. Si creés que es un error, hablá con quien lidera el
          establecimiento.
        </p>

        {otros.length > 0 && (
          <div className="mt-4 w-full max-w-[440px] border-t border-outline-variant pt-4">
            <p className="text-[13.5px] text-fg-2">
              {otros.length === 1
                ? "Podés seguir trabajando en tu otro establecimiento:"
                : "Podés seguir trabajando en tus otros establecimientos:"}
            </p>
            <div className="mt-2.5 flex flex-wrap justify-center gap-2">
              {otros.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onElegir(e.id)}
                  className="cursor-pointer rounded-md border border-outline-variant bg-surface px-3.5 py-2 text-[13.5px] font-semibold text-green-800 shadow-[inset_0_-2px_0_var(--green-100)] transition-colors hover:bg-cream-tert"
                >
                  Ir a {e.nombre}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* "Volver al inicio" y no "Volver a explorar": la barra del shell ya
            tiene ese botón, y repetir la etiqueta en la misma pantalla se lee
            como dos acciones distintas. Es además la salida de <SinPermiso>. */}
        <Link href="/explorar" className="btn btn-primary mt-4 inline-flex no-underline">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

/**
 * Cierra el panel entero mientras la cuenta esté suspendida en el
 * establecimiento activo. A diferencia de `GuardEstablecimientoSuspendido` —que
 * deja leer y sólo corta la escritura— acá no pasa nada: un productor suspendido
 * no puede ni ver los datos del establecimiento.
 *
 * No redirige ni saca de la URL, por lo mismo que `GuardRol`: el usuario tiene
 * que entender qué pasó. Y no puede redirigir aunque quisiera, porque la
 * suspensión es por establecimiento —se puede estar suspendido en una finca y
 * activo en otra— y el switcher del shell, que queda vivo detrás de este cartel,
 * es la salida.
 *
 * Se espera a `listo` antes de decidir: hasta que rehidratan los stores, `activo`
 * es el primero de la lista y no el que eligió el productor.
 *
 * Es control de navegación, no de seguridad: los accesos salen de un store que
 * se puede editar desde el navegador. La barrera real es el backend.
 */
export default function GuardProductorSuspendido({ children }: { children: ReactNode }) {
  const { lista, activo, elegir, listo } = useEstablecimientos();

  if (!listo) return null;
  if (!activo?.suspension) return <>{children}</>;

  return (
    <AccesoSuspendido
      establecimiento={activo}
      otros={lista.filter((e) => e.id !== activo.id && !e.suspension)}
      onElegir={elegir}
    />
  );
}
