"use client";

import { MailCheck, Inbox, KeyRound } from "lucide-react";
import { AuthLink } from "@/app/acceso/components/AuthShell";

interface RecoverSentViewProps {
  email: string;
  onOpenLink: () => void;
  onBackLogin: () => void;
  onResend: () => void;
}

export default function RecoverSentView({ email, onOpenLink, onBackLogin, onResend }: RecoverSentViewProps) {
  return (
    <div data-screen-label="Recuperar contraseña · enviado" style={{ textAlign: "center", paddingTop: 8 }}>
      <div
        className="pop"
        style={{
          width: 80, height: 80, borderRadius: "50%", background: "var(--info-fill)",
          display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px",
        }}
      >
        <MailCheck size={38} color="var(--info-fg)" />
      </div>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 27, color: "var(--fg-1)", margin: 0 }}>
        Revisá tu correo
      </h1>
      <p style={{ fontSize: 15, color: "var(--fg-2)", lineHeight: 1.55, margin: "12px 0 4px" }}>
        Enviamos un correo a <strong style={{ color: "var(--fg-1)" }}>{email}</strong>. Por favor revisá tu bandeja de
        entrada y seguí el enlace para crear una nueva contraseña.
      </p>
      <p style={{ fontSize: 13, color: "var(--fg-3)", margin: "10px 0 26px" }}>
        ¿No te llegó? Revisá el spam o <AuthLink onClick={onResend}>reenviá el correo</AuthLink>.
      </p>

      {/* Simulación del botón "Recuperar contraseña" que viaja en el mail */}
      <div
        style={{
          padding: 18, borderRadius: "var(--radius)", border: "1px dashed var(--brown-500)",
          background: "var(--brown-100)", marginBottom: 22, textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: "var(--brown-800)", fontWeight: 600, marginBottom: 12 }}>
          <Inbox size={16} /> Vista previa del correo
        </div>
        <button
          type="button"
          onClick={onOpenLink}
          className="btn btn-neutral"
          style={{ width: "100%", justifyContent: "center" }}
        >
          <KeyRound size={18} /> Recuperar contraseña
        </button>
      </div>

      <AuthLink onClick={onBackLogin}>Volver a iniciar sesión</AuthLink>
    </div>
  );
}
