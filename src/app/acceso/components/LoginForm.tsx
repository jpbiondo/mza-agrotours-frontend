"use client";

import { useMemo, useState } from "react";
import { LogIn, Mail, AlertCircle } from "lucide-react";
import { Field, TextInput } from "@/app/registro/components/FormFields";
import { FormHead, FormAlert, AuthLink, PasswordInput } from "./AuthShell";
import { loginSchema } from "../schema";
import { useAuth } from "@/hooks/useAuth";
import type { Cuenta } from "@/types/auth";
import z from "zod";

type Errors = { email?: string; password?: string };
type Touched = { email?: boolean; password?: boolean };

function parseErrors(email: string, password: string): Errors {
  const result = loginSchema.safeParse({ email, password });
  if (result.success) return {};
  const flat = z.flattenError(result.error);
  return {
    email: flat.fieldErrors.email?.[0],
    password: flat.fieldErrors.password?.[0],
  };
}

interface LoginFormProps {
  onSuccess: (cuenta: Cuenta) => void;
  onRecover: () => void;
}

export default function LoginForm({ onSuccess, onRecover }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState<Touched>({});
  const [submitted, setSubmitted] = useState(false);
  const { login, isLoading, authError, clearError } = useAuth();

  const allErrors = useMemo(() => parseErrors(email, password), [email, password]);
  const show = (k: keyof Errors) => ((touched[k] || submitted) && allErrors[k]) || null;

  async function handleSubmit() {
    setSubmitted(true);
    clearError();
    if (Object.keys(allErrors).some((k) => allErrors[k as keyof Errors])) return;
    try {
      const cuenta = await login({ email, password });
      onSuccess(cuenta);
    } catch {
      // authError ya fue seteado por el hook
    }
  }

  return (
    <div data-screen-label="Iniciar sesión">
      <FormHead
        icon={<LogIn size={24} color="var(--green-800)" />}
        title="Iniciá sesión"
        sub="Ingresá con tus credenciales para acceder a tus reservas y experiencias."
      />

      {authError === "badCreds" && (
        <FormAlert tone="danger">El correo o contraseña ingresado no son correctos.</FormAlert>
      )}
      {authError === "baja" && (
        <FormAlert tone="danger">Esta cuenta ha sido eliminada.</FormAlert>
      )}
      {authError === "error" && (
        <FormAlert tone="danger">Ocurrió un problema al iniciar sesión. Intentá de nuevo en unos minutos.</FormAlert>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
        noValidate
        style={{ display: "flex", flexDirection: "column", gap: 18 }}
      >
        <Field label="Correo" required error={show("email")} htmlFor="lg-email">
          <TextInput
            id="lg-email"
            icon={<Mail size={18} />}
            type="email"
            value={email}
            placeholder="nombre@dominio.com"
            inputMode="email"
            autoComplete="email"
            error={show("email")}
            onChange={(x) => { setEmail(x); setTouched((t) => ({ ...t, email: true })); clearError(); }}
          />
        </Field>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
            <label htmlFor="lg-pw" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg-1)" }}>
              Contraseña <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <span style={{ fontSize: 13 }}>
              <AuthLink onClick={onRecover}>¿Olvidaste tu contraseña?</AuthLink>
            </span>
          </div>
          <PasswordInput
            id="lg-pw"
            value={password}
            placeholder="Tu contraseña"
            autoComplete="current-password"
            error={show("password")}
            onChange={(x) => { setPassword(x); setTouched((t) => ({ ...t, password: true })); clearError(); }}
          />
          {show("password") && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--danger-fg)", marginTop: 7 }}>
              <AlertCircle size={14} /> {allErrors.password}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary btn-lg"
          style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
        >
          {isLoading ? "Ingresando…" : (<><LogIn size={18} /> Iniciar sesión</>)}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: 22, fontSize: 14, color: "var(--fg-2)" }}>
        ¿No tenés cuenta?{" "}
        <AuthLink href="/registro" strong>Registrate</AuthLink>
      </div>
    </div>
  );
}