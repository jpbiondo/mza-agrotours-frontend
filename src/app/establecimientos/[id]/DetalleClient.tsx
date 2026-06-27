"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, ChevronRight as Crumb, Image as ImageIcon, Info, Sprout,
  CalendarDays, Phone, Mail, MapPin, Mountain, ArrowLeft, ArrowRight, Star, Building2,
  Globe, AtSign,
} from "lucide-react";
import Photo from "@/components/landing/Photo";
import { actividadesDeEst } from "@/data/establecimientos";
import { moneyAr } from "@/lib/format";
import type { Actividad, Establecimiento, ImagenEst } from "@/types/catalogo";

/* ---- Carrusel ---------------------------------------------------------- */
function Carrusel({ imagenes }: { imagenes: ImagenEst[] }) {
  const [i, setI] = useState(0);
  const n = imagenes.length;
  const go = (d: number) => setI((p) => (p + d + n) % n);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  return (
    <div style={{ position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--outline-variant)" }}>
      <Photo seed={imagenes[i].seed} height={420} radius={0} caption={imagenes[i].caption} />
      {n > 1 && (
        <>
          <button type="button" aria-label="Imagen anterior" onClick={() => go(-1)} style={navBtn("left")}><ChevronLeft size={20} /></button>
          <button type="button" aria-label="Imagen siguiente" onClick={() => go(1)} style={navBtn("right")}><ChevronRight size={20} /></button>
          <span style={{ position: "absolute", top: 14, right: 14, zIndex: 2, background: "rgba(20,33,18,.62)", color: "#fff", borderRadius: "var(--radius-pill)", padding: "4px 11px", fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-mono)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ImageIcon size={13} /> {i + 1} / {n}
          </span>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 36, display: "flex", justifyContent: "center", gap: 8, zIndex: 2 }}>
            {imagenes.map((_, idx) => (
              <button key={idx} type="button" aria-label={`Ir a la imagen ${idx + 1}`} onClick={() => setI(idx)} style={{ width: idx === i ? 26 : 9, height: 9, borderRadius: 999, border: "none", cursor: "pointer", background: idx === i ? "#fff" : "rgba(255,255,255,.55)", transition: "width .2s, background .2s" }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function navBtn(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute", top: "50%", transform: "translateY(-50%)", [side]: 14, zIndex: 2,
    width: 44, height: 44, borderRadius: "50%", cursor: "pointer",
    background: "rgba(251,249,248,.92)", border: "1px solid var(--outline-variant)", boxShadow: "0 2px 10px rgba(45,90,39,.18)",
    display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--fg-1)",
  };
}

/* ---- Fila de contacto -------------------------------------------------- */
function ContactRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const inner = (
    <>
      <span style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--green-050)", border: "1px solid var(--green-100)" }}>{icon}</span>
      <span style={{ minWidth: 0 }}>
        <span className="t-label" style={{ display: "block", marginBottom: 2 }}>{label}</span>
        <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: "var(--fg-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
      </span>
    </>
  );
  const base: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, padding: "10px 0", textDecoration: "none" };
  return href ? <a href={href} style={base}>{inner}</a> : <div style={base}>{inner}</div>;
}

/* ---- Card de actividad ofrecida ---------------------------------------- */
function ActividadCard({ act }: { act: Actividad }) {
  return (
    <Link href={`/explorar/${act.id}`} className="card-hover" style={{ display: "flex", flexDirection: "column", textDecoration: "none", background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      <div style={{ position: "relative" }}>
        <Photo seed={act.seed} height={150} radius={0} />
        <span style={{ position: "absolute", top: 12, right: 12, display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(251,249,248,.95)", borderRadius: "var(--radius-pill)", padding: "5px 11px", boxShadow: "0 2px 8px rgba(45,90,39,.16)" }}>
          <Star size={14} color="#C9A227" fill="#C9A227" />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13.5, fontWeight: 700, color: "var(--fg-1)" }}>{act.rating.toFixed(1)}</span>
        </span>
        <span style={{ position: "absolute", top: 12, left: 12, background: "var(--brown-700)", color: "#fff", borderRadius: "var(--radius-pill)", padding: "4px 11px", fontSize: 11.5, fontWeight: 600 }}>{act.tipo}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: 16, gap: 10 }}>
        <h4 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16.5, color: "var(--fg-1)", lineHeight: 1.3 }}>{act.nombre}</h4>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {act.cultivos.map((c) => (
            <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--green-050)", color: "var(--green-800)", borderRadius: "var(--radius-pill)", padding: "2px 9px", fontSize: 11.5, fontWeight: 600 }}>
              <Sprout size={10} color="var(--green-700)" /> {c}
            </span>
          ))}
        </div>
        <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--cream-tert)", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div className="t-label" style={{ marginBottom: 2 }}>Desde</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 17, fontWeight: 700, color: "var(--fg-1)" }}>{moneyAr(act.precioAdulto)}</span>
              <span style={{ fontSize: 12, color: "var(--fg-3)" }}>/ adulto</span>
            </div>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: "var(--green-800)", whiteSpace: "nowrap" }}>
            Ver detalle <ArrowRight size={15} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function Seccion({ icon, titulo, children }: { icon: React.ReactNode; titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
        {icon}
        <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 21, color: "var(--fg-1)" }}>{titulo}</h2>
      </div>
      {children}
    </section>
  );
}

