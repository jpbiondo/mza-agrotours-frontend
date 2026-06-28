"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search, X, List, Clock, CheckCircle2, XCircle, ChevronRight, CalendarDays,
  Users, MapPin, ArrowRight, CalendarX, SearchX, RotateCcw, Compass, Loader,
} from "lucide-react";
import Photo from "@/components/landing/Photo";
import { ESTADO_TONE, ESTADO_LABEL, reservaTotal } from "@/data/reservas";
import { useReservas } from "@/hooks/useReservas";
import type { EstadoReserva, Reserva } from "@/types/reservas";

type FilterId = "todas" | EstadoReserva;

const FILTERS: { id: FilterId; label: string; icon: React.ReactNode }[] = [
  { id: "todas", label: "Todas", icon: <List size={15} /> },
  { id: "pendiente", label: "Pagadas", icon: <Clock size={15} /> },
  { id: "finalizada", label: "Finalizadas", icon: <CheckCircle2 size={15} /> },
  { id: "cancelada", label: "Canceladas", icon: <XCircle size={15} /> },
];

const TONE_VARS: Record<string, { bg: string; fg: string }> = {
  warning: { bg: "var(--warning-fill)", fg: "var(--warning-fg)" },
  success: { bg: "var(--success-fill)", fg: "var(--success-fg)" },
  danger: { bg: "var(--danger-fill)", fg: "var(--danger-fg)" },
};

function Pill({ estado }: { estado: EstadoReserva }) {
  const t = TONE_VARS[ESTADO_TONE[estado]];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", borderRadius: "var(--radius-pill)", padding: "4px 12px", fontSize: 12, fontWeight: 700, background: t.bg, color: t.fg, whiteSpace: "nowrap" }}>
      {ESTADO_LABEL[estado]}
    </span>
  );
}

function MetaItem({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 9, minWidth: 0 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--cream-tert)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0, lineHeight: 1.2 }}>
        <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--fg-3)", fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 13.5, color: "var(--fg-1)", fontWeight: 500, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>}
      </div>
    </div>
  );
}

function ReservaCard({ r }: { r: Reserva }) {
  return (
    <Link href={`/mis-reservas/${r.id}`} className="card card-hover" style={{ padding: 0, overflow: "hidden", display: "flex", alignItems: "stretch", textDecoration: "none" }}>
      <div style={{ width: 220, flexShrink: 0 }} className="reserva-photo">
        <Photo seed={r.seed} height="100%" radius={0} />
      </div>
      <div style={{ flex: 1, padding: "18px 22px", display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontFamily: "var(--font-mono)", color: "var(--fg-3)", letterSpacing: ".04em", marginBottom: 4 }}>{r.id}</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 19, color: "var(--fg-1)", margin: 0, lineHeight: 1.2 }}>{r.titulo}</h3>
          </div>
          <Pill estado={r.estado} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12, marginTop: 4 }} className="reserva-meta">
          <MetaItem icon={<CalendarDays size={15} color="var(--green-800)" />} label="Fecha" value={r.fechaLabel} sub={r.horario} />
          <MetaItem icon={<Users size={15} color="var(--green-800)" />} label="Personas" value={`${r.personas} ${r.personas === 1 ? "persona" : "personas"}`} />
          <MetaItem icon={<MapPin size={15} color="var(--green-800)" />} label="Ubicación" value={r.finca} sub={r.loc} />
        </div>

        <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--cream-tert)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12.5, color: "var(--fg-3)" }}>
            Total <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 14, color: "var(--green-800)", marginLeft: 4 }}>$ {reservaTotal(r).toLocaleString("es-AR")}</span>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--fg-1)" }}>
            Ver detalle <ArrowRight size={15} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ icon, title, sub, action }: { icon: React.ReactNode; title: string; sub: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px dashed var(--sand)", borderRadius: "var(--radius-lg)", padding: "64px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--cream-tert)", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20, color: "var(--fg-1)" }}>{title}</div>
      <div style={{ color: "var(--fg-2)", fontSize: 14.5, maxWidth: 440, lineHeight: 1.5 }}>{sub}</div>
      {action}
    </div>
  );
}

