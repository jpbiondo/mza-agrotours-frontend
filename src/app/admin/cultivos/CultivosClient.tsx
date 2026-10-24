"use client";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sprout, Utensils, Leaf, Scissors, Grape, Pencil, Trash2, Lock, Eye } from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { ActionBtn, Alert, Card, Skeleton } from "@/components/ui";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DialogBody } from "@/components/ui/dialog";
import { notify } from "@/lib/notify";
import { FaltanCampos, useCamposFaltantes } from "@/components/ui/faltan-campos";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { gradienteDe } from "@/lib/color";
import { PermisoAdmin } from "@/lib/permisos";
import { tienePermiso } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import {
  useActualizarCultivo,
  useCatalogoCultivos,
  useCrearCultivo,
  useCultivoDetalle,
  useEliminarCultivo,
} from "@/hooks/useGestionCultivos";
import type { CultivoCatalogo, DatosCultivo, Estacion } from "@/types/gestionCr";
import {
  GcrFormShell, GcrFormHeader, GcrFormFooter, GcrFieldLabel, GcrErr,
  GcrSeasonBar, GcrSeasonEditor, GcrListEditor, GcrStats, GcrSearchBar, GcrEmptyState, GcrPageHead,
  GcrNoMatch,
} from "@/components/admin/gcr/shared";
import {
  GcrNutricionEditor, nutricionInicial, type ErroresNutricion,
} from "@/components/admin/gcr/nutricion";
import { GcrImagePicker } from "@/components/admin/gcr/image-picker";
import { LIMITES_IMAGEN_CULTIVO } from "@/data/gestionCr";
import { useImagenUnica } from "@/hooks/useImagenUnica";
import { cultivoSchema, type CultivoForm as CultivoFormValues } from "./schema";

/** Alta: doce meses en reposo, un beneficio en blanco y la nutrición de siempre. */
const CULTIVO_VACIO: DatosCultivo = {
  nombre: "",
  descripcion: "",
  beneficios: [""],
  calendario: Array(12).fill("r") as Estacion[],
  foto: null,
  ...nutricionInicial(),
};

/** No lleva id: la carpeta y el permiso los decide la ruta. */
const PRESIGN_CULTIVO = "/admin/tipos-cultivo/archivos/presign";

/** Motivo de los botones apagados cuando falta GESTIONAR_CULTIVOS. */
const SIN_GESTION = "Necesitás el permiso de gestión de cultivos";

/**
 * Mensaje del rechazo al guardar. El backend manda sus motivos redactados
 * —nombre repetido, campos del DTO— así que se muestran tal cual; el genérico
 * queda para el fallo técnico, que es el único caso donde reintentar sirve.
 */
function mensajeGuardar(res: { errores?: string[] }, editando: boolean): string {
  if (res.errores && res.errores.length > 0) return res.errores.join(" · ");
  return editando
    ? "No pudimos guardar los cambios. Probá de nuevo en unos minutos."
    : "No pudimos agregar el cultivo. Probá de nuevo en unos minutos.";
}

function mensajeBaja(code?: string): string {
  return code
    ? "No se pudo eliminar el cultivo."
    : "No pudimos eliminar el cultivo. Probá de nuevo en unos minutos.";
}

/**
 * El backend manda `puedeEliminarse` pero no el motivo, así que se infiere de
 * los contadores. La tercera rama existe porque puede bloquear por una regla
 * que no publica: sin ella el mensaje mentiría.
 */
function motivoNoBorrable(c: CultivoCatalogo): string {
  if (c.cantidadRecetas > 0 && c.cantidadActividades > 0) return "No se puede eliminar con recetas y actividades vigentes asociadas";
  if (c.cantidadRecetas > 0) return "No se puede eliminar con recetas asociadas";
  if (c.cantidadActividades > 0) return "No se puede eliminar con actividades vigentes";
  return "Este cultivo no se puede eliminar";
}

/* ---- Cáscara de la tabla -------------------------------------------------
   La comparten el esqueleto y la tabla con datos, y los anchos van fijos: con
   el layout automático las columnas se recalculan al llegar los datos y salta
   todo, sobre todo Acciones, que va alineada a la derecha. */

const COLUMNAS = ["Cultivo", "Calendario de cosecha", "Recetas", "Actividades", "Acciones"];
const ANCHOS = [undefined, "w-[300px]", "w-[110px]", "w-[130px]", "w-[250px]"];

