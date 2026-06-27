"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Loader } from "lucide-react";
import type { FormData } from "@/types/registro";

const REDIRECT_MS = 3200;

interface SuccessViewProps {
  data: FormData;
}

export default function SuccessView({ data }: SuccessViewProps) {
  const [secs, setSecs] = useState(Math.round(REDIRECT_MS / 1000));

  useEffect(() => {
    const tick = setInterval(() => setSecs((s) => (s > 1 ? s - 1 : 0)), 1000);
    const go = setTimeout(() => { window.location.href = "/panel"; }, REDIRECT_MS);
    return () => { clearInterval(tick); clearTimeout(go); };
  }, []);

  return (
    <div
      data-screen-label="Registro · cuenta creada"
      style={{ maxWidth: 560, margin: "0 auto", padding: "72px 28px", textAlign: "center" }}
    >
      {/* Check circle */}
      <div
        className="pop"
        style={{
          width: 88, height: 88, borderRadius: "50%",
          background: "var(--success-fill)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
        }}
      >
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <path d="M10 22L18 30L34 14" stroke="var(--success-fg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h1
        style={{
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28,
          color: "var(--fg-1)", margin: 0, lineHeight: 1.18,
        }}
      >
        Tu cuenta fue creada correctamente.
      </h1>

      <p style={{ fontSize: 16.5, color: "var(--fg-2)", lineHeight: 1.55, margin: "12px 0 0" }}>
        Ya iniciamos sesión automáticamente{data.nombre ? `, ${data.nombre.split(" ")[0]}` : ""}.
      </p>

      <div
        style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          color: "var(--success-fg)", fontSize: 13.5, fontWeight: 600,
          margin: "22px 0 26px",
        }}
      >
        <Loader size={15} className="spin" />
        Te llevamos a tu panel en {secs} s…
      </div>

      <div>
        <button
          type="button"
          onClick={() => { window.location.href = "/panel"; }}
          className="btn btn-primary btn-lg"
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          Ir ahora a mi panel <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
