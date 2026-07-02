"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  MapPin, Plus, Search, X, SlidersHorizontal, LayoutGrid, FilePenLine, Eye, EyeOff,
  Ban, Settings2, CalendarPlus, CalendarDays, Trash2, Clock, Sprout, Loader, Check,
  AlertTriangle, RotateCcw, SearchX, Grape, Scissors, Wine, Leaf, Cherry, Nut, X as XIcon,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import ProducerShell from "@/components/panel/ProducerShell";
import { Pagination } from "@/components/catalog/controls";
import { FINCAS } from "@/data/panel";
import { estadoBucket, normalizar } from "@/data/actividades-prod";
import { useActividades, useActividadAcciones } from "@/hooks/useActividades";
import { moneyAr } from "@/lib/format";
import type { ActividadProd, EstadoActividad, EstadoBucket } from "@/types/actividad-prod";

const PAGE_SIZE = 10;

const ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  grape: Grape, scissors: Scissors, wine: Wine, leaf: Leaf, cherry: Cherry, sprout: Sprout, nut: Nut, "map-pin": MapPin,
};

type Override = Partial<Pick<ActividadProd, "estado" | "fechaBaja">>;
type Toast = { title: string; sub?: string } | null;

/* ---- Chip de cultivo --------------------------------------------------- */
function CropChip({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--green-100)", color: "var(--green-800)", borderRadius: "var(--radius-pill)", padding: "4px 11px", fontSize: 12.5, fontWeight: 600, lineHeight: 1.2 }}>
      <Sprout size={12} color="var(--green-700)" /> {children}
    </span>
  );
}

function CardAction({ icon, label, href, onClick, danger }: { icon: React.ReactNode; label: string; href?: string; onClick?: () => void; danger?: boolean }) {
  const style: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", fontFamily: "var(--font-sans)",
    fontSize: 13.5, fontWeight: 600, padding: "9px 14px", borderRadius: "var(--radius)", cursor: "pointer",
    background: "var(--surface)", border: "1px solid var(--sand)", color: danger ? "var(--danger-fg)" : "var(--fg-1)",
    boxShadow: `inset 0 -2px 0 ${danger ? "var(--danger-fill)" : "var(--outline)"}`, textDecoration: "none",
  };
  if (href) return <Link href={href} style={style}>{icon} {label}</Link>;
  return <button type="button" onClick={onClick} style={style}>{icon} {label}</button>;
}

/* ---- Toggle Borrador / Publicar ---------------------------------------- */
function PublishToggle({ act, busy, onPublicar, onBorrador }: { act: ActividadProd; busy: boolean; onPublicar: () => void; onBorrador: () => void }) {
  const isPublished = act.estado === "publicado" || act.estado === "activo";
  const reservas = act.reservas || 0;
  const draftDisabled = reservas > 0;
  const seg = (selected: boolean, disabled: boolean): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600,
    padding: "6px 13px", borderRadius: "var(--radius-pill)", border: "none",
    cursor: disabled ? "not-allowed" : selected ? "default" : "pointer",
    background: selected ? (isPublished ? "var(--green-800)" : "var(--brown-700)") : "transparent",
    color: selected ? "var(--fg-on-dark)" : "var(--fg-2)", opacity: disabled ? 0.4 : 1,
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <div role="group" aria-label="Estado de publicación" style={{ display: "inline-flex", gap: 3, padding: 3, background: "var(--cream-tert)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-pill)" }}>
        <button type="button" style={seg(!isPublished, draftDisabled || busy)} disabled={draftDisabled || busy} title={draftDisabled ? "No se puede ocultar: tiene reservas asociadas" : "Ocultar (guardar como borrador)"} onClick={() => { if (!draftDisabled && isPublished) onBorrador(); }}>
          <EyeOff size={13} /> Borrador
        </button>
        <button type="button" style={seg(isPublished, busy)} disabled={busy} title="Publicar (visible para visitantes)" onClick={() => { if (!isPublished) onPublicar(); }}>
          <Eye size={13} /> Publicar
        </button>
      </div>
      {draftDisabled && (
        <span style={{ fontSize: 11.5, color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 4 }}>
          {reservas} {reservas === 1 ? "reserva asociada" : "reservas asociadas"}
        </span>
      )}
    </div>
  );
}

