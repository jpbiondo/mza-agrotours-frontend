"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Ban } from "lucide-react";
import { SinAccesoProvider } from "@/components/AsyncView";
import { useEstablecimientos } from "@/hooks/useEstablecimientos";
import type { EstablecimientoAcceso } from "@/lib/roles";
import { buttonClasses } from "@/components/ui";
import { StatusScreen } from "@/components/ui/StatusScreen";

function EstablecimientoSuspendido({ establecimiento }: { establecimiento: EstablecimientoAcceso }) {
  return (
    <StatusScreen
      tone="warning"
      icon={<Ban />}
      title="Este establecimiento está suspendido"
      action={
        <Link href="/explorar" className={buttonClasses()}>
          Volver al inicio
        </Link>
      }
    >
      <p>
        Un administrador suspendió{" "}
        <strong className="font-semibold text-fg-1">{establecimiento.nombre}</strong>. Mientras
        siga suspendido no podés usar esta sección.
      </p>
      {establecimiento.motivoSuspension && (
        <p className="mt-3 whitespace-pre-line">
          <strong className="font-semibold text-fg-1">Motivo:</strong>{" "}
          {establecimiento.motivoSuspension}
        </p>
      )}
    </StatusScreen>
  );
}

/**
 * Con el establecimiento activo suspendido, un 403 en cualquier lectura del
 * panel se explica con la suspensión y su motivo, no con el "tu rol no incluye
 * este permiso" genérico: el rol no cambió, y pedirle el permiso a un
 * administrador no lo resolvería.
 *
 * Sólo cambia qué se muestra ante un 403; las pantallas que dejan leer con el
 * establecimiento suspendido siguen funcionando igual.
 */
export default function SinAccesoPorSuspension({ children }: { children: ReactNode }) {
  const { activo } = useEstablecimientos();
  const pantalla = activo?.establecimientoSuspendido ? (
    <EstablecimientoSuspendido establecimiento={activo} />
  ) : null;

  return <SinAccesoProvider value={pantalla}>{children}</SinAccesoProvider>;
}
