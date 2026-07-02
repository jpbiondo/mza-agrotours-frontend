"use client";

import { useEffect, useState } from "react";
import {
  ChevronRight, Pencil, X, Save, Info, ShieldCheck, Eye, EyeOff, Check, AlertCircle, AlertTriangle,
  CheckCircle2, ArrowRight, ImageOff, Loader, Image as ImageIcon, Building2, Coins, Landmark, Percent,
  CalendarPlus, Undo2, Timer, Store, Wallet, Settings2,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import AdminShell from "@/components/admin/AdminShell";
import { PARAM_ADMIN, PARAM_FIELDS, PARAM_GROUPS, paramError, paramDisplay } from "@/data/parametros";
import { admInitials } from "@/data/admin";
import { useParametros, useConfirmarIdentidad, useGuardarParametros } from "@/hooks/useParametros";
import type { ParametroKey, Parametros } from "@/types/parametros";

const ICON: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  image: ImageIcon, "building-2": Building2, coins: Coins, landmark: Landmark, percent: Percent,
  "calendar-plus": CalendarPlus, "undo-2": Undo2, timer: Timer, store: Store, wallet: Wallet, "settings-2": Settings2,
};
const inputStyle: React.CSSProperties = { width: "100%", fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--fg-1)", borderRadius: "var(--radius)", border: "1px solid var(--sand)", padding: "12px 14px", outline: "none", boxSizing: "border-box", background: "var(--surface)" };

function fieldErr(msg: string) {
  return <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 7, fontSize: 13, color: "var(--danger-fg)" }}><AlertCircle size={15} color="var(--danger)" /> {msg}</div>;
}

/* ---- Vista previa del logo (remonta al cambiar src) -------------------- */
function LogoPreview({ src, size = 56 }: { src: string; size?: number }) {
  const [ok, setOk] = useState(true);
  return (
    <span style={{ width: size, height: size, flexShrink: 0, borderRadius: 14, border: "1px solid var(--outline-variant)", background: "var(--cream-tert)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {ok && src
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={src} alt="Logo de la empresa" style={{ maxWidth: "78%", maxHeight: "78%", objectFit: "contain" }} onError={() => setOk(false)} />
        : <ImageOff size={size * 0.34} color="var(--fg-3)" />}
    </span>
  );
}

/* ---- Fila de parámetro ------------------------------------------------- */
function ParamRow({ fieldKey, value, editing, error, onChange }: { fieldKey: ParametroKey; value: string; editing: boolean; error: string; onChange: (v: string) => void }) {
  const field = PARAM_FIELDS.find((f) => f.key === fieldKey)!;
  const FIcon = ICON[field.icon] ?? Info;
  const labelCol = (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0 }}>
      <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 10, background: "var(--green-050)", border: "1px solid var(--green-300)", display: "flex", alignItems: "center", justifyContent: "center" }}><FIcon size={18} color="var(--green-800)" /></span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: "var(--fg-1)", lineHeight: 1.3 }}>{field.label}</div>
        <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 3, lineHeight: 1.4 }}>{field.hint}</div>
      </div>
    </div>
  );

  if (!editing) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)", gap: 24, alignItems: "center", padding: "14px 0" }}>
        {labelCol}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 14, minWidth: 0 }}>
          {field.kind === "logo" && <LogoPreview key={value} src={value} size={56} />}
          <span style={{ fontFamily: field.mono || (field.kind !== "logo" && field.kind !== "text") ? "var(--font-mono)" : "var(--font-sans)", fontSize: 15.5, fontWeight: 600, color: "var(--fg-1)", textAlign: "right", wordBreak: "break-word", maxWidth: field.kind === "logo" ? 220 : 360 }}>{paramDisplay(field.key, value)}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.1fr)", gap: 24, alignItems: "start", padding: "16px 0" }}>
      {labelCol}
      <div style={{ minWidth: 0 }}>
        {field.kind === "logo" && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            <LogoPreview key={value} src={value} size={64} />
            <div style={{ fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.45 }}>Vista previa en vivo. Pegá la ruta o URL de la imagen del logo.</div>
          </div>
        )}
        {field.unit ? (
          <div style={{ position: "relative" }}>
            <input inputMode={field.kind === "int" ? "numeric" : "decimal"} value={value} maxLength={field.max} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, paddingRight: 84, fontFamily: field.mono ? "var(--font-mono)" : "var(--font-sans)", borderColor: error ? "var(--danger)" : "var(--sand)" }} />
            <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, fontWeight: 600, color: "var(--fg-3)", pointerEvents: "none" }}>{field.unit}</span>
          </div>
        ) : (
          <input value={value} maxLength={field.max} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, fontFamily: field.mono ? "var(--font-mono)" : "var(--font-sans)", borderColor: error ? "var(--danger)" : "var(--sand)" }} />
        )}
        {error ? fieldErr(error) : field.max && <p style={{ margin: "7px 0 0", fontSize: 11.5, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>{(value || "").length}/{field.max}</p>}
      </div>
    </div>
  );
}

