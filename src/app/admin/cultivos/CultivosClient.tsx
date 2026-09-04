"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Sprout, Utensils, Leaf, Scissors, Grape, Pencil, Trash2, Lock, Loader } from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { Button, Card, Skeleton, Toast } from "@/components/ui";
import type { ToastData } from "@/components/ui";
import { TextField } from "@/components/ui/text-field";
import { gradienteDe } from "@/lib/color";
import { cn } from "@/lib/utils";
import {
  useActualizarCultivo,
  useCatalogoCultivos,
  useCrearCultivo,
  useCultivoDetalle,
  useEliminarCultivo,
} from "@/hooks/useGestionCultivos";
import type { CultivoCatalogo, DatosCultivo, Estacion } from "@/types/gestionCr";
import {
  GcrConfirmDelete, GcrFormShell, GcrFormHeader, GcrFormFooter, GcrFieldLabel, GcrErr,
  GcrSeasonBar, GcrSeasonEditor, GcrListEditor, GcrStats, GcrSearchBar, GcrEmptyState, GcrPageHead,
  GcrNoMatch,
} from "@/components/admin/gcr/shared";

/** Alta: doce meses en reposo y una fila de beneficio en blanco. */
const CULTIVO_VACIO: DatosCultivo = {
  nombre: "",
  descripcion: "",
  beneficios: [""],
  calendario: Array(12).fill("r") as Estacion[],
};

/**
 * Errores de dominio al guardar. Lo que no esté acá cae en el genérico, que es
 * el único caso donde tiene sentido sugerir reintentar.
 */
const ERROR_GUARDAR: Record<string, string> = {
  // TODO backend: confirmar el código real del nombre repetido.
  "tipoCultivo.tipoCultivoAlreadyExists": "Ya existe un cultivo con ese nombre. Elegí otro.",
};

function mensajeGuardar(code: string | undefined, editando: boolean): string {
  return (
    (code && ERROR_GUARDAR[code]) ||
    (editando
      ? "No pudimos guardar los cambios. Probá de nuevo en unos minutos."
      : "No pudimos agregar el cultivo. Probá de nuevo en unos minutos.")
  );
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
                    <Skeleton className="h-[34px] w-[86px]" />
                    <Skeleton className="h-[34px] w-[96px]" />
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
  const [nombre, setNombre] = useState(initial.nombre);
  const [descripcion, setDescripcion] = useState(initial.descripcion);
  const [beneficios, setBeneficios] = useState<string[]>(
    initial.beneficios.length > 0 ? initial.beneficios : [""],
  );
  const [calendario, setCalendario] = useState<Estacion[]>(initial.calendario);
  const [attempted, setAttempted] = useState(false);

  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const isDup = nombre.trim().length > 0 && existingNames.map(norm).includes(norm(nombre));
  const errNombre = !nombre.trim()
    ? "Ingresá el nombre del cultivo."
    : nombre.trim().length > 60
      ? "El nombre es demasiado largo."
      : isDup
        ? "Ya existe un cultivo con ese nombre. Elegí otro."
        : "";
  const errDesc = !descripcion.trim() ? "Escribí una breve descripción del cultivo." : "";
  // El duplicado se avisa mientras se escribe; el resto, recién al guardar.
  const showNombre = (attempted && errNombre) || (isDup ? errNombre : "");
  const showDesc = attempted && errDesc;

  function handleSave() {
    setAttempted(true);
    if (errNombre || errDesc) return;
    onSave({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      beneficios: beneficios.map((b) => b.trim()).filter(Boolean),
      calendario,
    });
  }

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
        onCancel={onCancel}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-[22px] overflow-y-auto px-[26px] py-[22px]">
        <div>
          <GcrFieldLabel required>Nombre</GcrFieldLabel>
          <TextField
            value={nombre}
            maxLength={60}
            onChange={setNombre}
            placeholder="Ej. Uva Malbec"
            aria-invalid={!!showNombre}
          />
          <div className="mt-[7px] flex items-center justify-between gap-3">
            {showNombre ? <GcrErr msg={errNombre} /> : <span />}
            <span className="shrink-0 font-mono text-xs text-fg-3">{nombre.length}/60</span>
          </div>
        </div>

        <div>
          <GcrFieldLabel required>Descripción</GcrFieldLabel>
          <textarea
            rows={4}
            maxLength={500}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Contá qué caracteriza a este cultivo, cuándo y cómo se cosecha en Mendoza."
            className={cn("textarea", showDesc && "err")}
          />
          <div className="mt-[7px] flex items-center justify-between gap-3">
            {showDesc ? <GcrErr msg={errDesc} /> : <span />}
            <span
              className={cn(
                "shrink-0 font-mono text-xs",
                descripcion.length >= 500 ? "text-danger" : "text-fg-3",
              )}
            >
              {descripcion.length}/500
            </span>
          </div>
        </div>

        <div>
          <GcrFieldLabel style={{ marginBottom: 4 }}>Estacionalidad anual</GcrFieldLabel>
          <p className="mb-3 text-[13.5px] leading-relaxed text-fg-2">
            Asigná a cada mes un estado: cosecha, crecimiento o reposo.
          </p>
          <GcrSeasonEditor value={calendario} onChange={setCalendario} />
        </div>

        <div>
          <GcrFieldLabel style={{ marginBottom: 4 }}>Beneficios para la alimentación</GcrFieldLabel>
          <p className="mb-3 text-[13.5px] leading-relaxed text-fg-2">
            Se muestran como lista en la ficha pública del cultivo. Hasta 100 caracteres cada uno.
          </p>
          <GcrListEditor
            items={beneficios}
            onChange={setBeneficios}
            placeholder="Ej. Antioxidante natural por su contenido de polifenoles"
            addLabel="Agregar beneficio"
            maxLength={100}
          />
        </div>
      </div>

      <GcrFormFooter
        onCancel={onCancel}
        onSave={handleSave}
        saveLabel={editando ? "Guardar cambios" : "Agregar cultivo"}
        saveIcon={busy ? <Loader className="spin size-[17px]" /> : editando ? undefined : <Sprout className="size-[17px]" />}
        busy={busy}
        error={error}
      />
    </>
  );
}

