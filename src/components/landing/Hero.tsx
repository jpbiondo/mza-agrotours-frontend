import Link from "next/link";
import { Sprout, UserPlus, Compass } from "lucide-react";

const STATS = [
  { value: "+40", label: "Fincas y bodegas" },
  { value: "+120", label: "Experiencias" },
  { value: "7", label: "Valles de Mendoza" },
];

export default function Hero() {
  return (
    <section style={{ position: "relative", overflow: "hidden" }}>
      {/* Fondo de viñedo */}
      <div
        style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, #0a2209 0%, #154212 30%, #1e5418 55%, #2d5a27 75%, #4a7c3f 100%)",
        }}
      />
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 80% 50%, rgba(167,201,139,.12) 0%, transparent 70%), radial-gradient(ellipse 40% 60% at 20% 80%, rgba(200,127,42,.08) 0%, transparent 60%)",
        }}
      />
      <div
        style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, rgba(14,46,12,.60) 0%, rgba(14,46,12,.25) 55%, rgba(251,249,248,.05) 100%)",
        }}
      />

      <div
        style={{
          position: "relative", maxWidth: 1160, margin: "0 auto",
          padding: "0 28px", minHeight: "min(680px, calc(100vh - 68px))",
          display: "flex", flexDirection: "column", justifyContent: "center",
          paddingTop: 72, paddingBottom: 72,
        }}
      >
        <div style={{ maxWidth: 600 }}>
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px",
              borderRadius: 999, background: "rgba(255,255,255,.16)", color: "#fff",
              fontSize: 12.5, fontWeight: 600, marginBottom: 22, backdropFilter: "blur(4px)",
            }}
          >
            <Sprout size={15} /> Turismo rural participativo en Mendoza
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: "clamp(2.2rem, 5.5vw, 3.5rem)", lineHeight: 1.06,
              color: "#fff", margin: 0, letterSpacing: "-.015em",
            }}
          >
            Viví la cosecha junto a los productores mendocinos
          </h1>

          <p
            style={{
              fontSize: 18, lineHeight: 1.55, color: "rgba(255,255,255,.92)",
              margin: "22px 0 34px", maxWidth: 500,
            }}
          >
            Descubrí experiencias en fincas y bodegas, reservá tu lugar y participá de
            vendimias, podas y degustaciones. Una conexión directa con quienes trabajan la tierra.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/explorar" className="btn btn-primary btn-lg" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Compass size={18} /> Explorar experiencias
            </Link>
            <Link href="/registro" className="btn btn-neutral btn-lg" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <UserPlus size={18} /> Crear cuenta
            </Link>
          </div>

          <div style={{ display: "flex", gap: 40, marginTop: 48, flexWrap: "wrap" }}>
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 30, color: "#fff" }}>{value}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.78)", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