/* ---- Modal de reconfirmación de identidad ------------------------------ */
function AuthModal({ busy, onCancel, onSubmit }: { busy: boolean; onCancel: () => void; onSubmit: (pass: string) => void }) {
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function submit() {
    if (!pass.trim()) { setErr("Ingresá tu contraseña para continuar."); return; }
    onSubmit(pass);
  }
  const fieldLbl: React.CSSProperties = { display: "block", fontWeight: 600, fontSize: 13, color: "var(--fg-2)", marginBottom: 7 };

  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(42,38,32,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(2px)" }}>
      <div className="pop" style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-pop)", width: "min(440px, 100%)", overflow: "hidden" }}>
        <div style={{ padding: "26px 28px 20px", borderBottom: "1px solid var(--outline-variant)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ width: 48, height: 48, flexShrink: 0, borderRadius: "50%", background: "var(--green-050)", border: "1px solid var(--green-300)", display: "flex", alignItems: "center", justifyContent: "center" }}><ShieldCheck size={23} color="var(--green-800)" /></span>
            <div><div className="t-label" style={{ marginBottom: 4 }}>Seguridad</div><h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 21, color: "var(--fg-1)" }}>Confirmá tu identidad</h3></div>
          </div>
          <p style={{ margin: "16px 0 0", color: "var(--fg-2)", fontSize: 14.5, lineHeight: 1.55 }}>Para modificar los parámetros del sistema, reingresá tu contraseña.</p>
        </div>
        <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={fieldLbl}>Cuenta</label>
            <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 14px", borderRadius: "var(--radius)", border: "1px solid var(--outline-variant)", background: "var(--cream-tert)" }}>
              <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: "50%", background: "var(--brown-700)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13 }}>{admInitials(PARAM_ADMIN.nombre)}</span>
              <span style={{ minWidth: 0 }}><span style={{ display: "block", fontWeight: 600, fontSize: 14, color: "var(--fg-1)" }}>{PARAM_ADMIN.nombre}</span><span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{PARAM_ADMIN.email}</span></span>
            </div>
          </div>
          <div>
            <label htmlFor="ps-pass" style={fieldLbl}>Contraseña <span style={{ color: "var(--danger)" }}>*</span></label>
            <div style={{ position: "relative" }}>
              <input id="ps-pass" type={show ? "text" : "password"} autoFocus placeholder="••••••••" value={pass} onChange={(e) => { setPass(e.target.value); setErr(""); }} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} style={{ ...inputStyle, paddingRight: 46, borderColor: err ? "var(--danger)" : "var(--sand)" }} />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Ocultar" : "Mostrar"} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8 }}>{show ? <EyeOff size={18} color="var(--fg-3)" /> : <Eye size={18} color="var(--fg-3)" />}</button>
            </div>
            {err && fieldErr(err)}
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--fg-3)" }}>Demo: la contraseña es <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg-2)" }}>agrotours</span>.</p>
          </div>
        </div>
        <div style={{ padding: "14px 28px", borderTop: "1px solid var(--outline-variant)", background: "var(--cream-tert)", display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button type="button" className="btn btn-neutral" onClick={onCancel} disabled={busy}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? <Loader size={17} className="spin" /> : <Check size={17} />} Confirmar</button>
        </div>
      </div>
    </div>
  );
}

