"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { LockKeyhole, Lock, Check } from "lucide-react";
import { TextField, EyeToggle } from "@/components/ui/text-field";
import { PasswordMeter } from "@/components/ui/password-meter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormHead, FormAlert } from "@/app/acceso/components/AuthShell";
import { Button } from "@/components/ui/Button";
import { newPasswordSchema } from "../schema";
import { confirmarResetPassword } from "@/lib/passwordReset";

type NewPasswordData = z.infer<typeof newPasswordSchema>;

interface RecoverResetFormProps {
  oobCode: string;
  onSuccess: () => void;
}

export default function RecoverResetForm({ oobCode, onSuccess }: RecoverResetFormProps) {
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<NewPasswordData>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { pw: "", confirm: "" },
    mode: "onTouched",
  });

  async function onValid(data: NewPasswordData) {
    setApiError(null);
    const r = await confirmarResetPassword(oobCode, data.pw);
    if (r.ok) {
      onSuccess();
      return;
    }
    setApiError(
      r.code === "expired"
        ? "El enlace expiró o no es válido. Solicitá uno nuevo desde «Recuperar contraseña»."
        : "No pudimos actualizar la contraseña. Intentá de nuevo en unos minutos.",
    );
  }

  return (
    <div data-screen-label="Recuperar contraseña · nueva">
      <FormHead
        icon={<LockKeyhole size={24} color="var(--green-800)" />}
        title="Creá una contraseña nueva"
        sub="Elegí una contraseña robusta para tu cuenta. Vas a usarla la próxima vez que inicies sesión."
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
            name="pw"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Contraseña nueva</FormLabel>
                <FormControl>
                  <TextField
                    {...field}
                    icon={<Lock />}
                    type={showPw ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    rightSlot={
                      <EyeToggle shown={showPw} onToggle={() => setShowPw((s) => !s)} />
                    }
                  />
                </FormControl>
                {field.value && <PasswordMeter value={field.value} />}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Confirmar contraseña nueva</FormLabel>
                <FormControl>
                  <TextField
                    {...field}
                    icon={<Lock />}
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repetí la contraseña nueva"
                    autoComplete="new-password"
                    rightSlot={
                      <EyeToggle
                        shown={showConfirm}
                        onToggle={() => setShowConfirm((s) => !s)}
                      />
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
              "Guardando…"
            ) : (
              <>
                <Check className="size-[18px]" /> Guardar
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
