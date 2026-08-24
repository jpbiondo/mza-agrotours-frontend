"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, X, Trash2, Check, Loader, Sprout, Clock, Users, CalendarRange,
  AlertCircle, ListChecks, HelpCircle, Ban, Info,
} from "lucide-react";
import { Alert, Button, Card, Toast } from "@/components/ui";
import type { ToastData } from "@/components/ui";
import { TextField } from "@/components/ui/text-field";
import { DIAS } from "@/data/actividad-form";
import { cn } from "@/lib/utils";
import { useEstablecimientos } from "@/hooks/useEstablecimientos";
import { useTiposCultivo } from "@/hooks/useTiposCultivo";
import { useGuardarActividad, type EstadoGuardado } from "@/hooks/useGuardarActividad";
import type { ActividadFormData } from "@/types/actividad-form";

/** Errores de dominio del alta. El resto cae en el genérico. */
const ERROR_ALTA: Record<string, string> = {
  // TODO backend: confirmar los códigos reales.
};

function mensajeAlta(code?: string): string {
  return (
    (code && ERROR_ALTA[code]) ||
    "No pudimos guardar la actividad. Probá de nuevo en unos minutos."
  );
}

function Section({
  icon,
  title,
  sub,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mb-[22px] overflow-hidden p-0">
      <div className="flex items-center gap-3 border-b border-cream-tert px-6 py-[18px]">
        <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-green-050">
          {icon}
        </div>
        <div>
          <h2 className="font-display text-[17px] font-semibold text-fg-1">{title}</h2>
          {sub && <p className="mt-0.5 text-[13px] text-fg-3">{sub}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </Card>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-[7px] block text-[13.5px] font-semibold text-fg-1">
      {children} {required && <span className="text-danger">*</span>}
    </label>
  );
}

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="err-msg mt-1.5">
      <AlertCircle className="size-[14px] text-danger" /> {msg}
    </div>
  );
}

function ListEditor({
  label,
  items,
  onChange,
  placeholder,
  addLabel,
  tone,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  addLabel: string;
  tone: "success" | "danger";
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-col gap-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span
              className={cn(
                "size-2 shrink-0 rounded-full",
                tone === "success" ? "bg-success" : "bg-danger",
              )}
            />
            <div className="min-w-0 flex-1">
              <TextField
                value={it}
                placeholder={placeholder}
                onChange={(val) => onChange(items.map((x, idx) => (idx === i ? val : x)))}
              />
            </div>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                aria-label="Quitar"
                className="inline-flex cursor-pointer text-fg-3"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="mt-2.5 inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-brown-500 bg-brown-100 px-4 py-2.5 text-[13.5px] font-semibold text-brown-800"
      >
        {tone === "danger" ? <Ban className="size-[15px]" /> : <Plus className="size-[15px]" />}
        {addLabel}
      </button>
    </div>
  );
}

type Errors = Partial<
  Record<"nombre" | "cupos" | "adultos" | "dias" | "vigencia" | "cultivos", string>
>;

