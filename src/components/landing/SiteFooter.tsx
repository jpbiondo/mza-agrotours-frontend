import Link from "next/link";

/**
 * El logo con los colores invertidos para el verde oscuro del pie: el
 * `logo-pano.svg` de siempre se pierde sobre ese fondo. Es el mismo dibujo,
 * pintado con tokens del `@theme`.
 */
function LogoInverso() {
  return (
    <svg width="45" height="30" viewBox="0 0 96 64" fill="none" aria-hidden className="block">
      <circle cx="46" cy="18" r="8.5" className="fill-warning" />
      <path d="M2 42 L20 24 L38 42 Z" className="fill-green-300" />
      <path d="M58 6 L88 42 H28 Z" className="fill-cream-bg" />
      <g className="stroke-brown-200" strokeWidth={3} strokeLinecap="round">
        <path d="M10 47 Q48 42.5 86 47" />
        <path d="M5 53 Q48 48 91 53" />
        <path d="M2 59.5 Q48 54 94 59.5" />
      </g>
    </svg>
  );
}

/**
 * Íconos de redes. lucide v1 sacó los de marcas, así que van dibujados acá con
 * el mismo trazo que el resto (son los que tenía lucide antes de sacarlos).
 */
function IconoFacebook() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-[18px]" aria-hidden>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function IconoInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-[18px]" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

/** TODO: las cuentas todavía no existen. Con `href`, el ícono pasa a ser link. */
const REDES: { nombre: string; icono: React.ReactNode; href?: string }[] = [
  { nombre: "Facebook", icono: <IconoFacebook /> },
  { nombre: "Instagram", icono: <IconoInstagram /> },
];

type Enlace = { href: string; label: string; pdf?: boolean };

/**
 * Rutas y no anclas de la landing, aunque hoy el footer sólo esté ahí: así
 * sirve igual el día que se sume al resto del sitio.
 */
const COLS: { title: string; links: Enlace[] }[] = [
  {
    title: "Descubrí",
    links: [
      { href: "/explorar", label: "Actividades" },
      { href: "/establecimientos", label: "Establecimientos" },
      { href: "/cultivos", label: "Cultivos" },
      { href: "/recetas", label: "Recetas" },
    ],
  },
  {
    title: "Ayuda",
    links: [
      { href: "/ayuda", label: "Preguntas frecuentes" },
      { href: "/incidencias", label: "Reportar un problema" },
      { href: "/manuales/Manual%20del%20visitante.pdf", label: "Manual del visitante", pdf: true },
    ],
  },
  {
    title: "Productores",
    links: [
      { href: "/mis-solicitudes/nueva", label: "Sumá tu finca" },
      { href: "/panel", label: "Panel del productor" },
      { href: "/manuales/Manual%20del%20productor.pdf", label: "Manual del productor", pdf: true },
    ],
  },
];

const LINK = "text-sm text-fg-on-dark/80 no-underline transition-colors hover:text-white";

export default function SiteFooter() {
  return (
    <footer className="bg-green-900 text-fg-on-dark">
      <div className="mx-auto grid max-w-[1160px] grid-cols-2 gap-10 px-7 pt-14 pb-8 min-[721px]:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <div className="col-span-2 min-[721px]:col-span-1">
          <div className="mb-4 flex items-center gap-[11px]">
            <LogoInverso />
            <div className="leading-none">
              <div className="font-display text-lg font-bold text-white">Mendoza</div>
              <div className="mt-0.5 text-[10px] font-semibold tracking-[.12em] text-green-300 uppercase">AgroTours</div>
            </div>
          </div>
          <p className="m-0 max-w-[320px] text-sm leading-[1.6] text-fg-on-dark/70">
            Turismo rural participativo que conecta visitantes con los productores de Mendoza.
          </p>
          <div className="mt-5 flex gap-2.5">
            {REDES.map((r) => {
              const clase = "inline-flex size-[38px] items-center justify-center rounded-[10px] bg-white/8 text-white";
              return r.href ? (
                <a key={r.nombre} href={r.href} target="_blank" rel="noopener" aria-label={r.nombre} className={`${clase} transition-colors hover:bg-white/15`}>
                  {r.icono}
                </a>
              ) : (
                <span key={r.nombre} role="img" aria-label={r.nombre} className={clase}>{r.icono}</span>
              );
            })}
          </div>
        </div>

        {COLS.map((col) => (
          <div key={col.title}>
            <div className="mb-4 text-[12.5px] font-bold tracking-[.06em] text-green-300 uppercase">{col.title}</div>
            <ul className="m-0 flex list-none flex-col gap-[11px] p-0">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.pdf ? (
                    <a href={l.href} target="_blank" rel="noopener" className={LINK}>
                      {l.label} <span className="text-fg-on-dark/50">(PDF)</span>
                    </a>
                  ) : (
                    <Link href={l.href} className={LINK}>{l.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-7 py-5 text-[13px] text-fg-on-dark/60">
          <span>© {new Date().getFullYear()} Mendoza AgroTours. Todos los derechos reservados.</span>
          <Link href="/terminos" className="text-fg-on-dark/60 no-underline transition-colors hover:text-white">
            Términos y condiciones
          </Link>
        </div>
      </div>
    </footer>
  );
}
