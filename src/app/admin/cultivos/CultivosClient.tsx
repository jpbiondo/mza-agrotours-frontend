"use client";

import { useMemo, useState } from "react";
import { Sprout, Utensils, Leaf, Scissors, Grape, Pencil, Trash2, Lock, Loader } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { genId } from "@/lib/id";
import { gcrRecetasDeCultivo, gcrCosechaLabel } from "@/data/gestionCr";
import { useGestionCultivos, useGuardarCultivo, useEliminarCultivo } from "@/hooks/useGestionCultivos";
import type { Estacion, GcrCultivo, GcrReceta } from "@/types/gestionCr";
import {
  GcrFlash, GcrConfirmDelete, GcrFormShell, GcrFormHeader, GcrFormFooter, GcrFieldLabel, GcrErr,
  GcrSeasonBar, GcrSeasonEditor, GcrListEditor, GcrStats, GcrSearchBar, GcrEmptyState, GcrPageHead, GcrNoMatch, inputBase,
} from "@/components/admin/gcr/shared";

/* ---- Formulario -------------------------------------------------------- */
function CultivoForm({ initial, busy, existingNames, onCancel, onSave }: { initial: GcrCultivo | null; busy: boolean; existingNames: string[]; onCancel: () => void; onSave: (c: GcrCultivo) => void }) {
  const editing = !!initial;
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "");
  const [beneficios, setBeneficios] = useState<string[]>(initial ? [...initial.beneficios] : [""]);
  const [calendario, setCalendario] = useState<Estacion[]>(initial ? [...initial.calendario] : (Array(12).fill("r") as Estacion[]));
  const [attempted, setAttempted] = useState(false);

  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const taken = existingNames.map(norm);
  const isDup = nombre.trim().length > 0 && taken.includes(norm(nombre));
  const errNombre = !nombre.trim() ? "Ingresá el nombre del cultivo." : nombre.trim().length > 60 ? "El nombre es demasiado largo." : isDup ? "Ya existe un cultivo con ese nombre. Elegí otro." : "";
  const errDesc = !descripcion.trim() ? "Escribí una breve descripción del cultivo." : "";
  const showNombre = (attempted && errNombre) || (isDup ? errNombre : "");
  const showDesc = attempted && errDesc;

  function handleSave() {
    setAttempted(true);
    if (errNombre || errDesc) return;
    onSave({
      id: editing ? initial!.id : genId("c"),
      nombre: nombre.trim(), descripcion: descripcion.trim(),
      beneficios: beneficios.map((b) => b.trim()).filter(Boolean), calendario,
      familia: editing ? initial!.familia : "",
      color: editing ? initial!.color : "linear-gradient(135deg,#7C8A4A,#3D4A1E)",
      actividades: editing ? initial!.actividades : 0, estado: "activo",
    });
  }

  return (
    <>
      <GcrFormHeader eyebrow={editing ? "Editar cultivo" : "Nuevo cultivo"} title={editing ? "Editar tipo de cultivo" : "Agregar un cultivo"} sub={editing ? "Modificá los datos del cultivo disponible para todos los establecimientos." : "Sumá un tipo de cultivo al catálogo de la plataforma. Queda disponible para asociar a actividades y recetas."} onCancel={onCancel} />
      <div style={{ padding: "22px 26px", overflowY: "auto", flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 22 }}>
        <div>
          <GcrFieldLabel required>Nombre</GcrFieldLabel>
          <input value={nombre} maxLength={60} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Uva Malbec" style={{ ...inputBase, borderColor: showNombre ? "var(--danger)" : "var(--sand)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 7 }}>{showNombre ? <GcrErr msg={errNombre} /> : <span />}<span style={{ flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-3)" }}>{nombre.length}/60</span></div>
        </div>
        <div>
          <GcrFieldLabel required>Descripción</GcrFieldLabel>
          <textarea rows={4} maxLength={500} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Contá qué caracteriza a este cultivo, cuándo y cómo se cosecha en Mendoza." style={{ ...inputBase, resize: "vertical", borderColor: showDesc ? "var(--danger)" : "var(--sand)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 7 }}>{showDesc ? <GcrErr msg={errDesc} /> : <span />}<span style={{ flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: 12, color: descripcion.length >= 500 ? "var(--danger)" : "var(--fg-3)" }}>{descripcion.length}/500</span></div>
        </div>
        <div>
          <GcrFieldLabel style={{ marginBottom: 4 }}>Estacionalidad anual</GcrFieldLabel>
          <p style={{ margin: "0 0 12px", fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.5 }}>Asigná a cada mes un estado: cosecha, crecimiento o reposo.</p>
          <GcrSeasonEditor value={calendario} onChange={setCalendario} />
        </div>
        <div>
          <GcrFieldLabel style={{ marginBottom: 4 }}>Beneficios para la alimentación</GcrFieldLabel>
          <p style={{ margin: "0 0 12px", fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.5 }}>Se muestran como lista en la ficha pública del cultivo. Hasta 100 caracteres cada uno.</p>
          <GcrListEditor items={beneficios} onChange={setBeneficios} placeholder="Ej. Antioxidante natural por su contenido de polifenoles" addLabel="Agregar beneficio" maxLength={100} />
        </div>
      </div>
      <GcrFormFooter onCancel={onCancel} onSave={handleSave} saveLabel={editing ? "Guardar cambios" : "Agregar cultivo"} saveIcon={busy ? <Loader size={17} className="spin" /> : editing ? undefined : <Sprout size={17} />} busy={busy} />
    </>
  );
}

