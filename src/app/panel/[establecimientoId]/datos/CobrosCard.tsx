"use client";

import { useState } from "react";
import { CheckCircle2, Landmark, Link2, Loader, RefreshCw } from "lucide-react";
import { Alert, Button, Skeleton } from "@/components/ui";
import { useCuentaMercadoPago, useVincularMercadoPago } from "@/hooks/useMercadoPago";
import { fmtFechaHora } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EstadoCobro } from "@/types/datos";
import { SectionCard } from "./SectionCard";

const ETIQUETA: Record<EstadoCobro, { texto: string; clase: string }> = {
  HABILITADO: { texto: "Recibe reservas", clase: "border-success bg-success-fill text-success-fg" },
  SIN_CUENTA: { texto: "No recibe reservas", clase: "border-warning bg-warning-fill text-warning-fg" },
  TOKEN_VENCIDO: { texto: "No recibe reservas", clase: "border-warning bg-warning-fill text-warning-fg" },
};

/**
 * Cuenta de Mercado Pago donde se cobran las reservas. Sin una cuenta
 * utilizable el establecimiento y sus actividades se siguen mostrando, pero no
 * admiten reservas nuevas. Se vincula con el OAuth de Mercado Pago, que al
 * terminar vuelve a `/mercadopago/vinculacion`.
 */
export function CobrosCard({ establecimientoId }: { establecimientoId: string }) {
  const { cuenta, isLoading, error, reload } = useCuentaMercadoPago(establecimientoId);
  const { vincular, isLoading: vinculando } = useVincularMercadoPago();
  const [errorVincular, setErrorVincular] = useState<string | null>(null);

  async function alVincular() {
    setErrorVincular(null);
    const res = await vincular(establecimientoId);
    if (!res.ok) {
      setErrorVincular(
        res.code === "accessDenied"
          ? "Sólo el productor titular del establecimiento puede vincular la cuenta de Mercado Pago."
          : "No pudimos iniciar la vinculación con Mercado Pago. Probá de nuevo en unos minutos.",
      );
    }
  }

  const etiqueta = cuenta ? ETIQUETA[cuenta.estadoCobro] : null;

  return (
    <SectionCard
      title="Cobros"
      icon={<Landmark className="size-4 text-green-800" />}
      isEditing={false}
      locked
      onEdit={() => {}}
      onCancel={() => {}}
      aside={
        etiqueta && (
          <span className={cn("inline-flex shrink-0 items-center rounded-pill border px-3 py-1.5 text-xs font-semibold", etiqueta.clase)}>
            {etiqueta.texto}
          </span>
        )
      }
    >
      {isLoading ? (
        <div className="pt-3" aria-busy>
          <span role="status" className="sr-only">Consultando la cuenta de Mercado Pago…</span>
          <Skeleton className="h-15.5 w-full rounded-md" />
          <Skeleton className="mt-4 h-10 w-70" />
        </div>
      ) : error || !cuenta ? (
        <div className="pt-3">
          <Alert>{error ?? "No pudimos consultar la cuenta de Mercado Pago."}</Alert>
          <Button variant="ghost" size="sm" className="mt-3 text-sm" onClick={reload}>
            <RefreshCw className="size-3.75" /> Reintentar
          </Button>
        </div>
      ) : (
        <div className="pt-3">
          {cuenta.estadoCobro === "HABILITADO" ? (
            <>
              <div className="flex items-start gap-2.5 text-[14.5px] text-fg-1">
                <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-success" />
                <span>
                  Cuenta de Mercado Pago vinculada. Los pagos de las reservas se acreditan ahí.
                </span>
              </div>
              {cuenta.fechaHoraVinculacion && (
                <p className="mt-2 pl-7 text-[13px] text-fg-3">
                  Vinculada el {fmtFechaHora(cuenta.fechaHoraVinculacion)}
                </p>
              )}
            </>
          ) : (
            <Alert tone="warning">
              {cuenta.estadoCobro === "SIN_CUENTA" ? (
                <>
                  Tu establecimiento no puede recibir reservas hasta que vincules una cuenta de
                  Mercado Pago. Mientras tanto, tus actividades se siguen mostrando a los visitantes.
                </>
              ) : (
                <>
                  Venció el acceso a tu cuenta de Mercado Pago y el establecimiento dejó de recibir
                  reservas. Volvé a vincularla para retomarlas.
                </>
              )}
            </Alert>
          )}

          {errorVincular && <Alert className="mt-3.5">{errorVincular}</Alert>}

          {cuenta.estadoCobro !== "HABILITADO" && (
            <>
              <Button className="mt-4" onClick={alVincular} disabled={vinculando}>
                {vinculando ? <Loader className="spin size-4" /> : <Link2 className="size-4" />}
                {cuenta.estadoCobro === "SIN_CUENTA"
                  ? "Vincular cuenta de Mercado Pago"
                  : "Volver a vincular Mercado Pago"}
              </Button>
              <p className="mt-2.5 text-[12.5px] text-fg-3">
                Te vamos a llevar a Mercado Pago para que autorices el acceso, y después volvés acá.
              </p>
            </>
          )}
        </div>
      )}
    </SectionCard>
  );
}
