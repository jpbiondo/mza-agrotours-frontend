"use client";

import { useMemo, useState } from "react";
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
import {
  Field,
  TextField,
  TipoIdSelect,
  CountrySelect,
  DateField,
  PasswordMeter,
  EyeToggle,
} from "./fields";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { TIPOS_IDENTIFICACION, EMPTY_FORM } from "@/data/registro";
import type { FormData } from "@/types/registro";
import { registroSchema } from "../schema";
import z from "zod";
import { useRegistro } from "@/hooks/useRegistro";
import { usePaises } from "@/hooks/usePaises";

type Errors = Partial<Record<keyof FormData, string>>;
type Touched = Partial<Record<keyof FormData, boolean>>;

function parseErrors(data: FormData): Errors {
  const result = registroSchema.safeParse(data);
  if (result.success) return {};
  const flat = z.flattenError(result.error);
  const out: Errors = {};
  (Object.keys(flat.fieldErrors) as (keyof FormData)[]).forEach((k) => {
    const msgs = flat.fieldErrors[k as keyof typeof flat.fieldErrors];
    if (msgs?.[0]) out[k] = msgs[0];
  });
  return out;
}

const ALL_FIELDS = Object.keys(EMPTY_FORM) as (keyof FormData)[];

interface RegistroFormProps {
  onSuccess: (data: FormData) => void;
}