/* ---- Tabla ------------------------------------------------------------- */
function Tabla({ cultivos, recetas, onEdit, onAskDelete }: { cultivos: GcrCultivo[]; recetas: GcrReceta[]; onEdit: (c: GcrCultivo) => void; onAskDelete: (c: GcrCultivo) => void }) {
  const th: React.CSSProperties = { fontWeight: 700, color: "var(--fg-2)", fontSize: 12.5, textTransform: "uppercase", letterSpacing: ".05em", padding: "14px 16px", borderBottom: "2px solid var(--outline-variant)", whiteSpace: "nowrap" };
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1020 }}>
        <thead><tr>{["Cultivo", "Calendario de cosecha", "Recetas", "Actividades", "Acciones"].map((h, i) => <th key={h} style={{ ...th, textAlign: i === 4 ? "right" : i === 2 || i === 3 ? "center" : "left" }}>{h}</th>)}</tr></thead>
        <tbody>
          {cultivos.map((c) => {
            const nRec = gcrRecetasDeCultivo(c.id, recetas);
            const noBorrable = nRec > 0 || c.actividades > 0;
            const hint = nRec > 0 ? "No se puede eliminar con recetas asociadas" : "No se puede eliminar con actividades vigentes";
            const delTitle = noBorrable ? hint : "Eliminar el cultivo";
            return (
              <tr key={c.id} style={{ borderBottom: "1px solid var(--cream-tert)" }}>
                <td style={{ padding: "14px 16px", verticalAlign: "middle", maxWidth: 360 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ width: 46, height: 46, borderRadius: 10, flexShrink: 0, background: c.color, display: "flex", alignItems: "center", justifyContent: "center" }}><Leaf size={21} color="rgba(255,255,255,.92)" /></span>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "var(--fg-1)" }}>{c.nombre}</div>
                  </div>
                </td>
                <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <GcrSeasonBar calendario={c.calendario} />
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--fg-2)" }}><Scissors size={13} color="var(--green-700)" />Cosecha: {gcrCosechaLabel(c.calendario)}</span>
                  </div>
                </td>
                <td style={{ padding: "14px 16px", verticalAlign: "middle", textAlign: "center" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: nRec ? "var(--fg-1)" : "var(--fg-3)" }}><Utensils size={15} color="var(--brown-700)" />{nRec}</span></td>
                <td style={{ padding: "14px 16px", verticalAlign: "middle", textAlign: "center" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: c.actividades ? "var(--fg-1)" : "var(--fg-3)" }}><Grape size={15} color="var(--green-700)" />{c.actividades}</span></td>
                <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center" }}>
                    <button type="button" className="btn btn-neutral btn-sm" onClick={() => onEdit(c)}><Pencil size={15} /> Editar</button>
                    <button type="button" className="btn btn-sm" disabled={noBorrable} title={delTitle} onClick={() => onAskDelete(c)} style={{ border: "1px solid " + (noBorrable ? "var(--outline-variant)" : "var(--danger)"), background: noBorrable ? "var(--cream-tert)" : "var(--surface)", color: noBorrable ? "var(--fg-3)" : "var(--danger)", cursor: noBorrable ? "not-allowed" : "pointer" }}><Trash2 size={15} /> Eliminar</button>
                  </div>
                  {noBorrable && <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", marginTop: 8, fontSize: 11.5, color: "var(--fg-3)" }}><Lock size={13} color="var(--fg-3)" />{hint}</div>}
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
function Inner({ initialCultivos, recetas }: { initialCultivos: GcrCultivo[]; recetas: GcrReceta[] }) {
  const [cultivos, setCultivos] = useState<GcrCultivo[]>(initialCultivos);
  const [form, setForm] = useState<{ open: boolean; initial: GcrCultivo | null } | null>(null);
  const [toDelete, setToDelete] = useState<GcrCultivo | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const { guardar, isLoading: saving } = useGuardarCultivo();
  const { eliminar, isLoading: deleting } = useEliminarCultivo();

  const notify = (msg: string) => { setFlash(msg); setTimeout(() => setFlash((f) => (f === msg ? null : f)), 3400); };
  const totalRecetas = recetas.filter((r) => r.estado === "activo").length;

  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? cultivos.filter((c) => c.nombre.toLowerCase().includes(q)) : cultivos;
  }, [cultivos, query]);

  async function saveCultivo(data: GcrCultivo) {
    const editing = cultivos.some((c) => c.id === data.id);
    await guardar(data);
    setCultivos((prev) => (editing ? prev.map((c) => (c.id === data.id ? data : c)) : [data, ...prev]));
    setForm(null);
    notify(editing ? `Se guardaron los cambios de «${data.nombre}».` : `Se agregó «${data.nombre}» al catálogo.`);
  }
  async function confirmDelete() {
    if (!toDelete) return;
    const c = toDelete;
    await eliminar(c.id);
    setCultivos((prev) => prev.filter((x) => x.id !== c.id));
    setToDelete(null);
    notify(`Se eliminó «${c.nombre}» del catálogo.`);
  }

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "28px 28px 72px" }}>
      <GcrPageHead crumb="Cultivos" title="Cultivos" desc="Administrá el catálogo de cultivos de la plataforma. Cada cultivo queda disponible para que los establecimientos lo asocien a sus actividades y para las recetas de la finca." actionLabel="Agregar cultivo" onAction={() => setForm({ open: true, initial: null })} />
      <GcrStats items={[{ icon: <Sprout size={20} color="var(--green-800)" />, label: "Cultivos en el catálogo", value: cultivos.length }, { icon: <Utensils size={20} color="var(--green-800)" />, label: "Recetas en el catálogo", value: totalRecetas }]} />
      <GcrSearchBar query={query} onQuery={setQuery} placeholder="Buscar por nombre" />

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {cultivos.length === 0 ? (
          <GcrEmptyState icon={<Sprout size={32} color="var(--brown-700)" />} title="Todavía no hay cultivos cargados" body="Empezá creando el primero. Una vez cargado, los establecimientos van a poder asociarlo a sus actividades y recetas." actionLabel="Agregar el primer cultivo" onAction={() => setForm({ open: true, initial: null })} />
        ) : visibles.length > 0 ? (
          <Tabla cultivos={visibles} recetas={recetas} onEdit={(c) => setForm({ open: true, initial: c })} onAskDelete={(c) => setToDelete(c)} />
        ) : (
          <GcrNoMatch msg="No hay cultivos que coincidan con la búsqueda." />
        )}
      </div>

      {form?.open && (
        <GcrFormShell onCancel={() => setForm(null)}>
          <CultivoForm initial={form.initial} busy={saving} existingNames={cultivos.filter((c) => !form.initial || c.id !== form.initial!.id).map((c) => c.nombre)} onCancel={() => setForm(null)} onSave={saveCultivo} />
        </GcrFormShell>
      )}

      <GcrConfirmDelete open={!!toDelete} title="Eliminar cultivo" busy={deleting} body={toDelete ? <>¿Seguro que querés eliminar <strong style={{ color: "var(--fg-1)" }}>«{toDelete.nombre}»</strong> del catálogo? Esta acción no se puede deshacer.</> : null} onCancel={() => setToDelete(null)} onConfirm={confirmDelete} />
      <GcrFlash flash={flash} />
    </div>
  );
}

export default function CultivosClient() {
  const { cultivos, recetas, isLoading } = useGestionCultivos();
  return (
    <AdminShell active="cultivos">
      {isLoading || !cultivos || !recetas ? (
        <div style={{ padding: "120px 28px", textAlign: "center", color: "var(--fg-3)" }}><Loader size={26} className="spin" /><div style={{ marginTop: 12, fontSize: 14 }}>Cargando cultivos…</div></div>
      ) : (
        <Inner initialCultivos={cultivos} recetas={recetas} />
      )}
    </AdminShell>
  );
}
