"use client";

import { AlertCircle, Trash2, Plus } from "lucide-react";
import { moneyAr } from "@/lib/format";
import { evalViajero, TIPOS_DOC, type Viajero, type Precios, type Rango } from "@/data/reserva";

const inputStyle: React.CSSProperties = {
  width: "100%", fontFamily: "var(--font-sans)", fontSize: 14.5, color: "var(--fg-1)",
  borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid var(--sand)",
  padding: "11px 13px", outline: "none", boxSizing: "border-box",
};

function Label({ children }: { children: React.ReactNode }) {
  return <span className="t-label" style={{ display: "block", marginBottom: 6 }}>{children}</span>;
}

function TravelerRow({
  index, v, precios, rangos, canRemove, onChange, onRemove,
}: {
  index: number; v: Viajero; precios: Precios; rangos: Rango[]; canRemove: boolean;
  onChange: (v: Viajero) => void; onRemove: () => void;
}) {
  const { edad, rango, permitido } = evalViajero(v, precios, rangos);
  const noPermitido = !!v.fechaNac && edad != null && !permitido;
  const subtotal = permitido && rango ? precios[rango.id] ?? 0 : 0;
  const set = (k: keyof Viajero, val: string) => onChange({ ...v, [k]: val });

  return (
    <div style={{ border: "1px solid var(--outline-variant)", borderRadius: 14, background: "var(--surface)", padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--green-800)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{index + 1}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>Visitante {index + 1}</span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label="Eliminar visitante"
          title={canRemove ? "Eliminar visitante" : "Debe haber al menos un visitante"}
          style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--outline-variant)", background: "var(--surface)", cursor: canRemove ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", opacity: canRemove ? 1 : 0.4 }}
        >
          <Trash2 size={15} color="var(--danger)" />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 14 }} className="trav-grid">
        <label>
          <Label>Nombre y apellido</Label>
          <input type="text" value={v.nombre} placeholder="Nombre y apellido" style={inputStyle} onChange={(e) => set("nombre", e.target.value)} />
        </label>
        <label>
          <Label>Fecha de nacimiento</Label>
          <input type="date" value={v.fechaNac} max="2026-06-21" style={noPermitido ? { ...inputStyle, borderColor: "var(--danger)", borderWidth: 2 } : inputStyle} onChange={(e) => set("fechaNac", e.target.value)} />
          {noPermitido && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--danger-fg)", marginTop: 6 }}>
              <AlertCircle size={14} color="var(--danger)" /> Esta actividad no está permitida para este rango etario
            </span>
          )}
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.6fr", gap: 14 }} className="trav-grid">
        <label>
          <Label>Tipo</Label>
          <select value={v.tipoDoc} style={inputStyle} onChange={(e) => set("tipoDoc", e.target.value)}>
            {TIPOS_DOC.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label>
          <Label>Número de identificación</Label>
          <input type="text" value={v.numDoc} placeholder="Número de documento" style={inputStyle} onChange={(e) => set("numDoc", e.target.value)} />
        </label>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, paddingTop: 14, borderTop: "1px dashed var(--outline-variant)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 600 }}>Rango etario</span>
          {rango && permitido ? (
            <span style={pill("success")}>{rango.label} · {edad} años</span>
          ) : noPermitido ? (
            <span style={pill("danger")}>No permitido</span>
          ) : (
            <span style={{ fontSize: 13, color: "var(--fg-3)" }}>Ingresá la fecha de nacimiento</span>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 600 }}>Subtotal</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: rango && permitido ? "var(--green-800)" : "var(--fg-3)" }}>
            {rango && permitido ? (subtotal > 0 ? moneyAr(subtotal) : "Sin cargo") : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

function pill(tone: "success" | "danger"): React.CSSProperties {
  const map = {
    success: { bg: "var(--success-fill)", fg: "var(--success-fg)" },
    danger: { bg: "var(--danger-fill)", fg: "var(--danger-fg)" },
  }[tone];
  return { display: "inline-flex", alignItems: "center", borderRadius: "var(--radius-pill)", padding: "3px 11px", fontSize: 12, fontWeight: 700, background: map.bg, color: map.fg };
}

export default function TravelersList({
  viajeros, precios, rangos, onChange,
}: {
  viajeros: Viajero[]; precios: Precios; rangos: Rango[]; onChange: (v: Viajero[]) => void;
}) {
  const setRow = (i: number, nv: Viajero) => onChange(viajeros.map((v, idx) => (idx === i ? nv : v)));
  const addRow = () => onChange([...viajeros, { nombre: "", fechaNac: "", tipoDoc: "DNI", numDoc: "" }]);
  const removeRow = (i: number) => onChange(viajeros.filter((_, idx) => idx !== i));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {viajeros.map((v, i) => (
        <TravelerRow key={i} index={i} v={v} precios={precios} rangos={rangos} canRemove={viajeros.length > 1} onChange={(nv) => setRow(i, nv)} onRemove={() => removeRow(i)} />
      ))}
      <button
        type="button"
        onClick={addRow}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "14px 16px", borderRadius: 12, cursor: "pointer", border: "2px dashed var(--brown-500)", background: "var(--brown-100)", color: "var(--brown-800)", fontSize: 14.5, fontWeight: 600, fontFamily: "var(--font-sans)" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--brown-200)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--brown-100)")}
      >
        <Plus size={18} color="var(--brown-700)" /> Agregar visitante
      </button>

      <style>{`@media (max-width: 560px) { .trav-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
