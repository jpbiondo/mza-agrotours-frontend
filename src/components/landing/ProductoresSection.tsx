import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { buttonClasses } from "@/components/ui";

const PASOS = [
  {
    titulo: "Creá tu cuenta",
    texto: "Registrate con tu correo. Si ya tenés cuenta, alcanza con iniciar sesión.",
  },
  {
    titulo: "Solicitá el alta de tu finca",
    texto: "Cargá los datos del establecimiento y la documentación que lo respalda.",
  },
  {
    titulo: "Publicá tus actividades",
    texto: "Cuando aprobamos la solicitud, cargás tus experiencias desde tu panel y empezás a recibir reservas.",
  },
];

/**
 * La única sección de la landing que le habla al productor. Va en una franja
 * de otro color para que se lea como cambio de público. "Sumá tu finca" va
 * directo a la solicitud: sin sesión, `GuardSesion` pasa por el acceso y
 * vuelve ahí.
 */
export default function ProductoresSection() {
  return (
    <section id="productores" className="border-t border-brown-200 bg-brown-100">
      <div className="mx-auto grid max-w-[1160px] items-center gap-10 px-7 py-20 nav:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] nav:gap-16">
        <div>
          <div className="t-label mb-2.5 text-brown-700">PARA PRODUCTORES</div>
          <h2 className="m-0 font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">¿Tenés una finca?</h2>
          <p className="mt-2.5 mb-0 max-w-[460px] text-base leading-[1.55] text-fg-2">
            Sumala a Mendoza AgroTours y recibí a visitantes que quieren vivir el campo junto a quienes lo trabajan.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link href="/mis-solicitudes/nueva" className={buttonClasses({ size: "lg" })}>
              Sumá tu finca <ArrowRight size={18} />
            </Link>
            <a
              href="/manuales/Manual%20del%20productor.pdf"
              target="_blank"
              rel="noopener"
              className={buttonClasses({ variant: "text" })}
            >
              <FileText size={16} /> Manual del productor (PDF)
            </a>
          </div>
        </div>

        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {PASOS.map((p, i) => (
            <li key={p.titulo} className="flex gap-4 rounded-lg border border-brown-200 bg-surface p-5">
              <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-800 font-display text-base font-bold text-fg-on-dark">
                {i + 1}
              </span>
              <div>
                <h3 className="m-0 font-display text-lg font-semibold text-fg-1">{p.titulo}</h3>
                <p className="mt-1 mb-0 text-[14.5px] leading-normal text-fg-2">{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
