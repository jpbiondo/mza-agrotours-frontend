"use client";

import Link from "next/link";
import { ChevronRight, CalendarCheck, ArrowRight, Loader, Leaf } from "lucide-react";
import { enTemporada, temporadaLabel } from "@/data/cultivos";
import { useCultivos } from "@/hooks/useCultivos";
import type { Cultivo } from "@/types/cultivos";

function CultivoCard({ c }: { c: Cultivo }) {
  const temporada = enTemporada(c);
  return (
    <Link href={`/cultivos/${c.id}`} className="card-hover" style={{ textDecoration: "none", display: "flex", flexDirection: "column", background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      <div style={{ position: "relative", height: 150, background: c.color, display: "flex", alignItems: "flex-end" }}>
        <Leaf size={64} color="rgba(255,255,255,.16)" style={{ position: "absolute", top: 14, right: 14 }} />
        {temporada && (
          <span style={{ position: "absolute", top: 12, left: 12, display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(251,249,248,.95)", borderRadius: "var(--radius-pill)", padding: "5px 11px", fontSize: 11.5, fontWeight: 700, color: "var(--green-800)" }}>
            <CalendarCheck size={13} color="var(--green-700)" /> En temporada
          </span>
        )}
      </div>
      <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--fg-1)", margin: 0 }}>{c.nombre}</h3>
        <div style={{ fontSize: 12.5, color: "var(--fg-3)", fontStyle: "italic", marginTop: 3 }}>{c.familia}</div>
        <p style={{ fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.5, margin: "12px 0 14px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>{c.descripcion}</p>
        <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--cream-tert)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--fg-3)" }}><CalendarCheck size={13} color="var(--brown-700)" /> {temporadaLabel(c)}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: "var(--green-800)" }}>Ver <ArrowRight size={15} /></span>
        </div>
      </div>
    </Link>
  );
}

export default function CultivosListClient() {
  const { data, isLoading } = useCultivos();

  return (
    <div style={{ maxWidth: 1160, margin: "0 auto", padding: "32px 28px 80px" }}>
      <div style={{ marginBottom: 28, maxWidth: 720 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13, marginBottom: 10 }}>
          <Link href="/" style={{ color: "var(--fg-3)", textDecoration: "none" }}>Inicio</Link>
          <ChevronRight size={14} />
          <span style={{ color: "var(--fg-2)", fontWeight: 500 }}>Cultivos</span>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 38, color: "var(--fg-1)", margin: 0, letterSpacing: "-.015em", lineHeight: 1.1 }}>
          Los <span style={{ color: "var(--green-800)" }}>cultivos</span> de Mendoza
        </h1>
        <p style={{ color: "var(--fg-2)", fontSize: 16, lineHeight: 1.55, margin: "12px 0 0" }}>
          Conocé las frutas, vides y olivos que dan vida al campo mendocino: su temporada, sus propiedades y recetas para aprovecharlos.
        </p>
      </div>

      {isLoading || !data ? (
        <div style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", padding: "72px 24px", textAlign: "center", color: "var(--fg-3)" }}>
          <Loader size={24} className="spin" /><div style={{ marginTop: 12, fontSize: 14 }}>Cargando cultivos…</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
          {data.map((c) => <CultivoCard key={c.id} c={c} />)}
        </div>
      )}

      <style>{`
        .card-hover { transition: box-shadow .16s, border-color .16s, transform .16s; }
        .card-hover:hover { box-shadow: var(--shadow-hover); border-color: var(--sand); transform: translateY(-2px); }
      `}</style>
    </div>
  );
}
