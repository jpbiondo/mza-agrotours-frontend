"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Utensils, Sprout, Users, List as ListIcon, Clock, Pencil, Trash2, Loader, Eye,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { ActionBtn, Alert, Card, Skeleton, Toast } from "@/components/ui";
import type { ToastData } from "@/components/ui";
import { TextField } from "@/components/ui/text-field";
import { gcrRecetaInitials } from "@/data/gestionCr";
import { PermisoAdmin } from "@/lib/permisos";
import { tienePermiso } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import {
  useActualizarReceta,
  useCatalogoRecetas,
  useCrearReceta,
  useCultivosDisponibles,
  useEliminarReceta,
  useRecetaDetalle,
} from "@/hooks/useGestionRecetas";
import type { CultivoOpcion, DatosReceta, DificultadId, RecetaCatalogo } from "@/types/gestionCr";
import {
  GcrConfirmDelete, GcrFormShell, GcrFormHeader, GcrFormFooter, GcrFieldLabel, GcrErr,
  GcrListEditor, GcrCultivoMultiSelect, GcrCultivoChip, GcrDifficultyPill, gcrDificultadLabel,
  GcrStats, GcrSearchBar, GcrEmptyState, GcrPageHead, GcrNoMatch,
} from "@/components/admin/gcr/shared";

/** Alta: una fila en blanco de cada lista y los valores más frecuentes. */
const RECETA_VACIA: DatosReceta = {
  nombre: "",
  cultivosIds: [],
  dificultad: "FACIL",
  tiempoMinsAprox: 0,
  porciones: 4,
  descripcion: "",
  ingredientes: [""],
  pasos: [""],
};

const DIFICULTADES: DificultadId[] = ["FACIL", "MEDIA", "DIFICIL"];

/**
 * Caracteres que acepta el nombre del lado del backend (`@SinCaracteresEspeciales`):
 * letras con acentos, números, espacios, guion medio y guion bajo.
 */
const NOMBRE_VALIDO = /^[a-zA-Z0-9áéíóúüÁÉÍÓÚÜñÑ _-]*$/;

/** Motivo de los botones apagados cuando falta GESTIONAR_RECETAS. */
const SIN_GESTION = "Necesitás el permiso de gestión de recetas";

