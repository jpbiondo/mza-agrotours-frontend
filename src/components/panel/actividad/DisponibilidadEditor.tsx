"use client";

import { useState } from "react";
import { AlertCircle, CalendarPlus, Info } from "lucide-react";
import { Button } from "@/components/ui";
import { DatePicker, hoyISO, sumarDiasISO } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { DIAS } from "@/data/actividad-form";
import { DIAS_VIGENCIA_MAX, type ErroresActividad } from "@/lib/actividad-form";
import { cn } from "@/lib/utils";
import type { DiaCfg, DiaKey } from "@/types/actividad-form";
import { CajaCheck, ErrorMsg } from "./campos";

function Titulo({ children, help }: { children: string; help: React.ReactNode }) {
  return (
    <>
      <div className="t-label mb-3.5 border-b border-outline-variant pb-3">{children}</div>
      <p className="m-0 text-[13px] text-fg-2">{help}</p>
    </>
  );
}

/** Días de la semana con su franja horaria, y período de vigencia. */
export function DisponibilidadEditor({
  days,
  onDays,
  fechaDesde,
  fechaHasta,
  onFechas,
  errs,
  intentado,
}: {
  days: Record<DiaKey, DiaCfg>;
  onDays: (days: Record<DiaKey, DiaCfg>) => void;
  fechaDesde: string;
  fechaHasta: string;
  onFechas: (desde: string, hasta: string) => void;
  errs: ErroresActividad;
  intentado: boolean;
}) {
  // Marcar un día es pedir su horario, así que desde ese momento la fila puede
  // mostrarse incompleta sin esperar al submit.
  const [tocados, setTocados] = useState<Set<DiaKey>>(() => new Set());

  const hoy = hoyISO();
  const topeVigencia = sumarDiasISO(hoy, DIAS_VIGENCIA_MAX);

  const parchar = (k: DiaKey, p: Partial<DiaCfg>) => onDays({ ...days, [k]: { ...days[k], ...p } });

  const alternar = (k: DiaKey) => {
    if (days[k].on) parchar(k, { on: false, desde: "", hasta: "" });
    else {
      setTocados((t) => new Set(t).add(k));
      parchar(k, { on: true });
    }
  };

  /** Marca todos los días replicando el horario del lunes. */
  const todos = () => {
    const ref = days.lunes;
    const next = { ...days };
    DIAS.forEach((d) => {
      next[d.key] = { on: true, desde: ref.desde, hasta: ref.hasta };
    });
    setTocados(new Set(DIAS.map((d) => d.key)));
    onDays(next);
  };

  const filaIncompleta = (k: DiaKey) =>
    (intentado || tocados.has(k)) && days[k].on && (!days[k].desde || !days[k].hasta);
  const algunaIncompleta = DIAS.some((d) => filaIncompleta(d.key));

  return (
    <div>
      <div className="mb-9">
        <Titulo
          help={
            <>
              Elegí los días en que se desarrollará la actividad <span className="text-danger">*</span>
            </>
          }
        >
          Días en que se realizará la actividad
        </Titulo>

        <div className="mt-3 mb-3.5 flex justify-end">
          <Button variant="neutral" size="sm" onClick={todos}>
            <CalendarPlus className="size-[15px]" /> Todos los días
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {DIAS.map((d) => {
            const fila = days[d.key];
            const mal = filaIncompleta(d.key);
            return (
              <div
                key={d.key}
                className={cn(
                  "flex flex-wrap items-center gap-3 rounded-md border border-outline-variant bg-surface px-3 py-2 transition-colors",
                  fila.on && "border-green-300 bg-green-050",
                  mal && "border-danger bg-danger-fill",
                )}
              >
                <button
                  type="button"
                  onClick={() => alternar(d.key)}
                  aria-pressed={fila.on}
                  className="flex w-32 shrink-0 cursor-pointer items-center gap-2.5"
                >
                  <CajaCheck on={fila.on} />
                  <span className={cn("text-[14.5px] font-semibold", fila.on ? "text-green-800" : "text-fg-1")}>
                    {d.label}
                  </span>
                </button>
                <div className="flex min-w-0 flex-1 gap-2">
                  <div className="min-w-0 flex-1">
                    <TimePicker
                      aria-label={`Hora de inicio del ${d.label.toLowerCase()}`}
                      value={fila.desde}
                      disabled={!fila.on}
                      error={mal && !fila.desde}
                      placeholder="Inicio"
                      onChange={(v) => parchar(d.key, { desde: v })}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <TimePicker
                      aria-label={`Hora de fin del ${d.label.toLowerCase()}`}
                      value={fila.hasta}
                      disabled={!fila.on}
                      error={mal && !fila.hasta}
                      placeholder="Fin"
                      onChange={(v) => parchar(d.key, { hasta: v })}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {intentado && errs.diasNone && (
          <div className="err-msg mt-3">
            <AlertCircle className="size-[14px] shrink-0 text-danger" />
            {errs.diasNone}
          </div>
        )}
        {algunaIncompleta && (
          <div className="err-msg mt-3">
            <AlertCircle className="size-[14px] shrink-0 text-danger" />
            Debe ingresar los horarios para los días seleccionados
          </div>
        )}
        {errs.diasOrden && (
          <div className="err-msg mt-2">
            <AlertCircle className="size-[14px] shrink-0 text-danger" />
            {errs.diasOrden}
          </div>
        )}
      </div>

      <div>
        <Titulo
          help={
            <>
              ¿Desde qué fecha y hasta qué fecha querés dejar vigente esta actividad?{" "}
              <span className="text-danger">*</span>
            </>
          }
        >
          Vigencia de la actividad
        </Titulo>

        <div className="mt-3.5 grid gap-4 sm:grid-cols-2">
          <div>
            <span className="mb-1.5 block text-xs font-medium text-fg-2">Fecha desde</span>
            <DatePicker
              aria-label="Fecha desde"
              value={fechaDesde}
              min={hoy}
              max={topeVigencia}
              error={intentado && !!errs.fechaDesde}
              // Una fecha de inicio posterior al fin dejaría un período imposible:
              // se limpia el fin en vez de guardarlo inválido.
              onChange={(v) => onFechas(v, fechaHasta && fechaHasta < v ? "" : fechaHasta)}
            />
            {intentado && <ErrorMsg>{errs.fechaDesde}</ErrorMsg>}
          </div>
          <div>
            <span className={cn("mb-1.5 block text-xs font-medium", fechaDesde ? "text-fg-2" : "text-fg-3")}>
              Fecha hasta
            </span>
            <DatePicker
              aria-label="Fecha hasta"
              value={fechaHasta}
              disabled={!fechaDesde}
              min={fechaDesde || hoy}
              max={topeVigencia}
              error={intentado && !!errs.fechaHasta}
              onChange={(v) => onFechas(fechaDesde, v)}
            />
            {intentado && <ErrorMsg>{errs.fechaHasta}</ErrorMsg>}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-md bg-info-fill px-3.5 py-2.5 text-[13px] text-info-fg">
          <Info className="size-[15px] shrink-0 text-info" />
          <span>
            {!fechaDesde
              ? "Seleccioná primero la fecha de inicio para habilitar la fecha de fin."
              : `La vigencia puede extenderse hasta ${DIAS_VIGENCIA_MAX} días desde hoy. No se permiten fechas pasadas.`}
          </span>
        </div>
      </div>
    </div>
  );
}
