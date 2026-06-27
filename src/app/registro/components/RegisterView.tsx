"use client";

import { ArrowLeft, CalendarCheck, Heart, Ticket } from "lucide-react";
import RegistroForm from "./RegistroForm";
import type { FormData } from "@/types/registro";

interface RegisterViewProps {
  onSuccess: (data: FormData) => void;
  onBack: () => void;
}

const BENEFITS = [
  {
    icon: <CalendarCheck size={17} color="var(--green-800)" />,
    title: "Reservar experiencias",
    desc: "Asegurá tu lugar en vendimias y cosechas.",
  },
  {
    icon: <Heart size={17} color="var(--green-800)" />,
    title: "Guardar tus favoritos",
    desc: "Armá tu lista de fincas y actividades.",
  },
  {
    icon: <Ticket size={17} color="var(--green-800)" />,
    title: "Gestionar tus reservas",
    desc: "Seguí el estado de cada visita.",
  },
];

export default function RegisterView({ onSuccess, onBack }: RegisterViewProps) {
  return (
    <div
      data-screen-label="Registro de cuenta"
      style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 28px 72px" }}
    >
      <button
        type="button"
        onClick={onBack}
        style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          background: "transparent", border: "none", cursor: "pointer",
          color: "var(--fg-2)", fontSize: 14, fontWeight: 500, marginBottom: 22, padding: 0,
        }}
      >
        <ArrowLeft size={17} /> Volver
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) 420px",
          gap: 48, alignItems: "start",
        }}
      >
        {/* Form column */}
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 34,
              color: "var(--fg-1)", margin: 0, letterSpacing: "-.01em",
            }}
          >
            Creá tu cuenta
          </h1>
          <p
            style={{
              fontSize: 15.5, color: "var(--fg-2)", margin: "10px 0 28px", maxWidth: 520,
            }}
          >
            Completá tus datos para acceder a la plataforma y reservar experiencias en las fincas de Mendoza.
          </p>
          <div className="card" style={{ padding: "30px 32px" }}>
            <RegistroForm onSuccess={onSuccess} />
          </div>
        </div>

        {/* Aside */}
        <aside style={{ position: "sticky", top: 92 }}>
          {/* Decorative photo placeholder */}
          <div
            style={{
              borderRadius: "var(--radius-lg)", overflow: "hidden",
              marginBottom: 18, height: 200,
              background: "linear-gradient(135deg, #1e5418 0%, #2d5a27 50%, #7fa876 100%)",
              display: "flex", alignItems: "flex-end",
            }}
          >
            <div
              style={{
                padding: "16px 20px", width: "100%",
                background: "linear-gradient(to top, rgba(14,46,12,.7) 0%, transparent 100%)",
              }}
            >
              <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,.85)", fontStyle: "italic" }}>
                Cosecha de Malbec al amanecer — Valle de Uco, Mendoza
              </p>
            </div>
          </div>

          <div className="card" style={{ padding: "22px 24px" }}>
            <div
              style={{
                fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17,
                color: "var(--fg-1)", marginBottom: 16,
              }}
            >
              Con tu cuenta vas a poder
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
              {BENEFITS.map(({ icon, title, desc }) => (
                <li key={title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span
                    style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: "var(--green-050)",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {icon}
                  </span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>{title}</div>
                    <div style={{ fontSize: 12.5, color: "var(--fg-2)", marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
