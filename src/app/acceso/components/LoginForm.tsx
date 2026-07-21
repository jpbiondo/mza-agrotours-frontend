"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, Mail, Lock } from "lucide-react";
import { TextField, EyeToggle } from "@/components/ui/text-field";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormHead, FormAlert, AuthLink } from "./AuthShell";
import { Button } from "@/components/ui/Button";
import { loginSchema, type LoginData } from "../schema";
import { useAuth } from "@/hooks/useAuth";
import type { Cuenta } from "@/types/auth";

interface LoginFormProps {
  onSuccess: (cuenta: Cuenta) => void;
  onRecover: () => void;
  /** Aviso informativo (p. ej. tras cambiar el email en Mi cuenta). */
  notice?: string;
}

export default function LoginForm({ onSuccess, onRecover, notice }: LoginFormProps) {
  const [showPw, setShowPw] = useState(false);
  const { login, authError, clearError } = useAuth();

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  async function onValid(data: LoginData) {
    clearError();
    try {
      const cuenta = await login({ email: data.email.trim(), password: data.password });
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

      {notice && <FormAlert tone="info">{notice}</FormAlert>}

      {authError === "badCreds" && (
        <FormAlert tone="danger">El correo o contraseña ingresado no son correctos.</FormAlert>
      )}
      {authError === "baja" && (
        <FormAlert tone="danger">Esta cuenta ha sido eliminada.</FormAlert>
      )}
      {authError === "error" && (
        <FormAlert tone="danger">
          Ocurrió un problema al iniciar sesión. Intentá de nuevo en unos minutos.
        </FormAlert>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onValid)}
          noValidate
          className="flex flex-col gap-[18px]"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Correo</FormLabel>
                <FormControl>
                  <TextField
                    {...field}
                    onChange={(v) => {
                      field.onChange(v);
                      clearError();
                    }}
                    icon={<Mail />}
                    type="email"
                    placeholder="nombre@dominio.com"
                    inputMode="email"
                    autoComplete="email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-baseline justify-between">
                  <FormLabel required>Contraseña</FormLabel>
                  <span className="text-[13px]">
                    <AuthLink onClick={onRecover}>¿Olvidaste tu contraseña?</AuthLink>
                  </span>
                </div>
                <FormControl>
                  <TextField
                    {...field}
                    onChange={(v) => {
                      field.onChange(v);
                      clearError();
                    }}
                    icon={<Lock />}
                    type={showPw ? "text" : "password"}
                    placeholder="Tu contraseña"
                    autoComplete="current-password"
                    rightSlot={
                      <EyeToggle shown={showPw} onToggle={() => setShowPw((s) => !s)} />
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={form.formState.isSubmitting}
            className="mt-1 w-full"
          >
            {form.formState.isSubmitting ? (
              "Ingresando…"
            ) : (
              <>
                <LogIn className="size-[18px]" /> Iniciar sesión
              </>
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-[22px] text-center text-sm text-fg-2">
        ¿No tenés cuenta?{" "}
        <AuthLink href="/registro" strong>
          Registrate
        </AuthLink>
      </div>
    </div>
  );
}