/** 75 → "1 h 15 min". Mismo formato que arma el backend para el visitante. */
function comoTiempo(minutos: number): string {
  if (minutos <= 0) return "—";
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto} min`;
  if (resto === 0) return `${horas} h`;
  return `${horas} h ${resto} min`;
}

function mensajeGuardar(res: { errores?: string[] }, editando: boolean): string {
  if (res.errores && res.errores.length > 0) return res.errores.join(" · ");
  return editando
    ? "No pudimos guardar los cambios. Probá de nuevo en unos minutos."
    : "No pudimos agregar la receta. Probá de nuevo en unos minutos.";
}

function mensajeBaja(res: { errores?: string[] }): string {
  if (res.errores && res.errores.length > 0) return res.errores.join(" · ");
  return "No pudimos eliminar la receta. Probá de nuevo en unos minutos.";
}

/* ---- Control segmentado --------------------------------------------------- */

function Segmented<T extends string>({ value, onChange, options }: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div
      role="radiogroup"
      className="inline-flex flex-wrap gap-[3px] rounded-md border border-outline-variant bg-cream-tert p-[3px]"
    >
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "cursor-pointer rounded-sm border-none px-3.5 py-[7px] text-[13.5px] font-semibold",
              on ? "bg-surface text-green-800 shadow-[0_1px_2px_rgba(45,90,39,.12)]" : "bg-transparent text-fg-2",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---- Cáscara de la tabla -------------------------------------------------
   La comparten el esqueleto y la tabla con datos; los anchos van fijos para que
   nada salte cuando llegan los datos. */

const COLUMNAS = ["Receta", "Cultivos", "Dificultad", "Tiempo", "Acciones"];
const ANCHOS = [undefined, "w-[260px]", "w-[130px]", "w-[150px]", "w-[230px]"];

function Tabla({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1060px] table-fixed border-collapse">
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
                  i === 4 ? "text-right" : "text-left",
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

const FILAS_SKELETON = ["w-[170px]", "w-[210px]", "w-[140px]", "w-[190px]", "w-[160px]"];

function RecetasSkeleton() {
  return (
    <div className="mx-auto max-w-[1240px] px-7 pt-7 pb-[72px]" aria-busy>
      <span role="status" className="sr-only">
        Cargando el recetario…
      </span>

      <GcrPageHead
        crumb="Recetas"
        title="Recetas"
        desc="Administrá el recetario de la plataforma. Cada receta se asocia a uno o más cultivos y aparece en sus fichas para inspirar a los visitantes a cocinar con lo que se cosecha."
        actionLabel="Agregar receta"
        onAction={() => {}}
        accionDeshabilitada
      />

      {/* "—" y no cero: "0 recetas" es una afirmación, y todavía no sabemos nada. */}
      <GcrStats
        items={[
          { icon: <Utensils className="size-5 text-green-800" />, label: "Recetas en el catálogo", value: "—" },
          { icon: <Sprout className="size-5 text-green-800" />, label: "Cultivos con receta", value: "—" },
        ]}
      />
      <GcrSearchBar query="" onQuery={() => {}} placeholder="Buscar por nombre o cultivo" disabled />

      <Card className="overflow-hidden p-0">
        <Tabla>
          <tbody>
            {FILAS_SKELETON.map((w, i) => (
              <tr key={i} className="border-b border-cream-tert">
                <td className="p-4 align-middle">
                  <div className="flex items-center gap-3.5">
                    <Skeleton className="size-11 rounded-[10px]" />
                    <div className="flex flex-col gap-2">
                      <Skeleton className={cn("h-4", w)} />
                      <Skeleton className="h-3 w-[120px]" />
                    </div>
                  </div>
                </td>
                <td className="p-4 align-middle">
                  <div className="flex gap-1.5">
                    <Skeleton className="h-5 w-[90px] rounded-full" />
                    <Skeleton className="h-5 w-[70px] rounded-full" />
                  </div>
                </td>
                <td className="p-4 align-middle">
                  <Skeleton className="h-6 w-[76px] rounded-full" />
                </td>
                <td className="p-4 align-middle">
                  <Skeleton className="h-4 w-[84px]" />
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

function RecetaForm({
  initial,
  editando,
  busy,
  error,
  cultivos,
  cultivosCargando,
  existingNames,
  onCancel,
  onSave,
}: {
  initial: DatosReceta;
  editando: boolean;
  busy: boolean;
  error: string | null;
  cultivos: CultivoOpcion[];
  cultivosCargando: boolean;
  existingNames: string[];
  onCancel: () => void;
  onSave: (datos: DatosReceta) => void;
}) {
  const [nombre, setNombre] = useState(initial.nombre);
  const [cultivosIds, setCultivosIds] = useState<string[]>(initial.cultivosIds);
  const [dificultad, setDificultad] = useState<DificultadId>(initial.dificultad);
  // Los dos números se editan como texto: un input vacío no es un 0.
  const [tiempo, setTiempo] = useState(initial.tiempoMinsAprox > 0 ? String(initial.tiempoMinsAprox) : "");
  const [porciones, setPorciones] = useState(initial.porciones > 0 ? String(initial.porciones) : "");
  const [descripcion, setDescripcion] = useState(initial.descripcion);
  const [ingredientes, setIngredientes] = useState<string[]>(
    initial.ingredientes.length > 0 ? initial.ingredientes : [""],
  );
  const [pasos, setPasos] = useState<string[]>(initial.pasos.length > 0 ? initial.pasos : [""]);
  const [attempted, setAttempted] = useState(false);

  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const isDup = nombre.trim().length > 0 && existingNames.map(norm).includes(norm(nombre));
  const errNombre = !nombre.trim()
    ? "Ingresá el nombre de la receta."
    : nombre.trim().length > 100
      ? "El nombre no puede superar los 100 caracteres."
      : !NOMBRE_VALIDO.test(nombre)
        ? "Usá solo letras, números, espacios, guiones y guiones bajos."
        : isDup
          ? "Ya existe una receta con ese nombre. Elegí otro."
          : "";
  const errCultivos = cultivosIds.length === 0 ? "Asociá al menos un cultivo." : "";
  const minutos = Number(tiempo);
  const errTiempo = !tiempo || !Number.isInteger(minutos) || minutos < 1
    ? "Ingresá el tiempo en minutos (mayor a 0)."
    : "";
  const porcNum = Number(porciones);
  const errPorciones = !porciones || !Number.isInteger(porcNum) || porcNum < 1
    ? "Ingresá una cantidad mayor a 0."
    : "";
  const errDesc = !descripcion.trim() ? "Escribí una breve descripción." : "";
  // El backend pide al menos un ingrediente y un paso (`@NotEmpty`).
  const ingLimpios = ingredientes.map((x) => x.trim()).filter(Boolean);
  const pasosLimpios = pasos.map((x) => x.trim()).filter(Boolean);
  const errIngredientes = ingLimpios.length === 0 ? "Cargá al menos un ingrediente." : "";
  const errPasos = pasosLimpios.length === 0 ? "Cargá al menos un paso." : "";
  // El duplicado se avisa mientras se escribe; el resto, recién al guardar.
  const showNombre = (attempted && errNombre) || (isDup ? errNombre : "");
  const showDesc = attempted && errDesc;

  function handleSave() {
    setAttempted(true);
    if (errNombre || errCultivos || errTiempo || errPorciones || errDesc || errIngredientes || errPasos) return;
    onSave({
      nombre: nombre.trim(),
      cultivosIds,
      dificultad,
      tiempoMinsAprox: minutos,
      porciones: porcNum,
      descripcion: descripcion.trim(),
      ingredientes: ingLimpios,
      pasos: pasosLimpios,
    });
  }

  return (
    <>
      <GcrFormHeader
        eyebrow={editando ? "Editar receta" : "Nueva receta"}
        title={editando ? "Editar receta" : "Agregar una receta"}
        sub={
          editando
            ? "Modificá los datos de la receta del catálogo."
            : "Sumá una receta al catálogo. Asociala a los cultivos con los que se prepara."
        }
        onCancel={onCancel}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-[22px] overflow-y-auto px-[26px] py-[22px]">
        <div>
          <GcrFieldLabel required>Nombre de la receta</GcrFieldLabel>
          <TextField
            value={nombre}
            maxLength={100}
            onChange={setNombre}
            placeholder="Ej. Tarta rústica de uva Malbec"
            aria-invalid={!!showNombre}
          />
          <div className="mt-[7px] flex items-center justify-between gap-3">
            {showNombre ? <GcrErr msg={errNombre} /> : <span />}
            <span className="shrink-0 font-mono text-xs text-fg-3">{nombre.length}/100</span>
          </div>
        </div>

        <div>
          <GcrFieldLabel required style={{ marginBottom: 4 }}>
            Cultivos asociados
          </GcrFieldLabel>
          <p className="mb-3 text-[13.5px] leading-relaxed text-fg-2">
            Elegí uno o más cultivos con los que se prepara esta receta.
          </p>
          {cultivosCargando ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-9 w-[130px] rounded-full" />
              ))}
            </div>
          ) : cultivos.length === 0 ? (
            <Alert tone="warning">
              Todavía no hay cultivos en el catálogo. Cargá uno antes de crear la receta.
            </Alert>
          ) : (
            <GcrCultivoMultiSelect cultivos={cultivos} selected={cultivosIds} onChange={setCultivosIds} />
          )}
          {attempted && errCultivos && (
            <div className="mt-2.5">
              <GcrErr msg={errCultivos} />
            </div>
          )}
        </div>
        <div>
            <GcrFieldLabel>Dificultad</GcrFieldLabel>
            <Segmented
              value={dificultad}
              onChange={setDificultad}
              options={DIFICULTADES.map((d) => ({ value: d, label: gcrDificultadLabel(d) }))}
            />
        </div>
        <div className="grid grid-cols-1 gap-[18px] min-[560px]:grid-cols-2">
          
          <div>
            <GcrFieldLabel required>Porciones</GcrFieldLabel>
            <TextField
              value={porciones}
              inputMode="numeric"
              maxLength={3}
              onChange={(v) => setPorciones(v.replace(/[^0-9]/g, ""))}
              placeholder="4"
              aria-invalid={!!(attempted && errPorciones)}
            />
            {attempted && errPorciones && (
              <div className="mt-[7px]">
                <GcrErr msg={errPorciones} />
              </div>
            )}
          </div>
          <div>
            <GcrFieldLabel required>Tiempo de preparación</GcrFieldLabel>
            <TextField
              value={tiempo}
              inputMode="numeric"
              maxLength={4}
              onChange={(v) => setTiempo(v.replace(/[^0-9]/g, ""))}
              placeholder="75"
              rightSlot={<span className="pr-1.5 text-[13px] text-fg-3">min</span>}
              aria-invalid={!!(attempted && errTiempo)}
            />
            <div className="mt-[7px] flex items-center justify-between gap-3">
              {attempted && errTiempo ? <GcrErr msg={errTiempo} /> : <span />}
              {/* La duración (Rápida / Media / Larga) la deduce el backend de
                  este número, así que acá sólo se confirma cómo se va a leer. */}
              <span className="shrink-0 font-mono text-xs text-fg-3">
                {minutos > 0 ? comoTiempo(minutos) : "—"}
              </span>
            </div>
          </div>
        </div>

        <div>
          <GcrFieldLabel required>Descripción</GcrFieldLabel>
          <textarea
            rows={3}
            maxLength={500}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Contá en una o dos líneas de qué se trata la receta."
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
          <GcrFieldLabel required style={{ marginBottom: 12 }}>
            Ingredientes
          </GcrFieldLabel>
          <GcrListEditor
            items={ingredientes}
            onChange={setIngredientes}
            placeholder="Ej. 250 g de harina 0000"
            addLabel="Agregar ingrediente"
            maxLength={100}
          />
          {attempted && errIngredientes && (
            <div className="mt-[7px]">
              <GcrErr msg={errIngredientes} />
            </div>
          )}
        </div>

        <div>
          <GcrFieldLabel required style={{ marginBottom: 12 }}>
            Pasos de preparación
          </GcrFieldLabel>
          <GcrListEditor
            items={pasos}
            onChange={setPasos}
            placeholder="Describí el paso"
            addLabel="Agregar paso"
            maxLength={200}
            numbered
          />
          {attempted && errPasos && (
            <div className="mt-[7px]">
              <GcrErr msg={errPasos} />
            </div>
          )}
        </div>
      </div>

      <GcrFormFooter
        onCancel={onCancel}
        onSave={handleSave}
        saveLabel={editando ? "Guardar cambios" : "Agregar receta"}
        saveIcon={busy ? <Loader className="spin size-[17px]" /> : editando ? undefined : <Utensils className="size-[17px]" />}
        busy={busy}
        error={error}
      />
    </>
  );
}

/* ---- Tabla con datos ------------------------------------------------------ */

function Filas({
  recetas,
  detalleId,
  gestionar,
  onEdit,
  onAskDelete,
}: {
  recetas: RecetaCatalogo[];
  detalleId: string | null;
  /** Sin GESTIONAR_RECETAS la pantalla es de sólo lectura. */
  gestionar: boolean;
  onEdit: (r: RecetaCatalogo) => void;
  onAskDelete: (r: RecetaCatalogo) => void;
}) {
  return (
    <tbody>
      {recetas.map((r) => {
        const abriendo = detalleId === r.id;
        return (
          <tr key={r.id} className="border-b border-cream-tert">
            <td className="p-4 align-middle">
              <div className="flex items-center gap-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] border border-sand bg-[#F3ECE2] font-display text-[15px] font-bold text-brown-700">
                  {gcrRecetaInitials(r.nombre)}
                </span>
                <div className="min-w-0">
                  <div className="font-display text-[15.5px] font-semibold text-fg-1">{r.nombre}</div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-fg-3">
                    <span className="inline-flex items-center gap-[5px]">
                      <Users className="size-[13px]" />
                      {r.porciones} porc.
                    </span>
                    <span className="inline-flex items-center gap-[5px]">
                      <ListIcon className="size-[13px]" />
                      {r.cantidadPasos} {r.cantidadPasos === 1 ? "paso" : "pasos"}
                    </span>
                  </div>
                </div>
              </div>
            </td>

            <td className="p-4 align-middle">
              <div className="flex flex-wrap gap-1.5">
                {r.nombresCultivos.map((nombre) => (
                  <GcrCultivoChip key={nombre} nombre={nombre} />
                ))}
              </div>
            </td>

            <td className="p-4 align-middle">
              <GcrDifficultyPill dificultad={r.dificultad} />
            </td>

            <td className="p-4 align-middle">
              <div className="flex flex-col gap-[3px]">
                <span className="inline-flex items-center gap-1.5 font-mono text-[13.5px] font-medium text-fg-1">
                  <Clock className="size-3.5 text-brown-700" />
                  {comoTiempo(r.tiempoMinsAprox)}
                </span>
                {/* La duración la clasifica el backend según el tiempo. */}
                <span className="pl-5 text-[11.5px] text-fg-3">{r.duracionNombre}</span>
              </div>
            </td>

            <td className="p-4 align-middle">
              <div className="flex items-center justify-end gap-2.5">
                <ActionBtn
                  icon={
                    abriendo ? (
                      <Loader className="spin size-[17px]" />
                    ) : (
                      <Pencil className="size-[17px]" />
                    )
                  }
                  label="Editar"
                  disabled={abriendo || !gestionar}
                  title={gestionar ? "Editar la receta" : SIN_GESTION}
                  onClick={() => onEdit(r)}
                />
                <ActionBtn
                  icon={<Trash2 className="size-[17px]" />}
                  label="Eliminar"
                  tone="danger"
                  disabled={!gestionar}
                  title={gestionar ? "Eliminar la receta" : SIN_GESTION}
                  onClick={() => onAskDelete(r)}
                />
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}

/* ---- Pantalla ------------------------------------------------------------ */

function Inner({
  recetas,
  cultivosConReceta,
  gestionar,
  onRefrescar,
}: {
  recetas: RecetaCatalogo[];
  cultivosConReceta: number;
  /** `LEER_RECETAS` alcanza para ver; crear, editar y borrar piden `GESTIONAR_RECETAS`. */
  gestionar: boolean;
  onRefrescar: () => void;
}) {
  const { cargar } = useRecetaDetalle();
  const { crear, isLoading: creando } = useCrearReceta();
  const { actualizar, isLoading: actualizando } = useActualizarReceta();
  const { eliminar, isLoading: borrando } = useEliminarReceta();
  const { cultivos, isLoading: cultivosCargando } = useCultivosDisponibles();

  const [query, setQuery] = useState("");
  // `id: null` = alta. Se abre recién con los datos en mano.
  const [form, setForm] = useState<{ id: string | null; datos: DatosReceta } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<RecetaCatalogo | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recetas;
    return recetas.filter(
      (r) =>
        r.nombre.toLowerCase().includes(q) ||
        r.nombresCultivos.some((c) => c.toLowerCase().includes(q)),
    );
  }, [recetas, query]);

  function notificar(title: string, tone: ToastData["tone"] = "success") {
    setToast({ tone, title });
    setTimeout(() => setToast((t) => (t?.title === title ? null : t)), 3400);
  }

  function abrirAlta() {
    setFormError(null);
    setForm({ id: null, datos: RECETA_VACIA });
  }

  /**
   * El listado no trae descripción, ingredientes ni pasos, así que editar
   * necesita el detalle. El panel se abre recién cuando llega: montarlo vacío y
   * rellenarlo después obligaría a sincronizar el formulario con un efecto.
   */
  async function abrirEdicion(r: RecetaCatalogo) {
    setDetalleId(r.id);
    const res = await cargar(r.id);
    setDetalleId(null);
    if (!res.ok || !res.datos) {
      notificar("No pudimos abrir la receta. Probá de nuevo.", "danger");
      return;
    }
    setFormError(null);
    setForm({ id: r.id, datos: res.datos });
  }

  async function guardar(datos: DatosReceta) {
    if (!form) return;
    const editando = form.id !== null;
    setFormError(null);
    const res = editando ? await actualizar(form.id!, datos) : await crear(datos);
    if (!res.ok) {
      // El panel queda abierto con lo cargado: rehacer los pasos y los
      // ingredientes sería cruel.
      setFormError(mensajeGuardar(res, editando));
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
      setDeleteError(mensajeBaja(res));
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
        crumb="Recetas"
        title="Recetas"
        desc="Administrá el recetario de la plataforma. Cada receta se asocia a uno o más cultivos y aparece en sus fichas para inspirar a los visitantes a cocinar con lo que se cosecha."
        actionLabel="Agregar receta"
        onAction={abrirAlta}
        accionDeshabilitada={!gestionar}
        accionTitulo={gestionar ? undefined : SIN_GESTION}
      />

      <GcrStats
        items={[
          {
            icon: <Utensils className="size-5 text-green-800" />,
            label: "Recetas en el catálogo",
            value: recetas.length,
          },
          {
            icon: <Sprout className="size-5 text-green-800" />,
            label: "Cultivos con receta",
            value: cultivosConReceta,
          },
        ]}
      />

      <GcrSearchBar query={query} onQuery={setQuery} placeholder="Buscar por nombre o cultivo" />

      {/* Con todas las acciones apagadas, decir por qué una sola vez evita que
          haya que apuntar cada botón para enterarse. */}
      {!gestionar && (
        <Alert tone="warning" icon={<Eye className="size-[18px]" />} className="mb-4">
          Estás viendo el recetario en modo lectura. {SIN_GESTION} para agregar, editar o eliminar.
        </Alert>
      )}

      <Card className="overflow-hidden p-0">
        {recetas.length === 0 ? (
          <GcrEmptyState
            icon={<Utensils className="size-8 text-brown-700" />}
            title="Todavía no hay recetas cargadas"
            body={
              gestionar
                ? "Empezá creando la primera. Asociala a un cultivo y va a aparecer en su ficha para que los visitantes cocinen con lo que se cosecha."
                : "Cuando se cargue la primera vas a poder consultarla acá, con sus cultivos, ingredientes y pasos."
            }
            actionLabel={gestionar ? "Agregar la primera receta" : undefined}
            onAction={gestionar ? abrirAlta : undefined}
          />
        ) : visibles.length > 0 ? (
          <Tabla>
            <Filas
              recetas={visibles}
              detalleId={detalleId}
              gestionar={gestionar}
              onEdit={abrirEdicion}
              onAskDelete={(r) => {
                setDeleteError(null);
                setToDelete(r);
              }}
            />
          </Tabla>
        ) : (
          <GcrNoMatch msg="No hay recetas que coincidan con la búsqueda." />
        )}
      </Card>

      {form && (
        <GcrFormShell onCancel={() => setForm(null)}>
          <RecetaForm
            initial={form.datos}
            editando={form.id !== null}
            busy={creando || actualizando}
            error={formError}
            cultivos={cultivos}
            cultivosCargando={cultivosCargando}
            existingNames={recetas.filter((r) => r.id !== form.id).map((r) => r.nombre)}
            onCancel={() => setForm(null)}
            onSave={guardar}
          />
        </GcrFormShell>
      )}

      <GcrConfirmDelete
        open={!!toDelete}
        title="Eliminar receta"
        busy={borrando}
        error={deleteError}
        body={
          toDelete ? (
            <>
              ¿Seguro que querés eliminar <strong className="text-fg-1">«{toDelete.nombre}»</strong> del
              catálogo? Dejará de aparecer en las fichas de sus cultivos. Esta acción no se puede deshacer.
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

export default function RecetasClient() {
  const { recetas, cultivosConReceta, isLoading, error, reload, refrescar } = useCatalogoRecetas();
  const accesos = useAuthStore((s) => s.accesos);
  const gestionar = tienePermiso(accesos, PermisoAdmin.GESTIONAR_RECETAS);

  return (
    <AsyncBoundary loading={isLoading} error={error} onRetry={reload} skeleton={<RecetasSkeleton />}>
      {/* Sin copia local: los contadores los calcula el backend, así que
          después de mutar hay que volver a pedirlos. */}
      <Inner
        recetas={recetas}
        cultivosConReceta={cultivosConReceta}
        gestionar={gestionar}
        onRefrescar={refrescar}
      />
    </AsyncBoundary>
  );
}
