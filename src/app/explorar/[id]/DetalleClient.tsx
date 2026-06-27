"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Share2, Check, X, MapPin, Star, Clock, Users, Tag, ChevronLeft, ChevronRight,
  Minus, Plus, Sun, Cloud, CloudSun, CloudDrizzle, CalendarDays, ShieldCheck,
  CreditCard, Building2, Sprout, ChevronDown, Info,
} from "lucide-react";
import Photo from "@/components/landing/Photo";
import { moneyAr } from "@/lib/format";
import {
  CALENDARIO, VIAJEROS, MEDIOS_PAGO, PRONOSTICO, NOMBRES_DIA, CUPO_MAXIMO,
} from "@/data/actividad-detalle";
import type { ActividadDetalle } from "@/types/catalogo";

const WEATHER_ICON: Record<string, React.ReactNode> = {
  sun: <Sun size={22} color="var(--warning)" />,
  "cloud-sun": <CloudSun size={22} color="var(--warning)" />,
  cloud: <Cloud size={22} color="var(--fg-3)" />,
  "cloud-drizzle": <CloudDrizzle size={22} color="var(--info)" />,
};

/* ---- Botón compartir (copia link) -------------------------------------- */
function ShareButton() {
  const [copied, setCopied] = useState(false);
  async function onShare() {
    try { await navigator.clipboard.writeText(window.location.href); } catch { /* noop */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }
  return (
    <button type="button" onClick={onShare} className={`btn btn-sm ${copied ? "btn-primary" : "btn-neutral"}`} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      {copied ? "Link copiado" : "Compartir"}
    </button>
  );
}

/* ---- Carrusel del hero ------------------------------------------------- */
function HeroCarousel({ fotos }: { fotos: ActividadDetalle["fotos"] }) {
  const [i, setI] = useState(0);
  const go = (d: number) => setI((p) => (p + d + fotos.length) % fotos.length);
  return (
    <div>
      <div style={{ position: "relative" }}>
        <Photo seed={fotos[i].seed} height={440} caption={fotos[i].caption} />
        <button type="button" onClick={() => go(-1)} aria-label="Anterior" style={navBtn("left")}><ChevronLeft size={22} /></button>
        <button type="button" onClick={() => go(1)} aria-label="Siguiente" style={navBtn("right")}><ChevronRight size={22} /></button>
        <span style={{ position: "absolute", top: 14, right: 14, background: "rgba(14,46,12,.7)", color: "#fff", borderRadius: "var(--radius-pill)", padding: "4px 11px", fontSize: 12.5, fontWeight: 600 }}>
          {i + 1} / {fotos.length}
        </span>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        {fotos.map((f, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setI(idx)}
            style={{ flex: 1, border: idx === i ? "2px solid var(--green-800)" : "2px solid transparent", borderRadius: 10, overflow: "hidden", cursor: "pointer", padding: 0, lineHeight: 0 }}
          >
            <Photo seed={f.seed} height={56} radius={6} />
          </button>
        ))}
      </div>
    </div>
  );
}

function navBtn(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute", top: "50%", [side]: 14, transform: "translateY(-50%)",
    width: 42, height: 42, borderRadius: "50%", border: "none", cursor: "pointer",
    background: "rgba(251,249,248,.92)", color: "var(--fg-1)",
    display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-pop)",
  };
}

/* ---- Encabezado de la actividad ---------------------------------------- */
function ActivityHeader({ a }: { a: ActividadDetalle }) {
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--warning-fill)", color: "var(--warning-fg)", borderRadius: "var(--radius-pill)", padding: "4px 12px", fontSize: 12.5, fontWeight: 700 }}>
          <Tag size={13} /> {a.tag}
        </span>
        {a.cultivos.map((c) => (
          <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--green-050)", color: "var(--green-800)", borderRadius: "var(--radius-pill)", padding: "4px 12px", fontSize: 12.5, fontWeight: 600 }}>
            <Sprout size={12} /> {c}
          </span>
        ))}
      </div>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 34, color: "var(--fg-1)", margin: 0, letterSpacing: "-.015em", lineHeight: 1.12 }}>{a.titulo}</h1>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 20px", marginTop: 14, fontSize: 14.5, color: "var(--fg-2)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><MapPin size={16} color="var(--brown-700)" /> {a.finca} · {a.loc}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Star size={16} color="#C9A227" fill="#C9A227" /> <strong style={{ color: "var(--fg-1)" }}>{a.rating.toFixed(1)}</strong> ({a.totalResenias} reseñas)</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Clock size={16} color="var(--fg-3)" /> {a.duracion}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Users size={16} color="var(--fg-3)" /> {a.edadPermitida}</span>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "var(--fg-1)", margin: "0 0 16px" }}>{children}</h2>;
}

