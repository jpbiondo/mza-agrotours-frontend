"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft, CheckCircle2, ChevronRight, CircleDot, ClipboardCheck, Info, List, Loader,
  MessageSquareReply, Plus, Send, X, XCircle, type LucideIcon,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { Alert, Button, Card, EstadoBadge, Skeleton, Toast } from "@/components/ui";
import { TextField } from "@/components/ui/text-field";
import { TextArea } from "@/components/ui/text-area";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { GI_ESTADOS, giCodigo } from "@/data/incidencias";
import { useMisIncidencias, useReportarIncidencia } from "@/hooks/useMisIncidencias";
import { fmtFechaHora } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EstadoIncidencia, IncidenciaPropia } from "@/types/incidencias";
import {
  DESC_MAX, INCIDENCIA_INICIAL, TITULO_MAX, incidenciaSchema, type IncidenciaForm,
} from "./schema";

const ESTADO_ICONO: Record<EstadoIncidencia, LucideIcon> = {
  reportada: CircleDot,
  revision: Loader,
  resuelta: CheckCircle2,
  desestimada: XCircle,
};

/** "hoy", "ayer", "hace 3 días": la antigüedad la calcula el backend en días. */
function antiguedad(dias: number | null): string | null {
  if (dias === null || dias < 0) return null;
  if (dias === 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 30) return `hace ${dias} días`;
  const meses = Math.floor(dias / 30);
  return meses === 1 ? "hace 1 mes" : `hace ${meses} meses`;
}

/* ---- Breadcrumb --------------------------------------------------------- */
function Migas({ children }: { children: React.ReactNode }) {
  return (
    <nav aria-label="Ruta" className="mb-3 flex items-center gap-[9px] text-[13px] text-fg-3">
      <Link href="/" className="text-fg-3 no-underline hover:text-fg-2">Inicio</Link>
      <ChevronRight className="size-3.5" />
      {children}
    </nav>
  );
}

