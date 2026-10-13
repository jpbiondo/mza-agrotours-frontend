import { Wallet } from "lucide-react";
import { buttonClasses } from "@/components/ui";
import { urlCheckout } from "@/lib/mercadoPago";
import { cn } from "@/lib/utils";

/**
 * Abre el Checkout Pro en la misma pestaña: al terminar, Mercado Pago vuelve a
 * /mercadopago/pago y de ahí al detalle de la reserva.
 */
export default function PagarConMercadoPago({
  preferenceId,
  size,
  className,
  children = "Pagar con Mercado Pago",
}: {
  preferenceId: string;
  size?: "lg";
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={urlCheckout(preferenceId)}
      className={buttonClasses({
        size,
        className: cn("bg-info shadow-[inset_0_-2px_0_var(--info-fg)] hover:bg-info-fg active:bg-info-fg", className),
      })}
    >
      <Wallet size={size === "lg" ? 20 : 17} aria-hidden /> {children}
    </a>
  );
}
