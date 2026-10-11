import { Cherry, Grape, Leaf, MapPin, Nut, Sprout, Wine } from "lucide-react";
import { EstadoBadge } from "@/components/ui";
import { iconoDeCultivos } from "@/data/actividades-prod";
import type { EstadoActividad } from "@/types/actividad-prod";
import type { CultivoRef } from "@/types/datos";

const ICONOS: Record<string, React.ComponentType<{ className?: string }>> = {
  grape: Grape, wine: Wine, leaf: Leaf, cherry: Cherry, sprout: Sprout, nut: Nut, "map-pin": MapPin,
};

/** El ícono de una actividad, deducido de sus cultivos. */
export function IconoActividad({ cultivos, className }: { cultivos: CultivoRef[]; className?: string }) {
  const Icono = ICONOS[iconoDeCultivos(cultivos)] ?? Grape;
  return <Icono className={className} />;
}

export function CropChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-green-100 px-[11px] py-1 text-[12.5px] leading-tight font-semibold text-green-800">
      <Sprout className="size-3 text-green-700" /> {children}
    </span>
  );
}

const ESTADO_BADGE: Record<EstadoActividad, { tone: "success" | "neutral" | "danger"; label: string }> = {
  publicado: { tone: "success", label: "Publicada" },
  borrador: { tone: "neutral", label: "Borrador" },
  dado_de_baja: { tone: "danger", label: "Dada de baja" },
};

export function EstadoActividadBadge({ estado }: { estado: EstadoActividad }) {
  const { tone, label } = ESTADO_BADGE[estado];
  return <EstadoBadge tone={tone}>{label}</EstadoBadge>;
}
