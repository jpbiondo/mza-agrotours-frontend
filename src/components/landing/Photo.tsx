import { Grape } from "lucide-react";

const GRADIENTS = [
  "linear-gradient(135deg, #0e2e0c 0%, #1e5418 60%, #4a7c3f 100%)",
  "linear-gradient(135deg, #154212 0%, #2d5a27 60%, #7fa876 100%)",
  "linear-gradient(135deg, #5c3b22 0%, #805533 55%, #a6794f 100%)",
  "linear-gradient(135deg, #1e5418 0%, #2d5a27 50%, #7fa876 100%)",
  "linear-gradient(135deg, #805533 0%, #a6794f 55%, #c77f2a 100%)",
  "linear-gradient(135deg, #0a2209 0%, #154212 55%, #2d5a27 100%)",
];

interface PhotoProps {
  seed: number;
  height?: number | string;
  caption?: string;
  radius?: number | string;
}

/**
 * Placeholder de imagen con degradado determinístico por seed.
 * Sustituye a las fotos reales del catálogo hasta tener assets.
 */
export default function Photo({ seed, height = 180, caption, radius = "var(--radius-lg)" }: PhotoProps) {
  const bg = GRADIENTS[((seed % GRADIENTS.length) + GRADIENTS.length) % GRADIENTS.length];
  return (
    <div
      style={{
        position: "relative", height, borderRadius: radius, overflow: "hidden",
        background: bg, display: "flex", alignItems: "flex-end",
      }}
    >
      <Grape
        size={64}
        color="rgba(255,255,255,.14)"
        style={{ position: "absolute", top: 16, right: 16 }}
      />
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
