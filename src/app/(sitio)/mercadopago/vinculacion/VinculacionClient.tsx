"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { buttonClasses, Card } from "@/components/ui";
import { RAIZ_PANEL, rutaPanel } from "@/lib/rutasPanel";
import { cn } from "@/lib/utils";

export type ResultadoVinculacion = "ok" | "cancelada" | "error";

/** Tiempo que el aviso de éxito queda a la vista antes de volver al panel. */
const ESPERA_VUELTA_MS = 3000;

const CONTENIDO: Record<ResultadoVinculacion, {
  titulo: string;
  texto: string;
  Icono: typeof CheckCircle2;
  tono: string;
}> = {
  ok: {
    titulo: "Cuenta de Mercado Pago vinculada",
    texto: "Tu establecimiento ya puede recibir reservas. Te llevamos de vuelta a los datos del establecimiento.",
    Icono: CheckCircle2,
    tono: "text-success",
  },
  cancelada: {
    titulo: "No se vinculó la cuenta",
    texto: "Cancelaste la autorización en Mercado Pago. Hasta que vincules una cuenta, el establecimiento no recibe reservas.",
    Icono: XCircle,
    tono: "text-warning",
  },
  error: {
    titulo: "No pudimos vincular la cuenta",
    texto: "Algo falló al conectar con Mercado Pago o el enlace venció. Probá de nuevo desde los datos del establecimiento.",
    Icono: AlertTriangle,
    tono: "text-danger",
  },
};

/**
 * Resultado del OAuth de Mercado Pago. La pantalla de datos vuelve a pedir el
 * estado de cobro al montarse, así que basta con volver a ella.
 */
export default function VinculacionClient({
  resultado,
  establecimientoId,
}: {
  resultado: ResultadoVinculacion;
  establecimientoId: string;
}) {
  const router = useRouter();
  const destino = establecimientoId ? rutaPanel(establecimientoId, "datos") : RAIZ_PANEL;
  const { titulo, texto, Icono, tono } = CONTENIDO[resultado];

  // Sólo el éxito vuelve solo: ante un error o una cancelación conviene que el
  // productor lea qué pasó antes de irse.
  useEffect(() => {
    if (resultado !== "ok") return;
    const t = setTimeout(() => router.replace(destino), ESPERA_VUELTA_MS);
    return () => clearTimeout(t);
  }, [resultado, destino, router]);

  return (
    <div className="mx-auto max-w-[560px] px-4 pt-16 pb-24">
      <Card className="p-8 text-center">
        <Icono className={cn("mx-auto size-10", tono)} aria-hidden />
        <h1 role="status" className="mt-4 font-display text-[24px] font-bold text-fg-1">
          {titulo}
        </h1>
        <p className="mt-2 text-[15px] leading-normal text-pretty text-fg-2">{texto}</p>
        <Link href={destino} replace className={buttonClasses({ className: "mt-6" })}>
          Ir a los datos del establecimiento
        </Link>
      </Card>
    </div>
  );
}