/* ---- Tabla con datos ------------------------------------------------------ */

function Filas({
  cultivos,
  detalleId,
  onEdit,
  onAskDelete,
}: {
  cultivos: CultivoCatalogo[];
  detalleId: string | null;
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
                <Button
                  variant="neutral"
                  size="sm"
                  className="text-sm"
                  disabled={abriendo}
                  onClick={() => onEdit(c)}
                >
                  {abriendo ? (
                    <Loader className="spin size-[15px]" />
                  ) : (
                    <Pencil className="size-[15px]" />
                  )}
                  Editar
                </Button>
                <Button
                  variant="neutral"
                  size="sm"
                  className="border-danger text-sm text-danger"
                  disabled={!c.puedeEliminarse}
                  title={c.puedeEliminarse ? "Eliminar el cultivo" : motivo}
                  onClick={() => onAskDelete(c)}
                >
                  <Trash2 className="size-[15px]" /> Eliminar
                </Button>
              </div>
              {!c.puedeEliminarse && (
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
  onRefrescar,
}: {
  cultivos: CultivoCatalogo[];
  totalRecetas: number;
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
  const [toast, setToast] = useState<ToastData | null>(null);

  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? cultivos.filter((c) => c.nombre.toLowerCase().includes(q)) : cultivos;
  }, [cultivos, query]);

  function notificar(title: string, tone: ToastData["tone"] = "success") {
    setToast({ tone, title });
    setTimeout(() => setToast((t) => (t?.title === title ? null : t)), 3400);
  }

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
      notificar("No pudimos abrir el cultivo. Probá de nuevo.", "danger");
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
      // El panel queda abierto con lo cargado: rehacer el calendario y los
      // beneficios sería cruel.
      setFormError(mensajeGuardar(res.code, editando));
      return;
    }
    setForm(null);
    onRefrescar();
    notificar(
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
    notificar(`Se eliminó «${nombre}» del catálogo.`);
  }

  return (
    <div className="mx-auto max-w-[1240px] px-7 pt-7 pb-[72px]">
      <GcrPageHead
        crumb="Cultivos"
        title="Cultivos"
        desc="Administrá el catálogo de cultivos de la plataforma. Cada cultivo queda disponible para que los establecimientos lo asocien a sus actividades y para las recetas de la finca."
        actionLabel="Agregar cultivo"
        onAction={abrirAlta}
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

      <Card className="overflow-hidden p-0">
        {cultivos.length === 0 ? (
          <GcrEmptyState
            icon={<Sprout className="size-8 text-brown-700" />}
            title="Todavía no hay cultivos cargados"
            body="Empezá creando el primero. Una vez cargado, los establecimientos van a poder asociarlo a sus actividades y recetas."
            actionLabel="Agregar el primer cultivo"
            onAction={abrirAlta}
          />
        ) : visibles.length > 0 ? (
          <Tabla>
            <Filas
              cultivos={visibles}
              detalleId={detalleId}
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
        <GcrFormShell onCancel={() => setForm(null)}>
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

      <GcrConfirmDelete
        open={!!toDelete}
        title="Eliminar cultivo"
        busy={borrando}
        error={deleteError}
        body={
          toDelete ? (
            <>
              ¿Seguro que querés eliminar <strong className="text-fg-1">«{toDelete.nombre}»</strong>{" "}
              del catálogo? Esta acción no se puede deshacer.
            </>
          ) : null
        }
        onCancel={() => setToDelete(null)}
        onConfirm={confirmarBaja}
      />

      {/* Toast propio y no <GcrFlash>: ése sólo hace el tono de éxito, y el
          fallo al abrir la edición necesita el rojo. */}
      {toast && <Toast {...toast} />}
    </div>
  );
}

export default function CultivosClient() {
  const { cultivos, totalRecetas, isLoading, error, reload, refrescar } = useCatalogoCultivos();
  return (
    <AsyncBoundary
      loading={isLoading}
      error={error}
      onRetry={reload}
      skeleton={<CultivosSkeleton />}
    >
      {/* Sin copia local: los contadores y `puedeEliminarse` los calcula el
          backend, así que después de mutar hay que volver a pedirlos. */}
      <Inner cultivos={cultivos} totalRecetas={totalRecetas} onRefrescar={refrescar} />
    </AsyncBoundary>
  );
}
