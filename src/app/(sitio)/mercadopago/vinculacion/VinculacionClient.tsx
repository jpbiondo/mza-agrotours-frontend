"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { buttonClasses, ResultScreen } from "@/components/ui";
import { RAIZ_PANEL, rutaPanel } from "@/lib/rutasPanel";

export type ResultadoVinculacion = "ok" | "cancelada" | "error";

/** Tiempo que el aviso de éxito queda a la vista antes de volver al panel. */
const ESPERA_VUELTA_MS = 3000;

const CONTENIDO: Record<ResultadoVinculacion, {
  titulo: string;
  texto: string;
  Icono: typeof CheckCircle2;
  tono: "success" | "warning" | "danger";
}> = {
  ok: {
    titulo: "Cuenta de Mercado Pago vinculada",
    texto: "Tu establecimiento ya puede recibir reservas. Te llevamos de vuelta a los datos del establecimiento.",
    Icono: CheckCircle2,
    tono: "success",
  },
  cancelada: {
    titulo: "No se vinculó la cuenta",
    // Puede venir de un primer vínculo o de un cambio de cuenta: en los dos
    // casos lo que había sigue igual.
    texto: "Cancelaste la autorización en Mercado Pago, así que la cuenta de cobro del establecimiento sigue como estaba.",
    Icono: XCircle,
    tono: "warning",
  },
  error: {
    titulo: "No pudimos vincular la cuenta",
    texto: "Algo falló al conectar con Mercado Pago o el enlace venció. La cuenta de cobro sigue como estaba: probá de nuevo desde los datos del establecimiento.",
    Icono: AlertTriangle,
    tono: "danger",
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

  // Se anuncia apenas aparece: si salió bien, la pantalla se va sola en 3 s.
  return (
    <div role="status">
    <ResultScreen
      tone={tono}
      icon={<Icono />}
      title={titulo}
      action={
        <Link href={destino} replace className={buttonClasses()}>
          Ir a los datos del establecimiento
        </Link>
      }
    >
      {texto}
    </ResultScreen>
    </div>
  );
}
