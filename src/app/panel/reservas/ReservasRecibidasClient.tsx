"use client";

import { useMemo, useState } from "react";
import {
  Search, X, ChevronDown, CalendarDays, Clock, Users, Check, Loader, Inbox,
  CreditCard, RotateCcw, XCircle, CheckCircle2, Banknote, UserCheck,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import ProducerShell from "@/components/panel/ProducerShell";
import { Pagination } from "@/components/catalog/controls";
import { FINCAS } from "@/data/panel";
import {
  ESTADO_META, ESTADO_OPTS, categoriaEtaria, precioCategoria, totalReserva, rangoEtario, type ProdTone,
} from "@/data/panel-reservas";
import { useReservasRecibidas, useConfirmarReserva } from "@/hooks/useReservasRecibidas";
import type { EstadoReservaProd, ReservaProd } from "@/types/panel-reservas";

const PAGE_SIZE = 8;

const TONE_VARS: Record<ProdTone, { bg: string; fg: string }> = {
  warning: { bg: "var(--warning-fill)", fg: "var(--warning-fg)" },
  info: { bg: "var(--info-fill)", fg: "var(--info-fg)" },
  neutral: { bg: "var(--cream-tert)", fg: "var(--fg-2)" },
  danger: { bg: "var(--danger-fill)", fg: "var(--danger-fg)" },
  success: { bg: "var(--success-fill)", fg: "var(--success-fg)" },
};

const ESTADO_ICON: Record<string, React.ReactNode> = {
  clock: <Clock size={13} />,
  "credit-card": <CreditCard size={13} />,
  "rotate-ccw": <RotateCcw size={13} />,
  "x-circle": <XCircle size={13} />,
  "check-circle-2": <CheckCircle2 size={13} />,
};

function money(n: number) {
  return "$ " + n.toLocaleString("es-AR");
}

function EstadoPill({ estado }: { estado: EstadoReservaProd }) {
  const meta = ESTADO_META[estado];
  const t = TONE_VARS[meta.tone];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: "var(--radius-pill)", padding: "4px 11px", fontSize: 12, fontWeight: 700, background: t.bg, color: t.fg, whiteSpace: "nowrap" }}>
      {ESTADO_ICON[meta.icon]} {meta.label}
    </span>
  );
}

function ReservaRow({ r, onConfirm, confirming }: { r: ReservaProd; onConfirm: (id: string) => void; confirming: boolean }) {
  const [open, setOpen] = useState(false);
  const total = totalReserva(r);
  const rango = rangoEtario(r.participantes);

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-3)", letterSpacing: ".04em" }}>{r.id}</span>
            <EstadoPill estado={r.estado} />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "var(--fg-1)", marginTop: 6 }}>{r.actividad}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px 16px", flexWrap: "wrap", fontSize: 13, color: "var(--fg-2)", marginTop: 6 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><UserCheck size={14} color="var(--brown-700)" /> {r.contacto}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><CalendarDays size={14} color="var(--green-800)" /> {r.fechaLabel} · {r.horario}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Users size={14} color="var(--fg-3)" /> {r.participantes.length} {r.participantes.length === 1 ? "persona" : "personas"}</span>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 600 }}>Total</div>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 17, color: "var(--green-800)" }}>{money(total)}</div>
        </div>
        <ChevronDown size={20} color="var(--fg-3)" style={{ flexShrink: 0, transition: "transform .2s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      {open && (
        <div className="pop" style={{ padding: "0 20px 20px", borderTop: "1px solid var(--cream-tert)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "16px 0" }}>
            {rango.map((g) => (
              <span key={g.cat} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--cream-tert)", borderRadius: "var(--radius-pill)", padding: "4px 11px", fontSize: 12.5, fontWeight: 600, color: "var(--fg-2)" }}>
                {g.n} {g.n === 1 ? g.cat.toLowerCase() : g.cat.toLowerCase() + (g.cat === "Infante" ? "s" : g.cat === "Menor" ? "es" : "s")}
              </span>
            ))}
          </div>
          <div className="t-label" style={{ marginBottom: 8 }}>Participantes</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {r.participantes.map((p, i) => {
              const sub = precioCategoria(p.edad, r.precioAdulto);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: i < r.participantes.length - 1 ? "1px solid var(--cream-tert)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--green-050)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 12, color: "var(--green-800)" }}>
                      {p.nombre.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, color: "var(--fg-1)", fontWeight: 500 }}>{p.nombre}</div>
                      <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{categoriaEtaria(p.edad)} · {p.edad} años</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 13.5, fontWeight: 600, color: sub > 0 ? "var(--fg-1)" : "var(--green-800)" }}>{sub > 0 ? money(sub) : "Sin cargo"}</div>
                </div>
              );
            })}
          </div>

          {r.estado === "pendiente" && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <button type="button" className="btn btn-primary" disabled={confirming} onClick={() => onConfirm(r.id)}>
                {confirming ? (<><Loader size={16} className="spin" /> Confirmando…</>) : (<><Check size={17} /> Confirmar reserva</>)}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 180 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-2)", fontSize: 13, fontWeight: 500 }}>{icon} {label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26, color: "var(--fg-1)", marginTop: 8 }}>{value}</div>
    </div>
  );
}

