"use client";

import Link from "next/link";
import {
  ChevronRight as Crumb, Info, Sprout, CalendarDays, Phone, Mail, MapPin,
  ArrowLeft, Building2, SearchX,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import ActividadCard from "@/components/catalog/ActividadCard";
import Photo, { seedDeId } from "@/components/landing/Photo";
import { BackLink, EmptyState, Skeleton, buttonClasses } from "@/components/ui";
import { useEstablecimientoPublico } from "@/hooks/useCatalogoEstablecimientos";
import type { EstablecimientoPublico } from "@/types/catalogo";

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

/* ---- Actividades ofrecidas --------------------------------------------- */
/** La misma grilla que `/explorar`, para que las cards tengan el mismo ancho. */
const GRILLA_ACTIVIDADES = "grid gap-5 grid-cols-1 min-[681px]:grid-cols-2 min-[1041px]:grid-cols-3";

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

function DetalleSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Skeleton className="h-10 w-2/5" />
      <Skeleton className="h-[420px] w-full rounded-2xl" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  );
}

function NoEncontrado() {
  return (
    <div style={{ textAlign: "center", padding: "64px 32px", background: "var(--surface)", border: "1px dashed var(--sand)", borderRadius: "var(--radius-lg)" }}>
      <div style={{ width: 68, height: 68, borderRadius: "50%", background: "var(--cream-tert)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
        <SearchX size={30} color="var(--fg-3)" />
      </div>
      <h1 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "var(--fg-1)" }}>No encontramos ese establecimiento</h1>
      <p style={{ margin: "0 auto 22px", color: "var(--fg-2)", fontSize: 15.5, maxWidth: 420, lineHeight: 1.5 }}>
        Puede que haya dejado de estar publicado o que el enlace esté mal.
      </p>
      <Link href="/establecimientos" className={buttonClasses()}>
        <ArrowLeft size={16} /> Volver al listado
      </Link>
    </div>
  );
}

/* ---- Contenido --------------------------------------------------------- */
function Detalle({ est }: { est: EstablecimientoPublico }) {
  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 36, color: "var(--fg-1)", margin: 0, letterSpacing: "-.01em", lineHeight: 1.12 }}>{est.nombre}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginTop: 10 }}>
          {est.razonSocial && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--fg-2)" }}><Building2 size={15} color="var(--fg-3)" /> {est.razonSocial}</span>}
          {est.departamento && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--fg-2)" }}><MapPin size={15} color="var(--brown-700)" /> {est.departamento}, Mendoza</span>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: 40, alignItems: "start" }} className="est-detail-grid">
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 38 }}>
          {/* Acá el diseño tiene un carrusel, pero el establecimiento guarda una
              sola portada: queda como imagen única, sin flechas ni miniaturas.
              Sin portada cargada queda el degradado por seed. */}
          <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--outline-variant)" }}>
            <Photo
              seed={seedDeId(est.id)}
              height={420}
              radius={0}
              src={est.foto?.url}
              alt={est.foto ? `Portada de ${est.nombre}` : ""}
            />
          </div>

          <Seccion icon={<Info size={19} color="var(--green-800)" />} titulo="Sobre el establecimiento">
            {est.descripcion ? (
              <p style={{ margin: 0, color: "var(--fg-1)", fontSize: 15.5, lineHeight: 1.65 }}>{est.descripcion}</p>
            ) : (
              <EmptyState size="inline">Este establecimiento todavía no cargó su descripción.</EmptyState>
            )}
          </Seccion>

          <Seccion icon={<Sprout size={19} color="var(--green-800)" />} titulo="Cultivos populares">
            {est.cultivos.length === 0 ? (
              <EmptyState size="inline">Este establecimiento todavía no cargó sus cultivos.</EmptyState>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                {est.cultivos.map((cult) => (
                  <span key={cult} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "var(--green-050)", color: "var(--green-800)", border: "1px solid var(--green-100)", borderRadius: "var(--radius-pill)", padding: "8px 15px", fontSize: 14, fontWeight: 600 }}>
                    <Sprout size={15} color="var(--green-700)" /> {cult}
                  </span>
                ))}
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
              {!est.email && !est.telefono ? (
                <p style={{ margin: "8px 0 0", color: "var(--fg-2)", fontSize: 14 }}>Todavía no publicó datos de contacto.</p>
              ) : (
                <>
                  {est.email && <ContactRow icon={<Mail size={17} color="var(--green-800)" />} label="Email" value={est.email} href={`mailto:${est.email}`} />}
                  {est.email && est.telefono && <div style={{ height: 1, background: "var(--cream-tert)" }} />}
                  {est.telefono && <ContactRow icon={<Phone size={17} color="var(--green-800)" />} label="Teléfono" value={est.telefono} href={`tel:${est.telefono.replace(/\s/g, "")}`} />}
                </>
              )}
            </div>

            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                <MapPin size={18} color="var(--green-800)" />
                <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--fg-1)" }}>Ubicación</h3>
              </div>
              {!est.ubicacion && !est.departamento ? (
                <p style={{ margin: 0, color: "var(--fg-2)", fontSize: 14 }}>Todavía no publicó su ubicación.</p>
              ) : (
                <div style={{ fontSize: 14.5, color: "var(--fg-1)", lineHeight: 1.6 }}>
                  {est.ubicacion && <div style={{ fontWeight: 600 }}>{est.ubicacion}</div>}
                  {est.departamento && <div style={{ color: "var(--fg-2)" }}>{est.departamento}, Mendoza</div>}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Fuera de la grilla con el aside, a todo el ancho: así las cards miden
          lo mismo que en `/explorar`. */}
      <div className="mt-9.5">
        <Seccion icon={<CalendarDays size={19} color="var(--green-800)" />} titulo={`Actividades ofrecidas (${est.actividades.length})`}>
          {est.actividades.length === 0 ? (
            <EmptyState size="inline">Este establecimiento todavía no publicó actividades.</EmptyState>
          ) : (
            <div className={GRILLA_ACTIVIDADES}>
              {est.actividades.map((act) => <ActividadCard key={act.id} act={act} sinEstablecimiento />)}
            </div>
          )}
        </Seccion>
      </div>
    </>
  );
}

/* ---- Página ------------------------------------------------------------ */
export default function DetalleClient({ id }: { id: string }) {
  const { data, isLoading, error, reload } = useEstablecimientoPublico(id);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 28px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13, marginBottom: 14 }}>
        <Link href="/establecimientos" style={{ color: "var(--fg-3)", textDecoration: "none" }}>Establecimientos</Link>
        <Crumb size={14} />
        <span style={{ color: "var(--fg-2)", fontWeight: 500 }}>{data?.nombre ?? "Detalle"}</span>
      </div>

      <BackLink href="/establecimientos" className="mb-[18px]">Volver al listado</BackLink>

      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} skeleton={<DetalleSkeleton />}>
        {/* `data` en null es un id que no existe, no una falla de la lectura. */}
        {data ? <Detalle est={data} /> : <NoEncontrado />}
      </AsyncBoundary>

      <style>{`
        @media (max-width: 940px) { .est-detail-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