export default function ActivityForm({
  mode,
  initial,
}: {
  mode: "crear" | "editar";
  initial: ActividadFormData;
}) {
  const router = useRouter();
  const { activo } = useEstablecimientos();
  const establecimientoId = activo?.id ?? "";

  const [v, setV] = useState<ActividadFormData>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState<EstadoGuardado | null>(null);
  const [errorAlta, setErrorAlta] = useState<string | null>(null);
  const { guardar, isLoading } = useGuardarActividad();
  const { cultivos: catalogo, isLoading: cargandoCultivos } = useTiposCultivo(true);

  const set = <K extends keyof ActividadFormData>(k: K, val: ActividadFormData[K]) =>
    setV((s) => ({ ...s, [k]: val }));

  const errors = useMemo<Errors>(() => {
    const e: Errors = {};
    if (!v.nombre.trim()) e.nombre = "Ingresá un nombre para la actividad.";
    if (!v.cupos.trim() || Number(v.cupos) <= 0) e.cupos = "Ingresá un cupo válido.";
    if (!v.ages.adultos.price.trim() || Number(v.ages.adultos.price) <= 0)
      e.adultos = "El precio de adultos es obligatorio.";
    const algunDia = DIAS.some((d) => v.days[d.key].on && v.days[d.key].desde && v.days[d.key].hasta);
    if (!algunDia) e.dias = "Habilitá al menos un día con horario de inicio y fin.";
    // La vigencia deja de ser opcional: es el período de los días que se cargan
    // arriba, y el backend la pide junto con ellos.
    if (!v.fechaDesde || !v.fechaHasta) e.vigencia = "Indicá desde y hasta cuándo se ofrece.";
    else if (v.fechaHasta < v.fechaDesde)
      e.vigencia = "La fecha de fin no puede ser anterior al inicio.";
    return e;
  }, [v]);

  const show = (k: keyof Errors) => (submitted ? errors[k] : undefined);

  async function onSubmit(estado: EstadoGuardado) {
    setSubmitted(true);
    setErrorAlta(null);
    if (Object.keys(errors).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const res = await guardar(establecimientoId, v, estado);
    if (!res.ok) {
      setErrorAlta(mensajeAlta(res.code));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setDone(estado);
    setTimeout(() => router.push("/panel/actividades"), 1400);
  }

  const toggleCultivo = (id: string) =>
    set("cultivos", v.cultivos.includes(id) ? v.cultivos.filter((x) => x !== id) : [...v.cultivos, id]);

  const disponibles = catalogo.filter((c) => !v.cultivos.includes(c.id));
  const nombreDe = (id: string) => catalogo.find((c) => c.id === id)?.nombre ?? id;

  const toast: ToastData | null = done
    ? {
        tone: "success",
        title:
          done === "publicado"
            ? "Actividad publicada correctamente."
            : "Borrador guardado correctamente.",
        sub: `«${v.nombre}»`,
      }
    : null;

  return (
    <div className="min-h-screen bg-cream-bg">
      <div className="mx-auto max-w-[880px] px-7 pt-7 pb-[120px]">
        <Button
          variant="neutral"
          size="sm"
          className="mb-4 text-sm"
          onClick={() => router.push("/panel/actividades")}
        >
          <ArrowLeft className="size-4" /> Volver al listado
        </Button>

        <h1 className="font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">
          {mode === "crear" ? "Crear actividad" : "Modificar actividad"}
        </h1>
        <p className="mt-1.5 mb-[26px] text-[15px] text-fg-2">
          Completá los datos de la experiencia. Podés guardarla como borrador y publicarla más
          adelante.
        </p>

        {!establecimientoId && (
          <Alert className="mb-5">
            No hay un establecimiento seleccionado. Elegí uno en el menú lateral para poder crear
            actividades.
          </Alert>
        )}
        {errorAlta && <Alert className="mb-5">{errorAlta}</Alert>}

        <Section icon={<Info className="size-[18px] text-green-800" />} title="Datos de la experiencia">
          <div className="mb-[18px]">
            <Label required>Nombre</Label>
            <TextField
              value={v.nombre}
              maxLength={80}
              placeholder="Ej. Cosecha de Malbec al amanecer"
              onChange={(val) => set("nombre", val)}
              aria-invalid={!!show("nombre")}
            />
            <Err msg={show("nombre")} />
          </div>

          <div className="mb-[18px]">
            <Label>Descripción</Label>
            <textarea
              className="textarea min-h-[110px]"
              value={v.descripcion}
              placeholder="Contá de qué se trata la experiencia…"
              maxLength={2000}
              onChange={(e) => set("descripcion", e.target.value)}
            />
            <div className="mt-1.5 text-right font-mono text-xs text-fg-3">
              {v.descripcion.length} / 2000
            </div>
          </div>

          <div className="mb-[18px] max-w-[220px]">
            <Label required>Cupo máximo por jornada</Label>
            <TextField
              type="number"
              inputMode="numeric"
              value={v.cupos}
              placeholder="Ej. 20"
              onChange={(val) => set("cupos", val)}
              aria-invalid={!!show("cupos")}
            />
            <Err msg={show("cupos")} />
          </div>

          <div>
            <Label>Cultivos asociados</Label>
            <div className="mb-2.5 flex flex-wrap gap-2">
              {v.cultivos.length === 0 && (
                <span className="text-[13.5px] text-fg-3">Sin cultivos seleccionados.</span>
              )}
              {v.cultivos.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-pill border border-green-100 bg-green-050 py-[5px] pr-1.5 pl-3 text-[13px] font-semibold text-green-800"
                >
                  <Sprout className="size-[13px] text-green-700" /> {nombreDe(id)}
                  <button
                    type="button"
                    onClick={() => toggleCultivo(id)}
                    aria-label={`Quitar ${nombreDe(id)}`}
                    className="inline-flex size-5 cursor-pointer items-center justify-center rounded-full bg-green-100"
                  >
                    <X className="size-3 text-green-800" />
                  </button>
                </span>
              ))}
            </div>
            <div className="max-w-[280px]">
              <select
                className="select"
                value=""
                disabled={cargandoCultivos || disponibles.length === 0}
                onChange={(e) => {
                  if (e.target.value) toggleCultivo(e.target.value);
                }}
              >
                <option value="">
                  {cargandoCultivos
                    ? "Cargando cultivos…"
                    : disponibles.length === 0
                      ? "No quedan cultivos para agregar"
                      : "+ Agregar cultivo…"}
                </option>
                {disponibles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        <Section
          icon={<Users className="size-[18px] text-green-800" />}
          title="Precio por rango etario"
          sub="El precio de adultos es obligatorio. Infantes (0–2) suelen ir sin cargo."
        >
          {(
            [
              { key: "adultos", label: "Adultos", sub: "18 años o más", required: true },
              { key: "menores", label: "Menores", sub: "3 a 17 años", required: false },
              { key: "infantes", label: "Infantes", sub: "0 a 2 años", required: false },
            ] as const
          ).map((tier) => {
            const t = v.ages[tier.key];
            const enabled = tier.required || t.on;
            return (
              <div
                key={tier.key}
                className="flex items-center gap-4 border-b border-cream-tert py-3"
              >
                <label
                  className={cn(
                    "flex flex-1 items-center gap-2.5",
                    tier.required ? "cursor-default" : "cursor-pointer",
                  )}
                >
                  {!tier.required && (
                    <input
                      type="checkbox"
                      checked={t.on}
                      onChange={(e) =>
                        set("ages", { ...v.ages, [tier.key]: { ...t, on: e.target.checked } })
                      }
                      className="size-[18px] accent-green-800"
                    />
                  )}
                  <span>
                    <span className="block text-sm font-semibold text-fg-1">
                      {tier.label}
                      {tier.required && <span className="text-danger"> *</span>}
                    </span>
                    <span className="block text-xs text-fg-3">{tier.sub}</span>
                  </span>
                </label>
                <div className="flex w-[200px] items-center gap-[7px]">
                  <span className="font-mono text-fg-3">$</span>
                  <TextField
                    type="number"
                    inputMode="numeric"
                    value={t.price}
                    placeholder={enabled ? "0" : "—"}
                    disabled={!enabled}
                    onChange={(val) =>
                      set("ages", { ...v.ages, [tier.key]: { ...t, price: val } })
                    }
                    aria-invalid={tier.key === "adultos" && !!show("adultos")}
                  />
                </div>
              </div>
            );
          })}
          <Err msg={show("adultos")} />
        </Section>

        <Section
          icon={<Clock className="size-[18px] text-green-800" />}
          title="Días y horarios"
          sub="Habilitá los días en que se ofrece la experiencia y su franja horaria."
        >
          <div className="flex flex-col gap-2">
            {DIAS.map((d) => {
              const cfg = v.days[d.key];
              return (
                <div
                  key={d.key}
                  className={cn(
                    "flex flex-wrap items-center gap-3.5 rounded-md border px-3 py-2",
                    cfg.on ? "border-green-100 bg-green-050" : "border-transparent bg-cream-tert",
                  )}
                >
                  <label className="flex w-[130px] cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={cfg.on}
                      onChange={(e) =>
                        set("days", { ...v.days, [d.key]: { ...cfg, on: e.target.checked } })
                      }
                      className="size-[18px] accent-green-800"
                    />
                    <span className="text-sm font-semibold text-fg-1">{d.label}</span>
                  </label>
                  <div className={cn("flex items-center gap-2", !cfg.on && "opacity-50")}>
                    <div className="w-[130px]">
                      <TextField
                        type="time"
                        value={cfg.desde}
                        disabled={!cfg.on}
                        onChange={(val) => set("days", { ...v.days, [d.key]: { ...cfg, desde: val } })}
                      />
                    </div>
                    <span className="text-fg-3">–</span>
                    <div className="w-[130px]">
                      <TextField
                        type="time"
                        value={cfg.hasta}
                        disabled={!cfg.on}
                        onChange={(val) => set("days", { ...v.days, [d.key]: { ...cfg, hasta: val } })}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <Err msg={show("dias")} />
        </Section>

        <Section
          icon={<CalendarRange className="size-[18px] text-green-800" />}
          title="Vigencia"
          sub="Período en el que la experiencia estará disponible para reservar."
        >
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[180px] flex-1">
              <Label required>Desde</Label>
              <TextField
                type="date"
                value={v.fechaDesde}
                onChange={(val) => set("fechaDesde", val)}
                aria-invalid={!!show("vigencia")}
              />
            </div>
            <div className="min-w-[180px] flex-1">
              <Label required>Hasta</Label>
              <TextField
                type="date"
                value={v.fechaHasta}
                onChange={(val) => set("fechaHasta", val)}
                aria-invalid={!!show("vigencia")}
              />
            </div>
          </div>
          <Err msg={show("vigencia")} />
        </Section>

        <Section
          icon={<ListChecks className="size-[18px] text-green-800" />}
          title="Qué incluye y qué no"
        >
          <ListEditor
            label="Incluye"
            items={v.incluye}
            onChange={(items) => set("incluye", items)}
            placeholder="Ej. Desayuno de campo"
            addLabel="Agregar inclusión"
            tone="success"
          />
          <div className="h-5" />
          <ListEditor
            label="No incluye"
            items={v.noIncluye}
            onChange={(items) => set("noIncluye", items)}
            placeholder="Ej. Traslado al establecimiento"
            addLabel="Agregar exclusión"
            tone="danger"
          />
        </Section>

        <Section
          icon={<HelpCircle className="size-[18px] text-green-800" />}
          title="Preguntas frecuentes"
        >
          <div className="flex flex-col gap-3.5">
            {v.faqs.map((f, i) => (
              <div key={i} className="rounded-md border border-outline-variant p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="t-label">Pregunta {i + 1}</span>
                  {v.faqs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => set("faqs", v.faqs.filter((_, idx) => idx !== i))}
                      aria-label="Quitar pregunta"
                      className="inline-flex cursor-pointer text-danger"
                    >
                      <Trash2 className="size-[15px]" />
                    </button>
                  )}
                </div>
                <div className="mb-2">
                  <TextField
                    value={f.q}
                    placeholder="¿Pregunta?"
                    onChange={(val) =>
                      set("faqs", v.faqs.map((x, idx) => (idx === i ? { ...x, q: val } : x)))
                    }
                  />
                </div>
                <textarea
                  className="textarea min-h-16"
                  value={f.a}
                  placeholder="Respuesta"
                  onChange={(e) =>
                    set(
                      "faqs",
                      v.faqs.map((x, idx) => (idx === i ? { ...x, a: e.target.value } : x)),
                    )
                  }
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => set("faqs", [...v.faqs, { q: "", a: "" }])}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-brown-500 bg-brown-100 px-4 py-2.5 text-[13.5px] font-semibold text-brown-800"
          >
            <Plus className="size-4" /> Agregar pregunta
          </button>
        </Section>
      </div>

      <div className="sticky bottom-0 z-20 border-t border-outline-variant bg-cream-bg/94 backdrop-blur-[8px]">
        <div className="mx-auto flex max-w-[880px] flex-wrap items-center justify-between gap-3 px-7 py-3.5">
          <Button variant="neutral" onClick={() => router.push("/panel/actividades")}>
            Cancelar
          </Button>
          <div className="flex gap-2.5">
            <Button
              variant="neutral"
              className="border-brown-500 text-brown-800"
              disabled={isLoading || !!done || !establecimientoId}
              onClick={() => onSubmit("borrador")}
            >
              {done === "borrador" ? (
                <>
                  <Check className="size-[17px]" /> Guardado
                </>
              ) : (
                "Guardar borrador"
              )}
            </Button>
            <Button
              disabled={isLoading || !!done || !establecimientoId}
              onClick={() => onSubmit("publicado")}
            >
              {isLoading ? (
                <>
                  <Loader className="spin size-[17px]" /> Guardando…
                </>
              ) : done === "publicado" ? (
                <>
                  <Check className="size-[17px]" /> Publicada
                </>
              ) : (
                <>
                  <Check className="size-[17px]" /> {mode === "crear" ? "Publicar" : "Guardar y publicar"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {toast && <Toast {...toast} />}
    </div>
  );
}
