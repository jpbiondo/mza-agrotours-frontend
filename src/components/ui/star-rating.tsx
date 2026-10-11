"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  id?: string;
  name?: string;
  /** 0 = sin elegir. */
  value: number;
  onChange: (val: number) => void;
  onBlur?: () => void;
  ref?: React.Ref<HTMLInputElement>;
  /** Nombre accesible del grupo ("Calificación general"). */
  label: string;
  /** Lado de cada estrella, en px. */
  size?: number;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

const ESTRELLA = "M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z";

/**
 * Selector de 1 a 5 estrellas. Por debajo son radios nativos ocultos, así que
 * el teclado (flechas, Tab) y la semántica salen del navegador sin escribirlos.
 * Al pasar el mouse previsualiza; en error, sin valor, las estrellas van en rojo.
 *
 * Reenvía ref/onBlur/aria-* para <FormControl>: el `ref` va al radio elegido (o
 * al primero), que es el que tiene que recibir el foco cuando RHF marca el error.
 */
export function StarRating({
  id, name, value, onChange, onBlur, ref, label, size = 38, disabled, className,
  "aria-invalid": ariaInvalid, "aria-describedby": describedBy,
}: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const autoName = useId();
  const activo = hover || value;
  const enError = !!ariaInvalid && !value;

  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={label}
      aria-invalid={ariaInvalid}
      aria-describedby={describedBy}
      onMouseLeave={() => setHover(0)}
      className={cn("inline-flex items-center gap-1.5", className)}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <label
          key={i}
          onMouseEnter={() => !disabled && setHover(i)}
          className={cn(
            "cursor-pointer rounded p-px leading-none transition-transform duration-150 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
            hover === i && "scale-110",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <input
            ref={i === (value || 1) ? ref : undefined}
            type="radio"
            name={name ?? autoName}
            value={i}
            checked={value === i}
            disabled={disabled}
            onChange={() => onChange(i)}
            onBlur={onBlur}
            aria-label={`${i} ${i === 1 ? "estrella" : "estrellas"}`}
            className="sr-only"
          />
          <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden className="block overflow-visible">
            <path
              d={ESTRELLA}
              strokeWidth={1.1}
              strokeLinejoin="round"
              className={cn(
                "transition-[fill,stroke] duration-200",
                enError
                  ? "fill-danger stroke-danger"
                  : i <= activo ? "fill-star stroke-star" : "fill-sand stroke-sand",
              )}
            />
          </svg>
        </label>
      ))}
    </div>
  );
}
