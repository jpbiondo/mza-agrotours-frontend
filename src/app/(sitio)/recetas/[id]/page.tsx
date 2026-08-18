import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ArrowLeft, Clock, Users, ChefHat, Sprout, ListChecks } from "lucide-react";
import Photo from "@/components/landing/Photo";
import { RECETAS, getReceta, getCultivo } from "@/data/cultivos";

export function generateStaticParams() {
  return RECETAS.map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const r = getReceta(id);
  if (!r) return { title: "Receta no encontrada · Mendoza AgroTours" };
  return { title: `${r.nombre} · Recetas · Mendoza AgroTours`, description: r.descripcion };
}

export default async function RecetaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = getReceta(id);
  if (!r) notFound();

  const cultivos = r.cultivos.map((cid) => getCultivo(cid)).filter(Boolean);
  const primerCultivo = cultivos[0];

  return (
    <>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 28px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13, marginBottom: 16, flexWrap: "wrap" }}>
          <Link href="/cultivos" style={{ color: "var(--fg-3)", textDecoration: "none" }}>Cultivos</Link>
          <ChevronRight size={14} />
          {primerCultivo && <><Link href={`/cultivos/${primerCultivo.id}`} style={{ color: "var(--fg-3)", textDecoration: "none" }}>{primerCultivo.nombre}</Link><ChevronRight size={14} /></>}
          <span style={{ color: "var(--fg-2)", fontWeight: 500 }}>{r.nombre}</span>
        </div>

        <Link href={primerCultivo ? `/cultivos/${primerCultivo.id}` : "/cultivos"} style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--green-800)", fontSize: 14, fontWeight: 600, textDecoration: "none", marginBottom: 18 }}>
          <ArrowLeft size={16} /> Volver
        </Link>

        <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: 24 }}>
          <Photo seed={r.seed} height={260} caption={r.photo} />
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 34, color: "var(--fg-1)", margin: 0, letterSpacing: "-.01em" }}>{r.nombre}</h1>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
          {[
            { icon: <Clock size={15} color="var(--green-700)" />, label: r.tiempo },
            { icon: <Users size={15} color="var(--green-700)" />, label: `${r.porciones} porciones` },
            { icon: <ChefHat size={15} color="var(--green-700)" />, label: r.dificultad },
          ].map((m, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-pill)", padding: "7px 14px", fontSize: 13.5, fontWeight: 600, color: "var(--fg-1)" }}>{m.icon} {m.label}</span>
          ))}
        </div>

        <p style={{ fontSize: 16, color: "var(--fg-2)", lineHeight: 1.7, margin: "22px 0 0" }}>{r.descripcion}</p>

        {cultivos.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
            {cultivos.map((c) => c && (
              <Link key={c.id} href={`/cultivos/${c.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--green-050)", color: "var(--green-800)", border: "1px solid var(--green-100)", borderRadius: "var(--radius-pill)", padding: "5px 12px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                <Sprout size={13} color="var(--green-700)" /> {c.nombre}
              </Link>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.4fr)", gap: 32, marginTop: 40, alignItems: "start" }} className="receta-grid">
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}><ListChecks size={20} color="var(--green-800)" /><h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)", margin: 0 }}>Ingredientes</h2></div>
            <div className="card">
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 11 }}>
                {r.ingredientes.map((ing) => (
                  <li key={ing} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14.5, color: "var(--fg-1)", lineHeight: 1.45 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green-700)", flexShrink: 0, marginTop: 7 }} /> {ing}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}><ChefHat size={20} color="var(--green-800)" /><h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)", margin: 0 }}>Preparación</h2></div>
            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
              {r.pasos.map((p, i) => (
                <li key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--green-800)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 14.5, color: "var(--fg-1)", lineHeight: 1.6, paddingTop: 4 }}>{p}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      <style>{`@media (max-width: 720px) { .receta-grid { grid-template-columns: 1fr !important; } }`}</style>
    </>
  );
}