/* ---- Fila de una incidencia -------------------------------------------- */
function IncidenciaFila({ inc }: { inc: IncidenciaPropia }) {
  const est = inc.estado ? GI_ESTADOS[inc.estado] : null;
  const Icono = inc.estado ? ESTADO_ICONO[inc.estado] : CircleDot;
  const resuelta = inc.estado === "resuelta";
  const cuando = antiguedad(inc.dias);

  return (
    <Card className="flex items-start gap-[18px] px-6 py-5 transition-[box-shadow,border-color] hover:border-sand hover:shadow-hover">
      <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-green-050 text-green-800">
        <Icono className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2.5 text-[12.5px] text-fg-3">
          <span className="font-mono">{giCodigo(inc.id)}</span>
          <span aria-hidden className="size-[3px] rounded-full bg-outline" />
          <span>{fmtFechaHora(inc.fechaInicio)}</span>
        </div>
        <h3 className="mb-1 truncate font-display text-lg font-semibold text-fg-1">{inc.titulo}</h3>
        <p className="line-clamp-2 text-sm leading-normal text-fg-2">{inc.desc}</p>

        {/* Respuesta del administrador: el backend sólo la manda en Resuelta o Desestimada. */}
        {inc.motivo && (
          <div
            className={cn(
              "mt-3 rounded-md border px-3.5 py-3",
              resuelta ? "border-green-100 bg-green-050" : "border-outline-variant bg-cream-tert",
            )}
          >
            <div className={cn("mb-1.5 flex items-center gap-[7px]", resuelta ? "text-green-800" : "text-fg-3")}>
              <MessageSquareReply className="size-3.5" />
              <span className="t-label text-[11px] text-current">Respuesta del administrador</span>
            </div>
            <p className="text-[13.5px] leading-[1.55] text-pretty text-fg-2">{inc.motivo}</p>
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <EstadoBadge tone={est?.tone ?? "neutral"}>{est?.label ?? "Sin estado"}</EstadoBadge>
        {cuando && <span className="text-xs text-fg-3">{cuando}</span>}
      </div>
    </Card>
  );
}

/* ---- Esqueleto y vacío -------------------------------------------------- */
function ListaEsqueleto() {
  return (
    <div aria-busy="true" aria-label="Cargando incidencias…">
      <Skeleton className="mb-3.5 h-4 w-56" />
      <div className="flex flex-col gap-3.5">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[122px] rounded-lg" />)}
      </div>
    </div>
  );
}

function SinIncidencias({ onReportar }: { onReportar: () => void }) {
  return (
    <Card className="flex flex-col items-center px-8 py-16 text-center">
      <span className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-green-050">
        <ClipboardCheck className="size-[30px] text-green-800" />
      </span>
      <h2 className="mb-2 font-display text-xl font-bold text-fg-1">Todavía no reportaste incidencias</h2>
      <p className="mb-6 max-w-[420px] text-[15px] text-fg-2">
        Si encontrás un error, un fallo o algo que no funciona como esperás, reportalo y el equipo de soporte te va a dar una mano.
      </p>
      <Button onClick={onReportar}><Plus className="size-[17px]" /> Reportar incidencia</Button>
    </Card>
  );
}

/* ---- Vista de listado --------------------------------------------------- */
function Listado({ incidencias, isLoading, error, reload, onReportar }: {
  incidencias: IncidenciaPropia[];
  isLoading: boolean;
  error: string | null;
  reload: () => void;
  onReportar: () => void;
}) {
  const vacio = !isLoading && !error && incidencias.length === 0;

  return (
    <div className="mx-auto max-w-[920px] px-7 pt-10 pb-[90px]">
      <Migas>
        <Link href="/ayuda" className="text-fg-3 no-underline hover:text-fg-2">Soporte</Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-fg-2">Incidencias</span>
      </Migas>

      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-[260px]">
          <h1 className="font-display text-[34px] font-bold tracking-[-.01em] text-fg-1">Incidencias</h1>
          <p className="mt-2.5 max-w-[560px] text-[15.5px] text-fg-2">
            Reportá errores o comportamientos inesperados del sistema y seguí el estado de cada caso que abriste con soporte.
          </p>
        </div>
        {!vacio && (
          <Button onClick={onReportar} disabled={isLoading}>
            <Plus className="size-[17px]" /> Reportar incidencia
          </Button>
        )}
      </div>

      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} skeleton={<ListaEsqueleto />}>
        {vacio ? (
          <SinIncidencias onReportar={onReportar} />
        ) : (
          <>
            <div className="mb-3.5 flex items-center gap-2 text-[13.5px] text-fg-3">
              <List className="size-[15px]" />
              {incidencias.length} {incidencias.length === 1 ? "incidencia" : "incidencias"} · más recientes primero
            </div>
            <div className="flex flex-col gap-3.5">
              {incidencias.map((inc) => <IncidenciaFila key={inc.id} inc={inc} />)}
            </div>
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}

/* ---- Vista de formulario ----------------------------------------------- */
function Formulario({ onCancelar, onReportada }: { onCancelar: () => void; onReportada: () => void }) {
  const { reportar, enviando } = useReportarIncidencia();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<IncidenciaForm>({
    resolver: zodResolver(incidenciaSchema),
    mode: "onTouched",
    defaultValues: INCIDENCIA_INICIAL,
  });
  const titulo = useWatch({ control: form.control, name: "titulo" });
  const desc = useWatch({ control: form.control, name: "desc" });

  async function enviar(datos: IncidenciaForm) {
    setError(null);
    const r = await reportar(datos);
    if (r.ok) {
      onReportada();
      return;
    }
    setError(
      r.code === "validationError"
        ? "El servidor rechazó los datos. Revisá el título y la descripción."
        : "No pudimos reportar la incidencia. Probá de nuevo en unos minutos.",
    );
  }

  /** Fila bajo cada campo: el error a la izquierda, el contador siempre a la derecha. */
  const meta = (largo: number, max: number) => (
    <div className="flex min-h-5 items-center justify-between gap-3">
      <FormMessage />
      <span className="ml-auto shrink-0 font-mono text-[11.5px] text-fg-3">{largo}/{max}</span>
    </div>
  );

  return (
    <div className="mx-auto max-w-[720px] px-7 pt-8 pb-[90px]">
      <Migas>
        <button
          type="button"
          onClick={onCancelar}
          className="cursor-pointer bg-transparent p-0 text-[13px] text-fg-3 hover:text-fg-2"
        >
          Incidencias
        </button>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-fg-2">Reportar incidencia</span>
      </Migas>

      <button
        type="button"
        onClick={onCancelar}
        className="mb-3.5 inline-flex cursor-pointer items-center gap-1.5 bg-transparent py-1 text-sm font-semibold text-green-800"
      >
        <ArrowLeft className="size-4" /> Volver al listado
      </button>

      <div className="mb-6">
        <h1 className="font-display text-[30px] font-bold tracking-[-.01em] text-fg-1">Reportar incidencia</h1>
        <p className="mt-2 text-[15px] text-fg-2">
          Contanos qué pasó. Cuantos más detalles nos des, más rápido va a poder ayudarte el equipo de soporte.
        </p>
      </div>

      <Form {...form}>
        <form noValidate onSubmit={form.handleSubmit(enviar)}>
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-[26px] p-8">
              <div className="t-label border-b border-outline-variant pb-3">Datos de la incidencia</div>

              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required className="font-display text-[15.5px] font-semibold">Título</FormLabel>
                    <FormControl>
                      <TextField
                        {...field}
                        maxLength={TITULO_MAX}
                        placeholder="Ej. No puedo confirmar una reserva"
                      />
                    </FormControl>
                    {meta(titulo.length, TITULO_MAX)}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="desc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required className="font-display text-[15.5px] font-semibold">Descripción</FormLabel>
                    <FormControl>
                      <TextArea
                        {...field}
                        rows={5}
                        maxLength={DESC_MAX}
                        placeholder="Describí el error: qué estabas haciendo, qué esperabas que pasara y qué pasó en su lugar."
                      />
                    </FormControl>
                    {meta(desc.length, DESC_MAX)}
                  </FormItem>
                )}
              />

              {error && <Alert>{error}</Alert>}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant bg-cream-tert px-8 py-5">
              <span className="flex items-center gap-[7px] text-[13px] text-fg-3">
                <Info className="size-[15px]" />
                Los campos con <span className="font-bold text-danger">*</span> son obligatorios
              </span>
              <div className="flex gap-3">
                <Button variant="neutral" onClick={onCancelar} disabled={enviando}>
                  <X className="size-[17px]" /> Cancelar
                </Button>
                <Button type="submit" disabled={enviando}>
                  {enviando ? <Loader className="spin size-[17px]" /> : <Send className="size-[17px]" />} Reportar
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </Form>
    </div>
  );
}

/* ---- Página ------------------------------------------------------------- */
export default function IncidenciasClient() {
  const router = useRouter();
  const { incidencias, isLoading, error, unauthenticated, reload } = useMisIncidencias();
  const [vista, setVista] = useState<"listado" | "formulario">("listado");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (unauthenticated) router.replace("/acceso");
  }, [unauthenticated, router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  if (unauthenticated) return null;

  return (
    <main key={vista} className="pop">
      {vista === "formulario" ? (
        <Formulario
          onCancelar={() => setVista("listado")}
          onReportada={() => {
            // Se vuelve a pedir el listado en vez de sumarla a mano: el estado,
            // la fecha y la antigüedad los pone el backend.
            reload();
            setVista("listado");
            setToast("Incidencia reportada exitosamente");
          }}
        />
      ) : (
        <Listado
          incidencias={incidencias}
          isLoading={isLoading}
          error={error}
          reload={reload}
          onReportar={() => { setToast(null); setVista("formulario"); }}
        />
      )}
      {toast && <Toast tone="success" title={toast} />}
    </main>
  );
}
