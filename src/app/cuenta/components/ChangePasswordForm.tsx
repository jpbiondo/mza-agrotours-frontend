"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Check, Loader, ShieldCheck } from "lucide-react";
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
import { Button, Card } from "@/components/ui";
import type { ToastData } from "@/components/ui";
import { cambiarPasswordSchema, type CambiarPasswordForm } from "../schema";
import { useCambiarPassword } from "@/hooks/usePerfil";

const TIPS = [
  "Mínimo 8 caracteres.",
  "Al menos un carácter especial.",
  "Evitá datos fáciles de adivinar.",
  "No la reutilices de otros sitios.",
];

export default function ChangePasswordForm({
  setToast,
}: {
  setToast: (t: ToastData | null) => void;
}) {
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { cambiar } = useCambiarPassword();

  const form = useForm<CambiarPasswordForm>({
    resolver: zodResolver(cambiarPasswordSchema),
    defaultValues: { actual: "", nueva: "", confirm: "" },
    mode: "onTouched",
  });

  async function onValid(data: CambiarPasswordForm) {
    const r = await cambiar(data.actual, data.nueva);
    if (!r.ok) {
      if (r.code === "badActual") {
        form.setError("actual", {
          message: "La contraseña actual ingresada es incorrecta",
        });
      } else {
        setToast({
          tone: "danger",
          title: "No se pudo cambiar la contraseña",
          sub: "Intentá de nuevo en unos minutos.",
        });
      }
      return;
    }
    form.reset();
    setToast({ tone: "success", title: "Contraseña actualizada correctamente" });
  }

  return (
    <div className="grid grid-cols-1 items-start gap-7 min-[681px]:grid-cols-[minmax(0,1fr)_280px]">
      <Card className="p-[28px_30px]">
        <div className="mb-[22px]">
          <h2 className="m-0 font-display text-xl font-semibold text-fg-1">
            Cambiar contraseña
          </h2>
          <p className="mt-1.5 text-[13.5px] leading-[1.5] text-fg-2">
            Por tu seguridad, vas a necesitar tu contraseña actual para definir una nueva.
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onValid)}
            noValidate
            className="flex flex-col gap-[18px]"
          >
            <FormField
              control={form.control}
              name="actual"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-baseline justify-between">
                    <FormLabel required>Contraseña actual</FormLabel>
                    <Link
                      href="/acceso/recuperar"
                      className="text-[13px] font-semibold text-green-800 no-underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <FormControl>
                    <TextField
                      {...field}
                      icon={<Lock />}
                      type={showActual ? "text" : "password"}
                      autoComplete="current-password"
                      rightSlot={
                        <EyeToggle
                          shown={showActual}
                          onToggle={() => setShowActual((s) => !s)}
                        />
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="my-0.5 h-px bg-cream-tert" />

            <FormField
              control={form.control}
              name="nueva"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Nueva contraseña</FormLabel>
                  <FormControl>
                    <TextField
                      {...field}
                      icon={<Lock />}
                      type={showNueva ? "text" : "password"}
                      autoComplete="new-password"
                      rightSlot={
                        <EyeToggle
                          shown={showNueva}
                          onToggle={() => setShowNueva((s) => !s)}
                        />
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
                  <FormLabel required>Repetí la nueva contraseña</FormLabel>
                  <FormControl>
                    <TextField
                      {...field}
                      icon={<Lock />}
                      type={showConfirm ? "text" : "password"}
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

            <div className="mt-1.5 flex gap-3">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader size={16} className="spin" /> Guardando…
                  </>
                ) : (
                  <>
                    <Check size={16} /> Guardar
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Card>

      <aside className="rounded-lg border border-outline-variant bg-surface p-[20px_22px]">
        <div className="mb-3.5 flex items-center gap-[9px]">
          <ShieldCheck size={18} className="text-green-800" />
          <div className="font-display text-[15px] font-semibold text-fg-1">
            Una buena contraseña
          </div>
        </div>
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {TIPS.map((t) => (
            <li
              key={t}
              className="flex gap-[9px] text-[13px] leading-[1.4] text-fg-2"
            >
              <Check size={15} className="mt-px shrink-0 text-green-800" />
              {t}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
