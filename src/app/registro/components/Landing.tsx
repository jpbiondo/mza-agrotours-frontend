"use client";

import { Sprout, UserPlus, Compass } from "lucide-react";

interface LandingProps {
  onRegister: () => void;
}

export default function Landing({ onRegister }: LandingProps) {
  return (
    <div
      data-screen-label="Plataforma · inicio"
      style={{ position: "relative", minHeight: "calc(100vh - 68px)", overflow: "hidden" }}
    >
      {/* Hero background — rich vineyard gradient */}
      <div
        style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, #0a2209 0%, #154212 30%, #1e5418 55%, #2d5a27 75%, #4a7c3f 100%)",
        }}
      />
      {/* Texture overlay */}
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            radial-gradient(ellipse 60% 50% at 80% 50%, rgba(167,201,139,.12) 0%, transparent 70%),
            radial-gradient(ellipse 40% 60% at 20% 80%, rgba(200,127,42,.08) 0%, transparent 60%)
          `,
        }}
      />
      {/* Directional gradient (matches design: left darker, right lighter) */}
      <div
        style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, rgba(14,46,12,.60) 0%, rgba(14,46,12,.25) 55%, rgba(251,249,248,.05) 100%)",
        }}
      />

      <div
        style={{
          position: "relative", maxWidth: 1160, margin: "0 auto",
          padding: "0 28px", minHeight: "calc(100vh - 68px)",
          display: "flex", alignItems: "center",
        }}
      >
        <div style={{ maxWidth: 560 }}>
          {/* Badge */}
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "7px 14px", borderRadius: 999,
              background: "rgba(255,255,255,.16)", color: "#fff",
              fontSize: 12.5, fontWeight: 600, marginBottom: 22,
              backdropFilter: "blur(4px)",
            }}
          >
            <Sprout size={15} />
            Turismo rural participativo en Mendoza
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: "clamp(2rem, 5vw, 3.25rem)", lineHeight: 1.08,
              color: "#fff", margin: 0, letterSpacing: "-.015em",
            }}
          >
            Viví la cosecha junto a los productores mendocinos
          </h1>

          <p
            style={{
              fontSize: 18, lineHeight: 1.55, color: "rgba(255,255,255,.92)",
              margin: "20px 0 32px", maxWidth: 480,
            }}
          >
            Descubrí experiencias en fincas, reservá tu lugar y participá de vendimias,
            podas y degustaciones. Creá tu cuenta para empezar.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={onRegister}
              className="btn btn-primary btn-lg"
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <UserPlus size={18} /> Registrarse
            </button>
            <button
              type="button"
              className="btn btn-neutral btn-lg"
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <Compass size={18} /> Explorar experiencias
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
