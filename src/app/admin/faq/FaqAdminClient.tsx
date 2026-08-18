"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight, MessagesSquare, Plus, Search, X, HelpCircle, Pencil, Trash2, ChevronDown,
  SearchX, RotateCcw, AlertCircle, Check, Loader, LayoutGrid, Info, CalendarCheck, UserRound,
  Tractor, Wallet,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { genId } from "@/lib/id";
import { FAQ_CATEGORIAS } from "@/data/faq";
import { useFaq, useGuardarFaq, useEliminarFaq } from "@/hooks/useFaq";
import type { FaqItem } from "@/types/catalogo";

const CAT_ICON: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  "layout-grid": LayoutGrid, info: Info, "calendar-check": CalendarCheck, "user-round": UserRound, tractor: Tractor, wallet: Wallet,
};
const CAT_BY_ID = Object.fromEntries(FAQ_CATEGORIAS.map((c) => [c.id, c]));

function highlight(text: string, term: string): React.ReactNode {
  const t = term.trim();
  if (!t) return text;
  const idx = text.toLowerCase().indexOf(t.toLowerCase());
  if (idx === -1) return text;
  return <>{text.slice(0, idx)}<mark style={{ background: "var(--green-100)", color: "var(--green-900)", borderRadius: 3, padding: "0 2px" }}>{text.slice(idx, idx + t.length)}</mark>{text.slice(idx + t.length)}</>;
}

const inputStyle: React.CSSProperties = { width: "100%", fontFamily: "var(--font-sans)", fontSize: 14.5, color: "var(--fg-1)", borderRadius: "var(--radius)", border: "1px solid var(--sand)", padding: "12px 14px", outline: "none", boxSizing: "border-box", background: "var(--surface)" };

/* ---- Item del acordeón ------------------------------------------------- */
function FaqItemRow({ item, term, open, onToggle, onEdit, onDelete }: { item: FaqItem; term: string; open: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  const cat = CAT_BY_ID[item.cat] ?? { label: "General", icon: "info" };
  const CIcon = CAT_ICON[cat.icon] ?? Info;
  const actBtn: React.CSSProperties = { width: 38, height: 38, flexShrink: 0, borderRadius: "var(--radius)", border: "1px solid var(--outline-variant)", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
  return (
    <div style={{ background: "var(--surface)", border: "1px solid " + (open ? "var(--green-300)" : "var(--outline-variant)"), borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: open ? "var(--shadow-hover)" : "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
        <button onClick={onToggle} aria-expanded={open} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 14, padding: 0, background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
          <span style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: open ? "var(--green-800)" : "var(--green-050)", color: open ? "#fff" : "var(--green-800)" }}><HelpCircle size={19} /></span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16.5, color: "var(--fg-1)", lineHeight: 1.35 }}>{highlight(item.q, term)}</span>
            <span className="t-label" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6, fontSize: 11 }}><CIcon size={12} color="var(--fg-3)" /> {cat.label}</span>
          </span>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <button type="button" onClick={onEdit} title="Editar" style={actBtn}><Pencil size={16} color="var(--green-800)" /></button>
          <button type="button" onClick={onDelete} title="Eliminar" style={actBtn}><Trash2 size={16} color="var(--danger-fg)" /></button>
          <button type="button" onClick={onToggle} aria-label={open ? "Contraer" : "Expandir"} style={{ ...actBtn, border: "1px solid transparent", background: "transparent" }}><ChevronDown size={20} color={open ? "var(--green-800)" : "var(--fg-3)"} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} /></button>
        </div>
      </div>
      {open && (
        <div style={{ padding: "0 18px 20px 74px" }}>
          <div style={{ height: 1, background: "var(--outline-variant)", margin: "0 0 14px" }} />
          <p style={{ margin: 0, color: "var(--fg-2)", fontSize: 15, lineHeight: 1.6 }}>{highlight(item.a, term)}</p>
        </div>
      )}
    </div>
  );
}

