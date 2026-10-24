"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft, ArrowRight, Ban, CalendarDays, Check, FileText, HelpCircle,
  Info, ListChecks, MapPin, Save, Send, Users, X,
} from "lucide-react";
import { Alert, BackLink, Button, Card } from "@/components/ui";
import { notify } from "@/lib/notify";
import { MultiSelect } from "@/components/ui/multi-select";
import { ImageUploader } from "@/components/ui/image-uploader";
import { FaltanCampos } from "@/components/ui/faltan-campos";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  PASOS, actividadAltaSchema, aErroresPlanosDeForm, erroresDeActividad, huecosDeEdad,
  pasoDelError, soloDigitos,
} from "@/lib/actividad-form";
import type { ErroresActividad } from "@/lib/actividad-form";
import { cn } from "@/lib/utils";
import { UPLOAD_FOTOS } from "@/data/actividad-form";
import { useEstablecimientos, useRutaPanel } from "@/hooks/useEstablecimientos";
import { useFotosActividad } from "@/hooks/useFotosActividad";
import { useTiposCultivo } from "@/hooks/useTiposCultivo";
import { useGuardarActividad, type EstadoGuardado } from "@/hooks/useGuardarActividad";
import type { ActividadFormData } from "@/types/actividad-form";
import { DisponibilidadEditor } from "./actividad/DisponibilidadEditor";
import { FaqEditor, ListaEditable } from "./actividad/ListaEditable";
import { Stepper } from "./actividad/Stepper";
import { TarifasEditor } from "./actividad/TarifasEditor";
import { CAMPO, FieldLabel } from "./actividad/campos";

/** Errores de dominio del alta. El resto cae en el genérico. */
const ERROR_ALTA: Record<string, string> = {
  // Llega si suspendieron el establecimiento con el formulario ya abierto: el
  // guard de la ruta sólo mira el estado que había al entrar.
  "E.suspendido":
    "El establecimiento está suspendido, así que no se pueden crear actividades. Vas a poder cuando un administrador lo reactive.",
  // TODO backend: confirmar el resto de los códigos.
};

function mensajeAlta(code?: string): string {
  return (
    (code && ERROR_ALTA[code]) ||
    "No pudimos guardar la actividad. Probá de nuevo en unos minutos."
  );
}

const ICONO_PASO = [FileText, ListChecks, Users, CalendarDays];
const LABEL = "font-semibold";

/**
 * Errores del schema que no son de un campo sino de una combinación (ver
 * `refinarTarifas` y `refinarDias`). RHF sólo actualiza el error del campo que
 * cambió, así que estos no le llegan nunca sin un submit: se toman de la
 * validación completa en cuanto el productor modifica el bloque.
 */
const SINTETICOS_TARIFAS = ["tarNone", "tarBase", "tarDup", "tarOverlap"];
const SINTETICOS_DIAS = ["diasNone", "diasHoras", "diasOrden", "diasRango"];

/** Los campos de cada paso, para marcarlos todos con "Ver qué falta". */
const CAMPOS_DEL_PASO: Record<number, FieldPath<ActividadFormData>[]> = {
  1: ["nombre", "descripcion", "cultivos"],
  2: ["incluye", "noIncluye", "faqs"],
  3: ["cupos", "tarifas"],
  4: ["days", "fechaDesde", "fechaHasta"],
};

function elegir(e: ErroresActividad, claves: string[]): ErroresActividad {
  return Object.fromEntries(claves.filter((k) => e[k]).map((k) => [k, e[k]]));
}