/* ---- Tarjeta de actividad ---------------------------------------------- */
function ActivityCard({ act, busy, onEliminar, onPublicar, onBorrador }: { act: ActividadProd; busy: boolean; onEliminar: () => void; onPublicar: () => void; onBorrador: () => void }) {
  const esBaja = estadoBucket(act.estado) === "baja";
  const activo = !esBaja && (act.estado === "publicado" || act.estado === "activo");
  const IconC = ICONS[act.icon] ?? Grape;
  const muted: React.CSSProperties | undefined = esBaja ? { filter: "grayscale(1)", opacity: 0.62 } : undefined;

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", background: esBaja ? "var(--cream-tert)" : "var(--surface)" }}>
      <div style={{ display: "flex", gap: 20, padding: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ width: 54, height: 54, borderRadius: 14, flexShrink: 0, background: activo ? "var(--green-050)" : "var(--surface)", border: "1px solid var(--outline-variant)", display: "flex", alignItems: "center", justifyContent: "center", ...muted }}>
          <IconC size={26} color={activo ? "var(--green-700)" : "var(--fg-3)"} />
        </div>

        <div style={{ flex: "1 1 280px", minWidth: 240 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 19, margin: 0, color: esBaja ? "var(--fg-2)" : "var(--fg-1)" }}>{act.nombre}</h3>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)" }}>{act.id}</span>
          </div>
          <div style={{ marginTop: 14, ...muted }}>
            <div className="t-label" style={{ marginBottom: 7 }}>Cultivos asociados</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{act.cultivos.map((c) => <CropChip key={c}>{c}</CropChip>)}</div>
          </div>
          <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", gap: 8, ...(esBaja ? { opacity: 0.7 } : null) }}>
            <span className="t-label">Precio regular</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 600, color: esBaja ? "var(--fg-2)" : "var(--fg-1)" }}>{moneyAr(act.precio)}</span>
            <span style={{ fontSize: 12.5, color: "var(--fg-3)" }}>por persona</span>
          </div>
        </div>

        <div style={{ flex: "1 1 240px", minWidth: 220, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
          <div style={{ alignSelf: "flex-end" }}>
            {esBaja ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--surface)", color: "var(--fg-2)", border: "1px solid var(--outline)", borderRadius: "var(--radius-pill)", padding: "5px 12px", fontSize: 13, fontWeight: 600 }}>
                  <Ban size={13} color="var(--fg-3)" /> Inactiva
                </span>
                {act.fechaBaja && <span style={{ fontSize: 11.5, color: "var(--fg-3)" }}>Dada de baja el {act.fechaBaja}</span>}
              </div>
            ) : (
              <PublishToggle act={act} busy={busy} onPublicar={onPublicar} onBorrador={onBorrador} />
            )}
          </div>
          <div style={{ width: "100%", ...muted }}>
            <div className="t-label" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 7 }}><Clock size={14} color="var(--fg-2)" /> Días y horas disponibles</div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
              {act.dias.map((d, i) => (
                <li key={i} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, fontSize: 14, color: "var(--fg-1)", borderBottom: i < act.dias.length - 1 ? "1px solid var(--cream-tert)" : "none", paddingBottom: i < act.dias.length - 1 ? 6 : 0 }}>
                  <span style={{ fontWeight: 600 }}>{d.dia}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>{d.desde} – {d.hasta}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap", padding: "14px 24px", borderTop: "1px solid var(--outline-variant)", background: esBaja ? "transparent" : "var(--cream-tert)" }}>
        {esBaja ? (
          <CardAction icon={<CalendarDays size={15} color="var(--fg-2)" />} label="Ver calendario" href={`/panel/actividades/${act.id}/calendario`} />
        ) : (
          <>
            <CardAction icon={<Settings2 size={15} color="var(--fg-2)" />} label="Modificar" href={`/panel/actividades/${act.id}/editar`} />
            <CardAction icon={<CalendarPlus size={15} color="var(--fg-2)" />} label="Agregar día" href={`/panel/actividades/${act.id}/editar`} />
            <CardAction icon={<CalendarDays size={15} color="var(--fg-2)" />} label="Ver calendario" href={`/panel/actividades/${act.id}/calendario`} />
            <CardAction icon={<Trash2 size={15} color="var(--danger)" />} label="Eliminar" danger onClick={onEliminar} />
          </>
        )}
      </div>
    </div>
  );
}

