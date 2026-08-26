import { AlertCircle, Check } from "lucide-react";
import { PASOS } from "@/lib/actividad-form";
import { cn } from "@/lib/utils";

/**
 * Indicador de progreso del formulario. Los pasos son navegables en los dos
 * sentidos a propósito: el formulario no valida al avanzar, así que volver a
 * corregir algo del paso 1 no debería costar tres clics.
 */
export function Stepper({
  actual,
  conError,
  onIr,
}: {
  actual: number;
  /** Pasos que tienen algún campo en rojo. Se llena recién al intentar guardar. */
  conError: Set<number>;
  onIr: (n: number) => void;
}) {
  return (
    <ol
      aria-label="Progreso del formulario"
      className="flex items-center gap-1 overflow-x-auto rounded-t-lg border-b border-outline-variant bg-cream-tert px-6 py-[18px]"
    >
      {PASOS.map((p, i) => {
        const activo = p.n === actual;
        const hecho = p.n < actual;
        const falla = conError.has(p.n) && !activo;

        return (
          // Cada paso ocupa lo suyo y el conector se estira con lo que sobra;
          // el último no lleva conector, así que tampoco crece.
          <li key={p.n} className={cn("flex items-center", i < PASOS.length - 1 && "flex-1")}>
            <button
              type="button"
              onClick={() => onIr(p.n)}
              aria-current={activo ? "step" : undefined}
              className="flex shrink-0 cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1 text-left"
            >
              <span
                className={cn(
                  "inline-flex size-[34px] shrink-0 items-center justify-center rounded-full text-[15px] font-bold transition-colors",
                  falla
                    ? "bg-danger text-fg-on-dark"
                    : activo
                      ? "bg-green-800 text-fg-on-dark ring-4 ring-green-100"
                      : hecho
                        ? "bg-green-800 text-fg-on-dark"
                        : "border-[1.5px] border-sand bg-surface text-fg-3",
                )}
              >
                {falla ? (
                  <AlertCircle className="size-4" />
                ) : hecho ? (
                  <Check className="size-4" />
                ) : (
                  p.n
                )}
              </span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span
                  className={cn(
                    "text-[10.5px] font-bold tracking-[.06em] uppercase",
                    falla ? "text-danger-fg" : activo ? "text-green-800" : "text-fg-3",
                  )}
                >
                  Paso {p.n}
                </span>
                <span
                  className={cn(
                    "mt-0.5 text-[13.5px] whitespace-nowrap",
                    activo ? "font-bold text-fg-1" : hecho ? "font-semibold text-fg-1" : "font-semibold text-fg-3",
                  )}
                >
                  {p.label}
                </span>
              </span>
            </button>
            {i < PASOS.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "mx-0.5 h-0.5 min-w-4 flex-auto rounded-sm",
                  p.n < actual ? "bg-green-800" : "bg-outline-variant",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
