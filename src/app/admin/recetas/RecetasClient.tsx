"use client";

import { useMemo, useState } from "react";
import { Utensils, Sprout, Users, List as ListIcon, Clock, Pencil, Trash2, Loader } from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { TextField } from "@/components/ui/text-field";
import { genId } from "@/lib/id";
import { GCR_DIFICULTADES, GCR_DURACIONES, gcrCultivoNombre, gcrRecetaInitials } from "@/data/gestionCr";
import { useGestionRecetas, useGuardarReceta, useEliminarReceta } from "@/hooks/useGestionRecetas";
import type { Dificultad, DuracionId, GcrCultivo, GcrReceta } from "@/types/gestionCr";
import {
  GcrFlash, GcrConfirmDelete, GcrFormShell, GcrFormHeader, GcrFormFooter, GcrFieldLabel, GcrErr,
  GcrListEditor, GcrCultivoMultiSelect, GcrCultivoChip, GcrDifficultyPill, GcrStats, GcrSearchBar,
  GcrEmptyState, GcrPageHead, GcrNoMatch,
} from "@/components/admin/gcr/shared";

/* ---- Segmented control ------------------------------------------------- */
function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div role="radiogroup" style={{ display: "inline-flex", background: "var(--cream-tert)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", padding: 3, gap: 3, flexWrap: "wrap" }}>
      {options.map((o) => {
        const on = value === o.value;
        return <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)} style={{ padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 600, background: on ? "var(--surface)" : "transparent", color: on ? "var(--green-800)" : "var(--fg-2)", boxShadow: on ? "0 1px 2px rgba(45,90,39,.12)" : "none" }}>{o.label}</button>;
      })}
    </div>
  );
}

