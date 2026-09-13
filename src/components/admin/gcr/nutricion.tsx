"use client";

import { Leaf, Plus, Trash2 } from "lucide-react";
import { GcrErr } from "@/components/admin/gcr/shared";
import { SimpleSelect } from "@/components/ui/simple-select";
import { TextField } from "@/components/ui/text-field";
import { cn } from "@/lib/utils";
import type { FilaNutricional, UnidadNutricional } from "@/types/gestionCr";

/** Porciones de referencia frecuentes, como accesos rápidos. */
const PORCIONES = ["100 g", "1 unidad", "1 taza (150 g)", "30 g"];

/** Nutrientes sugeridos: nombre, su unidad habitual y un valor de ejemplo. */
const NUTRIENTES: { nombre: string; unidad: UnidadNutricional; ejemplo: string }[] = [
  { nombre: "Energía", unidad: "kcal", ejemplo: "69" },
  { nombre: "Carbohidratos", unidad: "g", ejemplo: "18" },
  { nombre: "Azúcares", unidad: "g", ejemplo: "16" },
  { nombre: "Proteínas", unidad: "g", ejemplo: "0,7" },
  { nombre: "Grasas totales", unidad: "g", ejemplo: "0,2" },
  { nombre: "Fibra", unidad: "g", ejemplo: "0,9" },
  { nombre: "Sodio", unidad: "mg", ejemplo: "2" },
  { nombre: "Potasio", unidad: "mg", ejemplo: "191" },
  { nombre: "Vitamina C", unidad: "mg", ejemplo: "10,8" },
  { nombre: "Calcio", unidad: "mg", ejemplo: "10" },
  { nombre: "Hierro", unidad: "mg", ejemplo: "0,4" },
];

const UNIDADES: UnidadNutricional[] = ["kcal", "g", "mg", "mcg", "%"];

/** id del datalist; se declara una vez, abajo del editor. */
const SUGERENCIAS = "gcr-nutrientes";

/** Las tres columnas de la tabla más la de quitar, compartidas por encabezado y filas. */
const COLUMNAS = "grid grid-cols-[minmax(0,1fr)_110px_96px_38px] gap-2.5";

/**
 * Valor aceptado: un número —con coma o con punto— o una de las categorías que
 * el backend reconoce. Las categorías no se ofrecen en la interfaz, pero un
 * cultivo cargado con ellas tiene que poder editarse sin quedar trabado.
 */
const NUMERO = /^\d+([.,]\d+)?$/;
const CATEGORIAS = ["alto", "medio", "bajo"];

export interface ErroresNutricion {
  porcion?: string;
  /** Un mensaje por fila (o `null`), en el mismo orden que las filas. */
  filas: (string | null)[];
  /** Motivo que no es de ninguna fila en particular. */
  global?: string;
}

/** Fila en blanco, o precargada con un nutriente sugerido. */
export function filaNutricional(nombre = "", unidad: UnidadNutricional = "g"): FilaNutricional {
  return { nombre, valor: "", unidad };
}

/** Punto de partida del alta: la porción más común y los tres valores de siempre. */
export function nutricionInicial(): {
  porcionReferencia: string;
  informacionNutricional: FilaNutricional[];
} {
  return {
    porcionReferencia: "100 g",
    informacionNutricional: [
      filaNutricional("Energía", "kcal"),
      filaNutricional("Carbohidratos", "g"),
      filaNutricional("Proteínas", "g"),
    ],
  };
}

export function erroresNutricion(porcion: string, filas: FilaNutricional[]): ErroresNutricion {
  const errores: ErroresNutricion = { filas: [] };

  if (!porcion.trim()) errores.porcion = "Indicá la porción de referencia.";

  errores.filas = filas.map((f) => {
    const nombre = f.nombre.trim();
    const valor = f.valor.trim();
    if (!nombre && !valor) return "Completá el nutriente y su valor, o quitá la fila.";
    if (!nombre) return "Falta el nombre del nutriente.";
    if (!valor) return "Falta el valor.";
    if (!NUMERO.test(valor) && !CATEGORIAS.includes(valor.toLowerCase())) {
      return "Usá un número (18 o 0,7) o alto, medio o bajo.";
    }
    return null;
  });

  if (filas.length === 0) errores.global = "Cargá al menos un valor nutricional.";

  return errores;
}

/** `true` si hay algo que corregir: lo usa el formulario antes de guardar. */
export function hayErroresNutricion(e: ErroresNutricion): boolean {
  return !!e.porcion || !!e.global || e.filas.some(Boolean);
}

/**
 * Editor de la información nutricional de un cultivo: la porción sobre la que
 * se informan los valores y la tabla de nutrientes. Es lo que después ve el
 * visitante en la ficha pública del cultivo.
 *
 * Los errores los calcula `erroresNutricion` y los muestra recién cuando se
 * intentó guardar, igual que el resto del formulario.
 */