/* ---- Selector de estado ------------------------------------------------ */
function EstadoSelector({ value, onChange, counts }: { value: string; onChange: (v: "todas" | EstadoBucket) => void; counts: Record<string, number> }) {
  const opciones: { value: "todas" | EstadoBucket; label: string; icon: React.ReactNode }[] = [
    { value: "todas", label: "Todas", icon: <LayoutGrid size={15} /> },
    { value: "borrador", label: "Borrador", icon: <FilePenLine size={15} /> },
    { value: "publicado", label: "Publicado", icon: <Eye size={15} /> },
    { value: "baja", label: "Dado de baja", icon: <Ban size={15} /> },
  ];
  return (
    <div role="group" aria-label="Filtrar por estado" style={{ display: "inline-flex", flexWrap: "wrap", gap: 4, padding: 4, background: "var(--cream-tert)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-pill)" }}>
      {opciones.map((o) => {
        const sel = value === o.value;
        return (
          <button key={o.value} type="button" aria-pressed={sel} onClick={() => onChange(o.value)} style={{ display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 600, padding: "8px 14px", borderRadius: "var(--radius-pill)", border: "none", cursor: sel ? "default" : "pointer", background: sel ? "var(--green-800)" : "transparent", color: sel ? "var(--fg-on-dark)" : "var(--fg-2)" }}>
            <span style={{ display: "inline-flex", color: sel ? "var(--fg-on-dark)" : "var(--fg-3)" }}>{o.icon}</span>
            {o.label}
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, fontWeight: 700, minWidth: 20, textAlign: "center", padding: "1px 6px", borderRadius: "var(--radius-pill)", background: sel ? "rgba(255,255,255,.22)" : "var(--surface)", color: sel ? "var(--fg-on-dark)" : "var(--fg-2)", border: sel ? "none" : "1px solid var(--outline-variant)" }}>{counts[o.value] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---- Modales ----------------------------------------------------------- */
function Scrim({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div onMouseDown={onClose} style={{ position: "fixed", inset: 0, background: "rgba(42,38,32,.45)", backdropFilter: "blur(2px)", zIndex: 120, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="pop" onMouseDown={(e) => e.stopPropagation()} style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-pop)", width: 480, maxWidth: "100%", padding: 28 }}>{children}</div>
    </div>
  );
}

function DeleteModal({ act, busy, onConfirm, onClose }: { act: ActividadProd; busy: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <Scrim onClose={onClose}>
      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ width: 46, height: 46, borderRadius: "50%", background: "var(--danger-fill)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Trash2 size={22} color="var(--danger)" /></div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, margin: "0 0 6px", color: "var(--fg-1)" }}>¿Querés dar de baja esta actividad?</h3>
          <p style={{ margin: 0, color: "var(--fg-2)", fontSize: 14.5, lineHeight: 1.5 }}>
            Vas a dar de baja «<strong style={{ color: "var(--fg-1)" }}>{act.nombre}</strong>». Dejará de mostrarse al público y no podrán hacerse nuevas reservas. Esta acción no se puede deshacer.
          </p>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
        <button type="button" className="btn btn-neutral" onClick={onClose} disabled={busy}>Cancelar</button>
        <button type="button" className="btn" onClick={onConfirm} disabled={busy} style={{ background: "var(--danger)", color: "var(--fg-on-dark)", boxShadow: "inset 0 -2px 0 var(--danger-fg)" }}>
          {busy ? (<><Loader size={16} className="spin" /> Dando de baja…</>) : (<><Check size={17} /> Confirmar</>)}
        </button>
      </div>
    </Scrim>
  );
}

function BlockedDeleteModal({ act, onClose }: { act: ActividadProd; onClose: () => void }) {
  return (
    <Scrim onClose={onClose}>
      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ width: 46, height: 46, borderRadius: "50%", background: "var(--warning-fill)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AlertTriangle size={22} color="var(--warning)" /></div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, margin: "0 0 8px", color: "var(--fg-1)" }}>No es posible eliminar esta actividad</h3>
          <p style={{ margin: 0, color: "var(--fg-2)", fontSize: 14.5, lineHeight: 1.55 }}>
            «<strong style={{ color: "var(--fg-1)" }}>{act.nombre}</strong>» tiene reservas en estado «<strong style={{ color: "var(--fg-1)" }}>Pagado</strong>». Pasá todas las reservas a «Cancelado con reembolso» y gestioná los reembolsos antes de darla de baja.
          </p>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
        <button type="button" className="btn btn-neutral" onClick={onClose}>Cerrar</button>
        <Link href="/panel/reservas" className="btn btn-primary"><CalendarDays size={17} /> Ver reservas</Link>
      </div>
    </Scrim>
  );
}

function ToastView({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 4800);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  return (
    <div className="pop" style={{ position: "fixed", right: 24, bottom: 24, zIndex: 130, display: "flex", alignItems: "flex-start", gap: 13, background: "var(--surface)", border: "1px solid var(--green-300)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-pop)", padding: "16px 18px", width: 360, maxWidth: "calc(100vw - 48px)" }}>
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Check size={18} color="#fff" /></div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14.5, color: "var(--fg-1)" }}>{toast.title}</div>
        {toast.sub && <div style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 3, lineHeight: 1.45 }}>{toast.sub}</div>}
      </div>
      <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 }}><XIcon size={16} color="var(--fg-3)" /></button>
    </div>
  );
}

