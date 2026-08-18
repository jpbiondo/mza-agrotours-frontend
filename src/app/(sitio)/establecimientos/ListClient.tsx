"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sprout, MapPin, ChevronRight, RotateCcw, Building2, CalendarDays, ArrowRight, SearchX } from "lucide-react";
import Photo from "@/components/landing/Photo";
import { FilterSelect, Pagination, ActiveFilterPill, CropChip } from "@/components/catalog/controls";
import { ESTABLECIMIENTOS, buildCultivoOpts } from "@/data/establecimientos";
import type { Establecimiento } from "@/types/catalogo";

const PAGE_SIZE = 8;

function EstablecimientoCard({ est, cropFilter }: { est: Establecimiento; cropFilter: string | null }) {
  return (
    <Link href={`/establecimientos/${est.id}`} className="card-hover" style={{ textDecoration: "none", display: "flex", flexDirection: "column", background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      <div style={{ position: "relative" }}>
        <Photo seed={est.seed} height={150} radius={0} />
        <span style={{ position: "absolute", top: 12, left: 12, display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(251,249,248,.95)", borderRadius: "var(--radius-pill)", padding: "5px 11px", boxShadow: "0 2px 8px rgba(45,90,39,.16)" }}>
          <MapPin size={13} color="var(--brown-700)" />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg-1)" }}>{est.depto}</span>
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: 18, gap: 11 }}>
        <div>
          <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18.5, color: "var(--fg-1)", lineHeight: 1.25 }}>{est.nombre}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--fg-3)", fontSize: 13, marginTop: 5 }}>
            <Building2 size={14} color="var(--fg-3)" />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{est.razonSocial}</span>
          </div>
        </div>

        <p style={{ margin: 0, color: "var(--fg-2)", fontSize: 14, lineHeight: 1.55, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
          {est.descripcion}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {est.cultivos.map((c) => <CropChip key={c} active={cropFilter === c}>{c}</CropChip>)}
        </div>

        <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid var(--cream-tert)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--fg-3)" }}>
            <CalendarDays size={13} color="var(--brown-700)" />
            {est.actividades.length} {est.actividades.length === 1 ? "actividad" : "actividades"}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600, color: "var(--green-800)" }}>
            Ver establecimiento <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function NoResultados({ onClear }: { onClear: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "64px 32px", background: "var(--surface)", border: "1px dashed var(--sand)", borderRadius: "var(--radius-lg)" }}>
      <div style={{ width: 68, height: 68, borderRadius: "50%", background: "var(--cream-tert)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
        <SearchX size={30} color="var(--fg-3)" />
      </div>
      <h3 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 21, color: "var(--fg-1)" }}>No encontramos establecimientos</h3>
      <p style={{ margin: "0 auto 22px", color: "var(--fg-2)", fontSize: 15.5, maxWidth: 420, lineHeight: 1.5 }}>
        Ningún establecimiento trabaja el cultivo elegido. Probá quitando el filtro para ver todos.
      </p>
      <button type="button" className="btn btn-neutral" onClick={onClear}>
        <RotateCcw size={17} /> Quitar filtro
      </button>
    </div>
  );
}

export default function ListClient() {
  const base = useMemo(() => ESTABLECIMIENTOS.filter((e) => e.vigente), []);
  const cultivoOpts = useMemo(() => buildCultivoOpts(base), [base]);
  const [cultivo, setCultivo] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filtrados = useMemo(() => base.filter((e) => !cultivo || e.cultivos.includes(cultivo)), [base, cultivo]);
  const pages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pages);
  const visibles = filtrados.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 28px 80px" }}>
      <div style={{ marginBottom: 24, maxWidth: 720 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13, marginBottom: 10 }}>
          <Link href="/" style={{ color: "var(--fg-3)", textDecoration: "none" }}>Inicio</Link>
          <ChevronRight size={14} />
          <span style={{ color: "var(--fg-2)", fontWeight: 500 }}>Establecimientos</span>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 38, color: "var(--fg-1)", margin: 0, letterSpacing: "-.015em", lineHeight: 1.1 }}>
          Conocé los <span style={{ color: "var(--green-800)" }}>establecimientos</span> de Mendoza
        </h1>
        <p style={{ color: "var(--fg-2)", fontSize: 16, lineHeight: 1.55, margin: "12px 0 0" }}>
          Fincas, bodegas y olivares que abren sus puertas. Mirá un resumen de cada uno y filtrá por tipo de cultivo para encontrar el que querés visitar.
        </p>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", padding: 20, marginBottom: 22, display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <FilterSelect icon={<Sprout size={18} />} label="Tipo de cultivo" allLabel="Todos los cultivos" value={cultivo} options={cultivoOpts} onChange={(v) => { setCultivo(v); setPage(1); }} />
        {cultivo && (
          <button type="button" onClick={() => { setCultivo(null); setPage(1); }} style={{ height: 46, display: "inline-flex", alignItems: "center", gap: 7, background: "transparent", border: "none", cursor: "pointer", color: "var(--green-800)", fontFamily: "var(--font-sans)", fontSize: 14.5, fontWeight: 600, padding: "0 6px" }}>
            <RotateCcw size={16} color="var(--green-800)" /> Quitar filtro
          </button>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        <span style={{ fontSize: 15, color: "var(--fg-2)" }}>
          <strong style={{ color: "var(--fg-1)", fontWeight: 700 }}>{filtrados.length}</strong>{" "}
          {filtrados.length === 1 ? "establecimiento" : "establecimientos"}
          {cultivo ? " encontrados" : " disponibles"}
        </span>
        {cultivo && <ActiveFilterPill icon={<Sprout size={13} />} label={cultivo} onClear={() => setCultivo(null)} />}
      </div>

      {filtrados.length === 0 ? (
        <NoResultados onClear={() => setCultivo(null)} />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {visibles.map((est) => <EstablecimientoCard key={est.id} est={est} cropFilter={cultivo} />)}
          </div>
          <Pagination page={pageSafe} pages={pages} onPage={setPage} />
        </>
      )}

      <style>{`
        .card-hover { transition: box-shadow .16s, border-color .16s, transform .16s; }
        .card-hover:hover { box-shadow: var(--shadow-hover); border-color: var(--sand); transform: translateY(-2px); }
      `}</style>
    </div>
  );
}
