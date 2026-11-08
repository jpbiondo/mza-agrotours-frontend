"use client";

import { useState } from "react";
import { recortar } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

/**
 * Párrafo que se recorta a `max` caracteres (por palabra, con "…") y suma un
 * "Ver más" / "Ver menos" para desplegarlo entero. Si el texto entra, va sin
 * botón. El `className` es del `<p>`: tamaño, interlineado y color del texto.
 */
export function TextoExpandible({ texto, max = 220, className }: {
  texto: string;
  max?: number;
  className?: string;
}) {
  const [completo, setCompleto] = useState(false);
  const largo = texto.length > max;

  return (
    <>
      <p className={cn("wrap-break-word whitespace-pre-line text-fg-2", className)}>
        {largo && !completo ? recortar(texto, max) : texto}
      </p>
      {largo && (
        <Button
          variant="text"
          onClick={() => setCompleto((c) => !c)}
          aria-expanded={completo}
          className="mt-1.5 text-[13px]"
        >
          {completo ? "Ver menos" : "Ver más"}
        </Button>
      )}
    </>
  );
}
