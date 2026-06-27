"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sprout, MapPin, ChevronRight, RotateCcw, Star, Warehouse, ArrowRight, SearchX } from "lucide-react";
import Photo from "@/components/landing/Photo";
import { FilterSelect, Pagination, ActiveFilterPill, CropChip } from "@/components/catalog/controls";
import { ACTIVIDADES, CULTIVO_OPTS, DEPTO_OPTS } from "@/data/actividades";
import { moneyAr } from "@/lib/format";
import type { Actividad } from "@/types/catalogo";

const PAGE_SIZE = 10;

/* ---- Tarjeta de actividad ---------------------------------------------- */
function CatalogCard({ act, cropFilter }: { act: Actividad; cropFilter: string | null }) {
  return (
    <Link href={`/explorar/${act.id}`} className="card-hover" style={{ textDecoration: "none", display: "flex", flexDirection: "column", background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      <div style={{ position: "relative" }}>
        <Photo seed={act.seed} height={180} radius={0} />
        <span style={{ position: "absolute", top: 12, right: 12, display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(251,249,248,.95)", borderRadius: "var(--radius-pill)", padding: "5px 11px", boxShadow: "0 2px 8px rgba(45,90,39,.16)" }}>
          <Star size={14} color="#C9A227" fill="#C9A227" />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13.5, fontWeight: 700, color: "var(--fg-1)" }}>{act.rating.toFixed(1)}</span>
          <span style={{ fontSize: 11.5, color: "var(--fg-3)" }}>({act.resenias})</span>
        </span>
        {act.tag && (
          <span style={{ position: "absolute", top: 12, left: 12, background: "var(--green-800)", color: "#fff", borderRadius: "var(--radius-pill)", padding: "4px 11px", fontSize: 11.5, fontWeight: 600 }}>{act.tag}</span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: 18, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--fg-3)", fontSize: 13 }}>
          <MapPin size={14} color="var(--brown-700)" />
          <span style={{ fontWeight: 500, color: "var(--fg-2)" }}>{act.depto}, Mendoza</span>
        </div>
        <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18.5, color: "var(--fg-1)", lineHeight: 1.25 }}>{act.nombre}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--fg-3)", fontSize: 13 }}>
          <Warehouse size={14} color="var(--fg-3)" />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{act.finca}</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {act.cultivos.map((c) => <CropChip key={c} active={cropFilter === c}>{c}</CropChip>)}
        </div>
        <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid var(--cream-tert)", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div className="t-label" style={{ marginBottom: 2 }}>Desde</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 19, fontWeight: 700, color: "var(--fg-1)" }}>{moneyAr(act.precioAdulto)}</span>
              <span style={{ fontSize: 12.5, color: "var(--fg-3)" }}>/ adulto</span>
            </div>
          </div>
          <span className="btn btn-primary btn-sm" style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
            Ver detalle <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyResults({ onClear }: { onClear: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "64px 32px", background: "var(--surface)", border: "1px dashed var(--sand)", borderRadius: "var(--radius-lg)" }}>
      <div style={{ width: 68, height: 68, borderRadius: "50%", background: "var(--cream-tert)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
        <SearchX size={30} color="var(--fg-3)" />
      </div>
      <h3 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 21, color: "var(--fg-1)" }}>No encontramos experiencias</h3>
      <p style={{ margin: "0 auto 22px", color: "var(--fg-2)", fontSize: 15.5, maxWidth: 420, lineHeight: 1.5 }}>
        Ninguna actividad coincide con los filtros elegidos. Probá quitando alguno para ver más opciones.
      </p>
      <button type="button" className="btn btn-neutral" onClick={onClear}>
        <RotateCcw size={17} /> Limpiar filtros
      </button>
    </div>
  );
}

export default function CatalogClient() {
  const [cultivo, setCultivo] = useState<string | null>(null);
  const [depto, setDepto] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filtradas = useMemo(
    () => ACTIVIDADES.filter((a) => (!cultivo || a.cultivos.includes(cultivo)) && (!depto || a.depto === depto)),
    [cultivo, depto],
  );

  const pages = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pages);
  const visibles = filtradas.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [cultivo, depto]);

  const hasFilters = !!(cultivo || depto);
  const clearAll = () => { setCultivo(null); setDepto(null); };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 28px 80px" }}>
      <div style={{ marginBottom: 24, maxWidth: 720 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13, marginBottom: 10 }}>
          <Link href="/" style={{ color: "var(--fg-3)", textDecoration: "none" }}>Inicio</Link>
          <ChevronRight size={14} />
          <span style={{ color: "var(--fg-2)", fontWeight: 500 }}>Explorar actividades</span>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 38, color: "var(--fg-1)", margin: 0, letterSpacing: "-.015em", lineHeight: 1.1 }}>
          Descubrí <span style={{ color: "var(--green-800)" }}>experiencias</span> en toda la provincia
        </h1>
        <p style={{ color: "var(--fg-2)", fontSize: 16, lineHeight: 1.55, margin: "12px 0 0" }}>
          Cosechas, podas, recorridos y degustaciones en fincas de Mendoza. Filtrá por tipo de cultivo o por departamento para encontrar la tuya.
        </p>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", padding: 20, marginBottom: 22, display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <FilterSelect icon={<Sprout size={18} />} label="Tipo de cultivo" allLabel="Todos los cultivos" value={cultivo} options={CULTIVO_OPTS} onChange={setCultivo} />
        <FilterSelect icon={<MapPin size={18} />} label="Departamento" allLabel="Todos los departamentos" value={depto} options={DEPTO_OPTS} onChange={setDepto} />
        {hasFilters && (
          <button type="button" onClick={clearAll} style={{ height: 46, display: "inline-flex", alignItems: "center", gap: 7, background: "transparent", border: "none", cursor: "pointer", color: "var(--green-800)", fontFamily: "var(--font-sans)", fontSize: 14.5, fontWeight: 600, padding: "0 6px" }}>
            <RotateCcw size={16} color="var(--green-800)" /> Limpiar filtros
          </button>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        <span style={{ fontSize: 15, color: "var(--fg-2)" }}>
          <strong style={{ color: "var(--fg-1)", fontWeight: 700 }}>{filtradas.length}</strong>{" "}
          {filtradas.length === 1 ? "experiencia" : "experiencias"}
          {hasFilters ? " encontradas" : " disponibles"}
        </span>
        {cultivo && <ActiveFilterPill icon={<Sprout size={13} />} label={cultivo} onClear={() => setCultivo(null)} />}
        {depto && <ActiveFilterPill icon={<MapPin size={13} />} label={depto} onClear={() => setDepto(null)} />}
      </div>

      {filtradas.length === 0 ? (
        <EmptyResults onClear={clearAll} />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {visibles.map((act) => <CatalogCard key={act.id} act={act} cropFilter={cultivo} />)}
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