/* ---- Modal de revisión ------------------------------------------------- */
function ReviewModal({ draft, original, busy, onCancel, onConfirm }: { draft: Parametros; original: Parametros; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const changed = PARAM_FIELDS.filter((f) => (draft[f.key] ?? "").trim() !== (original[f.key] ?? "").trim());

  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(42,38,32,.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", overflowY: "auto", backdropFilter: "blur(2px)" }}>
      <div className="pop" style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-pop)", width: "min(620px, 100%)", maxHeight: "calc(100vh - 80px)", display: "flex", flexDirection: "column", overflow: "hidden", margin: "auto" }}>
        <div style={{ padding: "24px 28px 18px", borderBottom: "1px solid var(--outline-variant)", flexShrink: 0 }}>
          <div className="t-label" style={{ marginBottom: 6 }}>Revisión de cambios</div>
          <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 23, color: "var(--fg-1)" }}>Así quedarían los parámetros</h3>
          <p style={{ margin: "8px 0 0", color: "var(--fg-2)", fontSize: 14.5, lineHeight: 1.5 }}>{changed.length === 0 ? "No modificaste ningún valor." : `Revisá ${changed.length === 1 ? "el cambio" : `los ${changed.length} cambios`} antes de confirmar.`}</p>
        </div>
        <div style={{ padding: "6px 28px", overflowY: "auto", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 0", borderBottom: "1px solid var(--cream-tert)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ textAlign: "center" }}><LogoPreview key={"o" + original.logo} src={original.logo} size={56} /><div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 6 }}>Actual</div></div>
              <ArrowRight size={18} color="var(--fg-3)" />
              <div style={{ textAlign: "center" }}><LogoPreview key={"n" + draft.logo} src={draft.logo} size={56} /><div style={{ fontSize: 11, color: "var(--green-800)", fontWeight: 600, marginTop: 6 }}>Nuevo</div></div>
            </div>
            <div style={{ minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 15, color: "var(--fg-1)" }}>Logo de la empresa</div><div style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--fg-2)", marginTop: 4, wordBreak: "break-all" }}>{draft.logo}</div></div>
          </div>
          {PARAM_FIELDS.filter((f) => f.key !== "logo").map((f) => {
            const isChanged = (draft[f.key] ?? "").trim() !== (original[f.key] ?? "").trim();
            const FIcon = ICON[f.icon] ?? Info;
            return (
              <div key={f.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 0", borderBottom: "1px solid var(--cream-tert)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}><FIcon size={17} color="var(--fg-3)" /><span style={{ fontSize: 14, fontWeight: 500, color: "var(--fg-2)" }}>{f.label}</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  {isChanged && <span style={{ fontFamily: f.mono ? "var(--font-mono)" : "var(--font-sans)", fontSize: 13, color: "var(--fg-3)", textDecoration: "line-through" }}>{paramDisplay(f.key, original[f.key])}</span>}
                  {isChanged && <ArrowRight size={14} color="var(--fg-3)" />}
                  <span style={{ fontFamily: f.mono ? "var(--font-mono)" : "var(--font-sans)", fontSize: 14.5, fontWeight: 600, color: isChanged ? "var(--green-800)" : "var(--fg-1)" }}>{paramDisplay(f.key, draft[f.key])}</span>
                  {isChanged && <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--green-800)", background: "var(--green-050)", border: "1px solid var(--green-300)", borderRadius: "var(--radius-pill)", padding: "2px 8px" }}>Editado</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: "14px 28px", borderTop: "1px solid var(--outline-variant)", background: "var(--cream-tert)", display: "flex", justifyContent: "flex-end", gap: 12, flexShrink: 0 }}>
          <button type="button" className="btn btn-neutral" onClick={onCancel} disabled={busy}>Cancelar cambios</button>
          <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={busy}>{busy ? <Loader size={17} className="spin" /> : <Check size={17} />} Confirmar cambios</button>
        </div>
      </div>
    </div>
  );
}

/* ---- Inner ------------------------------------------------------------- */
function Inner({ initial }: { initial: Parametros }) {
  const [saved, setSaved] = useState<Parametros>(initial);
  const [draft, setDraft] = useState<Parametros>(initial);
  const [editing, setEditing] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [flash, setFlash] = useState<{ tone: "success" | "danger"; msg: string } | null>(null);
  const { confirmar, isLoading: authing } = useConfirmarIdentidad();
  const { guardar, isLoading: guardando } = useGuardarParametros();

  const notify = (tone: "success" | "danger", msg: string) => { setFlash({ tone, msg }); setTimeout(() => setFlash((f) => (f?.msg === msg ? null : f)), 3600); };

  const errors: Partial<Record<ParametroKey, string>> = {};
  PARAM_FIELDS.forEach((f) => { const e = paramError(f.key, draft[f.key]); if (e) errors[f.key] = e; });
  const hasErrors = Object.keys(errors).length > 0;

  async function onAuthSubmit(pass: string) {
    const ok = await confirmar(pass);
    setAuthOpen(false);
    if (!ok) { notify("danger", "No pudimos verificar tu identidad. Autenticación fallida."); return; }
    setDraft({ ...saved });
    setAttempted(false);
    setEditing(true);
  }
  function cancelEdit() { setEditing(false); setAttempted(false); setDraft({ ...saved }); }
  function askSave() {
    setAttempted(true);
    if (hasErrors) { notify("danger", "Revisá los campos marcados antes de guardar."); return; }
    setReviewOpen(true);
  }
  async function confirmSave() {
    const clean = { ...draft } as Parametros;
    (Object.keys(clean) as ParametroKey[]).forEach((k) => { clean[k] = (clean[k] ?? "").trim(); });
    await guardar(clean);
    setSaved(clean);
    setDraft(clean);
    setReviewOpen(false);
    setEditing(false);
    setAttempted(false);
    notify("success", "Los parámetros del sistema se cambiaron exitosamente.");
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 28px 88px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13.5, marginBottom: 14 }}><span>Parámetros</span><ChevronRight size={15} /><span style={{ color: "var(--fg-2)", fontWeight: 500 }}>Parámetros del sistema</span></div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ minWidth: 280 }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--fg-1)", letterSpacing: "-.01em" }}>Parámetros del sistema</h1>
          <p style={{ margin: "10px 0 0", color: "var(--fg-2)", fontSize: 15.5, lineHeight: 1.5, maxWidth: 640 }}>Información general del negocio y reglas de operación de la plataforma. Para modificarla, vas a tener que reconfirmar tu identidad.</p>
        </div>
        {!editing ? (
          <button type="button" className="btn btn-primary btn-lg" onClick={() => setAuthOpen(true)}><Pencil size={18} /> Modificar parámetros</button>
        ) : (
          <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
            <button type="button" className="btn btn-neutral btn-lg" onClick={cancelEdit} disabled={guardando}><X size={18} /> Cancelar cambios</button>
            <button type="button" className="btn btn-primary btn-lg" onClick={askSave} disabled={guardando}><Save size={18} /> Guardar cambios</button>
          </div>
        )}
      </div>

      {editing && (
        <div role="status" style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--green-050)", border: "1px solid var(--green-300)", borderRadius: "var(--radius)", padding: "12px 16px", marginBottom: 20 }}>
          <Pencil size={18} color="var(--green-800)" /><span style={{ fontSize: 14.5, color: "var(--green-800)", fontWeight: 500 }}>Estás editando los parámetros. Los cambios no se guardan hasta que los confirmes.</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {PARAM_GROUPS.map((g) => {
          const GIcon = ICON[g.icon] ?? Info;
          const fields = PARAM_FIELDS.filter((f) => f.group === g.id);
          return (
            <div key={g.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 22px", borderBottom: "1px solid var(--outline-variant)", background: "var(--cream-tert)" }}><GIcon size={17} color="var(--brown-700)" /><span className="t-label">{g.label}</span></div>
              <div>
                {fields.map((f, i) => (
                  <div key={f.key} style={{ borderBottom: i < fields.length - 1 ? "1px solid var(--cream-tert)" : "none", padding: "6px 22px" }}>
                    <ParamRow fieldKey={f.key} value={editing ? draft[f.key] : saved[f.key]} editing={editing} error={attempted ? errors[f.key] ?? "" : ""} onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 16, color: "var(--fg-3)", fontSize: 13 }}><Info size={16} color="var(--fg-3)" />Estos valores afectan a toda la plataforma. Los cambios se aplican una vez confirmados.</div>

      {authOpen && <AuthModal busy={authing} onCancel={() => setAuthOpen(false)} onSubmit={onAuthSubmit} />}
      {reviewOpen && <ReviewModal draft={draft} original={saved} busy={guardando} onCancel={() => setReviewOpen(false)} onConfirm={confirmSave} />}
      {flash && <div className="pop" style={{ position: "fixed", right: 24, bottom: 24, zIndex: 90, maxWidth: 440, background: flash.tone === "danger" ? "var(--danger)" : "var(--green-800)", color: "#fff", borderRadius: "var(--radius)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10, boxShadow: "var(--shadow-pop)", fontSize: 15, fontWeight: 500 }}>{flash.tone === "danger" ? <AlertTriangle size={20} color="#fff" /> : <CheckCircle2 size={20} color="#fff" />}{flash.msg}</div>}
    </div>
  );
}

export default function ParametrosClient() {
  const { data, isLoading, error, reload } = useParametros();
  return (
    <AdminShell active="parametros">
      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} loadingLabel="Cargando parámetros…">
        {data && <Inner initial={data} />}
      </AsyncBoundary>
    </AdminShell>
  );
}
