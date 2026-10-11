"use client";

import Link from "next/link";
import { CalendarCheck, CheckCircle2, Loader, Lock, Pencil, Ticket, Wallet } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui";

/**
 * Checkout Pro de Mercado Pago para una preferencia. Se va por redirección y no
 * con el Wallet brick porque la preferencia la crea el backend con el token del
 * establecimiento (split de marketplace): el brick tendría que leerla con la
 * public key de ese vendedor, y la de Agrotours recibe un 401. La redirección
 * corre en el dominio de Mercado Pago y no necesita ninguna key.
 *
 * TODO backend: que `POST /reserva/reservar` devuelva el `initPoint` de la
 * preferencia, así esta URL no se arma a mano en el front.
 */
function urlCheckout(preferenceId: string): string {
  return `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${encodeURIComponent(preferenceId)}`;
}

/**
 * Dónde está la reserva respecto de los cupos.
 * - `libre`: todavía no se confirmó; se puede editar todo.
 * - `conflicto`: al confirmar, el backend respondió que la fecha ya no tiene
 *   cupos suficientes (`Actividad.FULL`). Lleva la fecha que se quedó sin lugar,
 *   porque la selección se limpia para obligar a elegir otra.
 * - `retenida`: la reserva existe en "Pendiente" y los cupos están guardados
 *   hasta que se pague o venza.
 * - `pagada`: el pago se aprobó en el momento (pago manual, sin Mercado Pago).
 */
export type EstadoBloqueo =
  | { estado: "libre" }
  | { estado: "conflicto"; fecha: string }
  | { estado: "retenida"; codigo: string; preferenceId: string }
  | { estado: "pagada"; codigo: string };

/**
 * El pie de la tarjeta del total, que cambia según el estado del bloqueo: el
 * botón de confirmar, o los de pagar con Mercado Pago y liberar los cupos.
 */
export function BloqueoCupos({
  bloqueo, confirmando, cancelando, confirmable, fecha, visitantes,
  onConfirmar, onPagar, onCancelar,
}: {
  bloqueo: EstadoBloqueo;
  confirmando: boolean;
  cancelando: boolean;
  confirmable: boolean;
  fecha: string | null;
  visitantes: number;
  onConfirmar: () => void;
  /** Se llama al tocar "Pagar con Mercado Pago", cuando se abre el checkout en otra pestaña. */
  onPagar: () => void;
  onCancelar: () => void;
}) {
  if (bloqueo.estado === "retenida") {
    return (
      <div className="mt-4 flex flex-col gap-3">
        <div className="rounded-xl border border-green-300 bg-green-050 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <Lock size={17} className="shrink-0 text-green-800" aria-hidden />
            <span className="text-[13.5px] font-semibold text-fg-1">
              {visitantes} {visitantes === 1 ? "cupo reservado" : "cupos reservados"}
            </span>
          </div>
          {/* TODO backend: `POST /reserva/reservar` no devuelve `fechaHoraExpiracion`;
              con ella va acá la cuenta regresiva del diseño (y el aviso de los 2 minutos). */}
          <p className="mt-2 mb-0 text-[12.5px] leading-[1.45] text-fg-2">
            Guardamos tus lugares para el {fecha}. Completá el pago antes de que termine el tiempo.
          </p>
          <div className="mt-2 font-mono text-[11.5px] text-fg-3">{bloqueo.codigo} · pendiente de pago</div>
        </div>
        <a
          href={urlCheckout(bloqueo.preferenceId)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onPagar}
          className={buttonClasses({
            size: "lg",
            className: "w-full bg-info shadow-[inset_0_-2px_0_var(--info-fg)] hover:bg-info-fg active:bg-info-fg",
          })}
        >
          <Wallet size={20} aria-hidden /> Pagar con Mercado Pago
        </a>
        <Button variant="ghost" className="w-full" onClick={onCancelar} disabled={cancelando}>
          {cancelando && <Loader size={16} className="spin" aria-hidden />}
          Cancelar y liberar cupos
        </Button>
      </div>
    );
  }

  if (bloqueo.estado === "pagada") {
    return (
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-start gap-2.5 rounded-xl border border-success bg-success-fill px-4 py-3.5">
          <CheckCircle2 size={18} className="mt-px shrink-0 text-success" aria-hidden />
          <div className="text-[12.5px] leading-normal text-fg-2">
            <strong className="text-success-fg">¡Listo! Tu reserva quedó confirmada.</strong>
            <div className="mt-1 font-mono text-[11.5px] text-fg-3">{bloqueo.codigo} · pagada</div>
          </div>
        </div>
        <Link href="/mis-reservas" className={buttonClasses({ size: "lg", className: "w-full" })}>
          <Ticket size={20} aria-hidden /> Ir a Mis reservas
        </Link>
      </div>
    );
  }

  // El aviso de `conflicto` lo muestra la pantalla debajo del calendario.
  return (
    <>
      <Button size="lg" className="mt-4 w-full" disabled={!confirmable || confirmando} onClick={onConfirmar}>
        {confirmando ? (
          <><Loader size={18} className="spin" aria-hidden /> Reservando tus cupos…</>
        ) : (
          <><CalendarCheck size={20} aria-hidden /> Confirmar reserva</>
        )}
      </Button>
      <p className="mt-2.5 mb-0 text-center text-[11.5px] leading-[1.45] text-fg-3">
        Al confirmar, guardamos tus cupos por unos minutos para que completes el pago con Mercado Pago.
      </p>
    </>
  );
}

/** Aviso arriba de la columna principal mientras los cupos están retenidos. */
export function AvisoBloqueado({ onEditar, cancelando }: { onEditar: () => void; cancelando: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-outline-variant bg-cream-tert px-4 py-3">
      <Lock size={17} className="shrink-0 text-fg-2" aria-hidden />
      <div className="min-w-0 flex-[1_1_220px] text-[13px] leading-[1.45] text-fg-2">
        <strong className="text-fg-1">Fecha y visitantes bloqueados</strong> mientras tus cupos están reservados.
      </div>
      <Button variant="neutral" size="sm" className="shrink-0 whitespace-nowrap" onClick={onEditar} disabled={cancelando}>
        <Pencil size={15} aria-hidden /> Editar y liberar cupos
      </Button>
    </div>
  );
}