/* ---- Editor modal ------------------------------------------------------ */
function EditorModal({ item, busy, onCancel, onSave }: { item: FaqItem | null; busy: boolean; onCancel: () => void; onSave: (i: FaqItem) => void }) {
  const esEdicion = !!item;
  const categorias = FAQ_CATEGORIAS.filter((c) => c.id !== "todas");
  const [q, setQ] = useState(item?.q ?? "");
  const [a, setA] = useState(item?.a ?? "");
  const [cat, setCat] = useState(item?.cat ?? "general");
  const [intento, setIntento] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const errQ = !q.trim() ? "Ingresá la pregunta." : "";
  const errA = !a.trim() ? "Ingresá la respuesta." : "";
  const showQ = intento && errQ;
  const showA = intento && errA;

  function guardar() {
    setIntento(true);
    if (errQ || errA) return;
    onSave({ id: item?.id ?? genId("q"), q: q.trim(), a: a.trim(), cat });
  }

  const lbl: React.CSSProperties = { display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14.5, color: "var(--fg-1)", marginBottom: 9 };
  const hint: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 7, fontSize: 12.5, color: "var(--fg-3)" };
  const errMsg = (m: string) => <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 7, fontSize: 12.5, color: "var(--danger-fg)" }}><AlertCircle size={14} color="var(--danger)" /> {m}</div>;

  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(42,38,32,.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", overflowY: "auto", backdropFilter: "blur(2px)" }}>
      <div className="pop" style={{ background: "var(--surface)", width: "min(640px, 100%)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-pop)", margin: "auto", display: "flex", flexDirection: "column", overflow: "hidden", maxHeight: "calc(100vh - 80px)" }}>
        <div style={{ padding: "22px 26px", borderBottom: "1px solid var(--outline-variant)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <span style={{ flexShrink: 0, width: 42, height: 42, borderRadius: 12, background: "var(--green-050)", color: "var(--green-800)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--green-100)" }}>{esEdicion ? <Pencil size={20} /> : <Plus size={20} />}</span>
            <div><span className="t-label">{esEdicion ? "Editar entrada" : "Nueva entrada"}</span><h2 style={{ margin: "3px 0 0", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)" }}>{esEdicion ? "Editar pregunta frecuente" : "Cargá una pregunta frecuente"}</h2></div>
          </div>
          <button type="button" onClick={onCancel} aria-label="Cerrar" style={{ width: 42, height: 42, flexShrink: 0, borderRadius: "var(--radius)", border: "1px solid var(--outline-variant)", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={20} color="var(--fg-2)" /></button>
        </div>

        <div style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>
          <div>
            <label htmlFor="faq-q" style={lbl}>Pregunta <span style={{ color: "var(--danger)" }}>*</span></label>
            <input id="faq-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej.: ¿Cómo reservo una experiencia?" maxLength={160} autoFocus style={{ ...inputStyle, borderColor: showQ ? "var(--danger)" : "var(--sand)" }} />
            {showQ ? errMsg(errQ) : <div style={hint}><span>Redactá la duda tal como la haría un usuario.</span><span style={{ fontFamily: "var(--font-mono)" }}>{q.length}/160</span></div>}
          </div>
          <div>
            <label htmlFor="faq-a" style={lbl}>Respuesta <span style={{ color: "var(--danger)" }}>*</span></label>
            <textarea id="faq-a" value={a} onChange={(e) => setA(e.target.value)} placeholder="Escribí una respuesta clara y completa para resolver la consulta." rows={5} maxLength={700} style={{ ...inputStyle, resize: "vertical", minHeight: 120, lineHeight: 1.55, borderColor: showA ? "var(--danger)" : "var(--sand)" }} />
            {showA ? errMsg(errA) : <div style={hint}><span>Aparecerá justo debajo de la pregunta al desplegarla.</span><span style={{ fontFamily: "var(--font-mono)" }}>{a.length}/700</span></div>}
          </div>
          <div>
            <label htmlFor="faq-cat" style={lbl}>Categoría</label>
            <select id="faq-cat" value={cat} onChange={(e) => setCat(e.target.value)} style={{ ...inputStyle }}>{categorias.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
            <div style={hint}><span>Agrupa la pregunta dentro de la base de conocimiento.</span></div>
          </div>
        </div>

        <div style={{ padding: "16px 26px", borderTop: "1px solid var(--outline-variant)", background: "var(--cream-tert)", display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button type="button" className="btn btn-neutral" onClick={onCancel} disabled={busy}><X size={17} /> Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={guardar} disabled={busy}>{busy ? <Loader size={17} className="spin" /> : <Check size={17} />} {esEdicion ? "Guardar cambios" : "Crear pregunta"}</button>
        </div>
      </div>
    </div>
  );
}

/* ---- Inner ------------------------------------------------------------- */
function Inner({ initial }: { initial: FaqItem[] }) {
  const [items, setItems] = useState<FaqItem[]>(initial);
  const [term, setTerm] = useState("");
  const [cat, setCat] = useState("todas");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ open: boolean; item: FaqItem | null } | null>(null);
  const [borrar, setBorrar] = useState<FaqItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const { guardar, isLoading: saving } = useGuardarFaq();
  const { eliminar, isLoading: deleting } = useEliminarFaq();

  const afterSearch = useMemo(() => {
    const q = term.trim().toLowerCase();
    return q ? items.filter((i) => (i.q + " " + i.a).toLowerCase().includes(q)) : items;
  }, [items, term]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { todas: afterSearch.length };
    FAQ_CATEGORIAS.forEach((k) => { if (k.id !== "todas") c[k.id] = 0; });
    afterSearch.forEach((i) => { c[i.cat] = (c[i.cat] || 0) + 1; });
    return c;
  }, [afterSearch]);
  const visible = useMemo(() => (cat === "todas" ? afterSearch : afterSearch.filter((i) => i.cat === cat)), [afterSearch, cat]);

  function notify(msg: string) { setToast(msg); setTimeout(() => setToast((t) => (t === msg ? null : t)), 4000); }

  async function onSave(it: FaqItem) {
    const editing = items.some((x) => x.id === it.id);
    await guardar(it);
    setItems((prev) => (editing ? prev.map((x) => (x.id === it.id ? it : x)) : [it, ...prev]));
    if (!editing) setOpenId(it.id);
    setEditor(null);
    notify(editing ? "Pregunta actualizada correctamente." : "Pregunta agregada a la base de conocimiento.");
  }
  async function onDelete(it: FaqItem) {
    await eliminar(it.id);
    setItems((prev) => prev.filter((x) => x.id !== it.id));
    if (openId === it.id) setOpenId(null);
    setBorrar(null);
    notify("Pregunta eliminada.");
  }

  const sinDatos = items.length === 0;
  const noResults = visible.length === 0;

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "28px 28px 88px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13.5, marginBottom: 14 }}><span>Soporte</span><ChevronRight size={15} /><span style={{ color: "var(--fg-2)", fontWeight: 500 }}>Preguntas frecuentes</span></div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 28 }}>
        <div style={{ minWidth: 280 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            <span style={{ flexShrink: 0, width: 50, height: 50, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--green-050)", color: "var(--green-800)", border: "1px solid var(--green-100)" }}><MessagesSquare size={25} /></span>
            <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--fg-1)", letterSpacing: "-.01em" }}>Preguntas frecuentes</h1>
          </div>
          <p style={{ margin: 0, color: "var(--fg-2)", fontSize: 15.5, lineHeight: 1.5, maxWidth: 620 }}>Mantené la base de conocimiento que consultan los usuarios. Cada entrada necesita una pregunta y su respuesta.</p>
        </div>
        <button type="button" className="btn btn-primary btn-lg" onClick={() => setEditor({ open: true, item: null })}><Plus size={18} /> Cargá una pregunta</button>
      </div>

      {!sinDatos && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 22 }}>
          <div style={{ position: "relative", maxWidth: 420 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", display: "flex", color: "var(--fg-3)" }}><Search size={18} /></span>
            <input placeholder="Buscar por pregunta o respuesta…" value={term} onChange={(e) => setTerm(e.target.value)} style={{ ...inputStyle, paddingLeft: 42, paddingRight: term ? 40 : 14, height: 46 }} />
            {term && <button type="button" onClick={() => setTerm("")} aria-label="Limpiar" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "var(--cream-tert)", width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={14} color="var(--fg-2)" /></button>}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {FAQ_CATEGORIAS.map((c) => {
              const on = cat === c.id;
              const CIcon = CAT_ICON[c.icon] ?? Info;
              return (
                <button key={c.id} type="button" onClick={() => setCat(c.id)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 13px", borderRadius: "var(--radius-pill)", cursor: "pointer", fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", border: "1px solid " + (on ? "var(--green-800)" : "var(--sand)"), background: on ? "var(--green-800)" : "var(--surface)", color: on ? "#fff" : "var(--fg-2)" }}>
                  <CIcon size={15} color={on ? "#fff" : "var(--fg-3)"} /> {c.label}
                  <span style={{ minWidth: 20, height: 19, padding: "0 6px", borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 11.5, fontWeight: 700, background: on ? "rgba(255,255,255,.22)" : "var(--cream-tert)", color: on ? "#fff" : "var(--fg-2)" }}>{counts[c.id] ?? 0}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!sinDatos && !noResults && <div style={{ fontSize: 13.5, color: "var(--fg-3)", marginBottom: 14 }}>{visible.length} {visible.length === 1 ? "pregunta" : "preguntas"}{cat !== "todas" && <> · {CAT_BY_ID[cat].label.toLowerCase()}</>}{term.trim() && <> · resultados para «{term.trim()}»</>}</div>}

      {sinDatos || noResults ? (
        <div style={{ padding: "60px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", background: "var(--surface)", border: "1px dashed var(--sand)", borderRadius: "var(--radius-lg)" }}>
          <span style={{ width: 64, height: 64, borderRadius: 16, background: sinDatos ? "var(--green-050)" : "var(--cream-tert)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>{sinDatos ? <MessagesSquare size={30} color="var(--green-800)" /> : <SearchX size={30} color="var(--fg-3)" />}</span>
          <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)" }}>{sinDatos ? "Todavía no cargaste preguntas frecuentes" : term.trim() ? "No encontramos preguntas relacionadas" : "No hay preguntas en esta categoría"}</h2>
          <p style={{ margin: "0 auto 20px", color: "var(--fg-2)", fontSize: 15, maxWidth: 440 }}>{sinDatos ? "Empezá creando la primera. Cada entrada necesita una pregunta y su respuesta." : term.trim() ? <>No hay coincidencias para <strong style={{ color: "var(--fg-1)" }}>«{term.trim()}»</strong>. Probá con otra palabra.</> : "Probá con otra categoría o seleccioná «Todas» para ver el listado completo."}</p>
          {sinDatos ? <button type="button" className="btn btn-primary" onClick={() => setEditor({ open: true, item: null })}><Plus size={17} /> Cargá una pregunta</button> : <button type="button" className="btn btn-neutral" onClick={() => { setTerm(""); setCat("todas"); }}><RotateCcw size={17} /> Limpiar filtros</button>}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {visible.map((it) => <FaqItemRow key={it.id} item={it} term={term} open={openId === it.id} onToggle={() => setOpenId(openId === it.id ? null : it.id)} onEdit={() => setEditor({ open: true, item: it })} onDelete={() => setBorrar(it)} />)}
        </div>
      )}

      {editor?.open && <EditorModal item={editor.item} busy={saving} onCancel={() => setEditor(null)} onSave={onSave} />}
      {borrar && (
        <div onMouseDown={(e) => { if (e.target === e.currentTarget) setBorrar(null); }} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(42,38,32,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(2px)" }}>
          <div className="pop" style={{ background: "var(--surface)", width: "min(480px, 100%)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-pop)" }}>
            <div style={{ padding: "26px 26px 6px", textAlign: "center" }}>
              <span style={{ width: 56, height: 56, borderRadius: 14, background: "var(--danger-fill)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}><Trash2 size={26} color="var(--danger-fg)" /></span>
              <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)" }}>¿Eliminar esta pregunta?</h2>
              <p style={{ margin: "0 auto", maxWidth: 380, color: "var(--fg-2)", fontSize: 14.5, lineHeight: 1.5 }}>Se quitará de la base de conocimiento y dejará de mostrarse a los usuarios. Esta acción no se puede deshacer.</p>
              <div style={{ marginTop: 18, padding: "12px 14px", background: "var(--cream-tert)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", textAlign: "left", display: "flex", alignItems: "flex-start", gap: 11 }}><HelpCircle size={18} color="var(--fg-3)" style={{ marginTop: 1, flexShrink: 0 }} /><span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14.5, color: "var(--fg-1)", lineHeight: 1.4 }}>{borrar.q}</span></div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, padding: "18px 26px 24px" }}>
              <button type="button" className="btn btn-neutral" onClick={() => setBorrar(null)} disabled={deleting}><X size={17} /> Cancelar</button>
              <button type="button" className="btn" onClick={() => onDelete(borrar)} disabled={deleting} style={{ background: "var(--danger)", color: "#fff", boxShadow: "inset 0 -2px 0 var(--danger-fg)" }}>{deleting ? <Loader size={17} className="spin" /> : <Trash2 size={17} />} Eliminar</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="pop" style={{ position: "fixed", right: 24, bottom: 24, zIndex: 90, maxWidth: 400, background: "var(--green-800)", color: "#fff", borderRadius: "var(--radius)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 11, fontWeight: 500, fontSize: 14.5, boxShadow: "var(--shadow-pop)" }}><Check size={19} color="#fff" /> {toast}</div>}
    </div>
  );
}

export default function FaqAdminClient() {
  const { data, isLoading, error, reload } = useFaq();
  return (
    <AsyncBoundary loading={isLoading} error={error} onRetry={reload} loadingLabel="Cargando preguntas…">
      {data && <Inner initial={data} />}
    </AsyncBoundary>
  );
}
