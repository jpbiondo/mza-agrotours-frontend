"use client";

import { MailCheck } from "lucide-react";
import { AuthLink } from "@/app/acceso/components/AuthShell";
import { Button, ResultScreen } from "@/components/ui";

interface RecoverSentViewProps {
  email: string;
  onBackLogin: () => void;
  onResend: () => void;
}

export default function RecoverSentView({ email, onBackLogin, onResend }: RecoverSentViewProps) {
  return (
    <ResultScreen
      icon={<MailCheck />}
      title="Revisá tu correo"
      action={<Button onClick={onBackLogin}>Volver a iniciar sesión</Button>}
    >
      Enviamos un correo a <strong className="text-fg-1">{email}</strong>. Por favor revisá tu bandeja de
      entrada y seguí el enlace para crear una nueva contraseña.
      {/* Es la salida si el correo no llega, no un segundo CTA: va como link dentro del texto. */}
      <span className="mt-2.5 block text-[13px] text-fg-3">
        ¿No te llegó? Revisá el spam o <AuthLink onClick={onResend}>reenviá el correo</AuthLink>.
      </span>
    </ResultScreen>
  );
}
