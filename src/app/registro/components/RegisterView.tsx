"use client";

import { ArrowLeft, CalendarCheck, Heart, Ticket } from "lucide-react";
import RegistroForm from "./RegistroForm";
import type { FormData } from "@/types/registro";

interface RegisterViewProps {
  onSuccess: (data: FormData) => void;
  onBack: () => void;
}

const BENEFITS = [
  {
    icon: <CalendarCheck className="size-[17px] text-green-800" />,
    title: "Reservar experiencias",
    desc: "Asegurá tu lugar en vendimias y cosechas.",
  },
  {
    icon: <Heart className="size-[17px] text-green-800" />,
    title: "Guardar tus favoritos",
    desc: "Armá tu lista de fincas y actividades.",
  },
  {
    icon: <Ticket className="size-[17px] text-green-800" />,
    title: "Gestionar tus reservas",
    desc: "Seguí el estado de cada visita.",
  },
];

export default function RegisterView({ onSuccess, onBack }: RegisterViewProps) {
  return (
    <div
      data-screen-label="Registro de cuenta"
      className="mx-auto max-w-[1100px] px-7 pt-8 pb-[72px]"
    >
      <button
        type="button"
        onClick={onBack}
        className="mb-[22px] inline-flex cursor-pointer items-center gap-[7px] text-sm font-medium text-fg-2 hover:text-fg-1"
      >
        <ArrowLeft className="size-[17px]" /> Volver
      </button>

      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1fr)_420px]">
        {/* Form column */}
        <div>
          <h1 className="font-display text-[34px] font-bold tracking-[-.01em] text-fg-1">
            Creá tu cuenta
          </h1>
          <p className="mt-2.5 mb-7 max-w-[520px] text-[15.5px] text-fg-2">
            Completá tus datos para acceder a la plataforma y reservar
            experiencias en las fincas de Mendoza.
          </p>
          <div className="rounded-lg border border-outline-variant bg-surface px-8 py-[30px]">
            <RegistroForm onSuccess={onSuccess} />
          </div>
        </div>

        {/* Aside */}
        <aside className="sticky top-[92px]">
          {/* Decorative photo placeholder */}
          <div className="mb-[18px] flex h-[200px] items-end overflow-hidden rounded-lg bg-[linear-gradient(135deg,#1e5418_0%,#2d5a27_50%,#7fa876_100%)]">
            <div className="w-full bg-[linear-gradient(to_top,rgba(14,46,12,.7)_0%,transparent_100%)] px-5 py-4">
              <p className="text-[12.5px] text-white/85 italic">
                Cosecha de Malbec al amanecer — Valle de Uco, Mendoza
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-outline-variant bg-surface px-6 py-[22px]">
            <div className="mb-4 font-display text-[17px] font-semibold text-fg-1">
              Con tu cuenta vas a poder
            </div>
            <ul className="flex flex-col gap-3.5">
              {BENEFITS.map(({ icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-green-050">
                    {icon}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-fg-1">{title}</div>
                    <div className="mt-0.5 text-[12.5px] leading-snug text-fg-2">
                      {desc}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
