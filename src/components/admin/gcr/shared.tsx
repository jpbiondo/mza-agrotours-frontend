"use client";

import { useEffect } from "react";
import { Search, SearchX, Trash2, X, Plus, Check, AlertCircle, ChevronRight, Gauge } from "lucide-react";
import { Alert, Button, Card, IconCircle, Modal, Toast } from "@/components/ui";
import { TextField } from "@/components/ui/text-field";
import { GCR_MESES, GCR_ESTACIONES, GCR_EST_ORDEN, gcrCultivoNombre, gcrCultivoColor } from "@/data/gestionCr";
import { cn } from "@/lib/utils";
import type { Dificultad, Estacion, GcrCultivo } from "@/types/gestionCr";

/* ---- Escape-to-close hook ---------------------------------------------- */
function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
}

/* ---- Flash toast ------------------------------------------------------- */
export function GcrFlash({ flash }: { flash: string | null }) {
  if (!flash) return null;
  return <Toast tone="success" title={flash} />;
}

/* ---- Confirmación de eliminación --------------------------------------- */
export function GcrConfirmDelete({
  open,
  title,
  body,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: React.ReactNode;
  busy?: boolean;
  /** Rechazo del backend: el diálogo queda abierto con el aviso. */
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <Modal onClose={onCancel} dismissable={!busy}>
      <div className="flex items-center gap-3.5">
        <IconCircle tone="danger">
          <Trash2 className="size-[22px] text-danger" />
        </IconCircle>
        <h3 className="font-display text-xl font-bold text-fg-1">{title}</h3>
      </div>
      <p className="mt-4 text-[15px] leading-relaxed text-fg-2">{body}</p>
      {error && <Alert className="mt-4">{error}</Alert>}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="neutral" onClick={onCancel} disabled={busy}>
          No, volver
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>
          <Trash2 className="size-[17px]" /> Sí, eliminar
        </Button>
      </div>
    </Modal>
  );
}

/* ---- Modal shell de formulario -----------------------------------------
   No usa <Modal>: ese primitivo es un diálogo centrado de ancho fijo, y acá
   hace falta un panel ancho, anclado arriba y con scroll propio, porque el
   formulario crece con la cantidad de beneficios o pasos. */
export function GcrFormShell({ onCancel, children }: { onCancel: () => void; children: React.ReactNode }) {
  useEscape(onCancel);
  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      className="fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto bg-[rgba(42,38,32,.45)] px-5 py-10 backdrop-blur-[2px]"
    >
      <div className="pop m-auto flex max-h-[calc(100vh-80px)] w-[680px] max-w-full flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface shadow-pop">
        {children}
      </div>
    </div>
  );
}

export function GcrFormHeader({
  eyebrow,
  title,
  sub,
  onCancel,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-4 border-b border-outline-variant px-[26px] py-[22px]">
      <div className="min-w-0">
        <div className="t-label mb-1.5">{eyebrow}</div>
        <h2 className="font-display text-2xl font-bold text-fg-1">{title}</h2>
        {sub && <p className="mt-1.5 max-w-[480px] text-sm leading-relaxed text-fg-2">{sub}</p>}
      </div>
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cerrar"
        className="flex size-[42px] shrink-0 cursor-pointer items-center justify-center rounded-md border border-outline-variant bg-surface"
      >
        <X className="size-5 text-fg-2" />
      </button>
    </div>
  );
}

export function GcrFormFooter({
  onCancel,
  onSave,
  saveLabel,
  saveIcon,
  busy,
  error,
}: {
  onCancel: () => void;
  onSave: () => void;
  saveLabel: string;
  saveIcon?: React.ReactNode;
  busy?: boolean;
  /** Rechazo del backend: el panel queda abierto con lo cargado. */
  error?: string | null;
}) {
  return (
    <div className="shrink-0 border-t border-outline-variant bg-cream-tert px-[26px] py-4">
      {error && <Alert className="mb-3">{error}</Alert>}
      <div className="flex items-center justify-end gap-3">
        <Button variant="neutral" onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
        <Button onClick={onSave} disabled={busy}>
          {saveIcon ?? <Check className="size-[17px]" />} {saveLabel}
        </Button>
      </div>
    </div>
  );
}

export function GcrFieldLabel({
  children,
  required,
  style,
}: {
  children: React.ReactNode;
  required?: boolean;
  /** Se conserva porque la pantalla de recetas todavía la usa. */
  style?: React.CSSProperties;
}) {
  return (
    <label style={style} className="mb-2 block font-display text-[15.5px] font-semibold text-fg-1">
      {children}
      {required && <span className="ml-[3px] text-danger">*</span>}
    </label>
  );
}

export function GcrErr({ msg }: { msg: string }) {
  return (
    <div className="err-msg">
      <AlertCircle className="size-[15px] text-danger" /> {msg}
    </div>
  );
}

