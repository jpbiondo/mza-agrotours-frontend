"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Mail,
  Phone,
  Lock,
  BadgeCheck,
  Fingerprint,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import { TextField, EyeToggle } from "@/components/ui/text-field";
import { TipoIdSelect } from "@/components/ui/tipo-id-select";
import { CountrySelect } from "@/components/ui/country-select";
import { DateField } from "@/components/ui/date-field";
import { PasswordMeter } from "@/components/ui/password-meter";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { TIPOS_IDENTIFICACION, EMPTY_FORM } from "@/data/registro";
import type { FormData } from "@/types/registro";
import { registroSchema } from "../schema";
import { useRegistro } from "@/hooks/useRegistro";
import { usePaises } from "@/hooks/usePaises";

interface RegistroFormProps {
  onSuccess: (data: FormData) => void;
}

const SECTION_LABEL =
  "text-[13px] font-semibold tracking-[0.06em] text-brown-700 uppercase";

export default function RegistroForm({ onSuccess }: RegistroFormProps) {
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register: registrar, apiError } = useRegistro();
  const { paises, isLoading: paisesLoading, error: paisesError } = usePaises();

  const form = useForm<FormData>({
    resolver: zodResolver(registroSchema),
    defaultValues: EMPTY_FORM,
    mode: "onTouched",
  });

  // Suscripción reactiva (compatible con React Compiler, a diferencia de form.watch()).
  const tipoId = useWatch({ control: form.control, name: "tipoId" });

  async function onValid(data: FormData) {
    // Limpiamos espacios sobrantes antes de enviar al backend (las contraseñas no
    // se recortan). El email trimmeado también se usa para el auto-login posterior.
    const payload: FormData = {
      ...data,
      nombre: data.nombre.trim(),
      email: data.email.trim(),
      numeroId: data.numeroId.trim(),
      telefono: data.telefono.trim(),
    };
    try {
      await registrar(payload);
      onSuccess(payload);
    } catch {
      // apiError ya fue seteado por el hook
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onValid)}
        noValidate
        className="flex flex-col gap-[22px]"
      >
        {/* ---- Datos personales ---- */}
        <div className={SECTION_LABEL}>Datos personales</div>

        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Nombre y apellido</FormLabel>
              <FormControl>
                <TextField
                  {...field}
                  icon={<User />}
                  maxLength={40}
                  placeholder="Ej. Camila Ríos"
                  autoComplete="name"
                />
              </FormControl>
              <FormDescription>Como figura en tu documento</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Email</FormLabel>
              <FormControl>
                <TextField
                  {...field}
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

        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
          <FormField
            control={form.control}
            name="pais"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>País</FormLabel>
                <FormControl>
                  <CountrySelect
                    {...field}
                    options={paises}
                    placeholder={
                      paisesLoading
                        ? "Cargando países…"
                        : paisesError
                        ? "No se pudieron cargar los países"
                        : "Seleccionar país"
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fecha"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Fecha de nacimiento</FormLabel>
                <FormControl>
                  <DateField {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
          <FormField
            control={form.control}
            name="tipoId"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Tipo de identificación</FormLabel>
                <FormControl>
                  <TipoIdSelect
                    {...field}
                    icon={<BadgeCheck />}
                    options={TIPOS_IDENTIFICACION}
                    placeholder="Seleccionar tipo"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="numeroId"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Número de identificación</FormLabel>
                <FormControl>
                  <TextField
                    {...field}
                    icon={<Fingerprint />}
                    maxLength={20}
                    placeholder={
                      tipoId === "Pasaporte" ? "Ej. AB123456" : "Ej. 30.123.456"
                    }
                    autoComplete="off"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="telefono"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Teléfono</FormLabel>
              <FormControl>
                <TextField
                  {...field}
                  icon={<Phone />}
                  type="tel"
                  maxLength={15}
                  placeholder="Ej. +54 261 555 1234"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </FormControl>
              <FormDescription>
                Entre 7 y 15 caracteres, podés incluir el código de área
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ---- Seguridad ---- */}
        <div className={cn(SECTION_LABEL, "mt-2")}>Seguridad</div>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Contraseña</FormLabel>
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
              <FormLabel required>Confirmar contraseña</FormLabel>
              <FormControl>
                <TextField
                  {...field}
                  icon={<Lock />}
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repetí la contraseña"
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

        {/* ---- Términos y condiciones ---- */}
        <FormField
          control={form.control}
          name="terminos"
          render={({ field, fieldState }) => (
            <FormItem id="fld-terminos" className="mt-1">
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors",
                  fieldState.error ? "border-danger" : "border-outline-variant",
                  field.value ? "bg-green-050" : "bg-surface"
                )}
              >
                <Checkbox
                  ref={field.ref}
                  checked={field.value}
                  onCheckedChange={(ck) => field.onChange(ck === true)}
                  onBlur={field.onBlur}
                  aria-invalid={!!fieldState.error}
                  className="mt-0.5 size-5"
                />
                <span className="text-[13.5px] leading-relaxed text-fg-1">
                  Leí y acepto los{" "}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="font-semibold text-green-800"
                  >
                    términos y condiciones
                  </a>{" "}
                  y la{" "}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="font-semibold text-green-800"
                  >
                    política de privacidad
                  </a>{" "}
                  de Mendoza AgroTours.
                </span>
              </label>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ---- Submit ---- */}
        <div className="mt-1.5">
          {apiError && (
            <div className="mb-3.5 flex items-center gap-2 rounded-md border border-danger bg-danger-fill px-3.5 py-2.5 text-[13.5px] text-danger-fg">
              <AlertCircle className="size-[15px] shrink-0" />
              {apiError}
            </div>
          )}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={form.formState.isSubmitting}
            className="w-full"
          >
            {form.formState.isSubmitting ? (
              "Creando tu cuenta…"
            ) : (
              <>
                <UserPlus className="size-[18px]" /> Registrarse
              </>
            )}
          </Button>
          <div className="mt-3.5 text-center text-[13.5px] text-fg-2">
            ¿Ya tenés cuenta?{" "}
            <a href="/acceso" className="font-semibold text-green-800">
              Iniciá sesión
            </a>
          </div>
        </div>
      </form>
    </Form>
  );
}