export function GcrNutricionEditor({
  porcion,
  filas,
  onPorcion,
  onFilas,
  attempted,
  errores,
}: {
  porcion: string;
  filas: FilaNutricional[];
  onPorcion: (v: string) => void;
  onFilas: (v: FilaNutricional[]) => void;
  attempted: boolean;
  errores: ErroresNutricion;
}) {
  const editarFila = (i: number, cambio: Partial<FilaNutricional>) =>
    onFilas(filas.map((f, idx) => (idx === i ? { ...f, ...cambio } : f)));

  const usados = filas.map((f) => f.nombre.trim().toLowerCase());
  const sugeridos = NUTRIENTES.filter((n) => !usados.includes(n.nombre.toLowerCase()));
  const errorDeFila = (i: number) => (attempted ? errores.filas[i] : null);

  return (
    <div className="shrink-0 overflow-hidden rounded-lg border border-outline-variant bg-surface">
      <div className="flex items-center gap-[11px] border-b border-outline-variant bg-cream-tert px-5 py-4">
        <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] border border-green-300 bg-green-050">
          <Leaf className="size-[17px] text-green-800" />
        </span>
        <div className="font-display text-[17.5px] font-bold text-fg-1">Información nutricional</div>
      </div>

      <div className="flex flex-col gap-[18px] p-5">
        <div>
          <div className="t-label mb-2">
            Porción de referencia <span className="text-danger">*</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {PORCIONES.map((p) => {
              const on = porcion === p;
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onPorcion(p)}
                  className={cn(
                    "cursor-pointer rounded-pill border px-[13px] py-[7px] text-[13.5px] font-semibold whitespace-nowrap transition-colors",
                    on
                      ? "border-green-800 bg-green-800 text-white shadow-[inset_0_-2px_0_rgba(0,0,0,.25)]"
                      : "border-outline-variant bg-surface text-fg-2 hover:bg-cream-tert",
                  )}
                >
                  {p}
                </button>
              );
            })}
            <div className="w-[172px]">
              <TextField
                // Con una porción de la lista elegida el campo queda vacío: es
                // para escribir *otra*, y mostrarla ahí duplicaría la elección.
                value={PORCIONES.includes(porcion) ? "" : porcion}
                onChange={onPorcion}
                maxLength={28}
                placeholder="Otra porción"
                aria-invalid={attempted && !!errores.porcion}
              />
            </div>
          </div>
          {attempted && errores.porcion && (
            <div className="mt-[7px]">
              <GcrErr msg={errores.porcion} />
            </div>
          )}
        </div>

        <div>
          <div className={cn(COLUMNAS, "mb-2")}>
            <span className="t-label">Nutriente</span>
            <span className="t-label">Valor</span>
            <span className="t-label">Unidad</span>
            <span />
          </div>

          <div className="flex flex-col gap-2">
            {filas.map((fila, i) => {
              const err = errorDeFila(i);
              const sugerido = NUTRIENTES.find(
                (n) => n.nombre.toLowerCase() === fila.nombre.trim().toLowerCase(),
              );
              return (
                <div key={i}>
                  <div className={cn(COLUMNAS, "items-center")}>
                    <TextField
                      value={fila.nombre}
                      onChange={(v) => editarFila(i, { nombre: v })}
                      maxLength={40}
                      list={SUGERENCIAS}
                      placeholder="Ej. Vitamina C"
                      aria-invalid={!!err}
                    />
                    <TextField
                      value={fila.valor}
                      onChange={(v) => editarFila(i, { valor: v })}
                      maxLength={8}
                      inputMode="decimal"
                      placeholder={sugerido?.ejemplo ?? "0"}
                      aria-invalid={!!err}
                    />
                    <SimpleSelect
                      value={fila.unidad}
                      onChange={(v) => editarFila(i, { unidad: v as UnidadNutricional })}
                      options={UNIDADES}
                    />
                    <button
                      type="button"
                      onClick={() => onFilas(filas.filter((_, idx) => idx !== i))}
                      aria-label={`Quitar ${fila.nombre.trim() || "nutriente"}`}
                      className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-outline-variant bg-surface hover:border-danger hover:bg-danger-fill"
                    >
                      <Trash2 className="size-4 text-danger" />
                    </button>
                  </div>
                  {err && (
                    <div className="mt-1.5">
                      <GcrErr msg={err} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <datalist id={SUGERENCIAS}>
            {NUTRIENTES.map((n) => (
              <option key={n.nombre} value={n.nombre} />
            ))}
          </datalist>

          {attempted && errores.global && (
            <div className="mt-2.5">
              <GcrErr msg={errores.global} />
            </div>
          )}

          <button
            type="button"
            onClick={() => onFilas([...filas, filaNutricional()])}
            className="mt-2.5 inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-brown-700 bg-surface px-3 py-2 text-[13.5px] font-semibold text-brown-700 hover:bg-cream-tert"
          >
            <Plus className="size-4" /> Agregar nutriente
          </button>
        </div>

        {sugeridos.length > 0 && (
          <div>
            <div className="t-label mb-2">Agregar rápido</div>
            <div className="flex flex-wrap gap-[7px]">
              {sugeridos.map((n) => (
                <button
                  key={n.nombre}
                  type="button"
                  onClick={() => onFilas([...filas, filaNutricional(n.nombre, n.unidad)])}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-pill border border-sand bg-cream-tert py-1.5 pr-3 pl-[9px] text-[12.5px] font-medium text-fg-1 hover:border-green-800 hover:bg-green-050"
                >
                  <Plus className="size-3.5 text-green-800" />
                  {n.nombre}
                  <span className="font-mono text-[11px] text-fg-3">{n.unidad}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