/* ---- Barra de estacionalidad (lectura) --------------------------------- */
export function GcrSeasonBar({ calendario }: { calendario: Estacion[] }) {
  return (
    <div className="flex gap-0.5" title="Calendario de cosecha">
      {calendario.map((s, i) => {
        // Fallback: un estado fuera del enum no puede tumbar la fila entera.
        const est = GCR_ESTACIONES[s] ?? GCR_ESTACIONES.r;
        return (
          <span
            key={i}
            title={`${GCR_MESES[i] ?? ""}: ${est.nombre}`}
            className={cn("size-[19px] rounded", s === "r" && "opacity-[.42]")}
            style={{ background: est.swatch }}
          />
        );
      })}
    </div>
  );
}

/* ---- Editor de estacionalidad ------------------------------------------ */
export function GcrSeasonEditor({ value, onChange }: { value: Estacion[]; onChange: (v: Estacion[]) => void }) {
  const cycle = (s: Estacion): Estacion => {
    // `indexOf` da -1 con un valor fuera del orden; sin el max, el ciclo arranca
    // en el último estado en vez del primero.
    const i = Math.max(0, GCR_EST_ORDEN.indexOf(s));
    return GCR_EST_ORDEN[(i + 1) % GCR_EST_ORDEN.length];
  };

  return (
    <div>
      <div className="grid grid-cols-6 gap-2">
        {value.map((s, i) => {
          const est = GCR_ESTACIONES[s] ?? GCR_ESTACIONES.r;
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                const next = [...value];
                next[i] = cycle(s);
                onChange(next);
              }}
              style={{ borderColor: est.bd, background: est.bg, color: est.fg }}
              className="flex cursor-pointer flex-col items-center gap-1.5 rounded-md border px-1.5 py-[9px]"
            >
              <span className="text-[11.5px] font-bold tracking-[.04em] uppercase">
                {GCR_MESES[i] ?? ""}
              </span>
              <span className="flex items-center gap-[5px]">
                <span className="size-[9px] rounded-full" style={{ background: est.swatch }} />
                <span className="text-[11px] font-medium">{est.nombre}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-4">
        {GCR_EST_ORDEN.map((k) => {
          const e = GCR_ESTACIONES[k];
          return (
            <span key={k} className="inline-flex items-center gap-1.5 text-xs text-fg-2">
              <span className="size-[11px] rounded-sm" style={{ background: e.swatch }} />
              {e.nombre}
            </span>
          );
        })}
        <span className="ml-auto text-[11.5px] text-fg-3">Tocá cada mes para cambiar su estado.</span>
      </div>
    </div>
  );
}

/* ---- Editor de lista (beneficios / ingredientes / pasos) --------------- */
export function GcrListEditor({
  items,
  onChange,
  placeholder,
  numbered,
  addLabel,
  maxLength,
}: {
  items: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  numbered?: boolean;
  addLabel: string;
  maxLength?: number;
}) {
  const update = (i: number, v: string) => {
    const next = [...items];
    next[i] = v;
    onChange(next);
  };

  return (
    <div>
      <div className="flex flex-col gap-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span
              className={cn(
                "mt-[5px] flex size-[26px] shrink-0 items-center justify-center border border-green-300 bg-green-050 text-xs font-bold text-green-800",
                numbered ? "rounded-md font-mono" : "rounded-full",
              )}
            >
              {numbered ? i + 1 : <Check className="size-3.5" />}
            </span>
            <div className="min-w-0 flex-1">
              <TextField
                value={it}
                placeholder={placeholder}
                maxLength={maxLength}
                onChange={(v) => update(i, v)}
              />
              {maxLength && it.length >= Math.floor(maxLength * 0.8) && (
                <div
                  className={cn(
                    "mt-1 text-right font-mono text-[11px]",
                    it.length >= maxLength ? "text-danger" : "text-fg-3",
                  )}
                >
                  {it.length}/{maxLength}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              aria-label="Quitar"
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-outline-variant bg-surface"
            >
              <Trash2 className="size-4 text-danger" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="mt-2.5 inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-brown-700 bg-surface px-3 py-2 text-[13.5px] font-semibold text-brown-700"
      >
        <Plus className="size-4" />
        {addLabel}
      </button>
    </div>
  );
}

/* ---- Multiselección de cultivos (chips) -------------------------------- */
export function GcrCultivoMultiSelect({
  cultivos,
  selected,
  onChange,
}: {
  cultivos: GcrCultivo[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className="flex flex-wrap gap-2">
      {cultivos
        .filter((c) => c.estado === "activo")
        .map((c) => {
          const on = selected.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => toggle(c.id)}
              className={cn(
                "inline-flex cursor-pointer items-center gap-2.5 rounded-pill border py-[7px] pr-[13px] pl-2 text-[13.5px]",
                on
                  ? "border-green-800 bg-green-050 font-semibold text-green-800 shadow-[inset_0_-2px_0_var(--green-100)]"
                  : "border-outline-variant bg-surface font-medium text-fg-2",
              )}
            >
              <span className="size-5 shrink-0 rounded-full" style={{ background: c.color }} />
              {c.nombre}
              {on && <Check className="size-[15px]" />}
            </button>
          );
        })}
    </div>
  );
}

/* ---- Chip de cultivo (lectura) ----------------------------------------- */
export function GcrCultivoChip({ id, cultivos }: { id: string; cultivos: GcrCultivo[] }) {
  return (
    <span className="inline-flex items-center gap-[7px] rounded-pill border border-sand bg-cream-tert py-[3px] pr-2.5 pl-1 text-[12.5px] font-medium whitespace-nowrap text-fg-1">
      <span
        className="size-4 shrink-0 rounded-full"
        style={{ background: gcrCultivoColor(id, cultivos) }}
      />
      {gcrCultivoNombre(id, cultivos)}
    </span>
  );
}

/* ---- Pill de dificultad ------------------------------------------------ */
const DIFICULTAD_TONO: Record<string, string> = {
  "Fácil": "border-green-300 bg-green-050 text-green-800",
  "Media": "border-[#E6CA72] bg-[#FBF3D6] text-[#8A6D12]",
  "Difícil": "border-danger bg-danger-fill text-danger-fg",
};

export function GcrDifficultyPill({ dificultad }: { dificultad: Dificultad }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[12.5px] font-semibold whitespace-nowrap",
        DIFICULTAD_TONO[dificultad] ?? DIFICULTAD_TONO["Media"],
      )}
    >
      <Gauge className="size-[13px]" />
      {dificultad}
    </span>
  );
}

