import type { Metadata } from "next";
import VinculacionClient, { type ResultadoVinculacion } from "./VinculacionClient";

export const metadata: Metadata = {
  title: "Vinculación con Mercado Pago · Mendoza AgroTours",
  robots: { index: false },
};

const RESULTADOS: readonly ResultadoVinculacion[] = ["ok", "cancelada", "error"];

/** Un query param puede venir repetido: se toma el primero. */
const primero = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Adonde vuelve el OAuth de Mercado Pago. Mercado Pago redirige al callback del
 * backend, que procesa la vinculación y manda acá con
 * `?resultado=ok|cancelada|error&establecimientoId={uuid}`. El id puede faltar
 * si el `state` era inválido.
 */
export default async function VinculacionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = await searchParams;
  const r = primero(q.resultado);
  // Un resultado desconocido se trata como error: no se puede afirmar que se vinculó.
  const resultado = RESULTADOS.find((x) => x === r) ?? "error";
  return <VinculacionClient resultado={resultado} establecimientoId={primero(q.establecimientoId) ?? ""} />;
}