/* ---- Página ------------------------------------------------------------ */
export default function DetalleClient({ est }: { est: Establecimiento }) {
  const actividades = actividadesDeEst(est);
  const c = est.contacto;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 28px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13, marginBottom: 14 }}>
        <Link href="/establecimientos" style={{ color: "var(--fg-3)", textDecoration: "none" }}>Establecimientos</Link>
        <Crumb size={14} />
        <span style={{ color: "var(--fg-2)", fontWeight: 500 }}>{est.nombre}</span>
      </div>

      <Link href="/establecimientos" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--green-800)", fontSize: 14, fontWeight: 600, textDecoration: "none", marginBottom: 18 }}>
        <ArrowLeft size={16} color="var(--green-800)" /> Volver al listado
      </Link>

      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 36, color: "var(--fg-1)", margin: 0, letterSpacing: "-.01em", lineHeight: 1.12 }}>{est.nombre}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginTop: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--fg-2)" }}><Building2 size={15} color="var(--fg-3)" /> {est.razonSocial}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--fg-2)" }}><MapPin size={15} color="var(--brown-700)" /> {est.ubicacion.localidad}, {est.ubicacion.provincia}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: 40, alignItems: "start" }} className="est-detail-grid">
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 38 }}>
          <div>
            <Carrusel imagenes={est.imagenes} />
            {est.imagenes.length > 1 && (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${est.imagenes.length}, 1fr)`, gap: 12, marginTop: 12 }}>
                {est.imagenes.map((im, idx) => <Photo key={idx} seed={im.seed} height={76} radius={10} />)}
              </div>
            )}
          </div>

          <Seccion icon={<Info size={19} color="var(--green-800)" />} titulo="Sobre el establecimiento">
            <p style={{ margin: 0, color: "var(--fg-1)", fontSize: 15.5, lineHeight: 1.65 }}>{est.descripcionLarga}</p>
          </Seccion>

          <Seccion icon={<Sprout size={19} color="var(--green-800)" />} titulo="Cultivos populares">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
              {est.cultivos.map((cult) => (
                <span key={cult} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "var(--green-050)", color: "var(--green-800)", border: "1px solid var(--green-100)", borderRadius: "var(--radius-pill)", padding: "8px 15px", fontSize: 14, fontWeight: 600 }}>
                  <Sprout size={15} color="var(--green-700)" /> {cult}
                </span>
              ))}
            </div>
          </Seccion>

          <Seccion icon={<CalendarDays size={19} color="var(--green-800)" />} titulo={`Actividades ofrecidas (${actividades.length})`}>
            {actividades.length === 0 ? (
              <div style={{ background: "var(--surface)", border: "1px dashed var(--sand)", borderRadius: "var(--radius-lg)", padding: "36px 24px", textAlign: "center", color: "var(--fg-2)", fontSize: 14.5 }}>
                Este establecimiento todavía no publicó actividades.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
                {actividades.map((act) => <ActividadCard key={act.id} act={act} />)}
              </div>
            )}
          </Seccion>
        </div>

        <aside>
          <div style={{ position: "sticky", top: 88, display: "flex", flexDirection: "column", gap: 18 }}>
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
                <Phone size={18} color="var(--green-800)" />
                <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--fg-1)" }}>Contacto</h3>
              </div>
              <ContactRow icon={<Mail size={17} color="var(--green-800)" />} label="Email" value={c.email} href={`mailto:${c.email}`} />
              <div style={{ height: 1, background: "var(--cream-tert)" }} />
              <ContactRow icon={<Phone size={17} color="var(--green-800)" />} label="Teléfono" value={c.telefono} href={`tel:${c.telefono.replace(/\s/g, "")}`} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                <a href="#" onClick={(e) => e.preventDefault()} style={socialChip}><Globe size={15} color="var(--green-700)" /> {c.web}</a>
                <a href="#" onClick={(e) => e.preventDefault()} style={socialChip}><AtSign size={15} color="var(--green-700)" /> {c.instagram}</a>
              </div>
            </div>

            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                <MapPin size={18} color="var(--green-800)" />
                <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--fg-1)" }}>Ubicación</h3>
              </div>
              <div style={{ fontSize: 14.5, color: "var(--fg-1)", lineHeight: 1.6 }}>
                <div style={{ fontWeight: 600 }}>{est.ubicacion.calle}</div>
                <div style={{ color: "var(--fg-2)" }}>{est.ubicacion.localidad}, {est.ubicacion.provincia}</div>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, padding: "5px 12px", background: "var(--cream-tert)", borderRadius: "var(--radius-pill)", fontSize: 12.5, fontWeight: 600, color: "var(--brown-800)" }}>
                <Mountain size={13} color="var(--brown-700)" /> {est.ubicacion.zona}
              </div>
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .card-hover { transition: box-shadow .16s, border-color .16s, transform .16s; }
        .card-hover:hover { box-shadow: var(--shadow-hover); border-color: var(--sand); transform: translateY(-2px); }
        @media (max-width: 940px) { .est-detail-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

const socialChip: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none",
  background: "var(--surface)", border: "1px solid var(--sand)", borderRadius: "var(--radius-pill)",
  padding: "7px 13px", fontSize: 13, fontWeight: 600, color: "var(--fg-1)",
};
