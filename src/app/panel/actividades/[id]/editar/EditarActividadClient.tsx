"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useController, useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle, ArrowLeft, Ban, Check, HelpCircle, Info, Loader, LogOut, MapPin, Save, Send, X,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { Alert, Button, Card, Modal, Skeleton, Toast } from "@/components/ui";
import type { ToastData } from "@/components/ui";
import { Uploader } from "@/components/ui/uploader";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { FaqEditor, ListaEditable } from "@/components/panel/actividad/ListaEditable";
import { TarifasEditor } from "@/components/panel/actividad/TarifasEditor";
import { CAMPO, FieldLabel } from "@/components/panel/actividad/campos";
import { UPLOAD_FOTOS } from "@/data/actividad-form";
import { aErroresPlanosDeForm, bloqueoDeTarifas, huecosDeEdad } from "@/lib/actividad-form";
import { cn } from "@/lib/utils";
import { useActividadEdicion, useGuardarEdicion } from "@/hooks/useActividadEdicion";
import { useEstablecimientos } from "@/hooks/useEstablecimientos";
import { useSubirArchivos } from "@/hooks/useSubirArchivos";
import { useTiposCultivo } from "@/hooks/useTiposCultivo";
import type { EstadoActividad } from "@/types/actividad-prod";
import { actividadEditarSchema, type ActividadEditarForm } from "./schema";

const LISTADO = "/panel/actividades";
const LABEL = "font-semibold";

/** Errores de dominio de la edición. El resto cae en el genérico. */
const ERROR_EDICION: Record<string, string> = {
  // TODO backend: confirmar los códigos reales.
};

function mensajeError(code?: string): string {
  return (
    (code && ERROR_EDICION[code]) ||
    "No pudimos guardar los cambios. Probá de nuevo en unos minutos."
  );
}

interface ResultadoGuardado {
  estado: EstadoActividad;
  /** Huecos de edad y demás avisos: la actividad quedó guardada igual. */
  advertencias: string[];
  /** Fotos nuevas que no llegaron al storage. */
  fallidas: number;
}

/* ---- Bloques con estado propio ------------------------------------------
   Los editores de tarifas, listas y FAQ son presentacionales y se comparten
   con el alta, así que se conectan con `useController` en vez de recibir el
   formulario entero. */

function BloqueTarifas({
  control,
  errs,
}: {
  control: Control<ActividadEditarForm>;
  errs: Record<string, string>;
}) {
  const { field } = useController({ control, name: "tarifas" });
  const huecos = huecosDeEdad(field.value);

  return (
    <>
      <TarifasEditor filas={field.value} onChange={field.onChange} errs={errs} intentado />
      {huecos.length > 0 && (
        <div className="mb-[26px] flex items-start gap-2 rounded-md bg-info-fill px-3.5 py-2.5 text-[13px] text-info-fg">
          <Info className="mt-px size-[15px] shrink-0 text-info" />
          <span>
            Ninguno de tus rangos cubre {huecos.join(", ")}. Si esperás visitantes de esas edades,
            agregales un rango.
          </span>
        </div>
      )}
    </>
  );
}

function BloqueFotos({ control }: { control: Control<ActividadEditarForm> }) {
  const guardadas = useController({ control, name: "fotos" });
  const nuevas = useController({ control, name: "nuevas" });

  return (
    <div>
      <FieldLabel>Imágenes</FieldLabel>
      <Uploader
        vista="grilla"
        limites={UPLOAD_FOTOS}
        guardados={guardadas.field.value}
        onGuardados={guardadas.field.onChange}
        files={nuevas.field.value}
        onFiles={nuevas.field.onChange}
      />
    </div>
  );
}

/* ---- Formulario ----------------------------------------------------------
   Se monta recién con los datos ya cargados, así `defaultValues` sale del
   backend y no hace falta sincronizarlo después. */

