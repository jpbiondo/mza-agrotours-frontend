import Image from "next/image";
import { Sprout } from "lucide-react";
import HeroBuscador from "@/components/landing/HeroBuscador";
import fotoHero from "../../../public/landing/hero.jpg";

export default function Hero() {
  return (
    // El verde de fondo es lo que se ve mientras carga la foto.
    <section className="relative overflow-hidden bg-green-900">
      {/* Decorativa: el mensaje lo da el título, así que va sin alt. */}
      <Image
        src={fotoHero}
        alt=""
        fill
        priority
        placeholder="blur"
        sizes="100vw"
        className="object-cover object-[center_65%]"
      />
      {/* La foto es clara (cielo, arena): un velo parejo para el texto en
          celular, donde ocupa todo el ancho, y uno más fuerte a la izquierda,
          donde van el título y el buscador en escritorio. */}
      <div className="absolute inset-0 bg-green-900/45" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,46,12,.75)_0%,rgba(14,46,12,.45)_45%,rgba(14,46,12,0)_100%)]" />

      <div className="relative mx-auto flex min-h-[min(680px,calc(100vh_-_68px))] max-w-[1160px] flex-col justify-center px-7 py-18">
        <div className="max-w-[600px]">
          <div className="mb-[22px] inline-flex items-center gap-2 rounded-pill bg-white/16 px-3.5 py-[7px] text-[12.5px] font-semibold text-white backdrop-blur-[4px]">
            <Sprout size={15} /> Turismo rural participativo en Mendoza
          </div>

          <h1 className="m-0 font-display text-[clamp(2.2rem,5.5vw,3.5rem)] leading-[1.06] font-bold tracking-[-.015em] text-white">
            Viví la cosecha junto a los productores mendocinos
          </h1>

          <p className="mt-[22px] mb-[34px] max-w-[500px] text-lg leading-[1.55] text-white/92">
            Descubrí experiencias en fincas y bodegas, reservá tu lugar y participá de
            vendimias, podas y degustaciones. Una conexión directa con quienes trabajan la tierra.
          </p>
        </div>

        <HeroBuscador />
      </div>
    </section>
  );
}
