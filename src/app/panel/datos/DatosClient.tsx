"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Home, MapPin, Phone, Landmark, Sprout, Pencil, X, Check, Lock, Plus, Trash2,
  Search, AlertTriangle, AlertCircle, Loader, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import AsyncBoundary from "@/components/AsyncBoundary";
import ProducerShell from "@/components/panel/ProducerShell";
import { FINCAS } from "@/data/panel";
import {
  CATALOGO_CULTIVOS, findCultivoCat, validarDescripcion, validarTelefono, validarEmail,
} from "@/data/datos";
import { useEstablecimientoDatos, useGuardarEstablecimiento, useEliminarEstablecimiento } from "@/hooks/useEstablecimientoDatos";
import type { CultivoCat, EstablecimientoDatos } from "@/types/datos";

const inputStyle: React.CSSProperties = {
  width: "100%", fontFamily: "var(--font-sans)", fontSize: 14.5, color: "var(--fg-1)",
  borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid var(--sand)",
  padding: "11px 13px", outline: "none", boxSizing: "border-box",
};

type Toast = { tone: "success" | "danger"; msg: string } | null;

/* ---- Shell de sección con read/edit ------------------------------------ */
function SectionCard({ title, icon, isEditing, onEdit, onCancel, onSave, canSave = true, saving, locked, children }: {
  title: string; icon: React.ReactNode; isEditing: boolean; onEdit: () => void; onCancel: () => void;
  onSave?: () => void; canSave?: boolean; saving?: boolean; locked?: boolean; children: React.ReactNode;
}) {
  return (
    <section className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 22 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 26px", borderBottom: "1px solid var(--cream-tert)", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--green-050)", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, color: "var(--fg-1)" }}>{title}</h2>
        </div>
        {!isEditing ? (
          <button type="button" className="btn btn-neutral btn-sm" onClick={onEdit} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><Pencil size={15} /> Editar</button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-neutral btn-sm" onClick={onCancel} disabled={saving} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><X size={15} /> Cancelar</button>
            {!locked && onSave && (
              <button type="button" className="btn btn-primary btn-sm" onClick={onSave} disabled={!canSave || saving} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                {saving ? <Loader size={15} className="spin" /> : <Check size={15} />} Guardar cambios
              </button>
            )}
          </div>
        )}
      </header>
      <div style={{ padding: "8px 26px 26px" }}>{children}</div>
    </section>
  );
}

function ReadRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 24, padding: "14px 0", borderBottom: "1px dashed var(--cream-tert)" }} className="datos-row">
      <div className="t-label">{label}</div>
      <div style={{ fontSize: 14.5, color: value ? "var(--fg-1)" : "var(--fg-3)", fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)", wordBreak: "break-word" }}>{value || "—"}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", area, hint, disabled, error, count }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; area?: boolean;
  hint?: string; disabled?: boolean; error?: string | null; count?: number;
}) {
  const lock: React.CSSProperties | undefined = disabled ? { background: "var(--cream-tert)", color: "var(--fg-2)", cursor: "not-allowed" } : undefined;
  const errStyle = error ? { borderColor: "var(--danger)" } : undefined;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <label style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "var(--fg-1)", marginBottom: 7 }}>{label}</label>
        {count != null && <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: value.length > count ? "var(--danger)" : "var(--fg-3)" }}>{value.length} / {count}</span>}
      </div>
      {area ? (
        <textarea value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} rows={4} style={{ ...inputStyle, minHeight: 110, resize: "vertical", lineHeight: 1.5, ...lock, ...errStyle }} />
      ) : (
        <input type={type} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, ...lock, ...errStyle }} />
      )}
      {disabled && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--fg-3)", marginTop: 6 }}><Lock size={12} /> Este dato no puede modificarse</div>}
      {!disabled && hint && !error && <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 6 }}>{hint}</div>}
      {error && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--danger-fg)", marginTop: 6 }}><AlertCircle size={14} color="var(--danger)" /> {error}</div>}
    </div>
  );
}

