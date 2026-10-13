"use client";

import { useWatch, type FieldValues, type UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { cn } from "@/lib/utils";

/**
 * Lo que le falta a un formulario de react-hook-form para poder enviarse.
 *
 * RHF sólo informa errores de lo que ya se tocó, y `formState.isValid` arranca
 * en `false` hasta que valida por primera vez —el botón parpadearía al abrir—.
 * Así que se corre el mismo schema del resolver sobre los valores observados:
 * da el conteo completo desde el primer render.
 *
 * El conteo es por campo (primer tramo del path de cada issue), no por issue:
 * un campo con dos reglas rotas cuenta una vez. Sirve para schemas planos; el
 * alta de actividad, que es por pasos, cuenta por su cuenta.
 */
export function useCamposFaltantes<T extends FieldValues, S extends z.ZodType>(
  form: UseFormReturn<T>,
  schema: S,
): {
  faltan: number;
  /** Los valores ya parseados por el schema, o `null` mientras falte algo. */
  datos: z.output<S> | null;
  /** Marca en rojo todo lo que falta, aunque no se haya tocado, y enfoca el primero. */
  verQueFalta: () => void;
} {
  const valores = useWatch({ control: form.control });
  const res = schema.safeParse(valores);
  const faltan = res.success ? 0 : new Set(res.error.issues.map((i) => String(i.path[0] ?? ""))).size;

  return {
    faltan,
    datos: res.success ? res.data : null,
    verQueFalta: () => void form.trigger(undefined, { shouldFocus: true }),
  };
}

/**
 * Aviso que va debajo del botón deshabilitado de un formulario: cuántos campos
 * faltan y, si se pasa `onVerQueFalta`, un link para marcarlos. El link vale la
 * pena con más de un campo; con uno solo, el campo vacío ya está a la vista.
 */
export function FaltanCampos({
  faltan,
  para = "guardar",
  onVerQueFalta,
  className,
}: {
  faltan: number;
  /** Qué destraba completar los campos: "guardar", "seguir"… */
  para?: string;
  onVerQueFalta?: () => void;
  className?: string;
}) {
  if (faltan <= 0) return null;
  return (
    <span className={cn("flex items-center justify-end gap-1.5 text-xs font-medium text-fg-3", className)}>
      {faltan === 1 ? "Falta 1 campo" : `Faltan ${faltan} campos`} para {para}.
      {onVerQueFalta && (
        <button
          type="button"
          onClick={onVerQueFalta}
          className="cursor-pointer font-semibold text-green-800 underline underline-offset-2"
        >
          Ver qué falta
        </button>
      )}
    </span>
  );
}