export default function ReservasRecibidasClient() {
  const [fincaId, setFincaId] = useState(FINCAS[0].id);
  const { data, isLoading, error, reload } = useReservasRecibidas(fincaId);
  const { confirmar, pendingId } = useConfirmarReserva();

  const [overrides, setOverrides] = useState<Record<string, EstadoReservaProd>>({});
  const [filtro, setFiltro] = useState<"todos" | EstadoReservaProd>("todos");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const reservas = useMemo(
    () => (data ?? []).map((r) => (overrides[r.id] ? { ...r, estado: overrides[r.id] } : r)),
    [data, overrides],
  );

  const afterSearch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reservas;
    return reservas.filter((r) => [r.id, r.contacto, r.actividad].some((f) => f.toLowerCase().includes(q)));
  }, [reservas, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: afterSearch.length };
    afterSearch.forEach((r) => { c[r.estado] = (c[r.estado] || 0) + 1; });
    return c;
  }, [afterSearch]);

  const filtradas = useMemo(
    () => (filtro === "todos" ? afterSearch : afterSearch.filter((r) => r.estado === filtro)),
    [afterSearch, filtro],
  );

  const metrics = useMemo(() => {
    let personas = 0, ingreso = 0;
    reservas.forEach((r) => {
      if (r.estado === "pagada" || r.estado === "finalizada") {
        personas += r.participantes.length;
        ingreso += totalReserva(r);
      }
    });
    return { personas, ingreso, total: reservas.length };
  }, [reservas]);

  const pages = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pages);
  const visibles = filtradas.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  async function onConfirm(id: string) {
    await confirmar(id);
    setOverrides((o) => ({ ...o, [id]: "pagada" }));
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-bg)" }}>
      <ProducerShell active="reservas" fincas={FINCAS} activeFincaId={fincaId} onFincaChange={(id) => { setFincaId(id); setPage(1); setFiltro("todos"); }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 28px 80px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--fg-1)", margin: 0, letterSpacing: "-.01em" }}>Reservas recibidas</h1>
          <p style={{ margin: "6px 0 0", color: "var(--fg-2)", fontSize: 15 }}>Gestioná las reservas de las experiencias de tu establecimiento.</p>
        </div>

        {!isLoading && data && (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
            <Metric icon={<Inbox size={16} color="var(--green-600)" />} label="Reservas recibidas" value={String(metrics.total)} />
            <Metric icon={<Users size={16} color="var(--green-600)" />} label="Personas confirmadas" value={String(metrics.personas)} />
            <Metric icon={<Banknote size={16} color="var(--green-600)" />} label="Ingreso estimado" value={money(metrics.ingreso)} />
          </div>
        )}

        <div style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", padding: 18, display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
          <div style={{ position: "relative", maxWidth: 460 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", display: "flex", color: "var(--fg-3)" }}><Search size={18} /></span>
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Buscar por código, cliente o actividad…"
              aria-label="Buscar reservas"
              style={{ width: "100%", fontFamily: "var(--font-sans)", fontSize: 14.5, color: "var(--fg-1)", borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid var(--sand)", padding: "11px 13px 11px 42px", outline: "none", boxSizing: "border-box" }}
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Limpiar" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "var(--cream-tert)", width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={14} color="var(--fg-2)" /></button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ESTADO_OPTS.map((o) => {
              const on = filtro === o.value;
              const count = counts[o.value] ?? 0;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { setFiltro(o.value); setPage(1); }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 999, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-sans)", border: "1px solid " + (on ? "var(--green-800)" : "var(--sand)"), background: on ? "var(--green-800)" : "var(--surface)", color: on ? "#fff" : "var(--fg-2)" }}
                >
                  {o.label}
                  <span style={{ padding: "1px 7px", borderRadius: 999, fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)", background: on ? "rgba(255,255,255,.18)" : "var(--cream-tert)", color: on ? "#fff" : "var(--fg-3)" }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <AsyncBoundary loading={isLoading} error={error} onRetry={reload} loadingLabel="Cargando reservas…" pad={72}>
          {filtradas.length === 0 ? (
          <div style={{ background: "var(--surface)", border: "1px dashed var(--sand)", borderRadius: "var(--radius-lg)", padding: "64px 24px", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--cream-tert)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Inbox size={28} color="var(--brown-700)" />
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20, color: "var(--fg-1)" }}>No hay reservas para mostrar</div>
            <p style={{ color: "var(--fg-2)", fontSize: 14.5, maxWidth: 420, margin: "8px auto 0", lineHeight: 1.5 }}>
              {query || filtro !== "todos" ? "Probá con otro término o quitá los filtros." : "Cuando recibas reservas en tus experiencias, las vas a ver acá."}
            </p>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13.5, color: "var(--fg-3)", marginBottom: 14 }}>
              Mostrando <strong style={{ color: "var(--fg-2)" }}>{filtradas.length}</strong> {filtradas.length === 1 ? "reserva" : "reservas"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {visibles.map((r) => (
                <ReservaRow key={r.id} r={r} onConfirm={onConfirm} confirming={pendingId === r.id} />
              ))}
            </div>
            <Pagination page={pageSafe} pages={pages} onPage={setPage} />
          </>
        )}
        </AsyncBoundary>
      </div>
    </div>
  );
}
