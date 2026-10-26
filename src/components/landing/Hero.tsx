import { Sprout } from "lucide-react";
import HeroBuscador from "@/components/landing/HeroBuscador";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Fondo de viñedo */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#0a2209_0%,#154212_30%,#1e5418_55%,#2d5a27_75%,#4a7c3f_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_50%,rgba(167,201,139,.12)_0%,transparent_70%),radial-gradient(ellipse_40%_60%_at_20%_80%,rgba(200,127,42,.08)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,46,12,.60)_0%,rgba(14,46,12,.25)_55%,rgba(251,249,248,.05)_100%)]" />

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
