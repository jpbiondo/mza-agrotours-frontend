"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Phone, BadgeCheck, CreditCard, Mail, Check, Trash2, Loader } from "lucide-react";
import { TextField } from "@/components/ui/text-field";
import { TipoIdSelect } from "@/components/ui/tipo-id-select";
import { CountrySelect } from "@/components/ui/country-select";
import { DateField } from "@/components/ui/date-field";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button, Alert, SectionLabel } from "@/components/ui";
import type { ToastData } from "@/components/ui";
import { TIPOS_IDENTIFICACION } from "@/data/registro";
import { perfilSchema } from "../schema";
import type { Perfil } from "@/data/cuenta";
import { useGuardarPerfil } from "@/hooks/usePerfil";
import { usePaises } from "@/hooks/usePaises";

interface DatosPersonalesFormProps {
  inicial: Perfil;
  onDelete: () => void;
  setToast: (t: ToastData | null) => void;
}

export default function DatosPersonalesForm({
  inicial,
  onDelete,
  setToast,
}: DatosPersonalesFormProps) {
  const { guardar, isLoading } = useGuardarPerfil();
  const { paises } = usePaises();

  const form = useForm<Perfil>({
    resolver: zodResolver(perfilSchema),
    defaultValues: inicial,
    mode: "onTouched",
  });

  async function onValid(data: Perfil) {
    const r = await guardar(data);
    if (r.ok) {
      setToast({ tone: "success", title: "Cambios guardados exitosamente" });
      return;
    }
    // Email duplicado → error en el propio campo (mejor UX que un toast).
    if (r.code === "emailAlreadyExists") {
      form.setError(
        "email",
        { message: "Este correo ya está registrado." },
        { shouldFocus: true },
      );
      return;
    }
    setToast({
      tone: "danger",
      title: "No se pudieron guardar los cambios",
      sub:
        r.code === "validationError"
          ? "Revisá los datos e intentá de nuevo."
          : "Intentá de nuevo en unos minutos.",
    });
  }

  const showErrorAlert =
    form.formState.isSubmitted && Object.keys(form.formState.errors).length > 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onValid)} noValidate>
        {showErrorAlert && (
          <Alert tone="danger" className="mb-[22px]">
            Revisá los campos marcados en rojo: hay datos obligatorios o inválidos.
          </Alert>
        )}
        <SectionLabel>Datos de la cuenta</SectionLabel>
        <div className="grid grid-cols-2 gap-x-5 gap-y-[18px]">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-2">
                <FormLabel required>Nombre y apellido</FormLabel>
                <FormControl>
                  <TextField
                    {...field}
                    icon={<User />}
                    maxLength={40}
                    placeholder="Ej.: Camila Ríos"
                    autoComplete="name"
                  />
                </FormControl>
                {!fieldState.error && (
                  <FormDescription>{`${field.value.length}/40 caracteres`}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fechaNac"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel required>Fecha de nacimiento</FormLabel>
                <FormControl>
                  <DateField {...field} placeholder="dd/mm/aaaa" />
                </FormControl>
                {!fieldState.error && (
                  <FormDescription>No mayor a 120 años</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telefono"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel required>Teléfono</FormLabel>
                <FormControl>
                  <TextField
                    {...field}
                    onChange={(v) => field.onChange(v.replace(/\D/g, ""))}
                    icon={<Phone />}
                    maxLength={16}
                    inputMode="numeric"
                    placeholder="Ej.: 2615558842"
                    autoComplete="tel"
                  />
                </FormControl>
                {!fieldState.error && (
                  <FormDescription>Solo números (7 a 16 dígitos)</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tipoIdent"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Tipo de identificación</FormLabel>
                <FormControl>
                  <TipoIdSelect
                    {...field}
                    icon={<BadgeCheck />}
                    options={TIPOS_IDENTIFICACION}
                    placeholder="Seleccioná un tipo"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="identificacion"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel required>Identificación</FormLabel>
                <FormControl>
                  <TextField
                    {...field}
                    icon={<CreditCard />}
                    maxLength={20}
                    placeholder="Ej.: 38.422.190"
                  />
                </FormControl>
                {!fieldState.error && (
                  <FormDescription>{`${field.value.length}/20 caracteres`}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel required>Correo electrónico</FormLabel>
                <FormControl>
                  <TextField
                    {...field}
                    icon={<Mail />}
                    type="email"
                    maxLength={100}
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
            name="paisIso2"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>País</FormLabel>
                <FormControl>
                  <CountrySelect
                    {...field}
                    options={paises}
                    placeholder="Seleccioná tu país"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-cream-tert pt-[22px]">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader size={16} className="spin" /> Guardando…
              </>
            ) : (
              <>
                <Check size={16} /> Guardar cambios
              </>
            )}
          </Button>
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto inline-flex cursor-pointer items-center gap-2 rounded-md border border-danger bg-transparent px-4 py-2.5 font-sans text-sm font-semibold text-danger-fg"
          >
            <Trash2 size={16} /> Eliminar cuenta
          </button>
        </div>
      </form>
    </Form>
  );
}