/* ---- Chip de cultivo --------------------------------------------------- */
function CultivoChip({ nombre, removable, disabled, onRemove }: { nombre: string; removable?: boolean; disabled?: boolean; onRemove?: () => void }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--green-050)", color: "var(--green-800)", border: "1px solid var(--green-100)", borderRadius: "var(--radius-pill)", padding: removable ? "6px 6px 6px 14px" : "8px 15px", fontSize: 14, fontWeight: 600 }}>
      <Sprout size={15} color="var(--green-700)" /> {nombre}
      {removable && (
        <button type="button" onClick={disabled ? undefined : onRemove} disabled={disabled} title={disabled ? "No se puede eliminar: tiene actividades asociadas" : "Quitar cultivo"} aria-label={`Quitar ${nombre}`} style={{ width: 22, height: 22, borderRadius: "50%", border: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", background: disabled ? "transparent" : "var(--green-100)", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1 }}>
          {disabled ? <Lock size={13} color="var(--green-800)" /> : <X size={13} color="var(--green-800)" />}
        </button>
      )}
    </span>
  );
}

/* ---- Modales ----------------------------------------------------------- */
function Scrim({ onClose, width = 480, children }: { onClose: () => void; width?: number; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div onMouseDown={onClose} style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(20,33,18,.45)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="pop" onMouseDown={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: width, background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--outline-variant)", boxShadow: "var(--shadow-pop)", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 40px)" }}>{children}</div>
    </div>
  );
}

function AgregarCultivoModal({ yaAsociados, onCancel, onSelect }: { yaAsociados: string[]; onCancel: () => void; onSelect: (ids: string[]) => void }) {
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const disponibles = useMemo(() => CATALOGO_CULTIVOS.filter((c) => !yaAsociados.includes(c.id)), [yaAsociados]);
  const filtrados = useMemo(() => { const q = query.trim().toLowerCase(); return disponibles.filter((c) => c.nombre.toLowerCase().includes(q)); }, [query, disponibles]);
  const toggle = (id: string) => setSel((cur) => { const s = new Set(cur); if (s.has(id)) s.delete(id); else s.add(id); return s; });

  return (
    <Scrim onClose={onCancel} width={520}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "20px 22px 16px", borderBottom: "1px solid var(--cream-tert)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--green-050)", display: "flex", alignItems: "center", justifyContent: "center" }}><Sprout size={16} color="var(--green-800)" /></div>
          <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, color: "var(--fg-1)" }}>Agregar cultivo</h3>
        </div>
        <button type="button" onClick={onCancel} aria-label="Cerrar" style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--outline-variant)", background: "var(--surface)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><X size={16} color="var(--fg-2)" /></button>
      </div>
      <div style={{ padding: "16px 22px 6px" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", lineHeight: 0 }}><Search size={16} color="var(--fg-3)" /></span>
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscá por nombre del cultivo" style={{ ...inputStyle, paddingLeft: 38 }} />
        </div>
      </div>
      <div style={{ overflowY: "auto", padding: "10px 14px 6px", flex: 1 }}>
        {filtrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 16px", color: "var(--fg-3)", fontSize: 14 }}>No se encontraron cultivos para «{query}».</div>
        ) : (
          filtrados.map((c) => {
            const on = sel.has(c.id);
            return (
              <button key={c.id} type="button" onClick={() => toggle(c.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", border: "none", borderBottom: "1px solid var(--cream-tert)", background: "transparent", cursor: "pointer", textAlign: "left" }}>
                <span style={{ width: 20, height: 20, borderRadius: 5, display: "inline-flex", alignItems: "center", justifyContent: "center", border: on ? "none" : "1.5px solid var(--sand)", background: on ? "var(--green-800)" : "var(--surface)" }}>{on && <Check size={14} color="#fff" />}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14.5, color: "var(--fg-1)", fontWeight: 500 }}><Sprout size={15} color="var(--green-700)" /> {c.nombre}</span>
              </button>
            );
          })
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 22px 18px", borderTop: "1px solid var(--cream-tert)" }}>
        <button type="button" className="btn btn-neutral" onClick={onCancel}>Cancelar</button>
        <button type="button" className="btn btn-primary" disabled={sel.size === 0} onClick={() => onSelect([...sel])}><Check size={17} /> Seleccionar{sel.size > 0 ? ` (${sel.size})` : ""}</button>
      </div>
    </Scrim>
  );
}

function EliminarCultivoModal({ nombre, onCancel, onConfirm }: { nombre: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Scrim onClose={onCancel} width={440}>
      <div style={{ padding: "22px 22px 4px" }}>
        <h3 style={{ margin: "0 0 12px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 19, color: "var(--fg-1)" }}>¿Quitar este cultivo?</h3>
        <p style={{ margin: "0 0 16px", color: "var(--fg-2)", fontSize: 14.5, lineHeight: 1.55 }}>Se quitará del establecimiento al guardar los cambios.</p>
        <CultivoChip nombre={nombre} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "20px 22px 18px" }}>
        <button type="button" className="btn btn-neutral" onClick={onCancel}>Cancelar</button>
        <button type="button" className="btn" onClick={onConfirm} style={{ background: "var(--danger)", color: "#fff", boxShadow: "inset 0 -2px 0 var(--danger-fg)" }}><Trash2 size={16} /> Quitar</button>
      </div>
    </Scrim>
  );
}

function EliminarEstablecimientoModal({ nombre, busy, onCancel, onConfirm }: { nombre: string; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  const [txt, setTxt] = useState("");
  const ok = txt.trim().toUpperCase() === "ELIMINAR";
  return (
    <Scrim onClose={onCancel} width={460}>
      <div style={{ padding: "22px 22px 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--danger-fill)", display: "flex", alignItems: "center", justifyContent: "center" }}><AlertTriangle size={17} color="var(--danger-fg)" /></div>
          <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 19, color: "var(--fg-1)" }}>Eliminar establecimiento</h3>
        </div>
        <p style={{ margin: "0 0 16px", color: "var(--fg-2)", fontSize: 14.5, lineHeight: 1.55 }}>
          Vas a eliminar <strong style={{ color: "var(--fg-1)" }}>{nombre}</strong>. Se darán de baja sus actividades, cultivos y datos asociados. Esta acción no se puede deshacer.
        </p>
        <label style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "var(--fg-1)", marginBottom: 7 }}>Escribí <span style={{ fontFamily: "var(--font-mono)", color: "var(--danger-fg)" }}>ELIMINAR</span> para confirmar</label>
        <input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="ELIMINAR" style={inputStyle} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "20px 22px 18px" }}>
        <button type="button" className="btn btn-neutral" onClick={onCancel} disabled={busy}>Cancelar</button>
        <button type="button" className="btn" onClick={onConfirm} disabled={!ok || busy} style={{ background: ok && !busy ? "var(--danger)" : "var(--cream-tert)", color: ok && !busy ? "#fff" : "var(--fg-3)", boxShadow: ok && !busy ? "inset 0 -2px 0 var(--danger-fg)" : "none" }}>
          {busy ? <Loader size={16} className="spin" /> : <Trash2 size={16} />} Eliminar establecimiento
        </button>
      </div>
    </Scrim>
  );
}