export default function RegistroForm({ onSuccess }: RegistroFormProps) {
  const [v, setV] = useState<FormData>(EMPTY_FORM);
  const [touched, setTouched] = useState<Touched>({});
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register, isLoading, apiError } = useRegistro();
  const { paises, isLoading: paisesLoading, error: paisesError } = usePaises();

  // Setea el valor y marca el campo como tocado en un solo paso.
  const update = <K extends keyof FormData>(k: K, val: FormData[K]) => {
    setV((s) => ({ ...s, [k]: val }));
    setTouched((s) => ({ ...s, [k]: true }));
  };

  // Validamos siempre, pero sólo recalculamos cuando cambian los valores.
  const allErrors = useMemo(() => parseErrors(v), [v]);
  const errors = useMemo<Errors>(() => {
    const out: Errors = {};
    (Object.keys(touched) as (keyof FormData)[]).forEach((k) => {
      if (allErrors[k]) out[k] = allErrors[k];
    });
    return out;
  }, [allErrors, touched]);

  async function handleSubmit() {
    setTouched(Object.fromEntries(ALL_FIELDS.map((k) => [k, true])) as Touched);
    if (Object.keys(allErrors).length > 0) return;
    try {
      await register(v);
      onSuccess({ ...v });
    } catch {
      // apiError ya fue seteado por el hook
    }
  }

  const err = (k: keyof FormData) => errors[k];
  const termsError = touched.terminos && errors.terminos;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      noValidate
      className="flex flex-col gap-[22px]"
    >
      {/* ---- Datos personales ---- */}
      <div className="text-[13px] font-semibold tracking-[0.06em] text-brown-700 uppercase">
        Datos personales
      </div>

      <Field
        label="Nombre y apellido"
        required
        error={err("nombre")}
        hint="Como figura en tu documento"
        htmlFor="in-nombre"
      >
        <TextField
          id="in-nombre"
          icon={<User />}
          value={v.nombre}
          maxLength={40}
          placeholder="Ej. Camila Ríos"
          autoComplete="name"
          onChange={(x) => update("nombre", x)}
          error={err("nombre")}
        />
      </Field>

      <Field label="Email" required error={err("email")} htmlFor="in-email">
        <TextField
          id="in-email"
          icon={<Mail />}
          type="email"
          value={v.email}
          placeholder="nombre@dominio.com"
          inputMode="email"
          autoComplete="email"
          onChange={(x) => update("email", x)}
          error={err("email")}
        />
      </Field>

      <div className="grid grid-cols-2 gap-[18px]">
        <Field label="País" required error={err("pais")} htmlFor="in-pais">
          <CountrySelect
            id="in-pais"
            value={v.pais}
            options={paises}
            error={err("pais")}
            placeholder={
              paisesLoading
                ? "Cargando países…"
                : paisesError
                ? "No se pudieron cargar los países"
                : "Seleccionar país"
            }
            onChange={(x) => update("pais", x)}
          />
        </Field>

        <Field label="Fecha de nacimiento" required error={err("fecha")}>
          <DateField
            value={v.fecha}
            error={err("fecha")}
            onChange={(d) => update("fecha", d)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-[18px]">
        <Field
          label="Tipo de identificación"
          required
          error={err("tipoId")}
          htmlFor="in-tipoId"
        >
          <TipoIdSelect
            id="in-tipoId"
            icon={<BadgeCheck />}
            value={v.tipoId}
            options={TIPOS_IDENTIFICACION}
            placeholder="Seleccionar tipo"
            error={err("tipoId")}
            onChange={(x) => update("tipoId", x)}
          />
        </Field>

        <Field
          label="Número de identificación"
          required
          error={err("numeroId")}
          htmlFor="in-numeroId"
        >
          <TextField
            id="in-numeroId"
            icon={<Fingerprint />}
            value={v.numeroId}
            maxLength={20}
            placeholder={v.tipoId === "Pasaporte" ? "Ej. AB123456" : "Ej. 30.123.456"}
            autoComplete="off"
            onChange={(x) => update("numeroId", x)}
            error={err("numeroId")}
          />
        </Field>
      </div>

      <Field
        label="Teléfono"
        required
        error={err("telefono")}
        hint="Entre 7 y 15 caracteres, podés incluir el código de área"
        htmlFor="in-tel"
      >
        <TextField
          id="in-tel"
          icon={<Phone />}
          type="tel"
          value={v.telefono}
          maxLength={15}
          placeholder="Ej. +54 261 555 1234"
          inputMode="tel"
          autoComplete="tel"
          onChange={(x) => update("telefono", x)}
          error={err("telefono")}
        />
      </Field>

      {/* ---- Seguridad ---- */}
      <div className="mt-2 text-[13px] font-semibold tracking-[0.06em] text-brown-700 uppercase">
        Seguridad
      </div>

      <div>
        <Field label="Contraseña" required error={err("password")} htmlFor="in-pw">
          <TextField
            id="in-pw"
            icon={<Lock />}
            type={showPw ? "text" : "password"}
            value={v.password}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            onChange={(x) => update("password", x)}
            error={err("password")}
            rightSlot={<EyeToggle shown={showPw} onToggle={() => setShowPw((s) => !s)} />}
          />
        </Field>
        {v.password && <PasswordMeter value={v.password} />}
      </div>

      <Field
        label="Confirmar contraseña"
        required
        error={err("confirm")}
        htmlFor="in-confirm"
      >
        <TextField
          id="in-confirm"
          icon={<Lock />}
          type={showConfirm ? "text" : "password"}
          value={v.confirm}
          placeholder="Repetí la contraseña"
          autoComplete="new-password"
          onChange={(x) => update("confirm", x)}
          error={err("confirm")}
          rightSlot={
            <EyeToggle shown={showConfirm} onToggle={() => setShowConfirm((s) => !s)} />
          }
        />
      </Field>

      {/* ---- Términos y condiciones ---- */}
      <div id="fld-terminos" className="mt-1">
        <label
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors",
            termsError ? "border-danger" : "border-outline-variant",
            v.terminos ? "bg-green-050" : "bg-surface"
          )}
        >
          <Checkbox
            checked={v.terminos}
            onCheckedChange={(ck) => update("terminos", ck === true)}
            aria-invalid={!!termsError}
            className="mt-0.5 size-5"
          />
          <span className="text-[13.5px] leading-relaxed text-fg-1">
            Leí y acepto los{" "}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="font-semibold text-green-800"
            >
              términos y condiciones
            </a>{" "}
            y la{" "}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="font-semibold text-green-800"
            >
              política de privacidad
            </a>{" "}
            de Mendoza AgroTours.
          </span>
        </label>
        {termsError && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-danger-fg">
            <AlertCircle className="size-3.5 shrink-0" />
            {errors.terminos}
          </div>
        )}
      </div>

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
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
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
  );
}
