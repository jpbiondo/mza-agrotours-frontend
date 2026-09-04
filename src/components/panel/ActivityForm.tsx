"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle, ArrowLeft, ArrowRight, Ban, CalendarDays, Check, FileText, HelpCircle,
  Info, ListChecks, Loader, MapPin, Save, Send, Users, X,
} from "lucide-react";
import { Alert, Button, Card, Toast } from "@/components/ui";
import type { ToastData } from "@/components/ui";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  PASOS, bloqueoDeTarifas, erroresDeActividad, huecosDeEdad, pasoDelError, soloDigitos,
} from "@/lib/actividad-form";
import { useEstablecimientos } from "@/hooks/useEstablecimientos";
import { useTiposCultivo } from "@/hooks/useTiposCultivo";
import { useGuardarActividad, type EstadoGuardado } from "@/hooks/useGuardarActividad";
import type { ActividadFormData } from "@/types/actividad-form";
import { DisponibilidadEditor } from "./actividad/DisponibilidadEditor";
import { FaqEditor, ListaEditable } from "./actividad/ListaEditable";
import { Stepper } from "./actividad/Stepper";
import { TarifasEditor } from "./actividad/TarifasEditor";
import { ErrorMsg, FieldLabel } from "./actividad/campos";

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

const ICONO_PASO = [FileText, ListChecks, Users, CalendarDays];

