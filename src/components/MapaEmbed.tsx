import { cn } from "@/lib/utils";

/**
 * Clave de la Embed API de Google Maps. Viaja en la URL del iframe, así que
 * termina en el bundle del cliente: en la consola de Google tiene que estar
 * restringida por referrer al dominio del sitio, y limitada a la Embed API.
 */
const GOOGLE_MAPS_EMBED_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY ?? "";

/** Si hay clave para dibujar el iframe. Sin ella sólo queda el link "Cómo llegar". */
export const HAY_MAPA_EMBED = GOOGLE_MAPS_EMBED_KEY !== "";

/**
 * Qué se busca en el mapa. El backend no manda coordenadas, sólo la dirección
 * que escribió el productor, así que se le agrega lo que se sepa de la zona y
 * la provincia: "San Martín 1250" solo existe en media Argentina.
 */
export function consultaMapa(direccion: string, departamento?: string): string {
  return [direccion, departamento, "Mendoza, Argentina"].filter(Boolean).join(", ");
}

/** Link a Google Maps en una pestaña nueva, para sacar el recorrido. */
export function urlComoLlegar(consulta: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}`;
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
 * Mapa de una dirección con la Embed API de Google. El modo `place` busca por
 * texto, no por coordenadas, así que una dirección mal cargada cae en el centro
 * de la zona en vez de marcar un lugar equivocado.
 *
 * Sin `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` no dibuja nada —Google devolvería su
 * propio cartel de error—: quien lo usa tiene que dejar la dirección escrita
 * aparte, que con el link "Cómo llegar" sigue sirviendo igual.
 *
 * El alto va por `className`. Nada flotando encima: es un iframe que se
 * arrastra, y una tarjeta le comería los clicks y taparía la atribución.
 */
export default function MapaEmbed({ consulta, titulo, className }: {
  consulta: string;
  /** Nombre accesible del iframe ("Mapa de Finca La Rosa"). */
  titulo: string;
  className?: string;
}) {
  if (!HAY_MAPA_EMBED) return null;
  return (
    <iframe
      title={titulo}
      src={urlEmbed(consulta)}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
      className={cn("block h-[280px] w-full border-0", className)}
    />
  );
}