/* ---- Formulario -------------------------------------------------------- */
function RecetaForm({ initial, busy, cultivos, existingNames, onCancel, onSave }: { initial: GcrReceta | null; busy: boolean; cultivos: GcrCultivo[]; existingNames: string[]; onCancel: () => void; onSave: (r: GcrReceta) => void }) {
  const editing = !!initial;
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [selCultivos, setSelCultivos] = useState<string[]>(initial ? [...initial.cultivos] : []);
  const [dificultad, setDificultad] = useState<Dificultad>(initial?.dificultad ?? "Fácil");
  const [duracion, setDuracion] = useState<DuracionId>(initial?.duracion ?? "media");
  const [tiempo, setTiempo] = useState(initial?.tiempo ?? "");
  const [porciones, setPorciones] = useState(initial ? String(initial.porciones) : "4");
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "");
  const [ingredientes, setIngredientes] = useState<string[]>(initial ? [...initial.ingredientes] : [""]);
  const [pasos, setPasos] = useState<string[]>(initial ? [...initial.pasos] : [""]);
  const [attempted, setAttempted] = useState(false);

  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const taken = existingNames.map(norm);
  const isDup = nombre.trim().length > 0 && taken.includes(norm(nombre));
  const errNombre = !nombre.trim() ? "Ingresá el nombre de la receta." : nombre.trim().length > 100 ? "El nombre no puede superar los 100 caracteres." : isDup ? "Ya existe una receta con ese nombre. Elegí otro." : "";
  const errCultivos = selCultivos.length === 0 ? "Asociá al menos un cultivo." : "";
  const porcNum = parseInt(porciones, 10);
  const errPorciones = !porciones || isNaN(porcNum) || porcNum < 1 ? "Ingresá una cantidad mayor a 0." : "";
  const errDesc = !descripcion.trim() ? "Escribí una breve descripción." : "";
  const showNombre = (attempted && errNombre) || (isDup ? errNombre : "");

  function handleSave() {
    setAttempted(true);
    if (errNombre || errCultivos || errPorciones || errDesc) return;
    onSave({
      id: editing ? initial!.id : genId("r"),
      nombre: nombre.trim(), cultivos: selCultivos, dificultad, duracion,
      tiempo: tiempo.trim() || "—", porciones: Math.max(1, porcNum), descripcion: descripcion.trim(),
      ingredientes: ingredientes.map((x) => x.trim()).filter(Boolean),
      pasos: pasos.map((x) => x.trim()).filter(Boolean), estado: "activo",
    });
  }

  return (
    <>
      <GcrFormHeader eyebrow={editing ? "Editar receta" : "Nueva receta"} title={editing ? "Editar receta" : "Agregar una receta"} sub={editing ? "Modificá los datos de la receta del catálogo." : "Sumá una receta al catálogo. Asociala a los cultivos con los que se prepara."} onCancel={onCancel} />
      <div style={{ padding: "22px 26px", overflowY: "auto", flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 22 }}>
        <div>
          <GcrFieldLabel required>Nombre de la receta</GcrFieldLabel>
          <TextField value={nombre} maxLength={100} onChange={setNombre} placeholder="Ej. Tarta rústica de uva Malbec" aria-invalid={!!showNombre} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 7 }}>{showNombre ? <GcrErr msg={errNombre} /> : <span />}<span style={{ flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-3)" }}>{nombre.length}/100</span></div>
        </div>
        <div>
          <GcrFieldLabel required style={{ marginBottom: 4 }}>Cultivos asociados</GcrFieldLabel>
          <p style={{ margin: "0 0 12px", fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.5 }}>Elegí uno o más cultivos con los que se prepara esta receta.</p>
          <GcrCultivoMultiSelect cultivos={cultivos} selected={selCultivos} onChange={setSelCultivos} />
          {attempted && errCultivos && <div style={{ marginTop: 10 }}><GcrErr msg={errCultivos} /></div>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div><GcrFieldLabel>Dificultad</GcrFieldLabel><Segmented value={dificultad} onChange={setDificultad} options={GCR_DIFICULTADES.map((d) => ({ value: d, label: d }))} /></div>
          <div><GcrFieldLabel>Duración</GcrFieldLabel><Segmented value={duracion} onChange={setDuracion} options={Object.values(GCR_DURACIONES).map((d) => ({ value: d.id, label: d.nombre }))} /></div>
          <div>
            <GcrFieldLabel>Tiempo de preparación</GcrFieldLabel>
            <TextField value={tiempo} maxLength={40} onChange={setTiempo} placeholder="Ej. 1 h 15 min" />
            <div style={{ marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", textAlign: "right" }}>{tiempo.length}/40</div>
          </div>
          <div>
            <GcrFieldLabel>Porciones</GcrFieldLabel>
            <TextField inputMode="numeric" value={porciones} onChange={(v) => setPorciones(v.replace(/[^0-9]/g, ""))} aria-invalid={!!(attempted && errPorciones)} />
            {attempted && errPorciones && <div style={{ marginTop: 7 }}><GcrErr msg={errPorciones} /></div>}
          </div>
        </div>
        <div>
          <GcrFieldLabel required>Descripción</GcrFieldLabel>
          <textarea rows={3} maxLength={500} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Contá en una o dos líneas de qué se trata la receta." className={attempted && errDesc ? "textarea err" : "textarea"} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 7 }}>{attempted && errDesc ? <GcrErr msg={errDesc} /> : <span />}<span style={{ flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: 12, color: descripcion.length >= 500 ? "var(--danger)" : "var(--fg-3)" }}>{descripcion.length}/500</span></div>
        </div>
        <div><GcrFieldLabel style={{ marginBottom: 12 }}>Ingredientes</GcrFieldLabel><GcrListEditor items={ingredientes} onChange={setIngredientes} placeholder="Ej. 250 g de harina 0000" addLabel="Agregar ingrediente" maxLength={100} /></div>
        <div><GcrFieldLabel style={{ marginBottom: 12 }}>Pasos de preparación</GcrFieldLabel><GcrListEditor items={pasos} onChange={setPasos} placeholder="Describí el paso" addLabel="Agregar paso" maxLength={200} numbered /></div>
      </div>
      <GcrFormFooter onCancel={onCancel} onSave={handleSave} saveLabel={editing ? "Guardar cambios" : "Agregar receta"} saveIcon={busy ? <Loader size={17} className="spin" /> : editing ? undefined : <Utensils size={17} />} busy={busy} />
    </>
  );
}

/* ---- Tabla ------------------------------------------------------------- */
function Tabla({ recetas, cultivos, onEdit, onAskDelete }: { recetas: GcrReceta[]; cultivos: GcrCultivo[]; onEdit: (r: GcrReceta) => void; onAskDelete: (r: GcrReceta) => void }) {
  const th: React.CSSProperties = { textAlign: "left", fontWeight: 700, color: "var(--fg-2)", fontSize: 12.5, textTransform: "uppercase", letterSpacing: ".05em", padding: "14px 16px", borderBottom: "2px solid var(--outline-variant)", whiteSpace: "nowrap" };
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1060 }}>
        <thead><tr>{["Receta", "Cultivos", "Dificultad", "Tiempo", "Acciones"].map((h, i) => <th key={h} style={{ ...th, textAlign: i === 4 ? "right" : "left" }}>{h}</th>)}</tr></thead>
        <tbody>
          {recetas.map((r) => {
            const dur = GCR_DURACIONES[r.duracion];
            return (
              <tr key={r.id} style={{ borderBottom: "1px solid var(--cream-tert)" }}>
                <td style={{ padding: "14px 16px", verticalAlign: "middle", maxWidth: 400 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: "#F3ECE2", border: "1px solid var(--sand)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--brown-700)" }}>{gcrRecetaInitials(r.nombre)}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15.5, color: "var(--fg-1)" }}>{r.nombre}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, fontSize: 12, color: "var(--fg-3)" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Users size={13} color="var(--fg-3)" />{r.porciones} porc.</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><ListIcon size={13} color="var(--fg-3)" />{r.pasos.length} pasos</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 16px", verticalAlign: "middle", maxWidth: 260 }}><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{r.cultivos.map((cid) => <GcrCultivoChip key={cid} id={cid} cultivos={cultivos} />)}</div></td>
                <td style={{ padding: "14px 16px", verticalAlign: "middle" }}><GcrDifficultyPill dificultad={r.dificultad} /></td>
                <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 13.5, color: "var(--fg-1)", fontWeight: 500 }}><Clock size={14} color="var(--brown-700)" />{r.tiempo}</span>
                    <span style={{ fontSize: 11.5, color: "var(--fg-3)", paddingLeft: 20 }}>{dur ? dur.nombre : ""}</span>
                  </div>
                </td>
                <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center" }}>
                    <button type="button" className="btn btn-neutral btn-sm" onClick={() => onEdit(r)}><Pencil size={15} /> Editar</button>
                    <button type="button" className="btn btn-sm" onClick={() => onAskDelete(r)} style={{ border: "1px solid var(--danger)", background: "var(--surface)", color: "var(--danger)" }}><Trash2 size={15} /> Eliminar</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---- Inner ------------------------------------------------------------- */
function Inner({ initialRecetas, cultivos }: { initialRecetas: GcrReceta[]; cultivos: GcrCultivo[] }) {
  const [recetas, setRecetas] = useState<GcrReceta[]>(initialRecetas);
  const [form, setForm] = useState<{ open: boolean; initial: GcrReceta | null } | null>(null);
  const [toDelete, setToDelete] = useState<GcrReceta | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const { guardar, isLoading: saving } = useGuardarReceta();
  const { eliminar, isLoading: deleting } = useEliminarReceta();

  const notify = (msg: string) => { setFlash(msg); setTimeout(() => setFlash((f) => (f === msg ? null : f)), 3400); };

  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recetas;
    return recetas.filter((r) => r.nombre.toLowerCase().includes(q) || r.cultivos.some((cid) => gcrCultivoNombre(cid, cultivos).toLowerCase().includes(q)));
  }, [recetas, query, cultivos]);

  async function saveReceta(data: GcrReceta) {
    const editing = recetas.some((r) => r.id === data.id);
    await guardar(data);
    setRecetas((prev) => (editing ? prev.map((r) => (r.id === data.id ? data : r)) : [data, ...prev]));
    setForm(null);
    notify(editing ? `Se guardaron los cambios de «${data.nombre}».` : `Se agregó «${data.nombre}» al catálogo.`);
  }
  async function confirmDelete() {
    if (!toDelete) return;
    const r = toDelete;
    await eliminar(r.id);
    setRecetas((prev) => prev.filter((x) => x.id !== r.id));
    setToDelete(null);
    notify(`Se eliminó «${r.nombre}» del catálogo.`);
  }

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "28px 28px 72px" }}>
      <GcrPageHead crumb="Recetas" title="Recetas" desc="Administrá el recetario de la plataforma. Cada receta se asocia a uno o más cultivos y aparece en sus fichas para inspirar a los visitantes a cocinar con lo que se cosecha." actionLabel="Agregar receta" onAction={() => setForm({ open: true, initial: null })} />
      <GcrStats items={[{ icon: <Utensils size={20} color="var(--green-800)" />, label: "Recetas en el catálogo", value: recetas.length }, { icon: <Sprout size={20} color="var(--green-800)" />, label: "Cultivos con receta", value: new Set(recetas.flatMap((r) => r.cultivos)).size }]} />
      <GcrSearchBar query={query} onQuery={setQuery} placeholder="Buscar por nombre o cultivo" />

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {recetas.length === 0 ? (
          <GcrEmptyState icon={<Utensils size={32} color="var(--brown-700)" />} title="Todavía no hay recetas cargadas" body="Empezá creando la primera. Asociala a un cultivo y va a aparecer en su ficha para que los visitantes cocinen con lo que se cosecha." actionLabel="Agregar la primera receta" onAction={() => setForm({ open: true, initial: null })} />
        ) : visibles.length > 0 ? (
          <Tabla recetas={visibles} cultivos={cultivos} onEdit={(r) => setForm({ open: true, initial: r })} onAskDelete={(r) => setToDelete(r)} />
        ) : (
          <GcrNoMatch msg="No hay recetas que coincidan con la búsqueda." />
        )}
      </div>

      {form?.open && (
        <GcrFormShell onCancel={() => setForm(null)}>
          <RecetaForm initial={form.initial} busy={saving} cultivos={cultivos} existingNames={recetas.filter((r) => !form.initial || r.id !== form.initial!.id).map((r) => r.nombre)} onCancel={() => setForm(null)} onSave={saveReceta} />
        </GcrFormShell>
      )}

      <GcrConfirmDelete open={!!toDelete} title="Eliminar receta" busy={deleting} body={toDelete ? <>¿Seguro que querés eliminar <strong style={{ color: "var(--fg-1)" }}>«{toDelete.nombre}»</strong> del catálogo? Dejará de aparecer en las fichas de sus cultivos. Esta acción no se puede deshacer.</> : null} onCancel={() => setToDelete(null)} onConfirm={confirmDelete} />
      <GcrFlash flash={flash} />
    </div>
  );
}

export default function RecetasClient() {
  const { recetas, cultivos, isLoading, error, reload } = useGestionRecetas();
  return (
    <AsyncBoundary loading={isLoading} error={error} onRetry={reload} loadingLabel="Cargando recetas…">
      {recetas && cultivos && <Inner initialRecetas={recetas} cultivos={cultivos} />}
    </AsyncBoundary>
  );
}
