"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Share2, Check, X, MapPin, Users, ChevronLeft, ChevronRight, SearchX,
  Building2, Sprout, ChevronDown, Navigation, Droplets, ExternalLink,
  Sun, CloudSun, Cloud, Cloudy, CloudDrizzle, CloudRain, CloudLightning, CloudSnow, CloudFog,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import Photo, { seedDeId } from "@/components/landing/Photo";
import { Skeleton } from "@/components/ui";
import { useActividadPublica } from "@/hooks/useCatalogoActividades";
import { usePronosticoClima } from "@/hooks/useClima";
import { moneyAr } from "@/lib/format";
import type { ActividadPublica, FotoRef, TarifaActividad } from "@/types/catalogo";
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
    <button type="button" onClick={onShare} className={`btn btn-sm ${copied ? "btn-primary" : "btn-neutral"}`} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      {copied ? "Link copiado" : "Compartir"}
    </button>
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
      </div>
      {/* TODO backend: el detalle todavía no manda puntuación, reseñas ni duración. */}
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

function Block({ children }: { children: React.ReactNode }) {
  return <section style={{ marginTop: 40 }}>{children}</section>;
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

/* ---- Ubicación --------------------------------------------------------- */

/**
 * Clave de la Embed API de Google Maps. Viaja en la URL del iframe, así que
 * termina en el bundle del cliente: en la consola de Google tiene que estar
 * restringida por referrer al dominio del sitio, y limitada a la Embed API.
 */
const GOOGLE_MAPS_EMBED_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY ?? "";

/**
 * Qué se busca en el mapa. El detalle no manda coordenadas, sólo la dirección
 * que escribió el productor, así que se le agrega el departamento y la
 * provincia: "San Martín 1250" solo existe en media Argentina.
 */
function consultaMapa(a: ActividadPublica): string {
  return [a.direccion, a.establecimiento.departamento, "Mendoza, Argentina"].filter(Boolean).join(", ");
}

/** URL del embed en modo `place`, que resuelve la dirección como búsqueda de texto. */
function urlEmbed(consulta: string): string {
  const qs = new URLSearchParams({
    key: GOOGLE_MAPS_EMBED_KEY,
    q: consulta,
    language: "es",
    region: "AR",
  });
  return `https://www.google.com/maps/embed/v1/place?${qs.toString()}`;
}

/**
 * Mapa del establecimiento con la Embed API de Google. El modo `place` busca por
 * texto, no por coordenadas, así que una dirección mal cargada cae en el centro
 * del departamento en vez de marcar un lugar equivocado.
 *
 * Sin `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` el iframe no se dibuja —Google
 * devolvería su propio cartel de error— y queda sólo la barra de la dirección,
 * que con el botón "Cómo llegar" sigue sirviendo igual.
 *
 * Esa barra va **debajo** del mapa y no flotando encima como en el diseño: ahí
 * el mapa era un dibujo y acá es un iframe que se arrastra, así que una tarjeta
 * encima le comería los clicks y taparía la atribución de Google.
 */
function MapaUbicacion({ a }: { a: ActividadPublica }) {
  const consulta = consultaMapa(a);
  const lugar = [a.establecimiento.nombre, a.establecimiento.departamento].filter(Boolean).join(" · ");
  return (
    <Block>
      <SectionTitle sub={lugar || undefined}>Ubicación</SectionTitle>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {GOOGLE_MAPS_EMBED_KEY !== "" && (
          <iframe
            title={`Mapa de ${a.establecimiento.nombre || a.nombre}`}
            src={urlEmbed(consulta)}
            /* Está cerca del final de la página: no hace falta cargarlo hasta llegar. */
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            style={{ display: "block", width: "100%", height: 280, border: "none" }}
          />
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "14px 18px", borderTop: GOOGLE_MAPS_EMBED_KEY !== "" ? "1px solid var(--outline-variant)" : "none" }}>
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
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-neutral btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: 7, flexShrink: 0 }}
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

/** Una columna por día; el `<style>` del final la reacomoda en pantallas chicas. */
function grillaClima(columnas: number): React.CSSProperties {
  return { display: "grid", gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))`, gap: 10 };
}

function grados(t: number | null): string {
  return t === null ? "—" : `${Math.round(t)}°`;
}

function DiaClima({ d }: { d: DiaPronostico }) {
  const { Icono, texto, color } = d.condicion ? CLIMA[d.condicion] : SIN_CONDICION;
  const llueve = d.probabilidadLluvia >= 50;
  return (
    <div style={{ padding: "16px 12px", textAlign: "center", background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: 12 }}>
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
        <div style={grillaClima(5)} className="clima-grid">
          {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-37 w-full rounded-xl" />)}
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
      <div style={grillaClima(data.dias.length)} className="clima-grid">
        {data.dias.map((d) => <DiaClima key={d.fecha} d={d} />)}
      </div>
    </Block>
  );
}

/* ---- Widget de reserva ------------------------------------------------- */

/** El rango abierto por arriba se lee mejor como "18 años o más". */
function rangoEtario(t: TarifaActividad): string {
  return t.edadMaxima >= 120 ? `${t.edadMinima} años o más` : `${t.edadMinima} a ${t.edadMaxima} años`;
}

/**
 * Precio y tarifas, y de ahí a `/reservar`. La fecha y la cantidad de personas
 * se eligen allá, contra la disponibilidad real de `GET /actividades/{id}/reservar`.
 */
function BookingWidget({ a }: { a: ActividadPublica }) {
  return (
    <aside className="card" style={{ padding: 0, overflow: "hidden", position: "sticky", top: 88 }}>
      <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--outline-variant)" }}>
        <div className="t-label" style={{ marginBottom: 2 }}>Desde</div>
        {a.precioRegular === null ? (
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "var(--fg-3)" }}>A consultar</span>
        ) : (
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, color: "var(--fg-1)" }}>{moneyAr(a.precioRegular)}</span>
            <span style={{ fontSize: 13.5, color: "var(--fg-3)" }}>/ persona</span>
          </div>
        )}
      </div>

      <div style={{ padding: "18px 20px" }}>
        {a.tarifas.length > 0 && (
          <>
            <div className="t-label" style={{ marginBottom: 10 }}>Tarifas por edad</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {a.tarifas.map((t) => (
                <div key={t.id || t.nombre} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>{t.nombre}</div>
                    <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{rangoEtario(t)}</div>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 14.5, fontWeight: 600, color: t.precio === 0 ? "var(--fg-3)" : "var(--fg-1)", whiteSpace: "nowrap" }}>
                    {t.precio === 0 ? "Sin cargo" : moneyAr(t.precio)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {a.cuposMax > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--fg-2)", marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--outline-variant)" }}>
            <Users size={14} color="var(--green-700)" />
            Hasta {a.cuposMax} {a.cuposMax === 1 ? "persona" : "personas"} por fecha.
          </div>
        )}

        <Link href={`/explorar/${a.id}/reservar`} className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>
          Solicitar reserva
        </Link>
        <p style={{ fontSize: 12, color: "var(--fg-3)", textAlign: "center", margin: "10px 0 0", lineHeight: 1.5 }}>
          Elegís la fecha y cargás los visitantes en el paso siguiente.
        </p>
        {/* TODO backend: medios de pago y política de cancelación no vienen en el detalle. */}
      </div>
    </aside>
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
      <Link href="/explorar" className="btn btn-primary">Explorar actividades</Link>
    </div>
  );
}

/* ---- Página de detalle ------------------------------------------------- */
export default function DetalleClient({ id }: { id: string }) {
  const { data, isLoading, error, reload } = useActividadPublica(id);

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "24px 28px 80px" }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 56, alignItems: "start" }} className="detalle-grid">
        <div style={{ minWidth: 0 }}>
          <ActivityHeader a={a} />

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
              <div style={{ width: 56, height: 56, borderRadius: 12, background: "var(--green-800)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, flexShrink: 0 }}>
                {iniciales(a.establecimiento.nombre)}
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
                  <Link href={`/establecimientos/${a.establecimiento.id}`} className="btn btn-neutral btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 14 }}>
                    <Building2 size={15} /> Ver establecimiento
                  </Link>
                )}
              </div>
            </div>
          </Block>

          {/* Sin dirección cargada no hay nada que buscar en el mapa. */}
          {a.direccion && <MapaUbicacion a={a} />}

          {a.establecimiento.departamento && (
            <Pronostico departamento={a.establecimiento.departamento} />
          )}

          {a.preguntasFrecuentes.length > 0 && (
            <Block>
              <SectionTitle>Preguntas frecuentes</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {a.preguntasFrecuentes.map((f) => <FaqRow key={f.pregunta} q={f.pregunta} a={f.respuesta} />)}
              </div>
            </Block>
          )}
        </div>

        <BookingWidget a={a} />
      </div>

      <style>{`
        @media (max-width: 940px) {
          .detalle-grid { grid-template-columns: 1fr !important; }
          .incluye-grid { grid-template-columns: 1fr 1fr !important; }
        }
        /* Las columnas del clima son una por día: en angosto se apilan de a tres y de a dos. */
        @media (max-width: 720px) {
          .clima-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 460px) {
          .clima-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
      `}</style>
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