export default function MisReservasClient() {
  const { data, isLoading } = useReservas();
  const reservas = useMemo(() => data ?? [], [data]);
  const [filter, setFilter] = useState<FilterId>("todas");
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("");

  const afterSearch = useMemo(() => {
    if (!applied) return reservas;
    const q = applied.trim().toLowerCase();
    return reservas.filter((r) => [r.titulo, r.finca, r.loc, r.id].some((f) => f.toLowerCase().includes(q)));
  }, [applied, reservas]);

  const counts = useMemo(() => ({
    todas: afterSearch.length,
    pendiente: afterSearch.filter((r) => r.estado === "pendiente").length,
    finalizada: afterSearch.filter((r) => r.estado === "finalizada").length,
    cancelada: afterSearch.filter((r) => r.estado === "cancelada").length,
  }), [afterSearch]);

  const visible = useMemo(
    () => (filter === "todas" ? afterSearch : afterSearch.filter((r) => r.estado === filter)),
    [afterSearch, filter],
  );

  const searchEnabled = query.trim().length > 4;
  const noResults = visible.length === 0;

  return (
    <div style={{ maxWidth: 1160, margin: "0 auto", padding: "40px 28px 80px" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13, marginBottom: 10 }}>
          <Link href="/" style={{ color: "var(--fg-3)", textDecoration: "none" }}>Inicio</Link>
          <ChevronRight size={14} />
          <span style={{ color: "var(--fg-2)", fontWeight: 500 }}>Mis reservas</span>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 36, color: "var(--fg-1)", margin: 0, letterSpacing: "-.01em" }}>Mis reservas</h1>
        <p style={{ color: "var(--fg-2)", fontSize: 15.5, margin: "10px 0 0", maxWidth: 600 }}>
          Acá vas a encontrar las experiencias que reservaste en fincas mendocinas. Consultá su estado, descargá el comprobante y revisá los detalles.
        </p>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", padding: 20, display: "flex", flexDirection: "column", gap: 18, marginBottom: 28 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "stretch", maxWidth: 720 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", display: "flex", color: "var(--fg-3)" }}><Search size={18} /></span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && searchEnabled) setApplied(query); }}
              placeholder="Buscar por nombre de la actividad, finca o ubicación…"
              aria-label="Buscar reservas"
              style={{ width: "100%", fontFamily: "var(--font-sans)", fontSize: 14.5, color: "var(--fg-1)", borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid var(--sand)", padding: "11px 13px 11px 42px", outline: "none", boxSizing: "border-box" }}
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Limpiar" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "var(--cream-tert)", width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={14} color="var(--fg-2)" />
              </button>
            )}
          </div>
          <button type="button" className="btn btn-primary" disabled={!searchEnabled} onClick={() => setApplied(query)}>
            <Search size={16} /> Buscar
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {FILTERS.map((f) => {
              const on = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 999, cursor: "pointer", fontSize: 13.5, fontWeight: 600, fontFamily: "var(--font-sans)", border: "1px solid " + (on ? "var(--green-800)" : "var(--sand)"), background: on ? "var(--green-800)" : "var(--surface)", color: on ? "#fff" : "var(--fg-2)" }}
                >
                  <span style={{ color: on ? "#fff" : "var(--fg-3)", display: "inline-flex" }}>{f.icon}</span>
                  {f.label}
                  <span style={{ marginLeft: 2, padding: "2px 8px", borderRadius: 999, fontSize: 11.5, fontWeight: 700, fontFamily: "var(--font-mono)", background: on ? "rgba(255,255,255,.18)" : "var(--cream-tert)", color: on ? "#fff" : "var(--fg-3)" }}>{counts[f.id]}</span>
                </button>
              );
            })}
          </div>
          {applied && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "var(--fg-2)" }}>
              <span>Buscando:&nbsp;<strong style={{ color: "var(--fg-1)" }}>“{applied}”</strong></span>
              <button type="button" onClick={() => { setQuery(""); setApplied(""); }} style={{ background: "transparent", border: "none", color: "var(--green-800)", fontWeight: 600, fontSize: 13.5, cursor: "pointer", padding: "4px 6px" }}>Limpiar búsqueda</button>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", padding: "72px 24px", textAlign: "center", color: "var(--fg-3)" }}>
          <Loader size={24} className="spin" />
          <div style={{ marginTop: 12, fontSize: 14 }}>Cargando tus reservas…</div>
        </div>
      ) : noResults ? (
        applied || filter !== "todas" ? (
          <EmptyState
            icon={<SearchX size={28} color="var(--brown-700)" />}
            title="No se encontraron reservas relacionadas"
            sub={applied ? <>No hay reservas que coincidan con <strong style={{ color: "var(--fg-1)" }}>“{applied}”</strong>{filter !== "todas" ? " en el estado seleccionado" : null}. Probá con otro término o limpiá los filtros.</> : "No hay reservas en este estado."}
            action={<button type="button" className="btn btn-neutral" style={{ marginTop: 8 }} onClick={() => { setQuery(""); setApplied(""); setFilter("todas"); }}><RotateCcw size={17} /> Limpiar filtros</button>}
          />
        ) : (
          <EmptyState
            icon={<CalendarX size={28} color="var(--brown-700)" />}
            title="No tenés reservas registradas"
            sub="Cuando reserves tu primera experiencia en una finca de Mendoza, vas a verla acá."
            action={<Link href="/explorar" className="btn btn-primary" style={{ marginTop: 8 }}><Compass size={18} /> Explorar experiencias</Link>}
          />
        )
      ) : (
        <>
          <div style={{ fontSize: 13.5, color: "var(--fg-3)", marginBottom: 14 }}>
            Mostrando <strong style={{ color: "var(--fg-2)" }}>{visible.length}</strong> {visible.length === 1 ? "reserva" : "reservas"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 18 }}>
            {visible.map((r) => <ReservaCard key={r.id} r={r} />)}
          </div>
        </>
      )}

      <style>{`
        .card-hover { transition: box-shadow .16s, border-color .16s, transform .16s; }
        .card-hover:hover { box-shadow: var(--shadow-hover); border-color: var(--sand); transform: translateY(-2px); }
        @media (max-width: 620px) {
          .reserva-photo { display: none !important; }
          .reserva-meta { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
