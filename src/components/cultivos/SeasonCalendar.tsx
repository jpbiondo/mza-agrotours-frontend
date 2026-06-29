import { MESES, MES_ACTUAL } from "@/data/cultivos";
import type { MesEstado } from "@/types/cultivos";

const ESTADO: Record<MesEstado, { bg: string; fg: string; label: string }> = {
  h: { bg: "var(--green-700)", fg: "#fff", label: "Cosecha" },
  g: { bg: "var(--green-100)", fg: "var(--green-800)", label: "Crecimiento" },
  r: { bg: "var(--cream-tert)", fg: "var(--fg-3)", label: "Reposo" },
};

export default function SeasonCalendar({ calendario, compact }: { calendario: MesEstado[]; compact?: boolean }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 4 }}>
        {calendario.map((estado, i) => {
          const e = ESTADO[estado];
          const actual = i === MES_ACTUAL;
          return (
            <div key={i} style={{ textAlign: "center" }}>
              <div
                title={`${MESES[i]}: ${e.label}`}
                style={{
                  height: compact ? 26 : 34, borderRadius: 7, background: e.bg, color: e.fg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10.5, fontWeight: 700, fontFamily: "var(--font-mono)",
                  border: actual ? "2px solid var(--brown-700)" : "2px solid transparent",
                }}
              >
                {estado === "h" ? "✓" : estado === "g" ? "·" : ""}
              </div>
              <div style={{ fontSize: 10, color: actual ? "var(--brown-700)" : "var(--fg-3)", fontWeight: actual ? 700 : 500, marginTop: 4 }}>{MESES[i]}</div>
            </div>
          );
        })}
      </div>
      {!compact && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 16 }}>
          {(["h", "g", "r"] as MesEstado[]).map((k) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--fg-2)" }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: ESTADO[k].bg, border: "1px solid var(--outline-variant)" }} /> {ESTADO[k].label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