function Block({ children }: { children: React.ReactNode }) {
  return <section style={{ marginTop: 40 }}>{children}</section>;
}

/* ---- FAQ acordeón ------------------------------------------------------ */
function FaqRow({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <button type="button" onClick={() => setOpen((o) => !o)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px 18px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--fg-1)" }}>{q}</span>
        <ChevronDown size={19} color="var(--fg-3)" style={{ flexShrink: 0, transition: "transform .2s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && <div className="pop" style={{ padding: "0 18px 18px", fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6 }}>{a}</div>}
    </div>
  );
}

/* ---- Widget de reserva ------------------------------------------------- */
function BookingWidget({ a }: { a: ActividadDetalle }) {
  const [monthIdx, setMonthIdx] = useState(0);
  const [selMonthIdx, setSelMonthIdx] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [counts, setCounts] = useState({ infantes: 0, menores: 0, adultos: 2 });

  const mes = CALENDARIO[monthIdx];
  const total = counts.infantes + counts.menores + counts.adultos;
  const precio = counts.infantes * a.precios.infantes + counts.menores * a.precios.menores + counts.adultos * a.precios.adultos;

  const cuposSel = selMonthIdx !== null && selectedDay !== null ? CALENDARIO[selMonthIdx].days[selectedDay].cupos : null;
  const excedeCupo = cuposSel !== null && total > cuposSel;
  const fechaOk = selectedDay !== null;
  const puedeReservar = fechaOk && total >= 1 && counts.adultos >= 1 && !excedeCupo;

  const firstDow = useMemo(() => {
    const d = new Date(mes.year, mes.month, 1).getDay();
    return (d + 6) % 7; // lunes primero
  }, [mes]);
  const daysInMonth = new Date(mes.year, mes.month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  function setCount(id: "infantes" | "menores" | "adultos", delta: number) {
    setCounts((c) => ({ ...c, [id]: Math.max(0, Math.min(CUPO_MAXIMO, c[id] + delta)) }));
  }

  return (
    <aside className="card" style={{ padding: 0, overflow: "hidden", position: "sticky", top: 88 }}>
      <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--outline-variant)" }}>
        <div className="t-label" style={{ marginBottom: 2 }}>Desde</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, color: "var(--fg-1)" }}>{moneyAr(a.precioDesde)}</span>
          <span style={{ fontSize: 13.5, color: "var(--fg-3)" }}>/ adulto</span>
        </div>
      </div>

      <div style={{ padding: "18px 20px" }}>
        {/* Calendario */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <button type="button" onClick={() => setMonthIdx((m) => Math.max(0, m - 1))} disabled={monthIdx === 0} style={calNav(monthIdx === 0)}><ChevronLeft size={17} /></button>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15.5, color: "var(--fg-1)", display: "inline-flex", alignItems: "center", gap: 7 }}>
            <CalendarDays size={16} color="var(--green-700)" /> {mes.label}
          </span>
          <button type="button" onClick={() => setMonthIdx((m) => Math.min(CALENDARIO.length - 1, m + 1))} disabled={monthIdx === CALENDARIO.length - 1} style={calNav(monthIdx === CALENDARIO.length - 1)}><ChevronRight size={17} /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 5 }}>
          {NOMBRES_DIA.map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: 10.5, fontWeight: 700, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".03em" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
          {cells.map((d, idx) => {
            if (d === null) return <div key={idx} />;
            const info = mes.days[d];
            const disponible = info.state === "disponible";
            const sel = selMonthIdx === monthIdx && selectedDay === d;
            return (
              <button
                key={idx}
                type="button"
                disabled={!disponible}
                onClick={() => { setSelectedDay(d); setSelMonthIdx(monthIdx); }}
                style={{
                  aspectRatio: "1", borderRadius: 8, border: "none", cursor: disponible ? "pointer" : "default",
                  fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: sel ? 700 : 500,
                  background: sel ? "var(--green-800)" : disponible ? "var(--green-050)" : "transparent",
                  color: sel ? "#fff" : disponible ? "var(--green-800)" : "var(--fg-3)",
                  opacity: disponible ? 1 : 0.4,
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
        {cuposSel !== null && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: cuposSel <= 4 ? "var(--warning-fg)" : "var(--fg-2)", marginTop: 10 }}>
            <Info size={14} /> {cuposSel} {cuposSel === 1 ? "cupo disponible" : "cupos disponibles"} para esa fecha.
          </div>
        )}

        {/* Viajeros */}
        <div style={{ marginTop: 18 }}>
          <div className="t-label" style={{ marginBottom: 10 }}>Personas</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {VIAJEROS.map((v) => {
              const val = counts[v.id];
              const precioCat = a.precios[v.id];
              return (
                <div key={v.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>{v.label}</div>
                    <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{v.sub} · {precioCat === 0 ? "Sin cargo" : moneyAr(precioCat)}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button type="button" onClick={() => setCount(v.id, -1)} disabled={val === 0} style={stepBtn(val === 0)} aria-label={`Quitar ${v.label}`}><Minus size={15} /></button>
                    <span style={{ minWidth: 18, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600 }}>{val}</span>
                    <button type="button" onClick={() => setCount(v.id, 1)} disabled={total >= CUPO_MAXIMO} style={stepBtn(total >= CUPO_MAXIMO)} aria-label={`Agregar ${v.label}`}><Plus size={15} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {excedeCupo && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--danger-fg)", marginTop: 12 }}>
            <Info size={14} /> Seleccionaste {total} personas pero hay {cuposSel} cupos para esa fecha.
          </div>
        )}

        {/* Total */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--outline-variant)" }}>
          <span style={{ fontSize: 14, color: "var(--fg-2)" }}>Total ({total} {total === 1 ? "persona" : "personas"})</span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "var(--fg-1)" }}>{moneyAr(precio)}</span>
        </div>

        <Link
          href={`/explorar/${a.id}/reservar`}
          aria-disabled={!puedeReservar}
          className="btn btn-primary btn-lg"
          style={{ width: "100%", justifyContent: "center", marginTop: 14, pointerEvents: puedeReservar ? "auto" : "none", opacity: puedeReservar ? 1 : 0.55 }}
        >
          Solicitar reserva
        </Link>
        <p style={{ fontSize: 12, color: "var(--fg-3)", textAlign: "center", margin: "10px 0 0", lineHeight: 1.5 }}>
          {fechaOk ? "Continuá para cargar visitantes y pagar." : "Elegí una fecha disponible para continuar."}
        </p>

        {/* Medios de pago */}
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--outline-variant)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: "var(--fg-2)", marginBottom: 10 }}>
            <CreditCard size={15} color="var(--green-700)" /> Medios de pago
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {MEDIOS_PAGO.map((mp) => (
              <div key={mp.id} style={{ fontSize: 12.5, color: "var(--fg-2)" }}>
                <strong style={{ color: "var(--fg-1)", fontWeight: 600 }}>{mp.nombre}</strong> · {mp.sub}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function calNav(disabled: boolean): React.CSSProperties {
  return { width: 30, height: 30, borderRadius: 8, border: "1px solid var(--outline-variant)", background: "var(--surface)", cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--fg-2)", opacity: disabled ? 0.4 : 1 };
}
function stepBtn(disabled: boolean): React.CSSProperties {
  return { width: 30, height: 30, borderRadius: 8, border: "1px solid var(--sand)", background: "var(--surface)", cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: disabled ? "var(--fg-3)" : "var(--green-800)", opacity: disabled ? 0.5 : 1 };
}

/* ---- Página de detalle ------------------------------------------------- */
export default function DetalleClient({ a }: { a: ActividadDetalle }) {
  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "24px 28px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13 }}>
          <Link href="/" style={{ color: "var(--fg-3)", textDecoration: "none" }}>Inicio</Link>
          <ChevronRight size={14} />
          <Link href="/explorar" style={{ color: "var(--fg-3)", textDecoration: "none" }}>Explorar actividades</Link>
          <ChevronRight size={14} />
          <span style={{ color: "var(--fg-2)", fontWeight: 500 }}>{a.titulo}</span>
        </div>
        <ShareButton />
      </div>

      <div style={{ marginBottom: 28 }}><HeroCarousel fotos={a.fotos} /></div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 56, alignItems: "start" }} className="detalle-grid">
        <div style={{ minWidth: 0 }}>
          <ActivityHeader a={a} />

          <Block>
            <SectionTitle>Sobre la experiencia</SectionTitle>
            {a.descripcion.map((p, i) => (
              <p key={i} style={{ fontSize: 15.5, color: "var(--fg-2)", lineHeight: 1.65, margin: i === 0 ? "0 0 14px" : 0 }}>{p}</p>
            ))}
          </Block>

          <Block>
            <SectionTitle>Qué incluye</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 28px" }} className="incluye-grid">
              {a.incluye.map((x) => (
                <div key={x} style={{ display: "flex", gap: 9, fontSize: 14.5, color: "var(--fg-2)" }}>
                  <Check size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} /> {x}
                </div>
              ))}
              {a.noIncluye.map((x) => (
                <div key={x} style={{ display: "flex", gap: 9, fontSize: 14.5, color: "var(--fg-3)" }}>
                  <X size={18} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} /> {x}
                </div>
              ))}
            </div>
          </Block>

          <Block>
            <SectionTitle>El establecimiento</SectionTitle>
            <div className="card" style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: "var(--green-800)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, flexShrink: 0 }}>
                {a.establecimiento.iniciales}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--fg-1)", margin: 0 }}>{a.establecimiento.nombre}</h3>
                  <span style={{ fontSize: 12.5, color: "var(--fg-3)" }}>· {a.establecimiento.tipo}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--fg-2)", marginTop: 4 }}>
                  <MapPin size={14} color="var(--brown-700)" /> {a.establecimiento.loc}
                </div>
                <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.55, margin: "10px 0 14px" }}>{a.establecimiento.bio}</p>
                {a.estId && (
                  <Link href={`/establecimientos/${a.estId}`} className="btn btn-neutral btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                    <Building2 size={15} /> Ver establecimiento
                  </Link>
                )}
              </div>
            </div>
          </Block>

          <Block>
            <SectionTitle>Pronóstico para la zona</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }} className="clima-grid">
              {PRONOSTICO.map((d) => (
                <div key={d.fecha} className="card" style={{ padding: "14px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-2)" }}>{d.fecha}</div>
                  <div style={{ margin: "10px 0" }}>{WEATHER_ICON[d.icon]}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--fg-1)" }}>{d.tMax}°<span style={{ color: "var(--fg-3)", fontWeight: 500 }}> / {d.tMin}°</span></div>
                  <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 3 }}>{d.desc}</div>
                </div>
              ))}
            </div>
          </Block>

          <Block>
            <SectionTitle>Reseñas ({a.totalResenias})</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {a.resenias.map((r) => (
                <div key={r.autor} className="card">
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--cream-tert)", color: "var(--brown-700)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{r.iniciales}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>{r.autor}</div>
                      <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{r.fecha}</div>
                    </div>
                    <div style={{ display: "inline-flex", gap: 2 }}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={14} color="#C9A227" fill={i < r.rating ? "#C9A227" : "none"} />
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>{r.texto}</p>
                </div>
              ))}
            </div>
          </Block>

          <Block>
            <SectionTitle>Preguntas frecuentes</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {a.faqs.map((f) => <FaqRow key={f.q} q={f.q} a={f.a} />)}
            </div>
          </Block>

          <Block>
            <div className="card" style={{ background: "var(--green-050)", border: "1px solid var(--green-100)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
                <ShieldCheck size={20} color="var(--green-800)" />
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--fg-1)", margin: 0 }}>{a.cancelacion.titulo}</h3>
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                {a.cancelacion.bullets.map((b) => (
                  <li key={b} style={{ fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.5 }}>{b}</li>
                ))}
              </ul>
            </div>
          </Block>
        </div>

        <BookingWidget a={a} />
      </div>

      <style>{`
        @media (max-width: 940px) {
          .detalle-grid { grid-template-columns: 1fr !important; }
          .incluye-grid, .clima-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