/* ---- Cliente ----------------------------------------------------------- */
export default function ActividadesClient() {
  const [fincaId, setFincaId] = useState(FINCAS[0].id);
  const { data, isLoading, error, reload } = useActividades(fincaId);
  const { darDeBaja, cambiarEstado, pendingId } = useActividadAcciones();

  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [query, setQuery] = useState("");
  const [estadoF, setEstadoF] = useState<"todas" | EstadoBucket>("todas");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<ActividadProd | null>(null);
  const [blocked, setBlocked] = useState<ActividadProd | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const acts = useMemo(
    () => (data ?? []).map((a) => (overrides[a.id] ? { ...a, ...overrides[a.id] } : a)),
    [data, overrides],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { todas: acts.length, borrador: 0, publicado: 0, baja: 0 };
    acts.forEach((a) => { c[estadoBucket(a.estado)]++; });
    return c;
  }, [acts]);

  const filtradas = useMemo(() => {
    let arr = acts;
    if (estadoF !== "todas") arr = arr.filter((a) => estadoBucket(a.estado) === estadoF);
    const q = normalizar(query.trim());
    if (q) arr = arr.filter((a) => normalizar(a.nombre).includes(q));
    return [...arr].sort((x, y) => (estadoBucket(x.estado) === "baja" ? 1 : 0) - (estadoBucket(y.estado) === "baja" ? 1 : 0));
  }, [acts, query, estadoF]);

  const pages = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pages);
  const visibles = filtradas.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const pedirBaja = (act: ActividadProd) => {
    if ((act.reservasPagadas || 0) > 0) setBlocked(act);
    else setToDelete(act);
  };

  async function confirmDelete(act: ActividadProd) {
    await darDeBaja(act.id);
    const fechaBaja = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
    setOverrides((o) => ({ ...o, [act.id]: { estado: "baja", fechaBaja } }));
    setToDelete(null);
    setToast({ title: "La actividad se dio de baja correctamente.", sub: `«${act.nombre}» · fecha de baja ${fechaBaja}.` });
  }

  async function setEstado(act: ActividadProd, nuevo: EstadoActividad) {
    await cambiarEstado(act.id, nuevo);
    setOverrides((o) => ({ ...o, [act.id]: { ...o[act.id], estado: nuevo } }));
    setToast({
      title: nuevo === "publicado" ? "La actividad se publicó correctamente." : "La actividad se ocultó correctamente.",
      sub: `«${act.nombre}» · estado ${nuevo === "publicado" ? "Publicado" : "Borrador"}.`,
    });
  }

  const sinActividades = !isLoading && acts.length === 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-bg)" }}>
      <ProducerShell active="actividades" fincas={FINCAS} activeFincaId={fincaId} onFincaChange={(id) => { setFincaId(id); setEstadoF("todas"); setQuery(""); setPage(1); }} />

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "28px 28px 72px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 6 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--fg-3)", fontSize: 13, marginBottom: 6 }}>
              <MapPin size={14} color="var(--brown-700)" /> <span>Finca La Escondida · Luján de Cuyo, Mendoza</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--fg-1)", margin: 0, letterSpacing: "-.01em" }}>Actividades del establecimiento</h1>
            <p style={{ margin: "6px 0 0", color: "var(--fg-2)", fontSize: 15 }}>Gestioná las experiencias que ofrecés y revisá su disponibilidad.</p>
          </div>
          <Link href="/panel/actividades/crear" className="btn btn-primary"><Plus size={17} /> Crear actividad</Link>
        </div>

        <div style={{ height: 1, background: "var(--outline-variant)", margin: "22px 0 24px" }} />

        <AsyncBoundary loading={isLoading} error={error} onRetry={reload} loadingLabel="Cargando actividades…" pad={72}>
          {sinActividades ? (
          <div className="card" style={{ textAlign: "center", padding: "64px 32px", borderStyle: "dashed", borderColor: "var(--sand)" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--green-050)", border: "1px solid var(--green-100)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}><Grape size={34} color="var(--green-700)" /></div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, margin: "0 0 8px", color: "var(--fg-1)" }}>Todavía no hay actividades</h2>
            <p style={{ margin: "0 auto 24px", color: "var(--fg-2)", fontSize: 15.5, maxWidth: 420, lineHeight: 1.5 }}>Empezá creando la primera experiencia para tus visitantes.</p>
            <Link href="/panel/actividades/crear" className="btn btn-primary"><Plus size={18} /> Crear actividad</Link>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
              <div style={{ position: "relative", flex: 1, minWidth: 280, maxWidth: 460 }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", lineHeight: 0 }}><Search size={18} color="var(--fg-3)" /></span>
                <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Buscá por nombre de actividad…" aria-label="Buscar actividad" style={{ width: "100%", fontFamily: "var(--font-sans)", fontSize: 14.5, color: "var(--fg-1)", borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid var(--sand)", padding: "11px 40px 11px 42px", outline: "none", boxSizing: "border-box" }} />
                {query && <button type="button" onClick={() => { setQuery(""); setPage(1); }} aria-label="Limpiar búsqueda" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", cursor: "pointer", padding: 4, lineHeight: 0 }}><X size={16} color="var(--fg-3)" /></button>}
              </div>
              <div style={{ fontSize: 13.5, color: "var(--fg-2)" }}>
                <strong style={{ color: "var(--fg-1)", fontWeight: 600 }}>{filtradas.length}</strong> {filtradas.length === 1 ? "actividad" : "actividades"}{query ? " encontradas" : ""}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 22 }}>
              <span className="t-label" style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><SlidersHorizontal size={14} color="var(--fg-2)" /> Estado</span>
              <EstadoSelector value={estadoF} onChange={(v) => { setEstadoF(v); setPage(1); }} counts={counts} />
            </div>

            {filtradas.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "56px 32px" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--cream-tert)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}><SearchX size={28} color="var(--fg-3)" /></div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, margin: "0 0 6px", color: "var(--fg-1)" }}>Sin coincidencias</h3>
                <p style={{ margin: "0 auto 20px", color: "var(--fg-2)", fontSize: 15, maxWidth: 380 }}>No hay actividades para los filtros elegidos.</p>
                <button type="button" className="btn btn-neutral" onClick={() => { setQuery(""); setEstadoF("todas"); setPage(1); }}><RotateCcw size={17} /> Limpiar filtros</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {visibles.map((act) => (
                  <ActivityCard key={act.id} act={act} busy={pendingId === act.id} onEliminar={() => pedirBaja(act)} onPublicar={() => setEstado(act, "publicado")} onBorrador={() => setEstado(act, "borrador")} />
                ))}
              </div>
            )}

            <Pagination page={pageSafe} pages={pages} onPage={setPage} />
          </>
        )}
        </AsyncBoundary>
      </div>

      {toDelete && <DeleteModal act={toDelete} busy={pendingId === toDelete.id} onConfirm={() => confirmDelete(toDelete)} onClose={() => setToDelete(null)} />}
      {blocked && <BlockedDeleteModal act={blocked} onClose={() => setBlocked(null)} />}
      <ToastView toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
