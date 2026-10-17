import type { ComponentType } from "react";
import { AlertCircle, CheckCircle2, CircleDashed, Handshake } from "lucide-react";
import { EstadoBadge } from "@/components/ui";
import { DEUDA_ESTADO_META } from "@/data/deudas";
import type { EstadoDeuda } from "@/types/deudas";

export const DEUDA_ESTADO_ICON: Record<EstadoDeuda, ComponentType<{ size?: number; className?: string }>> = {
  sin_devolver: AlertCircle,
  parcial: CircleDashed,
  total: CheckCircle2,
  acuerdo: Handshake,
};

/** Píldora del estado de una deuda, con su icono. Compartida por la lista y el detalle. */
export function DeudaBadge({ estado }: { estado: EstadoDeuda }) {
  const meta = DEUDA_ESTADO_META[estado];
  const Icono = DEUDA_ESTADO_ICON[estado];
  return (
    <EstadoBadge tone={meta.tone}>
      <Icono size={13} /> {meta.label}
    </EstadoBadge>
  );
}
