import { Grape } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const GRADIENTS = [
  "linear-gradient(135deg, #0e2e0c 0%, #1e5418 60%, #4a7c3f 100%)",
  "linear-gradient(135deg, #154212 0%, #2d5a27 60%, #7fa876 100%)",
  "linear-gradient(135deg, #5c3b22 0%, #805533 55%, #a6794f 100%)",
  "linear-gradient(135deg, #1e5418 0%, #2d5a27 50%, #7fa876 100%)",
  "linear-gradient(135deg, #805533 0%, #a6794f 55%, #c77f2a 100%)",
  "linear-gradient(135deg, #0a2209 0%, #154212 55%, #2d5a27 100%)",
];

/**
 * Seed estable a partir de un id. El backend todavía no manda imágenes, así que
 * el degradado sale del propio id: cada establecimiento o actividad conserva
 * siempre el mismo entre renders y entre pantallas.
 */
export function seedDeId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
  return h;
}

interface PhotoProps {
  seed: number;
  height?: number | string;
  caption?: string;
  radius?: number | string;
  /** Glifo de fondo. Por defecto la uva; los cultivos usan una hoja. */
  icon?: LucideIcon;
  /**
   * Foto real, si la hay. Se dibuja **encima** del degradado, que queda de
   * respaldo mientras carga o si la URL falla.
   */
  src?: string | null;
  /** Texto alternativo de la foto real. Vacío = decorativa. */
  alt?: string;
}

/**
 * Imagen del catálogo: la foto real cuando el backend la manda, y si no un
 * degradado determinístico por seed, para que la tarjeta nunca quede en blanco.
 */
export default function Photo({ seed, height = 180, caption, radius = "var(--radius-lg)", icon: Icon = Grape, src, alt = "" }: PhotoProps) {
  const bg = GRADIENTS[((seed % GRADIENTS.length) + GRADIENTS.length) % GRADIENTS.length];
  return (
    <div
      style={{
        position: "relative", height, borderRadius: radius, overflow: "hidden",
        background: bg, display: "flex", alignItems: "flex-end",
      }}
    >
      <Icon
        size={64}
        color="rgba(255,255,255,.14)"
        style={{ position: "absolute", top: 16, right: 16 }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- el host del
          object storage cambia por entorno y no está en `images.remotePatterns`. */}
      {src && <img src={src} alt={alt} className="absolute inset-0 size-full object-cover" />}
      {caption && (
        <div
          style={{
            position: "relative", width: "100%", padding: "14px 16px",
            background: "linear-gradient(to top, rgba(14,46,12,.72) 0%, transparent 100%)",
            fontSize: 12.5, color: "rgba(255,255,255,.9)", fontStyle: "italic",
          }}
        >
          {caption}
        </div>
      )}
    </div>
  );
}