function Formulario({
  establecimientoId,
  actividadId,
  inicial,
}: {
  establecimientoId: string;
  actividadId: string;
  inicial: ActividadEditarForm;
}) {
  const router = useRouter();
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoGuardado | null>(null);
  const [confirmarSalida, setConfirmarSalida] = useState(false);

  const { guardar, isLoading } = useGuardarEdicion();
  const { subir, isLoading: subiendo } = useSubirArchivos();
  const { cultivos: catalogo, isLoading: cargandoCultivos } = useTiposCultivo(true);

  const form = useForm<ActividadEditarForm>({
    resolver: zodResolver(actividadEditarSchema),
    defaultValues: inicial,
    // `onChange` y no `onTouched`: los rangos etarios se validan entre sí
    // —solapamiento, tarifa base única, nombres repetidos— y esas
    // contradicciones tienen que verse al tipear, no recién al salir del campo.
    mode: "onChange",
  });

  const { control, formState } = form;
  const tarifas = useWatch({ control, name: "tarifas" });
  const nombre = useWatch({ control, name: "nombre" });
  const nuevas = useWatch({ control, name: "nuevas" });

  // Los editores compartidos piden los errores por clave plana; RHF los guarda
  // anidados como los emitió el schema.
  const errs = useMemo(
    () => aErroresPlanosDeForm(formState.errors, tarifas),
    [formState.errors, tarifas],
  );

  const bloqueoTarifas = bloqueoDeTarifas(errs);
  const cantidadErrores = Object.keys(errs).length;

  const arriba = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const salir = () => router.push(LISTADO);

  async function onValid(data: ActividadEditarForm, estado: EstadoActividad) {
    setErrorGuardado(null);
    setResultado(null);

    const res = await guardar(establecimientoId, actividadId, data, estado);
    if (!res.ok) {
      setErrorGuardado(mensajeError(res.code));
      arriba();
      return;
    }

    // Las fotos no viajan en el POST: el backend firma una URL por archivo y el
    // navegador las sube directo al storage. La actividad ya quedó guardada
    // aunque alguna falle.
    let fallidas = 0;
    if (data.nuevas.length > 0 && res.subidas.length > 0) {
      const subida = await subir(data.nuevas, res.subidas);
      fallidas = subida.fallidos.length;
    }

    // Preferimos las advertencias del backend, que ve más que el formulario; si
    // no mandó ninguna, quedan los huecos de edad que calculamos acá.
    const huecos = huecosDeEdad(data.tarifas);
    const advertencias = res.advertencias.length
      ? res.advertencias
      : huecos.length
      ? [`Ninguno de tus rangos cubre ${huecos.join(", ")}. Las personas de esas edades no van a poder reservar.`]
      : [];

    setResultado({ estado, advertencias, fallidas });
    // Con algo que avisar se queda en la pantalla: si redirigiéramos, el aviso
    // se iría con ella.
    if (advertencias.length === 0 && fallidas === 0) setTimeout(salir, 1400);
    else arriba();
  }

  const enviar = (estado: EstadoActividad) =>
    form.handleSubmit(
      (data) => onValid(data, estado),
      // El resolver ya marcó cada campo; sólo falta llevar la vista al resumen.
      () => arriba(),
    );

  const guardando = isLoading || subiendo || formState.isSubmitting;
  const bloqueado = guardando || !!bloqueoTarifas || !!resultado;
  const sucio = formState.isDirty || nuevas.length > 0;

  const toast: ToastData | null = resultado
    ? {
        tone: "success",
        title:
          resultado.estado === "publicado"
            ? "La actividad se modificó y quedó publicada."
            : "Los cambios se guardaron como borrador.",
        sub: `«${nombre}»`,
      }
    : null;

  return (
    <>
      {errorGuardado && <Alert className="mb-5">{errorGuardado}</Alert>}

      {resultado && (
        <div className="mb-5 rounded-md border border-info bg-info-fill px-4 py-3.5 text-[13.5px] text-info-fg">
          <div className="flex items-start gap-2.5">
            <Info className="mt-px size-[18px] shrink-0 text-info" />
            <div className="flex flex-col gap-1.5">
              {resultado.fallidas > 0 && (
                <span>
                  Los cambios se guardaron, pero{" "}
                  {resultado.fallidas === 1
                    ? "una imagen no se pudo subir"
                    : `${resultado.fallidas} imágenes no se pudieron subir`}
                  . Volvé a cargarlas desde esta pantalla.
                </span>
              )}
              {resultado.advertencias.map((a) => (
                <span key={a}>{a}</span>
              ))}
              <button
                type="button"
                onClick={salir}
                className="mt-1 w-fit cursor-pointer text-[13px] font-semibold text-info-fg underline underline-offset-2"
              >
                Volver al listado
              </button>
            </div>
          </div>
        </div>
      )}

      {formState.isSubmitted && cantidadErrores > 0 && (
        <div className="mb-5 flex items-center gap-2.5 rounded-md border border-danger bg-danger-fill px-4 py-3 text-sm font-medium text-danger-fg">
          <AlertCircle className="size-[18px] shrink-0 text-danger" />
          <span>
            Revisá los campos marcados en rojo.{" "}
            {cantidadErrores === 1 ? "Hay 1 campo" : `Hay ${cantidadErrores} campos`} que
            necesita{cantidadErrores === 1 ? "" : "n"} atención. Tus datos se conservaron.
          </span>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={enviar("publicado")} noValidate>
          <Card className="overflow-visible p-0">
            <div className="grid grid-cols-1 shell:grid-cols-2">
              {/* ---------- Columna izquierda · datos y tarifas ---------- */}
              <div className="border-b border-outline-variant p-6 sm:p-8 shell:border-r shell:border-b-0">
                <div className="mb-6 border-b border-outline-variant pb-3 text-[11.5px] font-bold tracking-[.06em] text-fg-3 uppercase">
                  Datos de la actividad
                </div>

                <FormField
                  control={control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem className="mb-[26px] gap-1.5">
                      <FormLabel required className={LABEL}>
                        Nombre
                      </FormLabel>
                      <FormControl>
                        <input
                          {...field}
                          type="text"
                          maxLength={80}
                          placeholder="Ej. Cosecha de Malbec al amanecer"
                          className={CAMPO}
                        />
                      </FormControl>
                      <div className="flex items-center justify-between gap-3">
                        <FormMessage />
                        <span className="ml-auto shrink-0 font-mono text-[11.5px] text-fg-3">
                          {field.value.length}/80
                        </span>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem className="mb-[26px] gap-1.5">
                      <FormLabel required className={LABEL}>
                        Descripción
                      </FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          maxLength={2000}
                          rows={4}
                          placeholder="Contales a los visitantes qué van a vivir: la cosecha, la familia productora, los aromas del viñedo…"
                          className={cn(CAMPO, "h-auto min-h-[110px] resize-y py-2.5 leading-normal")}
                        />
                      </FormControl>
                      <div className="flex items-center justify-between gap-3">
                        <FormMessage />
                        <span className="ml-auto shrink-0 font-mono text-[11.5px] text-fg-3">
                          {field.value.length}/2000
                        </span>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="cultivos"
                  render={({ field, fieldState }) => (
                    <FormItem className="mb-[26px] gap-1.5">
                      <FormLabel required className={LABEL}>
                        Cultivos asociados
                      </FormLabel>
                      <MultiSelect
                        aria-label="Cultivos asociados"
                        options={catalogo.map((c) => ({ id: c.id, label: c.nombre }))}
                        value={field.value}
                        isLoading={cargandoCultivos}
                        loadingText="Cargando cultivos…"
                        emptyText="No hay cultivos cargados en el catálogo."
                        placeholder="Seleccioná los cultivos"
                        error={!!fieldState.error}
                        onChange={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <BloqueTarifas control={control} errs={errs} />
                <BloqueFotos control={control} />
              </div>

              {/* ---------- Columna derecha · contenido de la experiencia ---------- */}
              <div className="p-6 sm:p-8">
                <div className="mb-6 border-b border-outline-variant pb-3 text-[11.5px] font-bold tracking-[.06em] text-fg-3 uppercase">
                  Qué incluye y qué no
                </div>

                <FormField
                  control={control}
                  name="incluye"
                  render={({ field }) => (
                    <ListaEditable
                      title="Qué incluye"
                      icon={<Check className="size-4" />}
                      tone="green"
                      items={field.value}
                      onChange={field.onChange}
                      placeholder="Ej. Degustación de vinos de la finca"
                      addLabel="Agregar ítem"
                      clave="inc"
                      errs={errs}
                      intentado
                      permitirNumeros
                    />
                  )}
                />
                <FormField
                  control={control}
                  name="noIncluye"
                  render={({ field }) => (
                    <ListaEditable
                      title="Qué NO incluye"
                      icon={<Ban className="size-4" />}
                      tone="danger"
                      items={field.value}
                      onChange={field.onChange}
                      placeholder="Ej. Traslado hasta el establecimiento"
                      addLabel="Agregar ítem"
                      clave="ninc"
                      errs={errs}
                      intentado
                      permitirNumeros
                    />
                  )}
                />

                <div className="mt-1 mb-7 h-px bg-outline-variant" />

                <FormField
                  control={control}
                  name="faqs"
                  render={({ field }) => (
                    <FaqEditor
                      icon={<HelpCircle className="size-4" />}
                      faqs={field.value}
                      onChange={field.onChange}
                      errs={errs}
                      intentado
                      permitirNumeros
                    />
                  )}
                />
              </div>
            </div>

            {/* ---------- Footer ---------- */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-b-lg border-t border-outline-variant bg-cream-tert px-7 py-5">
              <span className="flex items-center gap-1.5 text-[13px] text-fg-3">
                <Info className="size-[15px]" />
                Los campos con <span className="font-bold text-danger">*</span> son obligatorios
              </span>

              <div className="flex flex-col items-end gap-2">
                <div className="flex flex-wrap justify-end gap-3">
                  <Button
                    type="button"
                    variant="neutral"
                    onClick={() => (sucio && !resultado ? setConfirmarSalida(true) : salir())}
                  >
                    <X className="size-4" /> Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="neutral"
                    disabled={bloqueado}
                    title={bloqueoTarifas ?? undefined}
                    onClick={enviar("borrador")}
                  >
                    <Save className="size-4" /> Guardar como borrador
                  </Button>
                  <Button type="submit" disabled={bloqueado} title={bloqueoTarifas ?? undefined}>
                    {guardando ? (
                      <>
                        <Loader className="spin size-4" /> Guardando…
                      </>
                    ) : resultado ? (
                      <>
                        <Check className="size-4" /> Guardado
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />{" "}
                        {inicial.estado === "publicado" ? "Publicar cambios" : "Publicar"}
                      </>
                    )}
                  </Button>
                </div>
                {bloqueoTarifas && (
                  // Sin `.err-msg`: esa clase va sin capa en globals.css y su
                  // font-size le gana a `text-xs`.
                  <span className="flex max-w-[420px] items-start justify-end gap-1.5 text-right text-xs font-medium text-danger-fg">
                    <AlertCircle className="mt-px size-3 shrink-0 text-danger" />
                    {bloqueoTarifas}
                  </span>
                )}
              </div>
            </div>
          </Card>
        </form>
      </Form>

      {confirmarSalida && (
        <Modal onClose={() => setConfirmarSalida(false)} className="text-center">
          <span className="mx-auto mb-4 inline-flex size-[52px] items-center justify-center rounded-full bg-warning-fill">
            <AlertCircle className="size-6 text-warning-fg" />
          </span>
          <h3 className="mb-2 font-display text-[21px] font-semibold text-fg-1">¿Salir sin guardar?</h3>
          <p className="mb-6 text-[14.5px] leading-relaxed text-fg-2">
            Hiciste cambios en esta actividad que todavía no se guardaron. Si salís ahora, vas a
            perder las modificaciones.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="neutral" onClick={() => setConfirmarSalida(false)}>
              Seguir editando
            </Button>
            <Button onClick={salir}>
              <LogOut className="size-4" /> Salir sin guardar
            </Button>
          </div>
        </Modal>
      )}

      {toast && <Toast {...toast} />}
    </>
  );
}

/* ---- Esqueleto ----------------------------------------------------------- */
function FormularioSkeleton() {
  return (
    <Card className="p-6 sm:p-8" aria-busy>
      <div className="grid grid-cols-1 gap-8 shell:grid-cols-2">
        {[0, 1].map((col) => (
          <div key={col} className="flex flex-col gap-5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---- Pantalla ------------------------------------------------------------ */
export default function EditarActividadClient({ actividadId }: { actividadId: string }) {
  const router = useRouter();
  // El establecimiento activo lo elige el switcher del shell.
  const { activo } = useEstablecimientos();
  const establecimientoId = activo?.id ?? "";
  const { data, isLoading, error, reload } = useActividadEdicion(establecimientoId, actividadId);

  return (
    <div className="min-h-screen bg-cream-bg">
      <div className="mx-auto max-w-[1180px] px-7 pt-7 pb-16">
        <Button variant="neutral" size="sm" className="mb-4 text-sm" onClick={() => router.push(LISTADO)}>
          <ArrowLeft className="size-4" /> Volver al listado
        </Button>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">
              Modificar actividad
            </h1>
            <p className="mt-1.5 text-[15px] text-fg-2">
              Editá los datos de esta experiencia. Los cambios se aplican al publicar.
            </p>
          </div>
          {activo && (
            <span className="inline-flex items-center gap-1.5 rounded-pill border border-outline-variant bg-surface px-3 py-1.5 text-[13px] font-semibold text-fg-2">
              <MapPin className="size-[13px] text-green-700" /> {activo.nombre}
            </span>
          )}
        </div>

        {!establecimientoId ? (
          <Alert>
            No hay un establecimiento seleccionado. Elegí uno en el menú lateral para poder editar
            actividades.
          </Alert>
        ) : (
          <AsyncBoundary
            loading={isLoading}
            error={error}
            onRetry={reload}
            skeleton={<FormularioSkeleton />}
          >
            {data && (
              <Formulario
                establecimientoId={establecimientoId}
                actividadId={actividadId}
                inicial={data}
              />
            )}
          </AsyncBoundary>
        )}
      </div>
    </div>
  );
}
