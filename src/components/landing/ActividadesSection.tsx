"use client";

import { CalendarDays } from "lucide-react";
import ActividadCard, { ActividadCardSkeleton } from "@/components/catalog/ActividadCard";
import Destacados from "@/components/landing/Destacados";
import { useActividadesDestacadas } from "@/hooks/useCatalogoActividades";

export default function ActividadesSection() {
  const { data, isLoading, error, reload } = useActividadesDestacadas();
  const actividades = data ?? [];

  return (
    <section id="actividades" className="mx-auto max-w-[1160px] px-7 pt-20 pb-10">
      <Destacados
        etiqueta="EXPERIENCIAS DESTACADAS"
        titulo="Actividades para vivir el campo"
        bajada="Cosechas, degustaciones y talleres en las mejores fincas de Mendoza."
        href="/explorar"
        verTodas="Ver todas"
        cargando={isLoading}
        error={error}
        onRetry={reload}
        vacio={{
          icono: <CalendarDays />,
          titulo: "Todavía no hay experiencias destacadas",
          texto: "Pronto vas a encontrar acá las experiencias que ofrecen las fincas de Mendoza.",
        }}
        cantidad={actividades.length}
        esqueleto={<ActividadCardSkeleton />}
      >
        {actividades.map((a) => <ActividadCard key={a.id} act={a} />)}
      </Destacados>
    </section>
  );
}
