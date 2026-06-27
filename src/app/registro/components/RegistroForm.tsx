"use client";

import { useState, useEffect } from "react";
import {
  User, Mail, Phone, Lock, BadgeCheck, Fingerprint, UserPlus,
} from "lucide-react";
import {
  Field, TextInput, SelectInput, CountrySelect, DatePicker,
  PasswordMeter, EyeToggle, passwordChecks,
} from "./FormFields";
import { PAISES, TIPOS_IDENTIFICACION, EMAILS_REGISTRADOS, EMPTY_FORM } from "@/data/registro";
import type { FormData } from "@/types/registro";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Errors = Partial<Record<keyof FormData, string>>;
type Touched = Partial<Record<keyof FormData, boolean>>;

function validate(state: FormData): Errors {
  const e: Errors = {};

  if (!state.nombre.trim()) e.nombre = "Este campo es obligatorio";
  else if (state.nombre.trim().length > 40) e.nombre = "Máximo 40 caracteres";

  if (!state.email.trim()) e.email = "Este campo es obligatorio";
  else if (!EMAIL_RE.test(state.email.trim())) e.email = "Ingresá un email válido (nombre@dominio.com)";
  else if (EMAILS_REGISTRADOS.includes(state.email.trim().toLowerCase())) e.email = "El correo ya está registrado";

  if (!state.pais) e.pais = "Este campo es obligatorio";
  if (!state.fecha) e.fecha = "Este campo es obligatorio";
  if (!state.tipoId) e.tipoId = "Este campo es obligatorio";

  const nid = state.numeroId.trim();
  if (!nid) e.numeroId = "Este campo es obligatorio";
  else if (nid.length < 5 || nid.length > 20) e.numeroId = "Debe tener entre 5 y 20 caracteres";

  const tel = state.telefono.trim();
  if (!tel) e.telefono = "Este campo es obligatorio";
  else if (tel.length < 7 || tel.length > 15) e.telefono = "El teléfono debe tener entre 7 y 15 caracteres";

  if (!state.password) e.password = "Este campo es obligatorio";
  else {
    const c = passwordChecks(state.password);
    if (!c.length || !c.special) e.password = "La contraseña debe tener mínimo 8 caracteres y un carácter especial";
  }

  if (!state.confirm) e.confirm = "Este campo es obligatorio";
  else if (state.confirm !== state.password) e.confirm = "Las contraseñas ingresadas no coinciden";

  if (!state.terminos) e.terminos = "Debe leer y aceptar los términos y condiciones para poder registrarse";

  return e;
}

const ALL_FIELDS: (keyof FormData)[] = [
  "nombre", "email", "pais", "fecha", "tipoId", "numeroId",
  "telefono", "password", "confirm", "terminos",
];

interface RegistroFormProps {
  onSuccess: (data: FormData) => void;
}