/* ---- Tarjetas de estadística ------------------------------------------- */
export function GcrStats({ items }: { items: { icon: React.ReactNode; label: string; value: React.ReactNode }[] }) {
  return (
    <div className="mb-5 flex flex-wrap gap-3.5">
      {items.map((s) => (
        <Card key={s.label} className="flex min-w-[190px] items-center gap-3 px-4 py-3">
          <span className="flex size-[42px] shrink-0 items-center justify-center rounded-[10px] bg-green-050">
            {s.icon}
          </span>
          <span>
            <span className="block font-mono text-xl font-bold text-fg-1">{s.value}</span>
            <span className="block text-[12.5px] text-fg-2">{s.label}</span>
          </span>
        </Card>
      ))}
    </div>
  );
}

/* ---- Barra de búsqueda ------------------------------------------------- */
export function GcrSearchBar({
  query,
  onQuery,
  placeholder,
  disabled,
}: {
  query: string;
  onQuery: (v: string) => void;
  placeholder: string;
  /** El esqueleto dibuja el mismo control apagado, para que no salte el bloque. */
  disabled?: boolean;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="min-w-[240px] flex-1">
        {/* <TextField> y no la clase `.input`: ésa es CSS sin capa y le gana a
            las utilidades de Tailwind, así que el hueco para el icono no se
            podía abrir con `pl-*`. */}
        <TextField
          value={query}
          onChange={onQuery}
          icon={<Search />}
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

/* ---- Estado vacío ------------------------------------------------------ */
export function GcrEmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="px-7 py-[60px] text-center">
      <div className="mx-auto mb-[18px] flex size-[72px] items-center justify-center rounded-full border border-sand bg-cream-tert">
        {icon}
      </div>
      <h3 className="mb-2 font-display text-[21px] font-bold text-fg-1">{title}</h3>
      <p className="mx-auto mb-[22px] max-w-[440px] text-[15px] leading-relaxed text-fg-2">{body}</p>
      <Button onClick={onAction}>
        <Plus className="size-[17px]" /> {actionLabel}
      </Button>
    </div>
  );
}

/* ---- Encabezado de página ---------------------------------------------- */
export function GcrPageHead({
  crumb,
  title,
  desc,
  actionLabel,
  onAction,
  accionDeshabilitada,
}: {
  crumb: string;
  title: string;
  desc: string;
  actionLabel: string;
  onAction: () => void;
  /** El esqueleto muestra el mismo botón apagado. */
  accionDeshabilitada?: boolean;
}) {
  return (
    <>
      <div className="mb-3.5 flex items-center gap-2.5 text-[13.5px] text-fg-3">
        <span>Contenido</span>
        <ChevronRight className="size-[15px]" />
        <span className="font-medium text-fg-2">{crumb}</span>
      </div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-[280px]">
          <h1 className="font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">{title}</h1>
          <p className="mt-2.5 max-w-[680px] text-[15.5px] leading-relaxed text-fg-2">{desc}</p>
        </div>
        <Button size="lg" onClick={onAction} disabled={accionDeshabilitada}>
          <Plus className="size-[18px]" /> {actionLabel}
        </Button>
      </div>
    </>
  );
}

export function GcrNoMatch({ msg }: { msg: string }) {
  return (
    <div className="px-6 py-14 text-center text-fg-3">
      <SearchX className="mx-auto size-8" />
      <div className="mt-3 text-[15px]">{msg}</div>
    </div>
  );
}
