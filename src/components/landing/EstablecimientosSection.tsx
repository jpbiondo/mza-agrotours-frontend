import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import Photo from "./Photo";
import { ESTABLECIMIENTOS_DESTACADOS } from "@/data/establecimientos";
import type { Establecimiento } from "@/types/catalogo";

function EstablecimientoCard({ e }: { e: Establecimiento }) {
  return (
    <Link href={`/establecimientos/${e.id}`} className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", textDecoration: "none" }}>
      <Photo seed={e.seed} height={148} radius={0} />
      <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17, color: "var(--fg-1)", margin: 0 }}>
          {e.nombre}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--fg-2)", marginTop: 7 }}>
          <MapPin size={14} color="var(--fg-3)" /> {e.depto}, Mendoza
        </div>
        <p style={{ fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.5, margin: "12px 0 14px" }}>
          {e.descripcion}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: "auto" }}>
          {e.cultivos.map((c) => (
            <span
              key={c}
              style={{
                padding: "4px 11px", borderRadius: "var(--radius-pill)", fontSize: 12,
                fontWeight: 600, background: "var(--green-050)", color: "var(--green-800)",
                border: "1px solid var(--green-100)",
              }}
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export default function EstablecimientosSection() {
  return (
    <section style={{ background: "var(--cream-tert)", borderTop: "1px solid var(--outline-variant)", borderBottom: "1px solid var(--outline-variant)" }}>
      <div id="establecimientos" style={{ maxWidth: 1160, margin: "0 auto", padding: "80px 28px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
          <div>
            <div className="t-label" style={{ color: "var(--brown-700)", marginBottom: 10 }}>FINCAS Y BODEGAS</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--fg-1)", margin: 0, letterSpacing: "-.01em" }}>
              Establecimientos que te esperan
            </h2>
            <p style={{ fontSize: 16, color: "var(--fg-2)", margin: "10px 0 0", maxWidth: 540 }}>
              Familias productoras de todos los valles mendocinos abren sus puertas.
            </p>
          </div>
          <Link href="/establecimientos" className="btn btn-neutral" style={{ display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            Ver todos <ArrowRight size={16} />
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 24 }}>
          {ESTABLECIMIENTOS_DESTACADOS.map((e) => (
            <EstablecimientoCard key={e.id} e={e} />
          ))}
        </div>
      </div>
    </section>
  );
}