function ToastView({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3600);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  const danger = toast.tone === "danger";
  return (
    <div className="pop" style={{ position: "fixed", top: 88, left: "50%", transform: "translateX(-50%)", background: danger ? "var(--danger-fill)" : "var(--success-fill)", color: danger ? "var(--danger-fg)" : "var(--success-fg)", border: `1px solid ${danger ? "var(--danger)" : "var(--success)"}`, borderRadius: "var(--radius)", padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, fontWeight: 500, fontSize: 14, zIndex: 200, boxShadow: "var(--shadow-pop)" }}>
      {danger ? <AlertCircle size={16} color="var(--danger-fg)" /> : <Check size={16} color="var(--success-fg)" />} {toast.msg}
    </div>
  );
}

/* ---- Cliente ----------------------------------------------------------- */
export default function DatosClient() {
  const [fincaId, setFincaId] = useState(FINCAS[0].id);
  const { data, isLoading, error, reload } = useEstablecimientoDatos(fincaId);
  const { guardar, isLoading: saving } = useGuardarEstablecimiento();
  const { eliminar, isLoading: eliminando } = useEliminarEstablecimiento();

  const [overrides, setOverrides] = useState<Partial<EstablecimientoDatos>>({});
  const datos = useMemo(() => (data ? { ...data, ...overrides } : null), [data, overrides]);
  const [toast, setToast] = useState<Toast>(null);
  const [delOpen, setDelOpen] = useState(false);

  // edición por sección
  const [editing, setEditing] = useState<"identidad" | "contacto" | "cultivos" | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [descErr, setDescErr] = useState<string | null>(null);
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [contactErr, setContactErr] = useState<{ telefono?: string | null; email?: string | null }>({});
  const [draftCultivos, setDraftCultivos] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [toRemove, setToRemove] = useState<CultivoCat | null>(null);

  async function save(patch: Partial<EstablecimientoDatos>) {
    await guardar(patch);
    setOverrides((o) => ({ ...o, ...patch }));
    setEditing(null);
    setToast({ tone: "success", msg: "Cambios guardados correctamente." });
  }

  if (!datos) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--cream-bg)" }}>
        <ProducerShell active="datos" fincas={FINCAS} activeFincaId={fincaId} onFincaChange={setFincaId} />
        <AsyncBoundary loading={isLoading} error={error} onRetry={reload} loadingLabel="Cargando datos…">{null}</AsyncBoundary>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-bg)" }}>
      <ProducerShell active="datos" fincas={FINCAS} activeFincaId={fincaId} onFincaChange={(id) => { setFincaId(id); setEditing(null); setOverrides({}); }} />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 28px 80px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 26 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--fg-1)", margin: 0, letterSpacing: "-.01em" }}>Datos del establecimiento</h1>
            <p style={{ margin: "6px 0 0", color: "var(--fg-2)", fontSize: 15 }}>Información general, contacto y cultivos de la finca. Editá cada sección por separado.</p>
          </div>
          <Link href="/establecimientos/EST-ESCONDIDA" className="btn btn-neutral" style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><ExternalLink size={16} /> Ver perfil público</Link>
        </div>

        {/* Identidad */}
        <SectionCard title="Identidad de la finca" icon={<Home size={16} color="var(--green-800)" />}
          isEditing={editing === "identidad"} saving={saving}
          canSave={descripcion !== datos.descripcion && !validarDescripcion(descripcion)}
          onEdit={() => { setDescripcion(datos.descripcion); setDescErr(null); setEditing("identidad"); }}
          onCancel={() => setEditing(null)}
          onSave={() => { const e = validarDescripcion(descripcion); if (e) { setDescErr(e); return; } save({ descripcion }); }}>
          {editing !== "identidad" ? (
            <div>
              <ReadRow label="Nombre" value={datos.nombre} />
              <ReadRow label="CUIT" value={datos.cuit} mono />
              <ReadRow label="Razón social" value={datos.razonSocial} />
              <div style={{ padding: "14px 0 0" }}>
                <div className="t-label" style={{ marginBottom: 8 }}>Descripción</div>
                <p style={{ margin: 0, color: "var(--fg-1)", fontSize: 14.5, lineHeight: 1.6 }}>{datos.descripcion}</p>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="datos-edit-grid">
              <Field label="CUIT" value={datos.cuit} disabled onChange={() => {}} />
              <Field label="Razón social" value={datos.razonSocial} disabled onChange={() => {}} />
              <div style={{ gridColumn: "1 / -1" }}>
                <Field area label="Descripción" value={descripcion} count={2000} error={descErr} hint="Hasta 2000 caracteres." onChange={(v) => { setDescripcion(v); if (descErr) setDescErr(null); }} />
              </div>
            </div>
          )}
        </SectionCard>

        {/* Ubicación (no modificable) */}
        <SectionCard title="Ubicación" icon={<MapPin size={16} color="var(--green-800)" />} locked
          isEditing={editing === null ? false : false} onEdit={() => {}} onCancel={() => {}}>
          <div>
            <ReadRow label="Dirección" value={datos.calle} />
            <ReadRow label="Localidad (Departamento)" value={`${datos.localidad}, ${datos.provincia}`} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--fg-3)", marginTop: 12 }}><Lock size={12} /> La ubicación no puede modificarse desde acá.</div>
          </div>
        </SectionCard>

        {/* Contacto */}
        <SectionCard title="Contacto" icon={<Phone size={16} color="var(--green-800)" />}
          isEditing={editing === "contacto"} saving={saving}
          canSave={(telefono !== datos.telefono || email !== datos.email)}
          onEdit={() => { setTelefono(datos.telefono); setEmail(datos.email); setContactErr({}); setEditing("contacto"); }}
          onCancel={() => setEditing(null)}
          onSave={() => {
            const te = validarTelefono(telefono); const me = validarEmail(email);
            if (te || me) { setContactErr({ telefono: te, email: me }); return; }
            save({ telefono: telefono.trim(), email: email.trim() });
          }}>
          {editing !== "contacto" ? (
            <div>
              <ReadRow label="Teléfono" value={datos.telefono} mono />
              <ReadRow label="Email" value={datos.email} />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="datos-edit-grid">
              <Field label="Teléfono" value={telefono} error={contactErr.telefono} hint="Entre 7 y 16 caracteres." onChange={(v) => { setTelefono(v); if (contactErr.telefono) setContactErr((e) => ({ ...e, telefono: null })); }} />
              <Field type="email" label="Email" value={email} error={contactErr.email} hint="Hasta 100 caracteres." onChange={(v) => { setEmail(v); if (contactErr.email) setContactErr((e) => ({ ...e, email: null })); }} />
            </div>
          )}
        </SectionCard>

        {/* Operación (no modificable) */}
        <SectionCard title="Operación" icon={<Landmark size={16} color="var(--green-800)" />} locked
          isEditing={false} onEdit={() => {}} onCancel={() => {}}>
          <ReadRow label="CVU" value={datos.cvu} mono />
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--fg-3)", marginTop: 12 }}><Lock size={12} /> El CVU no puede modificarse desde acá.</div>
        </SectionCard>

        {/* Cultivos asociados */}
        <SectionCard title="Cultivos asociados" icon={<Sprout size={16} color="var(--green-800)" />}
          isEditing={editing === "cultivos"} saving={saving}
          canSave={JSON.stringify(draftCultivos) !== JSON.stringify(datos.cultivos)}
          onEdit={() => { setDraftCultivos([...datos.cultivos]); setEditing("cultivos"); }}
          onCancel={() => { setEditing(null); setAddOpen(false); setToRemove(null); }}
          onSave={() => save({ cultivos: draftCultivos })}>
          {(() => {
            const list = editing === "cultivos" ? draftCultivos : datos.cultivos;
            return list.length === 0 ? (
              <div style={{ padding: "8px 0 4px", color: "var(--fg-3)", fontSize: 14 }}>No hay cultivos asociados a este establecimiento.</div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, paddingTop: 4 }}>
                {list.map((id) => {
                  const cat = findCultivoCat(id);
                  if (!cat) return null;
                  return <CultivoChip key={id} nombre={cat.nombre} removable={editing === "cultivos"} disabled={cat.actividades > 0} onRemove={() => setToRemove(cat)} />;
                })}
              </div>
            );
          })()}
          {editing === "cultivos" && (
            <button type="button" onClick={() => setAddOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 18, padding: "10px 16px", border: "1px dashed var(--sand)", borderRadius: "var(--radius)", background: "var(--surface)", color: "var(--green-800)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={16} color="var(--green-800)" /> Agregar cultivo
            </button>
          )}
        </SectionCard>

        {/* Eliminar establecimiento */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 32 }}>
          <button type="button" className="btn" onClick={() => setDelOpen(true)} style={{ background: "var(--surface)", color: "var(--danger)", border: "1px solid var(--danger)", boxShadow: "inset 0 -2px 0 var(--danger-fill)" }}>
            <Trash2 size={16} color="var(--danger)" /> Eliminar establecimiento
          </button>
        </div>
      </div>

      {addOpen && <AgregarCultivoModal yaAsociados={draftCultivos} onCancel={() => setAddOpen(false)} onSelect={(ids) => { setDraftCultivos((cur) => [...cur, ...ids]); setAddOpen(false); }} />}
      {toRemove && <EliminarCultivoModal nombre={toRemove.nombre} onCancel={() => setToRemove(null)} onConfirm={() => { setDraftCultivos((cur) => cur.filter((id) => id !== toRemove.id)); setToRemove(null); }} />}
      {delOpen && (
        <EliminarEstablecimientoModal
          nombre={datos.nombre} busy={eliminando}
          onCancel={() => setDelOpen(false)}
          onConfirm={async () => { await eliminar(); setDelOpen(false); setToast({ tone: "success", msg: "Establecimiento eliminado." }); }}
        />
      )}
      <ToastView toast={toast} onClose={() => setToast(null)} />

      <style>{`@media (max-width: 620px) { .datos-row, .datos-edit-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
