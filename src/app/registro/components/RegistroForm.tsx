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
} from "lucide-react";
import {
  Field,
  TextInput,
  SelectInput,
  CountrySelect,
  DatePicker,
  PasswordMeter,
  EyeToggle,
} from "./FormFields";
import { PAISES, TIPOS_IDENTIFICACION, EMPTY_FORM } from "@/data/registro";
import type { FormData } from "@/types/registro";
import { registroSchema } from "../schema";
import z from "zod";
import { useRegistro } from "@/hooks/useRegistro";

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

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      noValidate
      style={{ display: "flex", flexDirection: "column", gap: 22 }}
    >
      {/* ---- Datos personales ---- */}
      <div className="t-label" style={{ color: "var(--brown-700)" }}>
        DATOS PERSONALES
      </div>

      <div id="fld-nombre">
        <Field
          label="Nombre y apellido"
          required
          error={err("nombre")}
          hint="Como figura en tu documento"
          htmlFor="in-nombre"
        >
          <TextInput
            id="in-nombre"
            icon={<User size={18} />}
            value={v.nombre}
            maxLength={40}
            placeholder="Ej. Camila Ríos"
            autoComplete="name"
            onChange={(x) => update("nombre", x)}
            error={err("nombre")}
          />
        </Field>
      </div>

      <div id="fld-email">
        <Field label="Email" required error={err("email")} htmlFor="in-email">
          <TextInput
            id="in-email"
            icon={<Mail size={18} />}
            type="email"
            value={v.email}
            placeholder="nombre@dominio.com"
            inputMode="email"
            autoComplete="email"
            onChange={(x) => update("email", x)}
            error={err("email")}
          />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div id="fld-pais">
          <Field label="País" required error={err("pais")} htmlFor="in-pais">
            <CountrySelect
              id="in-pais"
              value={v.pais}
              options={PAISES}
              error={err("pais")}
              placeholder="Seleccionar país"
              onChange={(x) => update("pais", x)}
            />
          </Field>
        </div>

        <div id="fld-fecha">
          <Field label="Fecha de nacimiento" required error={err("fecha")}>
            <DatePicker
              value={v.fecha}
              error={err("fecha")}
              onChange={(d) => update("fecha", d)}
            />
          </Field>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div id="fld-tipoId">
          <Field
            label="Tipo de identificación"
            required
            error={err("tipoId")}
            htmlFor="in-tipoId"
          >
            <SelectInput
              id="in-tipoId"
              icon={<BadgeCheck size={18} />}
              value={v.tipoId}
              options={TIPOS_IDENTIFICACION}
              placeholder="Seleccionar tipo"
              error={err("tipoId")}
              onChange={(x) => update("tipoId", x)}
            />
          </Field>
        </div>

        <div id="fld-numeroId">
          <Field
            label="Número de identificación"
            required
            error={err("numeroId")}
            htmlFor="in-numeroId"
          >
            <TextInput
              id="in-numeroId"
              icon={<Fingerprint size={18} />}
              value={v.numeroId}
              maxLength={20}
              placeholder={
                v.tipoId === "Pasaporte" ? "Ej. AB123456" : "Ej. 30.123.456"
              }
              autoComplete="off"
              onChange={(x) => update("numeroId", x)}
              error={err("numeroId")}
            />
          </Field>
        </div>
      </div>

      <div id="fld-telefono">
        <Field
          label="Teléfono"
          required
          error={err("telefono")}
          hint="Entre 7 y 15 caracteres, podés incluir el código de área"
          htmlFor="in-tel"
        >
          <TextInput
            id="in-tel"
            icon={<Phone size={18} />}
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
      </div>

      {/* ---- Seguridad ---- */}
      <div
        className="t-label"
        style={{ color: "var(--brown-700)", marginTop: 8 }}
      >
        SEGURIDAD
      </div>

      <div id="fld-password">
        <Field
          label="Contraseña"
          required
          error={err("password")}
          htmlFor="in-pw"
        >
          <TextInput
            id="in-pw"
            icon={<Lock size={18} />}
            type={showPw ? "text" : "password"}
            value={v.password}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            onChange={(x) => update("password", x)}
            error={err("password")}
            rightSlot={
              <EyeToggle shown={showPw} onToggle={() => setShowPw((s) => !s)} />
            }
          />
        </Field>
        {v.password && <PasswordMeter value={v.password} />}
      </div>

      <div id="fld-confirm">
        <Field
          label="Confirmar contraseña"
          required
          error={err("confirm")}
          htmlFor="in-confirm"
        >
          <TextInput
            id="in-confirm"
            icon={<Lock size={18} />}
            type={showConfirm ? "text" : "password"}
            value={v.confirm}
            placeholder="Repetí la contraseña"
            autoComplete="new-password"
            onChange={(x) => update("confirm", x)}
            error={err("confirm")}
            rightSlot={
              <EyeToggle
                shown={showConfirm}
                onToggle={() => setShowConfirm((s) => !s)}
              />
            }
          />
        </Field>
      </div>

      {/* ---- Términos y condiciones ---- */}
      <div id="fld-terminos" style={{ marginTop: 4 }}>
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            cursor: "pointer",
            padding: "14px 16px",
            borderRadius: "var(--radius)",
            border:
              "1px solid " +
              (touched.terminos && errors.terminos
                ? "var(--danger)"
                : "var(--outline-variant)"),
            background: v.terminos ? "var(--green-050)" : "var(--surface)",
            transition: "background-color .15s, border-color .15s",
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              flexShrink: 0,
              marginTop: 1,
              border:
                "1.5px solid " +
                (v.terminos ? "var(--green-800)" : "var(--sand)"),
              background: v.terminos ? "var(--green-800)" : "var(--surface)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {v.terminos && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2.5 7L5.5 10L11.5 4"
                  stroke="#fff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          <input
            type="checkbox"
            checked={v.terminos}
            style={{ display: "none" }}
            onChange={(e) => update("terminos", e.target.checked)}
          />
          <span
            style={{ fontSize: 13.5, color: "var(--fg-1)", lineHeight: 1.5 }}
          >
            Leí y acepto los{" "}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              style={{ color: "var(--green-800)", fontWeight: 600 }}
            >
              términos y condiciones
            </a>{" "}
            y la{" "}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              style={{ color: "var(--green-800)", fontWeight: 600 }}
            >
              política de privacidad
            </a>{" "}
            de Mendoza AgroTours.
          </span>
        </label>
        {touched.terminos && errors.terminos && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12.5,
              color: "var(--danger-fg)",
              marginTop: 7,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {errors.terminos}
          </div>
        )}
      </div>

      {/* ---- Submit ---- */}
      <div style={{ marginTop: 6 }}>
        {apiError && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13.5,
              color: "var(--danger-fg)",
              background: "var(--danger-bg, #fff0f0)",
              border: "1px solid var(--danger)",
              borderRadius: "var(--radius)",
              padding: "10px 14px",
              marginBottom: 14,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {apiError}
          </div>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary btn-lg"
          style={{ width: "100%", justifyContent: "center" }}
        >
          {isLoading ? (
            "Creando tu cuenta…"
          ) : (
            <>
              <UserPlus size={18} /> Registrarse
            </>
          )}
        </button>
        <div
          style={{
            textAlign: "center",
            marginTop: 14,
            fontSize: 13.5,
            color: "var(--fg-2)",
          }}
        >
          ¿Ya tenés cuenta?{" "}
          <a
            href="/acceso"
            style={{ color: "var(--green-800)", fontWeight: 600 }}
          >
            Iniciá sesión
          </a>
        </div>
      </div>
    </form>
  );
}
