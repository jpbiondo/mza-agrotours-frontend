"use client";

import { Building2 } from "lucide-react";
import EstablecimientoCard, { EstablecimientoCardSkeleton } from "@/components/catalog/EstablecimientoCard";
import Destacados from "@/components/landing/Destacados";
import { useEstablecimientosDestacados } from "@/hooks/useCatalogoEstablecimientos";

export default function EstablecimientosSection() {
  const { data, isLoading, error, reload } = useEstablecimientosDestacados();
  const establecimientos = data ?? [];

  return (
    <section className="border-y border-outline-variant bg-cream-tert">
      <div id="establecimientos" className="mx-auto max-w-[1160px] px-7 py-20">
        <Destacados
          etiqueta="FINCAS Y BODEGAS"
          titulo="Establecimientos que te esperan"
          bajada="Familias productoras de todos los valles mendocinos abren sus puertas."
          href="/establecimientos"
          verTodas="Ver todos"
          cargando={isLoading}
          error={error}
          onRetry={reload}
          vacio={{
            icono: <Building2 />,
            titulo: "Todavía no hay establecimientos destacados",
            texto: "Pronto vas a encontrar acá las fincas y bodegas que abren sus puertas.",
          }}
          cantidad={establecimientos.length}
          esqueleto={<EstablecimientoCardSkeleton />}
        >
          {establecimientos.map((e) => <EstablecimientoCard key={e.id} est={e} />)}
        </Destacados>
      </div>
    </section>
  );
}