function Tabla({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1020px] table-fixed border-collapse">
        <colgroup>
          {ANCHOS.map((w, i) => (
            <col key={i} className={w} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {COLUMNAS.map((h, i) => (
              <th
                key={h}
                className={cn(
                  "border-b-2 border-outline-variant px-4 py-3.5 text-[12.5px] font-bold tracking-[.05em] whitespace-nowrap text-fg-2 uppercase",
                  i === 2 || i === 3 ? "text-center" : i === 4 ? "text-right" : "text-left",
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        {children}
      </table>
    </div>
  );
}

/* ---- Esqueleto ----------------------------------------------------------- */

const FILAS_SKELETON = [
  { nombre: "w-[130px]" },
  { nombre: "w-[168px]" },
  { nombre: "w-[104px]" },
  { nombre: "w-[150px]" },
  { nombre: "w-[186px]" },
];

function CultivosSkeleton() {
  return (
    <div className="mx-auto max-w-[1240px] px-7 pt-7 pb-[72px]" aria-busy>
      <span role="status" className="sr-only">
        Cargando el catálogo de cultivos…
      </span>

      <GcrPageHead
        crumb="Cultivos"
        title="Cultivos"
        desc="Administrá el catálogo de cultivos de la plataforma. Cada cultivo queda disponible para que los establecimientos lo asocien a sus actividades y para las recetas de la finca."
        actionLabel="Agregar cultivo"
        onAction={() => {}}
        accionDeshabilitada
      />

      {/* "—" y no cero: "0 cultivos" es una afirmación, y todavía no sabemos nada. */}
      <GcrStats
        items={[
          { icon: <Sprout className="size-5 text-green-800" />, label: "Cultivos en el catálogo", value: "—" },
          { icon: <Utensils className="size-5 text-green-800" />, label: "Recetas en el catálogo", value: "—" },
        ]}
      />
      <GcrSearchBar query="" onQuery={() => {}} placeholder="Buscar por nombre" disabled />

      <Card className="overflow-hidden p-0">
        <Tabla>
          <tbody>
            {FILAS_SKELETON.map((f, i) => (
              <tr key={i} className="border-b border-cream-tert">
                <td className="p-4 align-middle">
                  <div className="flex items-center gap-3.5">
                    <Skeleton className="size-[46px] rounded-[10px]" />
                    <Skeleton className={cn("h-4", f.nombre)} />
                  </div>
                </td>
                <td className="p-4 align-middle">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 12 }, (_, m) => (
                        <Skeleton key={m} className="size-[19px] rounded" />
                      ))}
                    </div>
                    <Skeleton className="h-3 w-[130px]" />
                  </div>
                </td>
                <td className="p-4 align-middle">
                  <Skeleton className="mx-auto h-4 w-8" />
                </td>
                <td className="p-4 align-middle">
                  <Skeleton className="mx-auto h-4 w-8" />
                </td>
                <td className="p-4 align-middle">
                  <div className="flex justify-end gap-2.5">
                    <Skeleton className="h-[38px] w-[92px]" />
                    <Skeleton className="h-[38px] w-[106px]" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      </Card>
    </div>
  );
}

/* ---- Formulario ---------------------------------------------------------- */

function CultivoForm({
  initial,
  editando,
  busy,
  error,
  existingNames,
  onCancel,
  onSave,
}: {
  initial: DatosCultivo;
  editando: boolean;
  busy: boolean;
  error: string | null;
  existingNames: string[];
  onCancel: () => void;
  onSave: (datos: DatosCultivo) => void;
}) {
  // `existingNames` llega como un array nuevo en cada render de la pantalla;
  // el schema se rearma sólo cuando cambia su contenido.
  const ocupados = existingNames.join("\n");
  const schema = useMemo(() => cultivoSchema(ocupados ? ocupados.split("\n") : []), [ocupados]);

  const form = useForm<CultivoFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: initial.nombre,
      descripcion: initial.descripcion,
      beneficios: initial.beneficios.length > 0 ? initial.beneficios : [""],
      calendario: initial.calendario,
      porcionReferencia: initial.porcionReferencia,
      informacionNutricional: initial.informacionNutricional,
    },
    // `onChange` y no `onTouched`: un nombre que ya existe se avisa mientras se
    // escribe, no recién al salir del campo.
    mode: "onChange",
  });
  const { control, formState } = form;
  const { faltan, verQueFalta } = useCamposFaltantes(form, schema);
  const nombre = useWatch({ control, name: "nombre" });
  const descripcion = useWatch({ control, name: "descripcion" });
  const porcion = useWatch({ control, name: "porcionReferencia" });
  const filas = useWatch({ control, name: "informacionNutricional" });
  // El formulario monta recién con el detalle cargado, así que alcanza con
  // pasarle la imagen inicial una vez.
  const imagen = useImagenUnica(PRESIGN_CULTIVO, LIMITES_IMAGEN_CULTIVO, initial.foto);

  // El editor nutricional pide sus errores con su propia forma; RHF los tiene
  // anidados como los emitió el schema.
  const errNutri: ErroresNutricion = {
    porcion: formState.errors.porcionReferencia?.message,
    filas: filas.map((_, i) => formState.errors.informacionNutricional?.[i]?.message ?? null),
    global: formState.errors.informacionNutricional?.message,
  };

  const guardar = form.handleSubmit((v) =>
    onSave({
      nombre: v.nombre,
      descripcion: v.descripcion,
      beneficios: v.beneficios.map((b) => b.trim()).filter(Boolean),
      calendario: v.calendario,
      porcionReferencia: v.porcionReferencia.trim(),
      informacionNutricional: v.informacionNutricional.map((f) => ({
        ...f,
        nombre: f.nombre.trim(),
        valor: f.valor.trim(),
      })),
      // Ya está en el bucket: lo que viaja es la key.
      foto: imagen.claim && { ...imagen.claim, downloadUrl: imagen.imagen?.previewUrl ?? "" },
    }),
  );

  return (
    <>
      <GcrFormHeader
        eyebrow={editando ? "Editar cultivo" : "Nuevo cultivo"}
        title={editando ? "Editar tipo de cultivo" : "Agregar un cultivo"}
        sub={
          editando
            ? "Modificá los datos del cultivo disponible para todos los establecimientos."
            : "Sumá un tipo de cultivo al catálogo de la plataforma. Queda disponible para asociar a actividades y recetas."
        }
        busy={busy}
      />

      <Form {...form}>
      <DialogBody className="flex flex-col gap-[22px]">
        <FormField
          control={control}
          name="nombre"
          render={({ field }) => (
            <FormItem className="gap-2">
              <FormLabel required className="font-display text-[15.5px] font-semibold">
                Nombre
              </FormLabel>
              <FormControl>
                <TextField {...field} maxLength={60} placeholder="Ej. Uva Malbec" />
              </FormControl>
              <div className="flex items-center justify-between gap-3">
                <FormMessage />
                <span className="ml-auto shrink-0 font-mono text-xs text-fg-3">{nombre.length}/60</span>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="descripcion"
          render={({ field }) => (
            <FormItem className="gap-2">
              <FormLabel required className="font-display text-[15.5px] font-semibold">
                Descripción
              </FormLabel>
              <FormControl>
                <TextArea
                  {...field}
                  rows={4}
                  maxLength={500}
                  placeholder="Contá qué caracteriza a este cultivo, cuándo y cómo se cosecha en Mendoza."
                />
              </FormControl>
              <div className="flex items-center justify-between gap-3">
                <FormMessage />
                <span
                  className={cn(
                    "ml-auto shrink-0 font-mono text-xs",
                    descripcion.length >= 500 ? "text-danger" : "text-fg-3",
                  )}
                >
                  {descripcion.length}/500
                </span>
              </div>
            </FormItem>
          )}
        />

        <div>
          <GcrFieldLabel style={{ marginBottom: 4 }}>Imagen representativa</GcrFieldLabel>
          <p className="mb-3 text-[13.5px] leading-relaxed text-fg-2">
            Opcional. Se muestra en el listado y en la ficha pública del cultivo. Elegí una foto con
            luz natural del cultivo en el campo.
          </p>
          <GcrImagePicker imagen={imagen} limites={LIMITES_IMAGEN_CULTIVO} />
        </div>

        <FormField
          control={control}
          name="beneficios"
          render={({ field, fieldState }) => (
            <div>
              <GcrFieldLabel required style={{ marginBottom: 4 }}>
                Beneficios para la alimentación
              </GcrFieldLabel>
              <p className="mb-3 text-[13.5px] leading-relaxed text-fg-2">
                Se muestran como lista en la ficha pública del cultivo. Hasta 100 caracteres cada uno.
              </p>
              <GcrListEditor
                items={field.value}
                onChange={field.onChange}
                placeholder="Ej. Antioxidante natural por su contenido de polifenoles"
                addLabel="Agregar beneficio"
                maxLength={100}
              />
              {fieldState.error?.message && (
                <div className="mt-[7px]">
                  <GcrErr msg={fieldState.error.message} />
                </div>
              )}
            </div>
          )}
        />

        <GcrNutricionEditor
          porcion={porcion}
          filas={filas}
          onPorcion={(v) => form.setValue("porcionReferencia", v, { shouldValidate: true, shouldDirty: true })}
          onFilas={(v) => form.setValue("informacionNutricional", v, { shouldValidate: true, shouldDirty: true })}
          attempted
          errores={errNutri}
        />

        <FormField
          control={control}
          name="calendario"
          render={({ field, fieldState }) => (
            <div>
              <GcrFieldLabel required style={{ marginBottom: 4 }}>
                Estacionalidad anual
              </GcrFieldLabel>
              <p className="mb-3 text-[13.5px] leading-relaxed text-fg-2">
                Asigná a cada mes un estado: cosecha, crecimiento o reposo.
              </p>
              <GcrSeasonEditor value={field.value} onChange={field.onChange} />
              {fieldState.error?.message && (
                <div className="mt-[7px]">
                  <GcrErr msg={fieldState.error.message} />
                </div>
              )}
            </div>
          )}
        />
      </DialogBody>
      </Form>

      <GcrFormFooter
        onCancel={onCancel}
        onSave={guardar}
        saveLabel={editando ? "Guardar cambios" : "Agregar cultivo"}
        saveIcon={editando ? undefined : <Sprout className="size-[17px]" />}
        // Con la imagen a medio subir su key todavía no existe: guardar ahora
        // la perdería sin avisar.
        busy={busy || imagen.subiendo}
        saveDisabled={faltan > 0}
        aviso={
          <FaltanCampos
            faltan={faltan}
            para={editando ? "guardar" : "agregar el cultivo"}
            onVerQueFalta={verQueFalta}
          />
        }
        error={error}
      />
    </>
  );
}

/* ---- Tabla con datos ------------------------------------------------------ */

function Filas({
  cultivos,
  detalleId,
  gestionar,
  onEdit,
  onAskDelete,
}: {
  cultivos: CultivoCatalogo[];
  detalleId: string | null;
  /** Sin GESTIONAR_CULTIVOS la pantalla es de sólo lectura. */
  gestionar: boolean;
  onEdit: (c: CultivoCatalogo) => void;
  onAskDelete: (c: CultivoCatalogo) => void;
}) {
  return (
    <tbody>
      {cultivos.map((c) => {
        const motivo = motivoNoBorrable(c);
        const abriendo = detalleId === c.id;
        return (
          <tr key={c.id} className="border-b border-cream-tert">
            <td className="p-4 align-middle">
              <div className="flex items-center gap-3.5">
                <span
                  className="flex size-[46px] shrink-0 items-center justify-center rounded-[10px]"
                  style={{ background: gradienteDe(c.nombre) }}
                >
                  <Leaf className="size-[21px] text-white/90" />
                </span>
                <div className="min-w-0 font-display text-base font-semibold text-fg-1">
                  {c.nombre}
                </div>
              </div>
            </td>

            <td className="p-4 align-middle">
              <div className="flex flex-col gap-1.5">
                <GcrSeasonBar calendario={c.calendario} />
                <span className="inline-flex items-center gap-1.5 text-[12.5px] text-fg-2">
                  <Scissors className="size-[13px] text-green-700" />
                  Cosecha: {c.resumenCosecha || "Sin cosecha"}
                </span>
              </div>
            </td>

            <td className="p-4 text-center align-middle">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 font-mono text-sm font-bold",
                  c.cantidadRecetas ? "text-fg-1" : "text-fg-3",
                )}
              >
                <Utensils className="size-[15px] text-brown-700" />
                {c.cantidadRecetas}
              </span>
            </td>

            <td className="p-4 text-center align-middle">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 font-mono text-sm font-bold",
                  c.cantidadActividades ? "text-fg-1" : "text-fg-3",
                )}
              >
                <Grape className="size-[15px] text-green-700" />
                {c.cantidadActividades}
              </span>
            </td>

            <td className="p-4 align-middle">
              <div className="flex items-center justify-end gap-2.5">
                <ActionBtn
                  icon={<Pencil className="size-[17px]" />}
                  label="Editar"
                  disabled={!gestionar}
                  loading={abriendo}
                  title={gestionar ? "Editar el cultivo" : SIN_GESTION}
                  onClick={() => onEdit(c)}
                />
                <ActionBtn
                  icon={<Trash2 className="size-[17px]" />}
                  label="Eliminar"
                  tone="danger"
                  disabled={!c.puedeEliminarse || !gestionar}
                  title={!gestionar ? SIN_GESTION : c.puedeEliminarse ? "Eliminar el cultivo" : motivo}
                  onClick={() => onAskDelete(c)}
                />
              </div>
              {/* El candado explica por qué no se puede borrar *este* cultivo; el
                  permiso que falta ya lo dice el aviso de arriba de la tabla. */}
              {gestionar && !c.puedeEliminarse && (
                <div className="mt-2 flex items-center justify-end gap-1.5 text-[11.5px] text-fg-3">
                  <Lock className="size-[13px]" />
                  {motivo}
                </div>
              )}
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}

/* ---- Pantalla ------------------------------------------------------------ */

function Inner({
  cultivos,
  totalRecetas,
  gestionar,
  onRefrescar,
}: {
  cultivos: CultivoCatalogo[];
  totalRecetas: number;
  /** `LEER_CULTIVOS` alcanza para ver; crear, editar y borrar piden `GESTIONAR_CULTIVOS`. */
  gestionar: boolean;
  onRefrescar: () => void;
}) {
  const { cargar } = useCultivoDetalle();
  const { crear, isLoading: creando } = useCrearCultivo();
  const { actualizar, isLoading: actualizando } = useActualizarCultivo();
  const { eliminar, isLoading: borrando } = useEliminarCultivo();

  const [query, setQuery] = useState("");
  // `id: null` = alta. Se abre recién con los datos en mano.
  const [form, setForm] = useState<{ id: string | null; datos: DatosCultivo } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<CultivoCatalogo | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? cultivos.filter((c) => c.nombre.toLowerCase().includes(q)) : cultivos;
  }, [cultivos, query]);

  function abrirAlta() {
    setFormError(null);
    setForm({ id: null, datos: CULTIVO_VACIO });
  }

  /**
   * El listado no trae descripción ni beneficios, así que editar necesita el
   * detalle. El panel se abre recién cuando llega: montarlo vacío y rellenarlo
   * después obligaría a sincronizar el formulario con un efecto.
   */
  async function abrirEdicion(c: CultivoCatalogo) {
    setDetalleId(c.id);
    const res = await cargar(c.id);
    setDetalleId(null);
    if (!res.ok || !res.datos) {
      notify.error("No pudimos abrir el cultivo. Probá de nuevo.");
      return;
    }
    setFormError(null);
    setForm({ id: c.id, datos: res.datos });
  }

  async function guardar(datos: DatosCultivo) {
    if (!form) return;
    const editando = form.id !== null;
    setFormError(null);
    const res = editando ? await actualizar(form.id!, datos) : await crear(datos);
    if (!res.ok) {
      // El panel queda abierto con lo cargado: rehacer el calendario, los
      // beneficios y la tabla nutricional sería cruel.
      setFormError(mensajeGuardar(res, editando));
      return;
    }
    setForm(null);
    onRefrescar();
    notify.success(
      editando
        ? `Se guardaron los cambios de «${datos.nombre}».`
        : `Se agregó «${datos.nombre}» al catálogo.`,
    );
  }

  async function confirmarBaja() {
    if (!toDelete) return;
    setDeleteError(null);
    const res = await eliminar(toDelete.id);
    if (!res.ok) {
      setDeleteError(mensajeBaja(res.code));
      return;
    }
    const nombre = toDelete.nombre;
    setToDelete(null);
    onRefrescar();
    notify.success(`Se eliminó «${nombre}» del catálogo.`);
  }

  return (
    <div className="mx-auto max-w-[1240px] px-7 pt-7 pb-[72px]">
      <GcrPageHead
        crumb="Cultivos"
        title="Cultivos"
        desc="Administrá el catálogo de cultivos de la plataforma. Cada cultivo queda disponible para que los establecimientos lo asocien a sus actividades y para las recetas de la finca."
        actionLabel="Agregar cultivo"
        onAction={abrirAlta}
        accionDeshabilitada={!gestionar}
        accionTitulo={gestionar ? undefined : SIN_GESTION}
      />

      <GcrStats
        items={[
          {
            icon: <Sprout className="size-5 text-green-800" />,
            label: "Cultivos en el catálogo",
            value: cultivos.length,
          },
          {
            icon: <Utensils className="size-5 text-green-800" />,
            label: "Recetas en el catálogo",
            value: totalRecetas,
          },
        ]}
      />

      <GcrSearchBar query={query} onQuery={setQuery} placeholder="Buscar por nombre" />

      {/* Con todas las acciones apagadas, decir por qué una sola vez evita que
          haya que apuntar cada botón para enterarse. */}
      {!gestionar && (
        <Alert tone="warning" icon={<Eye className="size-[18px]" />} className="mb-4">
          Estás viendo el catálogo en modo lectura. {SIN_GESTION} para agregar, editar o eliminar.
        </Alert>
      )}

      <Card className="overflow-hidden p-0">
        {cultivos.length === 0 ? (
          <GcrEmptyState
            icon={<Sprout className="size-8 text-brown-700" />}
            title="Todavía no hay cultivos cargados"
            body={
              gestionar
                ? "Empezá creando el primero. Una vez cargado, los establecimientos van a poder asociarlo a sus actividades y recetas."
                : "Cuando se cargue el primero vas a poder consultarlo acá, con su estacionalidad y sus valores nutricionales."
            }
            actionLabel={gestionar ? "Agregar el primer cultivo" : undefined}
            onAction={gestionar ? abrirAlta : undefined}
          />
        ) : visibles.length > 0 ? (
          <Tabla>
            <Filas
              cultivos={visibles}
              detalleId={detalleId}
              gestionar={gestionar}
              onEdit={abrirEdicion}
              onAskDelete={(c) => {
                setDeleteError(null);
                setToDelete(c);
              }}
            />
          </Tabla>
        ) : (
          <GcrNoMatch msg="No hay cultivos que coincidan con la búsqueda." />
        )}
      </Card>

      {form && (
        <GcrFormShell onCancel={() => setForm(null)} busy={creando || actualizando}>
          <CultivoForm
            initial={form.datos}
            editando={form.id !== null}
            busy={creando || actualizando}
            error={formError}
            existingNames={cultivos
              .filter((c) => c.id !== form.id)
              .map((c) => c.nombre)}
            onCancel={() => setForm(null)}
            onSave={guardar}
          />
        </GcrFormShell>
      )}

      {toDelete && (
        <ConfirmDialog
          open
          title="Eliminar cultivo"
          confirmLabel="Eliminar cultivo"
          busy={borrando}
          error={deleteError}
          description={
            <>
              ¿Seguro que querés eliminar <strong className="text-fg-1">«{toDelete.nombre}»</strong>{" "}
              del catálogo? Esta acción no se puede deshacer.
            </>
          }
          onCancel={() => setToDelete(null)}
          onConfirm={confirmarBaja}
        />
      )}
    </div>
  );
}

export default function CultivosClient() {
  const { cultivos, totalRecetas, isLoading, error, reload, refrescar } = useCatalogoCultivos();
  const accesos = useAuthStore((s) => s.accesos);
  const gestionar = tienePermiso(accesos, PermisoAdmin.GESTIONAR_CULTIVOS);

  return (
    <AsyncBoundary
      loading={isLoading}
      error={error}
      onRetry={reload}
      skeleton={<CultivosSkeleton />}
    >
      {/* Sin copia local: los contadores y `puedeEliminarse` los calcula el
          backend, así que después de mutar hay que volver a pedirlos. */}
      <Inner
        cultivos={cultivos}
        totalRecetas={totalRecetas}
        gestionar={gestionar}
        onRefrescar={refrescar}
      />
    </AsyncBoundary>
  );
}
