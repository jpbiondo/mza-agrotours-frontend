"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";
import { Alert, buttonClasses } from "@/components/ui";
import { EyeToggle, TextField } from "@/components/ui/text-field";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import type { AuthCode, Cuenta } from "@/types/auth";
import { loginSchema, type LoginData } from "./schema";

/** Pantalla de recuperación de contraseña. */
export const RUTA_RECUPERAR = "/acceso/recuperar";

/** Link en línea con el texto: el `Button variant="text"`, con el tamaño de letra del contexto. */
const linkEnTexto = (className?: string) =>
  buttonClasses({ variant: "text", className: `text-[length:inherit] ${className ?? ""}` });

/**
 * El formulario de login sin su envoltorio: el estado, los campos, el rechazo
 * y el link de registro por separado, para que quien lo use ubique el botón de
 * envío y el error donde le toque.
 */
export function useLoginForm(onSuccess: (cuenta: Cuenta) => void) {
  const { login, authError, clearError } = useAuth();

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const onSubmit = form.handleSubmit(async (data) => {
    clearError();
    try {
      const cuenta = await login({ email: data.email.trim(), password: data.password });
      onSuccess(cuenta);
    } catch {
      // `authError` ya lo cargó el hook.
    }
  });

  return { form, onSubmit, authError, clearError };
}

const MENSAJE_ERROR: Partial<Record<AuthCode, string>> = {
  badCreds: "El correo o contraseña ingresado no son correctos.",
  baja: "Esta cuenta ha sido eliminada.",
  error: "Ocurrió un problema al iniciar sesión. Intentá de nuevo en unos minutos.",
};

/** El rechazo del login, o nada si no hay (o si el código no se muestra). */
export function LoginError({ code, className }: { code: AuthCode | null; className?: string }) {
  const mensaje = code ? MENSAJE_ERROR[code] : undefined;
  if (!mensaje) return null;
  return <Alert tone="danger" className={className}>{mensaje}</Alert>;
}

/** Correo y contraseña. Va dentro de un `<Form>` + `<form>` del que lo usa. */
export function LoginCampos({ form, clearError }: {
  form: UseFormReturn<LoginData>;
  clearError: () => void;
}) {
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="flex flex-col gap-[18px]">
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
                <Link href={RUTA_RECUPERAR} className={linkEnTexto()}>¿Olvidaste tu contraseña?</Link>
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
                rightSlot={<EyeToggle shown={showPw} onToggle={() => setShowPw((s) => !s)} />}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

/** "¿No tenés cuenta? Registrate", con la vuelta si la hay. */
export function LinkRegistro({ volver, className }: { volver?: string | null; className?: string }) {
  const href = volver ? `/registro?${new URLSearchParams({ volver })}` : "/registro";
  return (
    <div className={className ?? "text-center text-sm text-fg-2"}>
      ¿No tenés cuenta?{" "}
      <Link href={href} className={linkEnTexto("font-bold")}>
        Registrate
      </Link>
    </div>
  );
}
