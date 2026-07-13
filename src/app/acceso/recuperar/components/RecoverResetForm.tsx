"use client";

import { useMemo, useState } from "react";
import { LockKeyhole, Check } from "lucide-react";
import { Field, PasswordMeter } from "@/app/registro/components/FormFields";
import { FormHead, PasswordInput, FormAlert } from "@/app/acceso/components/AuthShell";
import { newPasswordSchema } from "../schema";
import { confirmarResetPassword } from "@/lib/passwordReset";
import z from "zod";

type Errors = { pw?: string; confirm?: string };
type Touched = { pw?: boolean; confirm?: boolean };

interface RecoverResetFormProps {
  oobCode: string;
  onSuccess: () => void;
}

export default function RecoverResetForm({ oobCode, onSuccess }: RecoverResetFormProps) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState<Touched>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const allErrors = useMemo<Errors>(() => {
    const r = newPasswordSchema.safeParse({ pw, confirm });
    if (r.success) return {};
    const flat = z.flattenError(r.error);
    return { pw: flat.fieldErrors.pw?.[0], confirm: flat.fieldErrors.confirm?.[0] };
  }, [pw, confirm]);
  const show = (k: keyof Errors) => ((touched[k] || submitted) && allErrors[k]) || null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (allErrors.pw || allErrors.confirm) return;
    setLoading(true);
    setApiError(null);
    const r = await confirmarResetPassword(oobCode, pw);
    setLoading(false);
    if (r.ok) { onSuccess(); return; }
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
