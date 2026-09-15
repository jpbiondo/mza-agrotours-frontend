import { useCallback, useEffect, useState } from "react";

/** Pausa de tecleo, en ms, antes de que la búsqueda salga al backend. */
const ESPERA_MS = 350;

export interface BusquedaDiferida {
  /** Lo que se ve en el input, tal cual se tipea. */
  texto: string;
  setTexto: (v: string) => void;
  /** Lo que viaja al backend: se pone al día al parar de teclear. */
  busqueda: string;
  /** Adelanta el pedido sin esperar la pausa (Enter). */
  aplicarYa: () => void;
  limpiar: () => void;
}

/**
 * Búsqueda por texto con aplicación diferida. El input se mueve en cada tecla
 * pero el pedido sale recién tras `ms` sin teclear, así una palabra no dispara
 * un request por letra.
 *
 * `texto` y `busqueda` son dos estados a propósito: si fueran uno solo, cada
 * tecla cambiaría la consulta y el listado se recargaría entero.
 */
export function useBusquedaDiferida(ms: number = ESPERA_MS): BusquedaDiferida {
  const [texto, setTexto] = useState("");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    // Ya aplicado (p. ej. recién se apretó Enter): no hay nada que agendar, y
    // sin este corte el efecto se re-dispararía en cada render.
    if (texto.trim() === busqueda) return;
    const t = setTimeout(() => setBusqueda(texto.trim()), ms);
    return () => clearTimeout(t);
  }, [texto, busqueda, ms]);

  // Un pedido pendiente queda cancelado por el cleanup del efecto, así que
  // adelantarlo no duplica la llamada.
  const aplicarYa = useCallback(() => setBusqueda(texto.trim()), [texto]);

  const limpiar = useCallback(() => {
    setTexto("");
    setBusqueda("");
  }, []);

  return { texto, setTexto, busqueda, aplicarYa, limpiar };
}