export default function ActivityForm({ initial }: { initial: ActividadFormData }) {
  const router = useRouter();
  const { activo } = useEstablecimientos();
  const establecimientoId = activo?.id ?? "";
  const listado = useRutaPanel()("actividades");

  const [paso, setPaso] = useState(1);
  const [done, setDone] = useState<EstadoGuardado | null>(null);
  // Pasos donde se pidió "Ver qué falta". Sólo hace falta para los errores de
  // combinación: los de campo los marca `trigger` y RHF los mantiene al día.
  const [revisados, setRevisados] = useState<Set<number>>(() => new Set());
  const [errorAlta, setErrorAlta] = useState<string | null>(null);

  const { guardar, isLoading } = useGuardarActividad();
  const fotos = useFotosActividad(establecimientoId);
  const { cultivos: catalogo, isLoading: cargandoCultivos } = useTiposCultivo(true);

  const form = useForm<ActividadFormData>({
    resolver: zodResolver(actividadAltaSchema),
    defaultValues: initial,
    // `onChange` y no `onTouched`, como en la modificación: los rangos etarios
    // se validan entre sí y esas contradicciones tienen que verse al tipear.
    mode: "onChange",
  });
  const { control, formState } = form;

  // `defaultValues` trae el formulario completo, así que lo observado nunca
  // tiene huecos aunque el tipo de `useWatch` lo deje parcial.
  const valores = useWatch({ control }) as ActividadFormData;

  // Todo lo que está mal, se haya tocado o no. Es lo que decide si se puede
  // avanzar o guardar; lo que se pinta en rojo sale de RHF (`errs`, abajo).
  const pendientes = useMemo(() => erroresDeActividad(valores), [valores]);

  // Los editores compartidos piden los errores por clave plana; RHF los guarda
  // anidados como los emitió el schema.
  const tarifasModificadas = !!formState.dirtyFields.tarifas || revisados.has(3);
  const diasModificados = !!formState.dirtyFields.days || revisados.has(4);
  const errs = useMemo(
    () => ({
      ...aErroresPlanosDeForm(formState.errors, valores.tarifas),
      ...(tarifasModificadas ? elegir(pendientes, SINTETICOS_TARIFAS) : {}),
      ...(diasModificados ? elegir(pendientes, SINTETICOS_DIAS) : {}),
    }),
    [formState.errors, valores.tarifas, pendientes, tarifasModificadas, diasModificados],
  );

  const huecos = huecosDeEdad(valores.tarifas);

  // Cuántos errores tiene cada paso. Se avanza de a uno y sólo con el paso en
  // regla, así el productor se entera de lo que falta donde lo está cargando y
  // no recién al final.
  const erroresPorPaso = useMemo(() => {
    const cuenta = new Map<number, number>();
    for (const k of Object.keys(pendientes)) {
      const n = pasoDelError(k);
      cuenta.set(n, (cuenta.get(n) ?? 0) + 1);
    }
    return cuenta;
  }, [pendientes]);
  const erroresDelPaso = erroresPorPaso.get(paso) ?? 0;
  // Hasta dónde deja llegar el stepper: el primer paso con errores. Volver
  // siempre se puede.
  const pasoMaximo = PASOS.find((p) => erroresPorPaso.has(p.n))?.n ?? PASOS.length;

  const irA = (n: number) => {
    setPaso(Math.min(Math.max(n, 1), pasoMaximo));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Marca en rojo todo lo que falta en el paso, aunque no se haya tocado, y
  // lleva el foco al primero. Los errores de combinación no pasan por
  // `trigger`: quedarían fijos en `formState.errors` aunque se corrijan después.
  const verQueFalta = () => {
    setRevisados((r) => new Set(r).add(paso));
    void form.trigger(CAMPOS_DEL_PASO[paso], { shouldFocus: true });
  };

  const enviar = (estado: EstadoGuardado) =>
    form.handleSubmit(async (data) => {
      setErrorAlta(null);

      // Las fotos ya están en el bucket: viaja la lista de keys, y su orden es el
      // que el productor dejó en la grilla.
      const res = await guardar(establecimientoId, data, estado, fotos.claims);
      if (!res.ok) {
        setErrorAlta(mensajeAlta(res.code));
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setDone(estado);
      notify.successDetailed(
        estado === "publicado" ? "Actividad publicada correctamente." : "Borrador guardado correctamente.",
        `«${data.nombre}»`,
      );
      setTimeout(() => router.push(listado), 1400);
    });

  const IconoPaso = ICONO_PASO[paso - 1];
  const metaPaso = PASOS[paso - 1];
  const guardando = isLoading || !!done;
  // No se guarda con una foto a medio subir —su key todavía no existe— ni con
  // una fallada: publicar ahora la perdería sin avisar.
  const noSePuedeGuardar =
    guardando ||
    !establecimientoId ||
    Object.keys(pendientes).length > 0 ||
    fotos.subiendo ||
    fotos.conError > 0;
  const motivoBloqueo = erroresDelPaso > 0 ? "Completá los campos de este paso para seguir." : undefined;

  return (
    <div className="min-h-screen bg-cream-bg">
      <div className="mx-auto max-w-[980px] px-7 pt-7 pb-16">
        <BackLink href={listado} className="mb-4">Volver al listado</BackLink>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">
              Crear actividad
            </h1>
            <p className="mt-1.5 text-[15px] text-fg-2">
              Cargá una experiencia de tu establecimiento para darle visibilidad a los visitantes.
            </p>
          </div>
          {activo && (
            <span className="inline-flex items-center gap-1.5 rounded-pill border border-outline-variant bg-surface px-3 py-1.5 text-[13px] font-semibold text-fg-2">
              <MapPin className="size-[13px] text-green-700" /> {activo.nombre}
            </span>
          )}
        </div>

        {!establecimientoId && (
          <Alert className="mb-5">
            No hay un establecimiento seleccionado. Elegí uno en el menú lateral para poder crear
            actividades.
          </Alert>
        )}
        {errorAlta && <Alert className="mb-5">{errorAlta}</Alert>}

        <Form {...form}>
        <Card className="overflow-visible p-0">
          <Stepper actual={paso} maximo={pasoMaximo} onIr={irA} />

          <div className="p-6 sm:p-9">
            <div className="mb-[26px] flex items-center gap-3 border-b border-outline-variant pb-[18px]">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[11px] bg-green-050">
                <IconoPaso className="size-5 text-green-800" />
              </span>
              <div>
                <div className="font-display text-xl leading-tight font-semibold text-fg-1">
                  {metaPaso.label}
                </div>
                <div className="mt-0.5 text-[13px] text-fg-3">{metaPaso.sub}</div>
              </div>
            </div>

            {/* ---------- Paso 1 · Información general ---------- */}
            {paso === 1 && (
              <div>
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
                    <FormItem className="gap-1.5">
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

                <div className="mt-[26px]">
                  <FieldLabel>Imágenes</FieldLabel>
                  <ImageUploader
                    limites={UPLOAD_FOTOS}
                    fotos={fotos.fotos}
                    onAgregar={fotos.agregar}
                    onQuitar={fotos.quitar}
                    onMover={fotos.mover}
                    onReintentar={fotos.reintentar}
                  />
                </div>
              </div>
            )}

            {/* ---------- Paso 2 · Detalles de la experiencia ---------- */}
            {paso === 2 && (
              <div>
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
                    />
                  )}
                />
              </div>
            )}

            {/* ---------- Paso 3 · Participantes y tarifas ---------- */}
            {paso === 3 && (
              <div>
                <FormField
                  control={control}
                  name="cupos"
                  render={({ field }) => (
                    <FormItem className="mb-[26px] max-w-[220px] gap-1.5">
                      <FormLabel required className={LABEL}>
                        Cupos máximos
                      </FormLabel>
                      <FormControl>
                        <input
                          {...field}
                          type="text"
                          inputMode="numeric"
                          placeholder="Ej. 20"
                          onChange={(e) => field.onChange(soloDigitos(e.target.value))}
                          className={CAMPO}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="tarifas"
                  render={({ field }) => (
                    <TarifasEditor filas={field.value} onChange={field.onChange} errs={errs} intentado />
                  )}
                />

                {huecos.length > 0 && (
                  <Alert tone="info">
                    Ninguno de tus rangos cubre {huecos.join(", ")}. Si esperás visitantes de esas
                    edades, agregales un rango.
                  </Alert>
                )}
              </div>
            )}

            {/* ---------- Paso 4 · Disponibilidad ---------- */}
            {paso === 4 && (
              <FormField
                control={control}
                name="days"
                render={({ field }) => (
                  <DisponibilidadEditor
                    days={field.value}
                    onDays={field.onChange}
                    fechaDesde={valores.fechaDesde}
                    fechaHasta={valores.fechaHasta}
                    // Las dos juntas: la de fin se valida contra la de inicio,
                    // así que cambiar una tiene que revalidar la otra.
                    onFechas={(desde, hasta) => {
                      const opciones = { shouldValidate: true, shouldDirty: true } as const;
                      form.setValue("fechaDesde", desde, opciones);
                      form.setValue("fechaHasta", hasta, opciones);
                    }}
                    errs={errs}
                    intentado
                  />
                )}
              />
            )}
          </div>

          {/* ---------- Navegación ---------- */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-b-lg border-t border-outline-variant bg-cream-tert px-7 py-5">
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-semibold text-fg-2">
                Paso {paso} de {PASOS.length}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-fg-3">
                <Info className="size-[13px]" />
                Los campos con <span className="font-bold text-danger">*</span> son obligatorios
              </span>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex flex-wrap justify-end gap-3">
                <Button variant="neutral" onClick={() => router.push(listado)}>
                  <X className="size-4" /> Cancelar
                </Button>
                {paso > 1 && (
                  <Button variant="neutral" onClick={() => irA(paso - 1)}>
                    <ArrowLeft className="size-4" /> Anterior
                  </Button>
                )}
                {paso < PASOS.length ? (
                  <Button
                    onClick={() => irA(paso + 1)}
                    disabled={erroresDelPaso > 0}
                    title={motivoBloqueo}
                  >
                    Siguiente <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="neutral"
                      disabled={noSePuedeGuardar}
                      title={motivoBloqueo}
                      onClick={enviar("borrador")}
                    >
                      {done === "borrador" ? (
                        <>
                          <Check className="size-4" /> Guardado
                        </>
                      ) : (
                        <>
                          <Save className="size-4" /> Guardar como borrador
                        </>
                      )}
                    </Button>
                    <Button
                      disabled={noSePuedeGuardar}
                      title={motivoBloqueo}
                      onClick={enviar("publicado")}
                      loading={isLoading}
                    >
                      {done === "publicado" ? <Check className="size-4" /> : <Send className="size-4" />}
                      {done === "publicado" ? "Publicada" : "Publicar"}
                    </Button>
                  </>
                )}
              </div>
              <FaltanCampos
                faltan={erroresDelPaso}
                para={paso < PASOS.length ? "seguir" : "guardar"}
                onVerQueFalta={verQueFalta}
              />
            </div>
          </div>
        </Card>
        </Form>
      </div>

    </div>
  );
}
