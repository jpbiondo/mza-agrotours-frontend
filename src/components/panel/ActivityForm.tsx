"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, X, Trash2, Check, Loader, Sprout, Clock, Users, CalendarRange,
  AlertCircle, ListChecks, HelpCircle, Ban, Info,
} from "lucide-react";
import { CATALOGO_CULTIVOS, DIAS } from "@/data/actividad-form";
import { useGuardarActividad, type EstadoGuardado } from "@/hooks/useGuardarActividad";
import type { ActividadFormData } from "@/types/actividad-form";

const inputStyle: React.CSSProperties = {
  width: "100%", fontFamily: "var(--font-sans)", fontSize: 14.5, color: "var(--fg-1)",
  borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid var(--sand)",
  padding: "11px 13px", outline: "none", boxSizing: "border-box",
};

function Section({ icon, title, sub, children }: { icon: React.ReactNode; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 24px", borderBottom: "1px solid var(--cream-tert)" }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--green-050)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17, color: "var(--fg-1)", margin: 0 }}>{title}</h2>
          {sub && <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--fg-3)" }}>{sub}</p>}
        </div>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </section>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "var(--fg-1)", marginBottom: 7 }}>
      {children} {required && <span style={{ color: "var(--danger)" }}>*</span>}
    </label>
  );
}

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--danger-fg)", marginTop: 6 }}><AlertCircle size={14} color="var(--danger)" /> {msg}</div>;
}

type Errors = Partial<Record<"nombre" | "cupos" | "adultos" | "dias" | "vigencia", string>>;