export default function ActivityForm({ initial }: { initial: ActividadFormData }) {
  const router = useRouter();
  const { activo } = useEstablecimientos();
  const establecimientoId = activo?.id ?? "";

  const [v, setV] = useState<ActividadFormData>(initial);
  const [paso, setPaso] = useState(1);
  const [intentado, setIntentado] = useState(false);
  const [tocados, setTocados] = useState<Set<string>>(() => new Set());
  const [done, setDone] = useState<EstadoGuardado | null>(null);
  const [errorAlta, setErrorAlta] = useState<string | null>(null);

  const { guardar, isLoading } = useGuardarActividad();
  const { cultivos: catalogo, isLoading: cargandoCultivos } = useTiposCultivo(true);

  const set = <K extends keyof ActividadFormData>(k: K, val: ActividadFormData[K]) =>
    setV((s) => ({ ...s, [k]: val }));

  const errs = useMemo(() => erroresDeActividad(v), [v]);
  const ver = (k: string) => (intentado || tocados.has(k) ? errs[k] : undefined);
  const tocar = (k: string) => setTocados((t) => new Set(t).add(k));

  const bloqueoTarifas = bloqueoDeTarifas(errs);
  const huecos = huecosDeEdad(v.tarifas);
  const cantidadErrores = Object.keys(errs).length;

  // Los pasos sólo se marcan en rojo después de intentar guardar: antes, un
  // formulario recién abierto tendría los cuatro en error.
  const pasosConError = useMemo(() => {
    if (!intentado) return new Set<number>();
    return new Set(Object.keys(errs).map(pasoDelError));
  }, [errs, intentado]);

  const irA = (n: number) => {
    setPaso(Math.min(Math.max(n, 1), PASOS.length));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function onSubmit(estado: EstadoGuardado) {
    setIntentado(true);
    setErrorAlta(null);

    if (cantidadErrores > 0) {
      // Al primer paso que tenga algo mal, no al que estabas mirando.
      irA(Math.min(...Object.keys(errs).map(pasoDelError)));
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

  const IconoPaso = ICONO_PASO[paso - 1];
  const metaPaso = PASOS[paso - 1];
  const guardando = isLoading || !!done;
  const noSePuedeGuardar = guardando || !establecimientoId || !!bloqueoTarifas;

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
      <div className="mx-auto max-w-[980px] px-7 pt-7 pb-16">
        <Button
          variant="neutral"
          size="sm"
          className="mb-4 text-sm"
          onClick={() => router.push("/panel/actividades")}
        >
          <ArrowLeft className="size-4" /> Volver al listado
        </Button>

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

        {intentado && cantidadErrores > 0 && (
          <div className="mb-5 flex items-center gap-2.5 rounded-md border border-danger bg-danger-fill px-4 py-3 text-sm font-medium text-danger-fg">
            <AlertCircle className="size-[18px] shrink-0 text-danger" />
            <span>
              Revisá los campos marcados en rojo.{" "}
              {cantidadErrores === 1 ? "Hay 1 campo" : `Hay ${cantidadErrores} campos`} que
              necesita{cantidadErrores === 1 ? "" : "n"} atención. Tus datos se conservaron.
            </span>
          </div>
        )}

        <Card className="overflow-visible p-0">
          <Stepper actual={paso} conError={pasosConError} onIr={irA} />

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
                <div className="mb-[26px]">
                  <FieldLabel required htmlFor="nombre">
                    Nombre
                  </FieldLabel>
                  <input
                    id="nombre"
                    type="text"
                    value={v.nombre}
                    maxLength={80}
                    placeholder="Ej. Cosecha de Malbec al amanecer"
                    aria-invalid={!!ver("nombre") || undefined}
                    onChange={(e) => set("nombre", e.target.value)}
                    onBlur={() => tocar("nombre")}
                    className="h-11 w-full rounded-md border border-input bg-surface px-3.5 text-base text-fg-1 outline-none transition-colors placeholder:text-fg-3 focus-visible:border-green-800 focus-visible:ring-3 focus-visible:ring-green-800/20 aria-invalid:border-danger aria-invalid:bg-danger-fill"
                  />
                  <div className="mt-1.5 flex items-center justify-between gap-3">
                    <ErrorMsg className="mt-0">{ver("nombre")}</ErrorMsg>
                    <span className="ml-auto shrink-0 font-mono text-[11.5px] text-fg-3">
                      {v.nombre.length}/80
                    </span>
                  </div>
                </div>

                <div className="mb-[26px]">
                  <FieldLabel required htmlFor="descripcion">
                    Descripción
                  </FieldLabel>
                  <textarea
                    id="descripcion"
                    value={v.descripcion}
                    maxLength={2000}
                    rows={4}
                    placeholder="Contales a los visitantes qué van a vivir: la cosecha, la familia productora, los aromas del viñedo…"
                    aria-invalid={!!ver("descripcion") || undefined}
                    onChange={(e) => set("descripcion", e.target.value)}
                    onBlur={() => tocar("descripcion")}
                    className="min-h-[110px] w-full resize-y rounded-md border border-input bg-surface px-3.5 py-2.5 text-base leading-normal text-fg-1 outline-none transition-colors placeholder:text-fg-3 focus-visible:border-green-800 focus-visible:ring-3 focus-visible:ring-green-800/20 aria-invalid:border-danger aria-invalid:bg-danger-fill"
                  />
                  <div className="mt-1.5 flex items-center justify-between gap-3">
                    <ErrorMsg className="mt-0">{ver("descripcion")}</ErrorMsg>
                    <span className="ml-auto shrink-0 font-mono text-[11.5px] text-fg-3">
                      {v.descripcion.length}/2000
                    </span>
                  </div>
                </div>

                <div>
                  <FieldLabel required>Cultivos asociados</FieldLabel>
                  <MultiSelect
                    aria-label="Cultivos asociados"
                    options={catalogo.map((c) => ({ id: c.id, label: c.nombre }))}
                    value={v.cultivos}
                    isLoading={cargandoCultivos}
                    loadingText="Cargando cultivos…"
                    emptyText="No hay cultivos cargados en el catálogo."
                    placeholder="Seleccioná los cultivos"
                    error={!!ver("cultivos")}
                    onChange={(ids) => {
                      set("cultivos", ids);
                      tocar("cultivos");
                    }}
                  />
                  <ErrorMsg>{ver("cultivos")}</ErrorMsg>
                </div>
              </div>
            )}

            {/* ---------- Paso 2 · Detalles de la experiencia ---------- */}
            {paso === 2 && (
              <div>
                <ListaEditable
                  title="Qué incluye"
                  icon={<Check className="size-4" />}
                  tone="green"
                  items={v.incluye}
                  onChange={(items) => set("incluye", items)}
                  placeholder="Ej. Degustación de vinos de la finca"
                  addLabel="Agregar ítem"
                  clave="inc"
                  errs={errs}
                  intentado={intentado}
                />
                <ListaEditable
                  title="Qué NO incluye"
                  icon={<Ban className="size-4" />}
                  tone="danger"
                  items={v.noIncluye}
                  onChange={(items) => set("noIncluye", items)}
                  placeholder="Ej. Traslado hasta el establecimiento"
                  addLabel="Agregar ítem"
                  clave="ninc"
                  errs={errs}
                  intentado={intentado}
                />

                <div className="mt-1 mb-7 h-px bg-outline-variant" />

                <FaqEditor
                  icon={<HelpCircle className="size-4" />}
                  faqs={v.faqs}
                  onChange={(faqs) => set("faqs", faqs)}
                  errs={errs}
                  intentado={intentado}
                />
              </div>
            )}

            {/* ---------- Paso 3 · Participantes y tarifas ---------- */}
            {paso === 3 && (
              <div>
                <div className="mb-[26px] max-w-[220px]">
                  <FieldLabel required htmlFor="cupos">
                    Cupos máximos
                  </FieldLabel>
                  <input
                    id="cupos"
                    type="text"
                    inputMode="numeric"
                    value={v.cupos}
                    placeholder="Ej. 20"
                    aria-invalid={!!ver("cupos") || undefined}
                    onChange={(e) => set("cupos", soloDigitos(e.target.value))}
                    onBlur={() => tocar("cupos")}
                    className="h-11 w-full rounded-md border border-input bg-surface px-3.5 text-base text-fg-1 outline-none transition-colors placeholder:text-fg-3 focus-visible:border-green-800 focus-visible:ring-3 focus-visible:ring-green-800/20 aria-invalid:border-danger aria-invalid:bg-danger-fill"
                  />
                  <ErrorMsg>{ver("cupos")}</ErrorMsg>
                </div>

                <TarifasEditor
                  filas={v.tarifas}
                  onChange={(filas) => set("tarifas", filas)}
                  errs={errs}
                  intentado={intentado}
                />

                {huecos.length > 0 && (
                  <div className="flex items-start gap-2 rounded-md bg-info-fill px-3.5 py-2.5 text-[13px] text-info-fg">
                    <Info className="mt-px size-[15px] shrink-0 text-info" />
                    <span>
                      Ninguno de tus rangos cubre {huecos.join(", ")}. Si esperás visitantes de esas
                      edades, agregales un rango.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ---------- Paso 4 · Disponibilidad ---------- */}
            {paso === 4 && (
              <DisponibilidadEditor
                days={v.days}
                onDays={(days) => set("days", days)}
                fechaDesde={v.fechaDesde}
                fechaHasta={v.fechaHasta}
                onFechas={(desde, hasta) => setV((s) => ({ ...s, fechaDesde: desde, fechaHasta: hasta }))}
                errs={errs}
                intentado={intentado}
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
                <Button variant="neutral" onClick={() => router.push("/panel/actividades")}>
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
                    disabled={paso === 3 && !!bloqueoTarifas}
                    title={paso === 3 && bloqueoTarifas ? bloqueoTarifas : undefined}
                  >
                    Siguiente <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="neutral"
                      disabled={noSePuedeGuardar}
                      title={bloqueoTarifas ?? undefined}
                      onClick={() => onSubmit("borrador")}
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
                      title={bloqueoTarifas ?? undefined}
                      onClick={() => onSubmit("publicado")}
                    >
                      {isLoading ? (
                        <>
                          <Loader className="spin size-4" /> Guardando…
                        </>
                      ) : done === "publicado" ? (
                        <>
                          <Check className="size-4" /> Publicada
                        </>
                      ) : (
                        <>
                          <Send className="size-4" /> Publicar
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
              {/* Sólo en el último paso: en el 3 el editor de tarifas ya tiene
                  el mismo aviso arriba, y repetirlo acá lo dice tres veces. */}
              {paso === PASOS.length && bloqueoTarifas && (
                // Sin `.err-msg`: esa clase va sin capa en globals.css y su
                // font-size le gana a `text-xs`, además de centrar un texto
                // que acá puede ocupar dos renglones.
                <span className="flex max-w-[420px] items-start justify-end gap-1.5 text-right text-xs font-medium text-danger-fg">
                  <AlertCircle className="mt-px size-3 shrink-0 text-danger" />
                  {bloqueoTarifas}
                </span>
              )}
            </div>
          </div>
        </Card>
      </div>

      {toast && <Toast {...toast} />}
    </div>
  );
}
