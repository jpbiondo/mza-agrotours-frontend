"use client";

import { useState } from "react";
import { ArrowLeftRight, CheckCircle2, Info, Landmark, Link2, RefreshCw } from "lucide-react";
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
 *
 * Con la cuenta habilitada se puede vincular otra por el mismo endpoint: si sale
 * bien, el backend da de baja la anterior; si se cancela, la anterior sigue.
 */
export function CobrosCard({ establecimientoId }: { establecimientoId: string }) {
  const { cuenta, isLoading, error, reload } = useCuentaMercadoPago(establecimientoId);
  const { vincular, isLoading: vinculando } = useVincularMercadoPago();
  const [errorVincular, setErrorVincular] = useState<string | null>(null);
  /** Con la cuenta habilitada, cambiarla pide una confirmación antes de ir a Mercado Pago. */
  const [cambiando, setCambiando] = useState(false);

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
          <Button variant="neutral" size="sm" className="mt-3" onClick={reload}>
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

              {!cambiando ? (
                <Button
                  variant="neutral"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setErrorVincular(null);
                    setCambiando(true);
                  }}
                >
                  <ArrowLeftRight className="size-3.75" /> Vincular otra cuenta
                </Button>
              ) : (
                <div className="mt-4 rounded-md border border-outline-variant bg-cream-tert px-4 py-3.5">
                  <div className="flex items-start gap-2.5 text-[13.5px] leading-normal text-pretty text-fg-2">
                    <Info className="mt-px size-3.75 shrink-0 text-info-fg" />
                    <div>
                      <p className="font-semibold text-fg-1">Vas a cambiar la cuenta donde cobrás</p>
                      <p className="mt-1">
                        Los pagos de las reservas nuevas se van a acreditar en la cuenta que autorices.
                        Las reservas ya pagadas se siguen gestionando con la cuenta anterior, incluidos
                        sus reembolsos. Mercado Pago usa la cuenta con la que tengas la sesión abierta: si es la actual,
                        cerrá sesión allá antes de seguir y entrá con la nueva.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3.5 flex flex-wrap gap-2 pl-6">
                    <Button size="sm" onClick={alVincular} loading={vinculando}>
                      <Link2 className="size-3.75" />
                      Continuar a Mercado Pago
                    </Button>
                    <Button
                      variant="neutral"
                      size="sm"
                      onClick={() => setCambiando(false)}
                      disabled={vinculando}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
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
              <Button className="mt-4" onClick={alVincular} loading={vinculando}>
                <Link2 className="size-4" />
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
