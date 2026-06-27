"use client";

import { useMemo, useState } from "react";
import { LockKeyhole, Check } from "lucide-react";
import { Field, PasswordMeter } from "@/app/registro/components/FormFields";
import { FormHead, PasswordInput } from "@/app/acceso/components/AuthShell";
import { newPasswordSchema } from "../schema";
import z from "zod";

type Errors = { pw?: string; confirm?: string };
type Touched = { pw?: boolean; confirm?: boolean };

interface RecoverResetFormProps {
  onSuccess: () => void;
}

export default function RecoverResetForm({ onSuccess }: RecoverResetFormProps) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState<Touched>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const allErrors = useMemo<Errors>(() => {
    const r = newPasswordSchema.safeParse({ pw, confirm });
    if (r.success) return {};
    const flat = z.flattenError(r.error);
    return { pw: flat.fieldErrors.pw?.[0], confirm: flat.fieldErrors.confirm?.[0] };
  }, [pw, confirm]);
  const show = (k: keyof Errors) => ((touched[k] || submitted) && allErrors[k]) || null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (allErrors.pw || allErrors.confirm) return;
    setLoading(true);
    // MOCK — simula el guardado de la nueva contraseña
    setTimeout(() => { setLoading(false); onSuccess(); }, 750);
  }

  return (
    <div data-screen-label="Recuperar contraseña · nueva">
      <FormHead
        icon={<LockKeyhole size={24} color="var(--green-800)" />}
        title="Creá una contraseña nueva"
        sub="Elegí una contraseña robusta para tu cuenta. Vas a usarla la próxima vez que inicies sesión."
      />
      <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <Field label="Contraseña nueva" required error={show("pw")} htmlFor="rr-pw">
            <PasswordInput
              id="rr-pw"
              value={pw}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              error={show("pw")}
              onChange={(x) => { setPw(x); setTouched((t) => ({ ...t, pw: true })); }}
            />
          </Field>
          {pw && <PasswordMeter value={pw} />}
        </div>
        <Field label="Confirmar contraseña nueva" required error={show("confirm")} htmlFor="rr-cf">
          <PasswordInput
            id="rr-cf"
            value={confirm}
            placeholder="Repetí la contraseña nueva"
            autoComplete="new-password"
            error={show("confirm")}
            onChange={(x) => { setConfirm(x); setTouched((t) => ({ ...t, confirm: true })); }}
          />
        </Field>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-lg"
          style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
        >
          {loading ? "Guardando…" : (<><Check size={18} /> Guardar</>)}
        </button>
      </form>
    </div>
  );
}
