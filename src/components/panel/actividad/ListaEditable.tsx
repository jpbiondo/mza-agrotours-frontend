"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { soloTexto, type ErroresActividad } from "@/lib/actividad-form";
import { cn } from "@/lib/utils";
import type { FaqItem } from "@/types/actividad-form";
import { BloqueHead, BotonAgregar, CAMPO, ErrorMsg } from "./campos";

const MIN = 5;
const MAX = 200;

/**
 * Lista de ítems de texto libre ("Qué incluye" / "Qué NO incluye"). Es opcional:
 * un renglón vacío no molesta, pero uno escrito a medias sí se marca.
 */
export function ListaEditable({
  title,
  hint,
  icon,
  tone,
  items,
  onChange,
  placeholder,
  addLabel,
  clave,
  errs,
  intentado,
  permitirNumeros,
}: {
  title: string;
  hint?: string;
  icon: React.ReactNode;
  tone: "green" | "danger";
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  addLabel: string;
  /** Prefijo de las claves de error: `inc` o `ninc`. */
  clave: string;
  errs: ErroresActividad;
  intentado: boolean;
  /**
   * Deja escribir dígitos. Al modificar hacen falta —«Desayuno para 2 personas»—
   * y filtrarlos borraría lo que el productor ya tenía cargado.
   */
  permitirNumeros?: boolean;
}) {
  const filtrar = permitirNumeros ? (s: string) => s : soloTexto;
  const [tocados, setTocados] = useState<Set<number>>(() => new Set());
  const ver = (i: number) => (intentado || tocados.has(i) ? errs[`${clave}_${i}`] : undefined);

  const quitar = (i: number) => {
    const next = items.filter((_, idx) => idx !== i);
    onChange(next.length ? next : [""]);
    // Los índices tocados se corren con la lista; sin esto, borrar el primero
    // dejaría el error del viejo índice 1 pegado en el nuevo.
    setTocados((t) => {
      const s = new Set<number>();
      t.forEach((k) => {
        if (k < i) s.add(k);
        else if (k > i) s.add(k - 1);
      });
      return s;
    });
  };

  return (
    <div className="mb-[26px]">
      <BloqueHead
        icon={icon}
        tone={tone}
        title={title}
        hint={hint ?? `Opcional · entre ${MIN} y ${MAX} caracteres por ítem`}
      />

      <div className="flex flex-col gap-2.5">
        {items.map((val, i) => {
          const err = ver(i);
          return (
            <div key={i}>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={val}
                  maxLength={MAX}
                  placeholder={placeholder}
                  aria-label={`${title}: ítem ${i + 1}`}
                  aria-invalid={!!err || undefined}
                  onChange={(e) => onChange(items.map((x, idx) => (idx === i ? filtrar(e.target.value).slice(0, MAX) : x)))}
                  onBlur={() => setTocados((t) => new Set(t).add(i))}
                  className={cn(CAMPO, "flex-1")}
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => quitar(i)}
                    title="Eliminar ítem"
                    aria-label={`Eliminar el ítem ${i + 1}`}
                    className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-outline-variant bg-surface text-danger-fg transition-colors hover:bg-cream-tert"
                  >
                    <Trash2 className="size-[17px]" />
                  </button>
                )}
              </div>
              <ErrorMsg>{err}</ErrorMsg>
            </div>
          );
        })}
      </div>

      <BotonAgregar onClick={() => onChange([...items, ""])}>{addLabel}</BotonAgregar>
    </div>
  );
}

/** Preguntas frecuentes. Pregunta y respuesta van juntas: una sin la otra se marca. */
export function FaqEditor({
  faqs,
  onChange,
  errs,
  intentado,
  icon,
  permitirNumeros,
}: {
  faqs: FaqItem[];
  onChange: (faqs: FaqItem[]) => void;
  errs: ErroresActividad;
  intentado: boolean;
  icon: React.ReactNode;
  /** Ver `ListaEditable`. */
  permitirNumeros?: boolean;
}) {
  const [tocados, setTocados] = useState<Set<string>>(() => new Set());
  const ver = (i: number, campo: "q" | "a") =>
    intentado || tocados.has(`${i}_${campo}`) ? errs[`faq_${i}_${campo}`] : undefined;

  const filtrar = permitirNumeros ? (s: string) => s : soloTexto;
  const editar = (i: number, campo: "q" | "a", v: string) =>
    onChange(faqs.map((f, idx) => (idx === i ? { ...f, [campo]: filtrar(v).slice(0, MAX) } : f)));

  const quitar = (i: number) => {
    const next = faqs.filter((_, idx) => idx !== i);
    onChange(next.length ? next : [{ q: "", a: "" }]);
  };

  return (
    <div className="mb-[26px]">
      <BloqueHead
        icon={icon}
        tone="info"
        title="Preguntas frecuentes (FAQ)"
        hint={`Opcional · entre ${MIN} y ${MAX} caracteres por campo`}
      />

      <div className="flex flex-col gap-3">
        {faqs.map((f, i) => {
          const errQ = ver(i, "q");
          const errA = ver(i, "a");
          return (
            <div key={i} className="rounded-md border border-outline-variant bg-cream-tert p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11.5px] font-bold tracking-[.05em] text-green-800 uppercase">
                  Pregunta {i + 1}
                </span>
                {faqs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => quitar(i)}
                    title="Eliminar pregunta"
                    aria-label={`Eliminar la pregunta ${i + 1}`}
                    className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-outline-variant bg-surface text-danger-fg transition-colors hover:bg-cream-bg"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>

              <div className="mb-2.5">
                <span className="mb-1.5 block text-xs font-medium text-fg-2">Pregunta</span>
                <input
                  type="text"
                  value={f.q}
                  maxLength={MAX}
                  placeholder="Ej. ¿Necesito llevar algo en particular?"
                  aria-label={`Pregunta ${i + 1}`}
                  aria-invalid={!!errQ || undefined}
                  onChange={(e) => editar(i, "q", e.target.value)}
                  onBlur={() => setTocados((t) => new Set(t).add(`${i}_q`))}
                  className={CAMPO}
                />
                <ErrorMsg>{errQ}</ErrorMsg>
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-medium text-fg-2">Respuesta</span>
                <textarea
                  value={f.a}
                  maxLength={MAX}
                  rows={2}
                  placeholder="Ej. Recomendamos calzado cómodo, gorro y protector solar."
                  aria-label={`Respuesta ${i + 1}`}
                  aria-invalid={!!errA || undefined}
                  onChange={(e) => editar(i, "a", e.target.value)}
                  onBlur={() => setTocados((t) => new Set(t).add(`${i}_a`))}
                  className={cn(CAMPO, "h-auto min-h-16 resize-y py-2.5 leading-normal")}
                />
                <ErrorMsg>{errA}</ErrorMsg>
              </div>
            </div>
          );
        })}
      </div>

      <BotonAgregar onClick={() => onChange([...faqs, { q: "", a: "" }])}>Agregar pregunta</BotonAgregar>
    </div>
  );
}
