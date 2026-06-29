import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight, ArrowLeft, CalendarCheck, Salad, HeartPulse, ChefHat, MapPin, Clock, Users, ArrowRight, Compass,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import Photo from "@/components/landing/Photo";
import SeasonCalendar from "@/components/cultivos/SeasonCalendar";
import { CULTIVOS, getCultivo, recetasDeCultivo, actividadesDeCultivo, temporadaLabel, enTemporada } from "@/data/cultivos";

export function generateStaticParams() {
  return CULTIVOS.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const c = getCultivo(id);
  if (!c) return { title: "Cultivo no encontrado · Mendoza AgroTours" };
  return { title: `${c.nombre} · Cultivos · Mendoza AgroTours`, description: c.descripcion };
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>{icon}<h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "var(--fg-1)", margin: 0 }}>{title}</h2></div>
      {children}
    </section>
  );
}

export default async function CultivoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getCultivo(id);
  if (!c) notFound();

  const recetas = recetasDeCultivo(c);
  const actividades = actividadesDeCultivo(c);
  const temporada = enTemporada(c);

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-bg)" }}>
      <SiteHeader active="cultivos" />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 28px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13, marginBottom: 16 }}>
          <Link href="/cultivos" style={{ color: "var(--fg-3)", textDecoration: "none" }}>Cultivos</Link>
          <ChevronRight size={14} />
          <span style={{ color: "var(--fg-2)", fontWeight: 500 }}>{c.nombre}</span>
        </div>

        <Link href="/cultivos" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--green-800)", fontSize: 14, fontWeight: 600, textDecoration: "none", marginBottom: 18 }}>
          <ArrowLeft size={16} /> Volver a cultivos
        </Link>

        {/* Hero */}
        <div style={{ position: "relative", height: 240, borderRadius: "var(--radius-lg)", overflow: "hidden", background: c.color, display: "flex", alignItems: "flex-end", padding: 28 }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.45), transparent 60%)" }} />
          <div style={{ position: "relative" }}>
            {temporada && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(251,249,248,.95)", borderRadius: "var(--radius-pill)", padding: "5px 12px", fontSize: 12.5, fontWeight: 700, color: "var(--green-800)", marginBottom: 12 }}><CalendarCheck size={14} color="var(--green-700)" /> En temporada</span>}
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 36, color: "#fff", margin: 0, letterSpacing: "-.01em" }}>{c.nombre}</h1>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,.85)", fontStyle: "italic", marginTop: 4 }}>{c.familia}</div>
          </div>
        </div>

        <p style={{ fontSize: 16, color: "var(--fg-2)", lineHeight: 1.7, margin: "24px 0 0" }}>{c.descripcion}</p>

        {/* Temporada */}
        <Section icon={<CalendarCheck size={20} color="var(--green-800)" />} title="Calendario de temporada">
          <div className="card">
            <div style={{ fontSize: 14, color: "var(--fg-2)", marginBottom: 16 }}>{temporadaLabel(c)}</div>
            <SeasonCalendar calendario={c.calendario} />
          </div>
        </Section>

        {/* Nutrición + beneficios */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 40, alignItems: "start" }} className="cultivo-grid">
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}><Salad size={20} color="var(--green-800)" /><h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "var(--fg-1)", margin: 0 }}>Información nutricional</h2></div>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--cream-tert)", fontSize: 12.5, color: "var(--fg-3)" }}>Por porción de {c.nutricion.porcion}</div>
              <div>
                {c.nutricion.items.map((it, i) => (
                  <div key={it.label} style={{ display: "flex", justifyContent: "space-between", padding: "11px 18px", borderBottom: i < c.nutricion.items.length - 1 ? "1px solid var(--cream-tert)" : "none", fontSize: 14 }}>
                    <span style={{ color: "var(--fg-2)" }}>{it.label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--fg-1)" }}>{it.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}><HeartPulse size={20} color="var(--green-800)" /><h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "var(--fg-1)", margin: 0 }}>Beneficios</h2></div>
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {c.beneficios.map((b) => (
                <div key={b} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--green-050)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><HeartPulse size={15} color="var(--green-700)" /></span>
                  <span style={{ fontSize: 14, color: "var(--fg-1)", lineHeight: 1.5 }}>{b}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Recetas */}
        {recetas.length > 0 && (
          <Section icon={<ChefHat size={20} color="var(--green-800)" />} title={`Recetas con ${c.nombre.toLowerCase()}`}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
              {recetas.map((r) => (
                <Link key={r.id} href={`/recetas/${r.id}`} className="card-hover" style={{ textDecoration: "none", display: "flex", flexDirection: "column", background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                  <Photo seed={r.seed} height={130} radius={0} />
                  <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "var(--fg-1)", margin: 0, lineHeight: 1.3 }}>{r.nombre}</h3>
                    <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 12.5, color: "var(--fg-3)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Clock size={13} /> {r.tiempo}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Users size={13} /> {r.porciones}</span>
                    </div>
                    <span style={{ marginTop: "auto", paddingTop: 12, display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: "var(--green-800)" }}>Ver receta <ArrowRight size={14} /></span>
                  </div>
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* Actividades */}
        {actividades.length > 0 && (
          <Section icon={<Compass size={20} color="var(--green-800)" />} title="Viví la cosecha">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
              {actividades.map((a) => (
                <Link key={a.id} href="/explorar" className="card-hover" style={{ textDecoration: "none", display: "flex", flexDirection: "column", background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                  <Photo seed={a.seed} height={130} radius={0} />
                  <div style={{ padding: "14px 16px 16px" }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "var(--fg-1)", margin: 0, lineHeight: 1.3 }}>{a.titulo}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--fg-3)", marginTop: 8 }}><MapPin size={13} color="var(--brown-700)" /> {a.finca} · {a.loc}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--green-800)", fontSize: 15 }}>$ {a.precio}</span>
                      <span style={{ fontSize: 12.5, color: "var(--fg-3)" }}>{a.dur}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Section>
        )}
      </div>

      <style>{`
        .card-hover { transition: box-shadow .16s, border-color .16s, transform .16s; }
        .card-hover:hover { box-shadow: var(--shadow-hover); border-color: var(--sand); transform: translateY(-2px); }
        @media (max-width: 720px) { .cultivo-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
