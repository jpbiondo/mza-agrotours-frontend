"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Share2, Check, X, MapPin, Users, ChevronLeft, ChevronRight, SearchX,
  ArrowRight, Sprout, ChevronDown, Navigation, Droplets, ExternalLink, Star,
  Sun, CloudSun, Cloud, Cloudy, CloudDrizzle, CloudRain, CloudLightning, CloudSnow, CloudFog,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import Photo, { seedDeId } from "@/components/landing/Photo";
import { Button, Skeleton, buttonClasses } from "@/components/ui";
import { useActividadPublica } from "@/hooks/useCatalogoActividades";
import { usePronosticoClima } from "@/hooks/useClima";
import ContactarEstablecimiento from "@/components/chat/ContactarEstablecimiento";
import MapaEmbed, { HAY_MAPA_EMBED, consultaMapa, urlComoLlegar } from "@/components/MapaEmbed";
import BookingWidget from "./BookingWidget";
import Resenias from "./Resenias";
import { fmtPuntaje } from "@/lib/format";
import type { ActividadPublica, FotoRef } from "@/types/catalogo";
import type { CondicionClima, DiaPronostico } from "@/types/clima";

/* ---- Botón compartir (copia link) -------------------------------------- */
function ShareButton() {
  const [copied, setCopied] = useState(false);
  async function onShare() {
    try { await navigator.clipboard.writeText(window.location.href); } catch { /* noop */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }
  return (
    <Button variant={copied ? "primary" : "neutral"} size="sm" onClick={onShare}>
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      {copied ? "Link copiado" : "Compartir"}
    </Button>
  );
}

/* ---- Carrusel del hero ------------------------------------------------- */
function HeroCarousel({ fotos, seed, titulo }: { fotos: FotoRef[]; seed: number; titulo: string }) {
  const [i, setI] = useState(0);

  // Sin fotos cargadas queda el degradado, sin flechas ni miniaturas.
  if (fotos.length === 0) return <Photo seed={seed} height={440} />;

  const go = (d: number) => setI((p) => (p + d + fotos.length) % fotos.length);
  return (
    <div>
      <div style={{ position: "relative" }}>
        <Photo seed={seed} height={440} src={fotos[i].url} alt={`${titulo} — foto ${i + 1}`} />
        {fotos.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Anterior" style={navBtn("left")}><ChevronLeft size={22} /></button>
            <button type="button" onClick={() => go(1)} aria-label="Siguiente" style={navBtn("right")}><ChevronRight size={22} /></button>
            <span style={{ position: "absolute", top: 14, right: 14, background: "rgba(14,46,12,.7)", color: "#fff", borderRadius: "var(--radius-pill)", padding: "4px 11px", fontSize: 12.5, fontWeight: 600 }}>
              {i + 1} / {fotos.length}
            </span>
          </>
        )}
      </div>
      {fotos.length > 1 && (
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          {fotos.map((f, idx) => (
            <button
              key={f.key || idx}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Ver foto ${idx + 1}`}
              style={{ flex: 1, border: idx === i ? "2px solid var(--green-800)" : "2px solid transparent", borderRadius: 10, overflow: "hidden", cursor: "pointer", padding: 0, lineHeight: 0 }}
            >
              <Photo seed={seed} height={56} radius={6} src={f.url} />
            </button>
          ))}
        </div>
      )}
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
function ActivityHeader({ a }: { a: ActividadPublica }) {
  const lugar = [a.establecimiento.nombre, a.establecimiento.departamento].filter(Boolean).join(" · ");
  return (
    <div>
      {a.cultivos.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {a.cultivos.map((c) => (
            <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--green-050)", color: "var(--green-800)", borderRadius: "var(--radius-pill)", padding: "4px 12px", fontSize: 12.5, fontWeight: 600 }}>
              <Sprout size={12} /> {c}
            </span>
          ))}
        </div>
      )}
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 34, color: "var(--fg-1)", margin: 0, letterSpacing: "-.015em", lineHeight: 1.12 }}>{a.nombre}</h1>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 20px", marginTop: 14, fontSize: 14.5, color: "var(--fg-2)" }}>
        {lugar && <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><MapPin size={16} color="var(--brown-700)" /> {lugar}</span>}
        {a.cuposMax > 0 && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Users size={16} color="var(--fg-3)" /> Hasta {a.cuposMax} {a.cuposMax === 1 ? "persona" : "personas"}
          </span>
        )}
        {a.resenias.promedio !== null && (
          <a href="#resenias" className="inline-flex items-center gap-1.5 text-fg-2 no-underline hover:underline">
            <Star size={16} className="fill-star text-star" aria-hidden />
            <span className="font-semibold text-fg-1">{fmtPuntaje(a.resenias.promedio)}</span>
            · {a.resenias.total} {a.resenias.total === 1 ? "reseña" : "reseñas"}
          </a>
        )}
      </div>
      {/* TODO backend: el detalle todavía no manda la duración. */}
    </div>
  );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ margin: "0 0 16px" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "var(--fg-1)", margin: 0 }}>{children}</h2>
      {sub && <p style={{ fontSize: 13.5, color: "var(--fg-2)", margin: "6px 0 0", lineHeight: 1.45 }}>{sub}</p>}
    </div>
  );
}

function Block({ id, children }: { id?: string; children: React.ReactNode }) {
  // `first:mt-0`: la primera sección ya queda separada del título por el gap de la grilla.
  // `scroll-mt`: al saltar con un ancla, que el header fijo no tape el título.
  return <section id={id} className="mt-10 scroll-mt-24 first:mt-0">{children}</section>;
}

/* ---- FAQ acordeón ------------------------------------------------------ */
function FaqRow({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px 18px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--fg-1)" }}>{q}</span>
        <ChevronDown size={19} color="var(--fg-3)" style={{ flexShrink: 0, transition: "transform .2s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && <div className="pop" style={{ padding: "0 18px 18px", fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6 }}>{a}</div>}
    </div>
  );
}

/* ---- Establecimiento --------------------------------------------------- */

/** "Ver detalle" lleva a la página del establecimiento; "Contactar" abre el chat. */
function AccionesEstablecimiento({ id, actividadId, actividadNombre }: {
  id: string;
  actividadId: string;
  actividadNombre: string;
}) {
  return (
    <div className="mt-3.5 flex flex-wrap gap-2">
      <Link href={`/establecimientos/${id}`} className={buttonClasses({ size: "sm" })}>
        Ver detalle <ArrowRight size={15} />
      </Link>
      <ContactarEstablecimiento actividadId={actividadId} establecimientoId={id} titulo={actividadNombre} size="sm" />
    </div>
  );
}

/* ---- Ubicación --------------------------------------------------------- */

/**
 * Mapa del establecimiento y, debajo, la dirección con "Cómo llegar".
 *
 * Esa barra va **debajo** del mapa y no flotando encima como en el diseño: ahí
 * el mapa era un dibujo y acá es un iframe que se arrastra, así que una tarjeta
 * encima le comería los clicks y taparía la atribución de Google.
 */
function MapaUbicacion({ a }: { a: ActividadPublica }) {
  const consulta = consultaMapa(a.direccion, a.establecimiento.departamento);
  const lugar = [a.establecimiento.nombre, a.establecimiento.departamento].filter(Boolean).join(" · ");
  return (
    <Block>
      <SectionTitle sub={lugar || undefined}>Ubicación</SectionTitle>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <MapaEmbed consulta={consulta} titulo={`Mapa de ${a.establecimiento.nombre || a.nombre}`} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "14px 18px", borderTop: HAY_MAPA_EMBED ? "1px solid var(--outline-variant)" : "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <MapPin size={18} color="var(--brown-700)" style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg-1)" }}>{a.direccion}</div>
              {a.establecimiento.departamento && (
                <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 1 }}>{a.establecimiento.departamento}, Mendoza</div>
              )}
            </div>
          </div>
          <a
            href={urlComoLlegar(consulta)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({ variant: "neutral", size: "sm", className: "shrink-0" })}
          >
            Cómo llegar <ExternalLink size={15} />
          </a>
        </div>
      </div>
    </Block>
  );
}

/* ---- Pronóstico del clima ---------------------------------------------- */

/**
 * Cómo se dibuja cada condición del backend. El texto es corto a propósito:
 * entra debajo del ícono en una columna angosta, y el número de lluvia de más
 * abajo es el que da la precisión.
 */
const CLIMA: Record<CondicionClima, { Icono: LucideIcon; texto: string; color: string }> = {
  CLEAR_SKY:        { Icono: Sun,           texto: "Despejado",     color: "var(--warning)" },
  FEW_CLOUDS:       { Icono: CloudSun,      texto: "Algo nublado",  color: "var(--warning)" },
  SCATTERED_CLOUDS: { Icono: Cloud,         texto: "Nubes aisladas", color: "var(--brown-500)" },
  BROKEN_CLOUDS:    { Icono: Cloudy,        texto: "Nublado",       color: "var(--brown-500)" },
  SHOWER_RAIN:      { Icono: CloudDrizzle,  texto: "Chaparrones",   color: "var(--info)" },
  RAIN:             { Icono: CloudRain,     texto: "Lluvia",        color: "var(--info)" },
  THUNDERSTORM:     { Icono: CloudLightning, texto: "Tormenta",     color: "var(--info)" },
  SNOW:             { Icono: CloudSnow,     texto: "Nieve",         color: "var(--info)" },
  MIST:             { Icono: CloudFog,      texto: "Niebla",        color: "var(--fg-3)" },
};

/** Un día con una condición que este front no conoce igual muestra sus grados. */
const SIN_CONDICION = { Icono: Cloud, texto: "Sin datos", color: "var(--fg-3)" };

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/**
 * "2026-09-22" → "Lun 22/09". Se parte el string en vez de dejar que `Date` lea
 * el ISO: una fecha sola la toma como UTC y al oeste de Greenwich caería un día
 * antes, con lo que el nombre del día tampoco sería el que corresponde.
 */
function etiquetaDia(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return `${DIAS_SEMANA[d.getDay()]} ${m[3]}/${m[2]}`;
}

/**
 * Una columna por día, siempre en una sola fila. En angosto cada día tiene un
 * ancho fijo (un 30% deja ver que hay más) y la fila se desplaza de costado;
 * desde `md` se reparten el ancho en partes iguales.
 */
const GRILLA_CLIMA =
  "grid grid-flow-col auto-cols-[max(96px,30%)] gap-2.5 overflow-x-auto snap-x snap-mandatory pb-1 md:auto-cols-[minmax(0,1fr)] md:overflow-visible md:pb-0";

function grados(t: number | null): string {
  return t === null ? "—" : `${Math.round(t)}°`;
}

function DiaClima({ d }: { d: DiaPronostico }) {
  const { Icono, texto, color } = d.condicion ? CLIMA[d.condicion] : SIN_CONDICION;
  const llueve = d.probabilidadLluvia >= 50;
  return (
    <div className="snap-start" style={{ padding: "16px 12px", textAlign: "center", background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: 12 }}>
      <div style={{ fontSize: 12, color: "var(--fg-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>
        {etiquetaDia(d.fecha)}
      </div>
      <div style={{ margin: "10px 0 8px", display: "flex", justifyContent: "center" }}>
        <Icono size={32} color={color} aria-hidden />
      </div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 6, fontFamily: "var(--font-mono)" }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: "var(--fg-1)" }}>{grados(d.temperaturaMax)}</span>
        <span style={{ fontSize: 12, color: "var(--fg-3)" }}>{grados(d.temperaturaMin)}</span>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--fg-2)", marginTop: 6 }}>{texto}</div>
      <div style={{ fontSize: 11, color: llueve ? "var(--info)" : "var(--fg-3)", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
        <Droplets size={11} aria-hidden /> {Math.round(d.probabilidadLluvia)}%
      </div>
    </div>
  );
}

/**
 * El pronóstico es un extra del detalle, no su contenido: si falla o el backend
 * no tiene ese departamento, la sección desaparece en vez de mostrar el panel
 * de error con "Reintentar" —por eso no usa `<AsyncBoundary>`—. Mientras carga
 * deja el esqueleto para que lo de abajo no salte cuando llegan los días.
 */
function Pronostico({ departamento }: { departamento: string }) {
  const { data, isLoading } = usePronosticoClima(departamento);

  if (isLoading) {
    return (
      <Block>
        <SectionTitle>Pronóstico del clima</SectionTitle>
        {/* Cinco columnas es lo que suele devolver el backend; el alto es el de una tarjeta. */}
        <div className={GRILLA_CLIMA}>
          {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-37 w-full snap-start rounded-xl" />)}
        </div>
      </Block>
    );
  }

  if (!data || data.dias.length === 0) return null;

  return (
    <Block>
      <SectionTitle sub={`Para que armes mejor la valija. Es el pronóstico de ${data.departamento}, Mendoza.`}>
        {/* Cuántos días trae depende de lo que haya cargado el scheduler: suelen ser 5 o 6. */}
        {data.dias.length === 1 ? "Pronóstico para hoy" : `Pronóstico próximos ${data.dias.length} días`}
      </SectionTitle>
      <div className={GRILLA_CLIMA}>
        {data.dias.map((d) => <DiaClima key={d.fecha} d={d} />)}
      </div>
    </Block>
  );
}

/* ---- Estados de la pantalla -------------------------------------------- */

function DetalleSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <Skeleton className="h-110 w-full rounded-lg" />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 620 }}>
        <Skeleton className="h-6 w-1/4 rounded-full" />
        <Skeleton className="h-9 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
      </div>
    </div>
  );
}

function NoEncontrada() {
  return (
    <div style={{ textAlign: "center", padding: "80px 32px", background: "var(--surface)", border: "1px dashed var(--sand)", borderRadius: "var(--radius-lg)" }}>
      <div style={{ width: 68, height: 68, borderRadius: "50%", background: "var(--cream-tert)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
        <SearchX size={30} color="var(--fg-3)" />
      </div>
      <h1 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "var(--fg-1)" }}>No encontramos esta actividad</h1>
      <p style={{ margin: "0 auto 22px", color: "var(--fg-2)", fontSize: 15.5, maxWidth: 440, lineHeight: 1.5 }}>
        Puede que ya no esté publicada o que el link esté mal. Mirá el resto de las experiencias disponibles.
      </p>
      <Link href="/explorar" className={buttonClasses()}>Explorar actividades</Link>
    </div>
  );
}

/* ---- Página de detalle ------------------------------------------------- */
export default function DetalleClient({ id }: { id: string }) {
  const { data, isLoading, error, reload } = useActividadPublica(id);

  return (
    // Abajo deja lugar para la barra fija de reserva, que en angosto tapa el final.
    <div className="mx-auto max-w-[1240px] px-4 pt-4 pb-28 sm:px-7 sm:pt-6 shell:pb-20">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13 }}>
          <Link href="/" style={{ color: "var(--fg-3)", textDecoration: "none" }}>Inicio</Link>
          <ChevronRight size={14} />
          <Link href="/explorar" style={{ color: "var(--fg-3)", textDecoration: "none" }}>Explorar actividades</Link>
          {data && (
            <>
              <ChevronRight size={14} />
              <span style={{ color: "var(--fg-2)", fontWeight: 500 }}>{data.nombre}</span>
            </>
          )}
        </div>
        {data && <ShareButton />}
      </div>

      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} skeleton={<DetalleSkeleton />}>
        {data === null ? <NoEncontrada /> : <Detalle a={data} />}
      </AsyncBoundary>
    </div>
  );
}

function Detalle({ a }: { a: ActividadPublica }) {
  // El backend manda la descripción como un texto solo; los saltos dobles son
  // los párrafos que escribió el productor.
  const parrafos = a.descripcion.split(/\n\s*\n/).filter((p) => p.trim() !== "");

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <HeroCarousel fotos={a.fotos} seed={seedDeId(a.id)} titulo={a.nombre} />
      </div>

      {/* En angosto el widget no ocupa lugar en la grilla: es la barra fija de
          abajo y su hoja. Desde `shell:` pasa a la columna derecha, arriba de
          todo y estático: se scrollea junto con el contenido. */}
      <div className="grid grid-cols-1 items-start gap-x-8 gap-y-10 [grid-template-areas:'header'_'contenido'] shell:grid-cols-[minmax(0,1fr)_minmax(340px,370px)] shell:grid-rows-[auto_1fr] shell:[grid-template-areas:'header_reserva'_'contenido_reserva'] min-[1100px]:grid-cols-[minmax(0,1fr)_400px] min-[1100px]:gap-x-14">
        <div className="min-w-0 [grid-area:header]">
          <ActivityHeader a={a} />
        </div>

        <BookingWidget a={a} className="self-start [grid-area:reserva]" />

        <div className="min-w-0 [grid-area:contenido]">
          {parrafos.length > 0 && (
            <Block>
              <SectionTitle>Sobre la experiencia</SectionTitle>
              {parrafos.map((p, i) => (
                <p key={i} style={{ fontSize: 15.5, color: "var(--fg-2)", lineHeight: 1.65, margin: i === 0 ? "0 0 14px" : "0 0 14px" }}>{p}</p>
              ))}
            </Block>
          )}

          {(a.incluye.length > 0 || a.noIncluye.length > 0) && (
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
          )}

          <Block>
            <SectionTitle>El establecimiento</SectionTitle>
            <div className="card" style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              {/* Sin portada cargada, el monograma. */}
              <div className="inline-flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-green-800 font-display text-xl font-bold text-white">
                {a.establecimiento.foto
                  // eslint-disable-next-line @next/next/no-img-element -- el host del object storage no está en `images.remotePatterns`, igual que en Photo.
                  ? <img src={a.establecimiento.foto.url} alt="" className="size-full object-cover" />
                  : iniciales(a.establecimiento.nombre)}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--fg-1)", margin: 0 }}>{a.establecimiento.nombre}</h3>
                {a.establecimiento.departamento && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--fg-2)", marginTop: 4 }}>
                    <MapPin size={14} color="var(--brown-700)" /> {a.establecimiento.departamento}, Mendoza
                  </div>
                )}
                {a.direccion && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--fg-2)", marginTop: 4 }}>
                    <Navigation size={14} color="var(--fg-3)" /> {a.direccion}
                  </div>
                )}
                {a.establecimiento.descripcion && (
                  <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.55, margin: "10px 0 0" }}>{a.establecimiento.descripcion}</p>
                )}
                {a.establecimiento.id && (
                  <AccionesEstablecimiento id={a.establecimiento.id} actividadId={a.id} actividadNombre={a.nombre} />
                )}
              </div>
            </div>
          </Block>

          {/* Sin dirección cargada no hay nada que buscar en el mapa. */}
          {a.direccion && <MapaUbicacion a={a} />}

          {a.establecimiento.departamento && (
            <Pronostico departamento={a.establecimiento.departamento} />
          )}

          <Block id="resenias">
            <SectionTitle>Reseñas de visitantes</SectionTitle>
            <Resenias a={a} />
          </Block>

          {a.preguntasFrecuentes.length > 0 && (
            <Block>
              <SectionTitle>Preguntas frecuentes</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {a.preguntasFrecuentes.map((f) => <FaqRow key={f.pregunta} q={f.pregunta} a={f.respuesta} />)}
              </div>
            </Block>
          )}
        </div>
      </div>
    </>
  );
}

/** Monograma del establecimiento: las iniciales de sus dos primeras palabras. */
function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "—";
}