export default function ActivityForm({ mode, initial }: { mode: "crear" | "editar"; initial: ActividadFormData }) {
  const router = useRouter();
  const [v, setV] = useState<ActividadFormData>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState<EstadoGuardado | null>(null);
  const { guardar, isLoading } = useGuardarActividad();

  const set = <K extends keyof ActividadFormData>(k: K, val: ActividadFormData[K]) => setV((s) => ({ ...s, [k]: val }));

  const errors = useMemo<Errors>(() => {
    const e: Errors = {};
    if (!v.nombre.trim()) e.nombre = "Ingresá un nombre para la actividad.";
    if (!v.cupos.trim() || Number(v.cupos) <= 0) e.cupos = "Ingresá un cupo válido.";
    if (!v.ages.adultos.price.trim() || Number(v.ages.adultos.price) <= 0) e.adultos = "El precio de adultos es obligatorio.";
    const algunDia = DIAS.some((d) => v.days[d.key].on && v.days[d.key].desde && v.days[d.key].hasta);
    if (!algunDia) e.dias = "Habilitá al menos un día con horario de inicio y fin.";
    if (v.fechaDesde && v.fechaHasta && v.fechaHasta < v.fechaDesde) e.vigencia = "La fecha de fin no puede ser anterior al inicio.";
    return e;
  }, [v]);

  const show = (k: keyof Errors) => (submitted ? errors[k] : undefined);

  async function onSubmit(estado: EstadoGuardado) {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    try {
      await guardar(v, estado);
      setDone(estado);
      setTimeout(() => router.push("/panel/actividades"), 1400);
    } catch {
      /* el hook ya expone el error */
    }
  }

  const toggleCultivo = (c: string) => set("cultivos", v.cultivos.includes(c) ? v.cultivos.filter((x) => x !== c) : [...v.cultivos, c]);
  const disponibles = CATALOGO_CULTIVOS.filter((c) => !v.cultivos.includes(c));

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-bg)" }}>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "28px 28px 120px" }}>
        <button type="button" onClick={() => router.push("/panel/actividades")} className="btn btn-neutral btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 16 }}>
          <ArrowLeft size={16} /> Volver al listado
        </button>

        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--fg-1)", margin: 0, letterSpacing: "-.01em" }}>
          {mode === "crear" ? "Crear actividad" : "Modificar actividad"}
        </h1>
        <p style={{ margin: "6px 0 26px", color: "var(--fg-2)", fontSize: 15 }}>
          Completá los datos de la experiencia. Podés guardarla como borrador y publicarla más adelante.
        </p>

        {/* Datos básicos */}
        <Section icon={<Info size={18} color="var(--green-800)" />} title="Datos de la experiencia">
          <div style={{ marginBottom: 18 }}>
            <Label required>Nombre</Label>
            <input style={show("nombre") ? { ...inputStyle, borderColor: "var(--danger)" } : inputStyle} value={v.nombre} placeholder="Ej. Cosecha de Malbec al amanecer" maxLength={80} onChange={(e) => set("nombre", e.target.value)} />
            <Err msg={show("nombre")} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <Label>Descripción</Label>
            <textarea style={{ ...inputStyle, minHeight: 110, resize: "vertical", lineHeight: 1.5 }} value={v.descripcion} placeholder="Contá de qué se trata la experiencia…" maxLength={2000} onChange={(e) => set("descripcion", e.target.value)} />
            <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 6, textAlign: "right" }}>{v.descripcion.length} / 2000</div>
          </div>
          <div style={{ marginBottom: 18, maxWidth: 220 }}>
            <Label required>Cupo máximo por jornada</Label>
            <input type="number" min={1} style={show("cupos") ? { ...inputStyle, borderColor: "var(--danger)" } : inputStyle} value={v.cupos} placeholder="Ej. 20" onChange={(e) => set("cupos", e.target.value)} />
            <Err msg={show("cupos")} />
          </div>
          <div>
            <Label>Cultivos asociados</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              {v.cultivos.length === 0 && <span style={{ fontSize: 13.5, color: "var(--fg-3)" }}>Sin cultivos seleccionados.</span>}
              {v.cultivos.map((c) => (
                <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--green-050)", color: "var(--green-800)", border: "1px solid var(--green-100)", borderRadius: "var(--radius-pill)", padding: "5px 6px 5px 12px", fontSize: 13, fontWeight: 600 }}>
                  <Sprout size={13} color="var(--green-700)" /> {c}
                  <button type="button" onClick={() => toggleCultivo(c)} aria-label={`Quitar ${c}`} style={{ width: 20, height: 20, borderRadius: "50%", border: "none", background: "var(--green-100)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><X size={12} color="var(--green-800)" /></button>
                </span>
              ))}
            </div>
            {disponibles.length > 0 && (
              <select value="" onChange={(e) => { if (e.target.value) toggleCultivo(e.target.value); }} style={{ ...inputStyle, maxWidth: 280 }}>
                <option value="">+ Agregar cultivo…</option>
                {disponibles.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
        </Section>

        {/* Precio por rango etario */}
        <Section icon={<Users size={18} color="var(--green-800)" />} title="Precio por rango etario" sub="El precio de adultos es obligatorio. Infantes (0–2) suelen ir sin cargo.">
          {([
            { key: "adultos", label: "Adultos", sub: "18 años o más", required: true },
            { key: "menores", label: "Menores", sub: "3 a 17 años", required: false },
            { key: "infantes", label: "Infantes", sub: "0 a 2 años", required: false },
          ] as const).map((tier) => {
            const t = v.ages[tier.key];
            const enabled = tier.required || t.on;
            return (
              <div key={tier.key} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderBottom: "1px solid var(--cream-tert)" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, cursor: tier.required ? "default" : "pointer" }}>
                  {!tier.required && (
                    <input type="checkbox" checked={t.on} onChange={(e) => set("ages", { ...v.ages, [tier.key]: { ...t, on: e.target.checked } })} style={{ width: 18, height: 18, accentColor: "var(--green-800)" }} />
                  )}
                  <span>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>{tier.label}{tier.required && <span style={{ color: "var(--danger)" }}> *</span>}</span>
                    <span style={{ display: "block", fontSize: 12, color: "var(--fg-3)" }}>{tier.sub}</span>
                  </span>
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 7, width: 200 }}>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg-3)" }}>$</span>
                  <input type="number" min={0} disabled={!enabled} value={t.price} placeholder={enabled ? "0" : "—"} onChange={(e) => set("ages", { ...v.ages, [tier.key]: { ...t, price: e.target.value } })} style={{ ...inputStyle, background: enabled ? "var(--surface)" : "var(--cream-tert)", borderColor: tier.key === "adultos" && show("adultos") ? "var(--danger)" : "var(--sand)" }} />
                </div>
              </div>
            );
          })}
          <Err msg={show("adultos")} />
        </Section>

        {/* Días y horarios */}
        <Section icon={<Clock size={18} color="var(--green-800)" />} title="Días y horarios" sub="Habilitá los días en que se ofrece la experiencia y su franja horaria.">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {DIAS.map((d) => {
              const cfg = v.days[d.key];
              return (
                <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 12px", borderRadius: "var(--radius)", background: cfg.on ? "var(--green-050)" : "var(--cream-tert)", border: "1px solid " + (cfg.on ? "var(--green-100)" : "transparent"), flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, width: 130, cursor: "pointer" }}>
                    <input type="checkbox" checked={cfg.on} onChange={(e) => set("days", { ...v.days, [d.key]: { ...cfg, on: e.target.checked } })} style={{ width: 18, height: 18, accentColor: "var(--green-800)" }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>{d.label}</span>
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="time" disabled={!cfg.on} value={cfg.desde} onChange={(e) => set("days", { ...v.days, [d.key]: { ...cfg, desde: e.target.value } })} style={{ ...inputStyle, width: 130, opacity: cfg.on ? 1 : 0.5 }} />
                    <span style={{ color: "var(--fg-3)" }}>–</span>
                    <input type="time" disabled={!cfg.on} value={cfg.hasta} onChange={(e) => set("days", { ...v.days, [d.key]: { ...cfg, hasta: e.target.value } })} style={{ ...inputStyle, width: 130, opacity: cfg.on ? 1 : 0.5 }} />
                  </div>
                </div>
              );
            })}
          </div>
          <Err msg={show("dias")} />
        </Section>

        {/* Vigencia */}
        <Section icon={<CalendarRange size={18} color="var(--green-800)" />} title="Vigencia" sub="Período en el que la experiencia estará disponible para reservar.">
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <Label>Desde</Label>
              <input type="date" value={v.fechaDesde} onChange={(e) => set("fechaDesde", e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <Label>Hasta</Label>
              <input type="date" value={v.fechaHasta} min={v.fechaDesde || undefined} onChange={(e) => set("fechaHasta", e.target.value)} style={show("vigencia") ? { ...inputStyle, borderColor: "var(--danger)" } : inputStyle} />
            </div>
          </div>
          <Err msg={show("vigencia")} />
        </Section>

        {/* Incluye / no incluye */}
        <Section icon={<ListChecks size={18} color="var(--green-800)" />} title="Qué incluye y qué no">
          <ListEditor label="Incluye" items={v.incluye} onChange={(items) => set("incluye", items)} placeholder="Ej. Desayuno de campo" addLabel="Agregar inclusión" tone="success" />
          <div style={{ height: 20 }} />
          <ListEditor label="No incluye" items={v.noIncluye} onChange={(items) => set("noIncluye", items)} placeholder="Ej. Traslado al establecimiento" addLabel="Agregar exclusión" tone="danger" />
        </Section>

        {/* FAQ */}
        <Section icon={<HelpCircle size={18} color="var(--green-800)" />} title="Preguntas frecuentes">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {v.faqs.map((f, i) => (
              <div key={i} style={{ border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span className="t-label">Pregunta {i + 1}</span>
                  {v.faqs.length > 1 && <button type="button" onClick={() => set("faqs", v.faqs.filter((_, idx) => idx !== i))} aria-label="Quitar pregunta" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--danger)", display: "inline-flex" }}><Trash2 size={15} /></button>}
                </div>
                <input style={{ ...inputStyle, marginBottom: 8 }} value={f.q} placeholder="¿Pregunta?" onChange={(e) => set("faqs", v.faqs.map((x, idx) => idx === i ? { ...x, q: e.target.value } : x))} />
                <textarea style={{ ...inputStyle, minHeight: 64, resize: "vertical" }} value={f.a} placeholder="Respuesta" onChange={(e) => set("faqs", v.faqs.map((x, idx) => idx === i ? { ...x, a: e.target.value } : x))} />
              </div>
            ))}
          </div>
          <button type="button" onClick={() => set("faqs", [...v.faqs, { q: "", a: "" }])} style={addBtnStyle}><Plus size={16} color="var(--brown-700)" /> Agregar pregunta</button>
        </Section>
      </div>

      {/* Barra de acciones fija */}
      <div style={{ position: "sticky", bottom: 0, zIndex: 20, background: "rgba(251,249,248,.94)", backdropFilter: "blur(8px)", borderTop: "1px solid var(--outline-variant)" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-neutral" onClick={() => router.push("/panel/actividades")}>Cancelar</button>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn btn-neutral" disabled={isLoading || !!done} onClick={() => onSubmit("borrador")} style={{ borderColor: "var(--brown-500)", color: "var(--brown-800)" }}>
              {done === "borrador" ? <><Check size={17} /> Guardado</> : "Guardar borrador"}
            </button>
            <button type="button" className="btn btn-primary" disabled={isLoading || !!done} onClick={() => onSubmit("publicado")}>
              {isLoading ? <><Loader size={17} className="spin" /> Guardando…</> : done === "publicado" ? <><Check size={17} /> Publicada</> : <><Check size={17} /> {mode === "crear" ? "Publicar" : "Guardar y publicar"}</>}
            </button>
          </div>
        </div>
      </div>

      {done && (
        <div className="pop" style={{ position: "fixed", right: 24, bottom: 84, zIndex: 130, display: "flex", alignItems: "flex-start", gap: 13, background: "var(--surface)", border: "1px solid var(--green-300)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-pop)", padding: "16px 18px", width: 360 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Check size={18} color="#fff" /></div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14.5, color: "var(--fg-1)" }}>
              {mode === "crear"
                ? (done === "publicado" ? "Actividad publicada correctamente." : "Borrador guardado correctamente.")
                : "La actividad se modificó correctamente."}
            </div>
            <div style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 3 }}>«{v.nombre}» · estado {done === "publicado" ? "Publicado" : "Borrador"}.</div>
          </div>
        </div>
      )}
    </div>
  );
}

const addBtnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8, marginTop: 16, padding: "10px 16px",
  border: "1px dashed var(--brown-500)", borderRadius: "var(--radius)", background: "var(--brown-100)",
  color: "var(--brown-800)", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
};

function ListEditor({ label, items, onChange, placeholder, addLabel, tone }: { label: string; items: string[]; onChange: (items: string[]) => void; placeholder: string; addLabel: string; tone: "success" | "danger" }) {
  const dot = tone === "success" ? "var(--success)" : "var(--danger)";
  return (
    <div>
      <Label>{label}</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0 }} />
            <input style={inputStyle} value={it} placeholder={placeholder} onChange={(e) => onChange(items.map((x, idx) => idx === i ? e.target.value : x))} />
            {items.length > 1 && <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} aria-label="Quitar" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--fg-3)", display: "inline-flex" }}><X size={16} /></button>}
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...items, ""])} style={{ ...addBtnStyle, marginTop: 10 }}>
        {tone === "danger" ? <Ban size={15} color="var(--brown-700)" /> : <Plus size={15} color="var(--brown-700)" />} {addLabel}
      </button>
    </div>
  );
}
