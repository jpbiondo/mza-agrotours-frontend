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
  UserCheck,
} from "lucide-react";
import { TextField, EyeToggle } from "@/components/ui/text-field";
import { SimpleSelect } from "@/components/ui/simple-select";
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
import type { ToastData } from "@/components/ui";
import { cn } from "@/lib/utils";
import { TIPOS_IDENTIFICACION, EMPTY_FORM } from "@/data/registro";
import type { FormData } from "@/types/registro";
import { completarRegistroSchema, registroSchema } from "../schema";
import { useRegistro } from "@/hooks/useRegistro";
import { cerrarSesion } from "@/hooks/useAuth";
import { usePaises } from "@/hooks/usePaises";

/**
 * - `alta`: crea la cuenta de Firebase y el perfil.
 * - `completar`: la cuenta de Firebase ya existe (alta a medias); sólo se piden
 *   los datos del perfil. El email es el de la cuenta y no se edita.
 */
export type ModoRegistro = "alta" | "completar";

interface RegistroFormProps {
  onSuccess: (data: FormData) => void;
  setToast: (t: ToastData | null) => void;
  modo?: ModoRegistro;
  /** Email de la cuenta de Firebase; sólo en modo `completar`. */
  emailCuenta?: string;
}

const SECTION_LABEL =
  "text-[13px] font-semibold tracking-[0.06em] text-brown-700 uppercase";

export default function RegistroForm({
  onSuccess,
  setToast,
  modo = "alta",
  emailCuenta = "",
}: RegistroFormProps) {
  const alta = modo === "alta";
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register: registrar, completar } = useRegistro();
  const { paises, isLoading: paisesLoading, error: paisesError } = usePaises();

  const form = useForm<FormData>({
    resolver: zodResolver(alta ? registroSchema : completarRegistroSchema),
    defaultValues: alta ? EMPTY_FORM : { ...EMPTY_FORM, email: emailCuenta },
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

    const r = alta ? await registrar(payload) : await completar(payload);

    if (r.ok) {
      onSuccess(data);
      return;
    }

    if (
      r.code === "auth/email-already-in-use" ||
      r.code === "userAlreadyExists"
    ) {
      form.setError(
        "email",
        { message: "Este correo ya está registrado" },
        { shouldFocus: true },
      );
      return;
    }
    if (r.code === "auth/invalid-email") {
      form.setError(
        "email",
        { message: "Correo electrónico inválido" },
        { shouldFocus: true },
      );
      return;
    }
    // La password policy de Firebase puede ser más estricta que el esquema.
    if (
      r.code === "auth/weak-password" ||
      r.code === "auth/password-does-not-meet-requirements"
    ) {
      form.setError(
        "password",
        { message: "La contraseña no cumple los requisitos de seguridad" },
        { shouldFocus: true },
      );
      return;
    }
    if (r.code === "PHONE_NUMBER_ALREADY_EXISTS") {
      form.setError(
        "telefono",
        { message: "Este teléfono ya está registrado" },
        { shouldFocus: true },
      );
      return;
    }
    setToast({
      tone: "danger",
      title: "No se pudo crear el usuario",
      sub:
        r.code === "validationError"
          ? "Revisá los datos e intentá de nuevo."
          : "Intentá de nuevo en unos minutos.",
    });
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
                  disabled={!alta}
                />
              </FormControl>
              {!alta && (
                <FormDescription>Es el correo de tu cuenta.</FormDescription>
              )}
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
                  <SimpleSelect
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
                  onChange={(v) =>
                    field.onChange(v.replace(/[^\d+]/g, "").slice(0, 16))
                  }
                  icon={<Phone />}
                  type="tel"
                  maxLength={20}
                  placeholder="Ej. +542615551234"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </FormControl>
              <FormDescription>
                Ingresá tu número en formato internacional, sin espacios:
                primero un + y luego 8 a 15 dígitos (el código de país va
                incluido).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ---- Seguridad (sólo en el alta: la cuenta de Firebase ya tiene contraseña) ---- */}
        {alta && (
          <>
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
                        <EyeToggle
                          shown={showPw}
                          onToggle={() => setShowPw((s) => !s)}
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
          </>
        )}

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
                  field.value ? "bg-green-050" : "bg-surface",
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
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={form.formState.isSubmitting}
            className="w-full"
          >
            {form.formState.isSubmitting ? (
              alta ? (
                "Creando tu cuenta…"
              ) : (
                "Guardando tus datos…"
              )
            ) : alta ? (
              <>
                <UserPlus className="size-[18px]" /> Registrarse
              </>
            ) : (
              <>
                <UserCheck className="size-[18px]" /> Completar registro
              </>
            )}
          </Button>
          {alta ? (
            <div className="mt-3.5 text-center text-[13.5px] text-fg-2">
              ¿Ya tenés cuenta?{" "}
              <a href="/acceso" className="font-semibold text-green-800">
                Iniciá sesión
              </a>
            </div>
          ) : (
            <div className="mt-3.5 text-center text-[13.5px] text-fg-2">
              ¿No es tu cuenta?{" "}
              <button
                type="button"
                onClick={() => cerrarSesion()}
                className="cursor-pointer font-semibold text-green-800"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </form>
    </Form>
  );
}
