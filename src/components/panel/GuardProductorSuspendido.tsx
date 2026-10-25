"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { UserX } from "lucide-react";
import { fmtFecha } from "@/lib/format";
import { useEstablecimientos } from "@/hooks/useEstablecimientos";
import type { EstablecimientoAcceso } from "@/lib/roles";
import { Button, buttonClasses } from "@/components/ui";
import { StatusScreen } from "@/components/ui/StatusScreen";

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
  const motivo = establecimiento.suspension?.motivo?.trim();

  return (
    // `StatusScreen` directo y no `ForbiddenScreen`: ésa sólo acepta un texto, y
    // acá hacen falta el motivo y las salidas a los otros establecimientos.
    <StatusScreen
      tone="warning"
      icon={<UserX />}
      title="Tu acceso está suspendido"
      // "Volver al inicio" y no "Volver a explorar": la barra del shell ya
      // tiene ese botón, y repetir la etiqueta en la misma pantalla se lee
      // como dos acciones distintas. Es además la salida de <SinPermiso>.
      action={
        <Link href="/explorar" className={buttonClasses()}>
          Volver al inicio
        </Link>
      }
    >
      <p>
        No podés ver ni gestionar los datos de{" "}
        <strong className="font-semibold text-fg-1">{establecimiento.nombre}</strong> hasta el{" "}
        <strong className="font-semibold text-fg-1">
          {fmtFecha(establecimiento.suspension?.fechaHoraFin ?? null)}
        </strong>
        .
      </p>
      {/* El motivo es opcional en el backend: sin él, no se muestra la línea. */}
      {motivo && (
        <p className="mt-3 whitespace-pre-line">
          <strong className="font-semibold text-fg-1">Motivo:</strong> {motivo}
        </p>
      )}
      <p className="mt-3 text-[13.5px] text-fg-3">
        Seguís formando parte del establecimiento y conservás tu rol: el acceso se restablece
        solo cuando termina la suspensión. Si creés que es un error, hablá con quien lidera el
        establecimiento.
      </p>

      {otros.length > 0 && (
        <div className="mt-4 border-t border-outline-variant pt-4">
          <p className="text-[13.5px]">
            {otros.length === 1
              ? "Podés seguir trabajando en tu otro establecimiento:"
              : "Podés seguir trabajando en tus otros establecimientos:"}
          </p>
          <div className="mt-2.5 flex flex-wrap justify-center gap-2">
            {otros.map((e) => (
              <Button key={e.id} variant="neutral" onClick={() => onElegir(e.id)}>
                Ir a {e.nombre}
              </Button>
            ))}
          </div>
        </div>
      )}
    </StatusScreen>
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
 * Se espera a `listo` antes de decidir: hasta que rehidrata la sesión no hay
 * accesos con qué saber si la cuenta está suspendida en el de la URL.
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
