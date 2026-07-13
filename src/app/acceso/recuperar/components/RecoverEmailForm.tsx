"use client";

import { useMemo, useState } from "react";
import { KeyRound, Mail, Send } from "lucide-react";
import { Field, TextInput } from "@/app/registro/components/FormFields";
import { FormHead, BackLink, FormAlert } from "@/app/acceso/components/AuthShell";
import { recoverEmailSchema } from "../schema";
import { enviarResetEmail } from "@/lib/passwordReset";
import z from "zod";

interface RecoverEmailFormProps {
  onSent: (email: string) => void;
  onBack: () => void;
}

export default function RecoverEmailForm({ onSent, onBack }: RecoverEmailFormProps) {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const error = useMemo(() => {
    const r = recoverEmailSchema.safeParse({ email });
    if (r.success) return undefined;
    return z.flattenError(r.error).fieldErrors.email?.[0];
  }, [email]);
  const show = (touched || submitted) && error;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (error) return;
    setLoading(true);
    setApiError(null);
    const r = await enviarResetEmail(email);
    setLoading(false);
    if (r.ok) { onSent(email.trim()); return; }
    setApiError(
      r.code === "invalidEmail"
        ? "El correo ingresado no es válido."
        : "No pudimos enviar el correo. Intentá de nuevo en unos minutos.",
    );
  }

  return (
    <div data-screen-label="Recuperar contraseña · correo">
      <BackLink onClick={onBack}>Volver a iniciar sesión</BackLink>
      <FormHead
        icon={<KeyRound size={24} color="var(--green-800)" />}
        title="Recuperá tu contraseña"
        sub="Ingresá el correo asociado a tu cuenta y te enviaremos un enlace para crear una nueva contraseña."
      />

      {apiError && <FormAlert tone="danger">{apiError}</FormAlert>}

      <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Field label="Correo" required error={show} htmlFor="rc-email">
          <TextInput
            id="rc-email"
            icon={<Mail size={18} />}
            type="email"
            value={email}
            placeholder="nombre@dominio.com"
            inputMode="email"
            autoComplete="email"
            error={show}
            onChange={(x) => { setEmail(x); setTouched(true); }}
          />
        </Field>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-lg"
          style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
        >
          {loading ? "Enviando…" : (<><Send size={18} /> Enviar enlace de recuperación</>)}
        </button>
      </form>
    </div>
  );
}
