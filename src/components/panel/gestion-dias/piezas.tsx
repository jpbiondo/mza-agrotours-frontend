import { CalendarRange, Clock, Info, Tag, X } from "lucide-react";
import { DIA_CORTO, fechaCorta, mesCorto, nombreMes } from "@/lib/gestion-dias";
import { moneyAr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FechaISO, Tarifa, VigenciaMes } from "@/types/gestion-dias";

export function BotonCerrar({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Cerrar"
      className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-outline-variant bg-surface text-fg-2 transition-colors hover:bg-cream-tert disabled:cursor-not-allowed disabled:opacity-50"
    >
      <X className="size-[18px]" />
    </button>
  );
}

/** Cabecera de los diálogos de un día: el día y el mes en un bloque, título y bajada. */
export function CabeceraDia({
  fecha, titulo, bajada, onCerrar, cerrarDeshabilitado,
}: {
  fecha: FechaISO;
  titulo: React.ReactNode;
  bajada: React.ReactNode;
  onCerrar: () => void;
  cerrarDeshabilitado?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3.5 border-b border-outline-variant px-6 pt-[22px] pb-[18px]">
      <div className="flex min-w-0 items-center gap-3.5">
        <div className="flex h-[60px] w-14 shrink-0 flex-col items-center justify-center rounded-[10px] border border-green-300 bg-green-050">
          <span className="font-display text-[22px] leading-none font-bold text-green-800">{Number(fecha.slice(8))}</span>
          <span className="mt-1 text-[10px] font-bold tracking-[.1em] text-green-700">{mesCorto(fecha)}</span>
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-[16.5px] leading-tight font-semibold text-fg-1">{titulo}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-1 text-[12.5px] text-fg-2">{bajada}</div>
        </div>
      </div>
      <BotonCerrar onClick={onCerrar} disabled={cerrarDeshabilitado} />
    </div>
  );
}

/** Recordatorio de qué se cobra: el precio no se configura por día. */
export function PrecioContexto({ tarifas, className }: { tarifas: Tarifa[]; className?: string }) {
  if (tarifas.length === 0) return null;
  return (
    <div className={cn("flex items-start gap-[7px] text-[12.5px] leading-snug text-fg-2", className)}>
      <Tag className="mt-px size-3.5 shrink-0 text-fg-3" />
      <span>
        Se cobran las <strong>tarifas</strong> de la actividad:{" "}
        {tarifas.map((t, i) => (
          <span key={`${t.nombre}-${i}`}>
            {i > 0 && " · "}
            <span className="font-mono font-bold text-fg-1">{moneyAr(t.precio)}</span> {t.nombre.toLowerCase()}
          </span>
        ))}
        . Se cambian desde «Modificar».
      </span>
    </div>
  );
}

export function NotaInfo({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start gap-1.5 rounded-md bg-info-fill px-3 py-2.5 text-[12.5px] leading-normal text-info-fg", className)}>
      <Info className="mt-px size-3.5 shrink-0 text-info" />
      <span>{children}</span>
    </div>
  );
}

/** Pie de los diálogos, sobre crema. */
export function PieDialogo({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant bg-cream-tert px-6 py-4", className)}>
      {children}
    </div>
  );
}

/**
 * Vigencias del mes visible: una fila por período cargado por lote y, dentro,
 * cada horario con los días de semana en que aplica.
 */
export function VigenciasMes({ vigencias, mes0 }: { vigencias: VigenciaMes[]; mes0: number }) {
  return (
    <div className="mb-5 rounded-md bg-cream-tert px-4 py-3.5">
      <div className="mb-2.5 text-[11px] font-bold tracking-[.06em] text-fg-3 uppercase">
        Vigencias y horarios de {nombreMes(mes0)}
      </div>
      {vigencias.length === 0 ? (
        <div className="text-[13px] text-fg-2">Sin días cargados por lote para este mes.</div>
      ) : (
        <div className="flex flex-col">
          {vigencias.map((v, i) => (
            <div
              key={`${v.desde}-${v.hasta}`}
              className={cn(
                "grid grid-cols-1 items-start gap-x-6 gap-y-2 py-2.5 sm:grid-cols-[minmax(200px,auto)_minmax(0,1fr)]",
                i > 0 && "border-t border-outline-variant",
              )}
            >
              <span className="inline-flex items-center gap-1.5 pt-[3px] font-mono text-[13px] font-semibold text-fg-1">
                <CalendarRange className="size-3.5 text-green-800" />
                {fechaCorta(v.desde)} → {fechaCorta(v.hasta)}
              </span>
              <div className="flex min-w-0 flex-col gap-1.5">
                {v.horarios.map((h) => (
                  <div key={`${h.horaInicio}-${h.horaFin}`} className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex min-w-[118px] items-center gap-[5px] font-mono text-[13px] font-semibold text-fg-1">
                      <Clock className="size-[13px] text-fg-3" />
                      {h.horaInicio} – {h.horaFin}
                    </span>
                    <span className="flex flex-wrap gap-1">
                      {h.dias.map((d) => (
                        <span
                          key={d}
                          className="rounded-pill border border-outline-variant bg-surface px-[9px] py-0.5 text-xs font-semibold text-fg-1"
                        >
                          {DIA_CORTO[d]}
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