export default function RegistroForm({ onSuccess }: RegistroFormProps) {
  const [v, setV] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Touched>({});
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormData>(k: K, val: FormData[K]) =>
    setV((s) => ({ ...s, [k]: val }));
  const touch = (k: keyof FormData) => setTouched((s) => ({ ...s, [k]: true }));

  useEffect(() => {
    if (Object.keys(touched).length === 0) return;
    const all = validate(v);
    const next: Errors = {};
    (Object.keys(touched) as (keyof FormData)[]).forEach((k) => {
      if (all[k]) next[k] = all[k];
    });
    setErrors(next);
  }, [v]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit() {
    const e = validate(v);
    setErrors(e);
    const allTouched = Object.fromEntries(ALL_FIELDS.map((k) => [k, true])) as Touched;
    setTouched(allTouched);
    if (Object.keys(e).length > 0) return;
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); onSuccess({ ...v }); }, 850);
  }

  const err = (k: keyof FormData) => touched[k] ? errors[k] : undefined;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
      noValidate
      style={{ display: "flex", flexDirection: "column", gap: 22 }}
    >
      {/* ---- Datos personales ---- */}
      <div className="t-label" style={{ color: "var(--brown-700)" }}>DATOS PERSONALES</div>

      <div id="fld-nombre">
        <Field label="Nombre y apellido" required error={err("nombre")} hint="Como figura en tu documento" htmlFor="in-nombre">
          <TextInput
            id="in-nombre"
            icon={<User size={18} />}
            value={v.nombre}
            maxLength={40}
            placeholder="Ej. Camila Ríos"
            autoComplete="name"
            onChange={(x) => { set("nombre", x); touch("nombre"); }}
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
            onChange={(x) => { set("email", x); touch("email"); }}
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
              onChange={(x) => { set("pais", x); touch("pais"); }}
            />
          </Field>
        </div>

        <div id="fld-fecha">
          <Field label="Fecha de nacimiento" required error={err("fecha")}>
            <DatePicker
              value={v.fecha}
              error={err("fecha")}
              onChange={(d) => { set("fecha", d); touch("fecha"); }}
            />
          </Field>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div id="fld-tipoId">
          <Field label="Tipo de identificación" required error={err("tipoId")} htmlFor="in-tipoId">
            <SelectInput
              id="in-tipoId"
              icon={<BadgeCheck size={18} />}
              value={v.tipoId}
              options={TIPOS_IDENTIFICACION}
              placeholder="Seleccionar tipo"
              error={err("tipoId")}
              onChange={(x) => { set("tipoId", x); touch("tipoId"); }}
            />
          </Field>
        </div>

        <div id="fld-numeroId">
          <Field label="Número de identificación" required error={err("numeroId")} htmlFor="in-numeroId">
            <TextInput
              id="in-numeroId"
              icon={<Fingerprint size={18} />}
              value={v.numeroId}
              maxLength={20}
              placeholder={v.tipoId === "Pasaporte" ? "Ej. AB123456" : "Ej. 30.123.456"}
              autoComplete="off"
              onChange={(x) => { set("numeroId", x); touch("numeroId"); }}
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
            onChange={(x) => { set("telefono", x); touch("telefono"); }}
            error={err("telefono")}
          />
        </Field>
      </div>

      {/* ---- Seguridad ---- */}
      <div className="t-label" style={{ color: "var(--brown-700)", marginTop: 8 }}>SEGURIDAD</div>

      <div id="fld-password">
        <Field label="Contraseña" required error={err("password")} htmlFor="in-pw">
          <TextInput
            id="in-pw"
            icon={<Lock size={18} />}
            type={showPw ? "text" : "password"}
            value={v.password}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            onChange={(x) => { set("password", x); touch("password"); }}
            error={err("password")}
            rightSlot={<EyeToggle shown={showPw} onToggle={() => setShowPw((s) => !s)} />}
          />
        </Field>
        {v.password && <PasswordMeter value={v.password} />}
      </div>

      <div id="fld-confirm">
        <Field label="Confirmar contraseña" required error={err("confirm")} htmlFor="in-confirm">
          <TextInput
            id="in-confirm"
            icon={<Lock size={18} />}
            type={showConfirm ? "text" : "password"}
            value={v.confirm}
            placeholder="Repetí la contraseña"
            autoComplete="new-password"
            onChange={(x) => { set("confirm", x); touch("confirm"); }}
            error={err("confirm")}
            rightSlot={<EyeToggle shown={showConfirm} onToggle={() => setShowConfirm((s) => !s)} />}
          />
        </Field>
      </div>

      {/* ---- Términos y condiciones ---- */}
      <div id="fld-terminos" style={{ marginTop: 4 }}>
        <label
          style={{
            display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer",
            padding: "14px 16px", borderRadius: "var(--radius)",
            border: "1px solid " + (touched.terminos && errors.terminos ? "var(--danger)" : "var(--outline-variant)"),
            background: v.terminos ? "var(--green-050)" : "var(--surface)",
            transition: "background-color .15s, border-color .15s",
          }}
        >
          <span
            style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
              border: "1.5px solid " + (v.terminos ? "var(--green-800)" : "var(--sand)"),
              background: v.terminos ? "var(--green-800)" : "var(--surface)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {v.terminos && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </span>
          <input
            type="checkbox"
            checked={v.terminos}
            style={{ display: "none" }}
            onChange={(e) => { set("terminos", e.target.checked); touch("terminos"); }}
          />
          <span style={{ fontSize: 13.5, color: "var(--fg-1)", lineHeight: 1.5 }}>
            Leí y acepto los{" "}
            <a href="#" onClick={(e) => e.preventDefault()} style={{ color: "var(--green-800)", fontWeight: 600 }}>
              términos y condiciones
            </a>{" "}
            y la{" "}
            <a href="#" onClick={(e) => e.preventDefault()} style={{ color: "var(--green-800)", fontWeight: 600 }}>
              política de privacidad
            </a>{" "}
            de Mendoza AgroTours.
          </span>
        </label>
        {touched.terminos && errors.terminos && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--danger-fg)", marginTop: 7 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {errors.terminos}
          </div>
        )}
      </div>

      {/* ---- Submit ---- */}
      <div style={{ marginTop: 6 }}>
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary btn-lg"
          style={{ width: "100%", justifyContent: "center" }}
        >
          {submitting ? (
            "Creando tu cuenta…"
          ) : (
            <>
              <UserPlus size={18} /> Registrarse
            </>
          )}
        </button>
        <div style={{ textAlign: "center", marginTop: 14, fontSize: 13.5, color: "var(--fg-2)" }}>
          ¿Ya tenés cuenta?{" "}
          <a href="/acceso" style={{ color: "var(--green-800)", fontWeight: 600 }}>
            Iniciá sesión
          </a>
        </div>
      </div>
    </form>
  );
}
