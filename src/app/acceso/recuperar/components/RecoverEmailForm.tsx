"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { KeyRound, Mail, Send } from "lucide-react";
import { TextField } from "@/components/ui/text-field";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormHead, BackLink, FormAlert } from "@/app/acceso/components/AuthShell";
import { Button } from "@/components/ui/Button";
import { recoverEmailSchema } from "../schema";
import { enviarResetEmail } from "@/lib/passwordReset";

type RecoverEmailData = z.infer<typeof recoverEmailSchema>;

interface RecoverEmailFormProps {
  onSent: (email: string) => void;
  onBack: () => void;
}

export default function RecoverEmailForm({ onSent, onBack }: RecoverEmailFormProps) {
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<RecoverEmailData>({
    resolver: zodResolver(recoverEmailSchema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });

  async function onValid(data: RecoverEmailData) {
    setApiError(null);
    const email = data.email.trim();
    const r = await enviarResetEmail(email);
    if (r.ok) {
      onSent(email);
      return;
    }
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
                      setApiError(null);
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

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={form.formState.isSubmitting}
            className="mt-1 w-full"
          >
            {form.formState.isSubmitting ? (
              "Enviando…"
            ) : (
              <>
                <Send className="size-[18px]" /> Enviar enlace de recuperación
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
