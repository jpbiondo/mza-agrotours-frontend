import Link from "next/link";
import { MapPin, Star, ArrowRight } from "lucide-react";
import Photo from "./Photo";
import { ACTIVIDADES_DESTACADAS } from "@/data/actividades";
import { moneyAr } from "@/lib/format";
import type { Actividad } from "@/types/catalogo";

function ActividadCard({ a }: { a: Actividad }) {
  return (
    <article
      className="card"
      style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}
    >
      <div style={{ position: "relative" }}>
        <Photo seed={a.seed} height={172} radius={0} />
        {a.tag && (
          <span
            style={{
              position: "absolute", top: 12, left: 12, padding: "5px 11px",
              borderRadius: "var(--radius-pill)", background: "rgba(251,249,248,.95)",
              fontSize: 11.5, fontWeight: 700, color: "var(--brown-700)",
            }}
          >
            {a.tag}
          </span>
        )}
        <span
          style={{
            position: "absolute", top: 12, right: 12, padding: "5px 11px",
            borderRadius: "var(--radius-pill)", background: "rgba(21,66,18,.88)",
            fontSize: 11.5, fontWeight: 600, color: "#fff",
          }}
        >
          {a.tipo}
        </span>
      </div>

      <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17, color: "var(--fg-1)", margin: 0, lineHeight: 1.25 }}>
          {a.nombre}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--fg-2)", marginTop: 8 }}>
          <MapPin size={14} color="var(--fg-3)" /> {a.finca} · {a.depto}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--fg-2)", marginTop: 6 }}>
          <Star size={14} color="var(--warning)" fill="var(--warning)" />
          <strong style={{ color: "var(--fg-1)" }}>{a.rating.toFixed(1)}</strong>
          <span style={{ color: "var(--fg-3)" }}>({a.resenias} reseñas)</span>
        </div>

        <div
          style={{
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
            gap: 12, marginTop: "auto", paddingTop: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 11.5, color: "var(--fg-3)" }}>Desde</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--green-800)" }}>
              {moneyAr(a.precioAdulto)}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--fg-3)" }}>por adulto</div>
          </div>
          <Link
            href={`/explorar/${a.id}`}
            className="btn btn-neutral btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            Ver experiencia <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function ActividadesSection() {
  return (
    <section id="actividades" style={{ maxWidth: 1160, margin: "0 auto", padding: "80px 28px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
        <div>
          <div className="t-label" style={{ color: "var(--brown-700)", marginBottom: 10 }}>EXPERIENCIAS DESTACADAS</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--fg-1)", margin: 0, letterSpacing: "-.01em" }}>
            Actividades para vivir el campo
          </h2>
          <p style={{ fontSize: 16, color: "var(--fg-2)", margin: "10px 0 0", maxWidth: 540 }}>
            Cosechas, degustaciones y talleres en las mejores fincas de Mendoza.
          </p>
        </div>
        <Link href="/explorar" className="btn btn-neutral" style={{ display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          Ver todas <ArrowRight size={16} />
        </Link>
      </div>

      <div
        style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 24,
        }}
      >
        {ACTIVIDADES_DESTACADAS.map((a) => (
          <ActividadCard key={a.id} a={a} />
        ))}
      </div>
    </section>
  );
}
