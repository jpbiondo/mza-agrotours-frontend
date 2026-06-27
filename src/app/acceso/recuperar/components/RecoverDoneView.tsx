"use client";

import { useEffect } from "react";
import { ShieldCheck, LogIn } from "lucide-react";

const REDIRECT_MS = 3000;

export default function RecoverDoneView({ onBackLogin }: { onBackLogin: () => void }) {
  useEffect(() => {
    const t = setTimeout(onBackLogin, REDIRECT_MS);
    return () => clearTimeout(t);
  }, [onBackLogin]);

  return (
    <div data-screen-label="Recuperar contraseña · éxito" style={{ textAlign: "center", paddingTop: 12 }}>
      <div
        className="pop"
        style={{
          width: 84, height: 84, borderRadius: "50%", background: "var(--success-fill)",
          display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px",
        }}
      >
        <ShieldCheck size={42} color="var(--success-fg)" />
      </div>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 27, color: "var(--fg-1)", margin: 0 }}>
        Contraseña actualizada correctamente
      </h1>
      <p style={{ fontSize: 15, color: "var(--fg-2)", lineHeight: 1.55, margin: "12px 0 26px" }}>
        Ya podés iniciar sesión con tu nueva contraseña.
      </p>
      <button
        type="button"
        onClick={onBackLogin}
        className="btn btn-primary btn-lg"
        style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
      >
        <LogIn size={18} /> Ir a iniciar sesión
      </button>
    </div>
  );
}
