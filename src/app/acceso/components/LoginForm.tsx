"use client";

import { LogIn } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Alert } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { LinkRegistro, LoginCampos, LoginError, useLoginForm } from "@/components/auth/LoginCampos";
import type { Cuenta } from "@/types/auth";
import { FormHead } from "./AuthShell";

interface LoginFormProps {
  onSuccess: (cuenta: Cuenta) => void;
  /** Aviso informativo (p. ej. tras cambiar el email en Mi cuenta). */
  notice?: string;
  /** A dónde volver tras el login; se le pasa también al registro. */
  volver?: string | null;
}

/** El login de la página `/acceso`. */
export default function LoginForm({ onSuccess, notice, volver }: LoginFormProps) {
  const { form, onSubmit, authError, clearError } = useLoginForm(onSuccess);

  return (
    <div data-screen-label="Iniciar sesión">
      <FormHead
        icon={<LogIn size={24} color="var(--green-800)" />}
        title="Iniciá sesión"
        sub="Ingresá con tus credenciales para acceder a tus reservas y experiencias."
      />

      {notice && <Alert tone="info" className="pop mb-[22px]">{notice}</Alert>}
      <LoginError code={authError} className="pop mb-[22px]" />

      <Form {...form}>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-[18px]">
          <LoginCampos form={form} clearError={clearError} />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={form.formState.isSubmitting}
            className="mt-1 w-full"
          >
            <LogIn className="size-[18px]" /> Iniciar sesión
          </Button>
        </form>
      </Form>

      <LinkRegistro volver={volver} className="mt-[22px] text-center text-sm text-fg-2" />
    </div>
  );
}
