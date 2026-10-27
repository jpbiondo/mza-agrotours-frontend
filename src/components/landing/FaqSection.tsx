"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, HelpCircle, MessagesSquare } from "lucide-react";
import { AsyncView } from "@/components/AsyncView";
import { EmptyState, Skeleton, buttonClasses } from "@/components/ui";
import { FaqFila } from "@/components/faq/piezas";
import { useFaqGenerales } from "@/hooks/useFaq";

/** Cuántas preguntas muestra la landing; el resto está en /ayuda. */
const CANTIDAD = 6;

function FaqEsqueleto() {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando preguntas…" className="flex flex-col gap-3">
      {Array.from({ length: CANTIDAD }, (_, i) => <Skeleton key={i} className="h-[82px] rounded-lg" />)}
    </div>
  );
}

export default function FaqSection() {
  const query = useFaqGenerales(CANTIDAD);
  // De a una abierta: es un resumen, no una base para leer de corrido.
  const [abierta, setAbierta] = useState<string | null>(null);

  return (
    <section id="faq" className="mx-auto max-w-[820px] px-7 py-20">
      <div className="mb-9 text-center">
        <div className="mb-4 inline-flex size-12 items-center justify-center rounded-[12px] bg-green-050">
          <HelpCircle className="size-6 text-green-800" />
        </div>
        <h2 className="m-0 font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">Preguntas frecuentes</h2>
        <p className="mt-2.5 mb-0 text-base text-fg-2">Todo lo que necesitás saber antes de tu primera experiencia.</p>
      </div>

      <AsyncView
        query={query}
        skeleton={<FaqEsqueleto />}
        isEmpty={(d) => d.length === 0}
        empty={
          <EmptyState icon={<MessagesSquare />} title="Todavía no hay preguntas frecuentes">
            Pronto vas a encontrar acá las respuestas a las dudas más comunes.
          </EmptyState>
        }
      >
        {(faqs) => (
          <>
            <div className="flex flex-col gap-3">
              {faqs.map((f) => (
                <FaqFila
                  key={f.id}
                  item={f}
                  conCategoria={false}
                  open={abierta === f.id}
                  onToggle={() => setAbierta((a) => (a === f.id ? null : f.id))}
                />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href="/ayuda" className={buttonClasses({ variant: "neutral" })}>
                Ver todas las preguntas <ArrowRight size={16} />
              </Link>
            </div>
          </>
        )}
      </AsyncView>
    </section>
  );
}
