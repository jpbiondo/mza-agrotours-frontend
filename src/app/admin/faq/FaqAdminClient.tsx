"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronRight, MessagesSquare, Plus, Search, X, HelpCircle, Pencil, Trash2, ChevronDown,
  SearchX, RotateCcw, Check, Loader,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { Alert, Button, Modal, Skeleton, Toast } from "@/components/ui";
import { TextField } from "@/components/ui/text-field";
import { TextArea } from "@/components/ui/text-area";
import { SimpleSelect } from "@/components/ui/simple-select";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { GcrFormFooter, GcrFormShell } from "@/components/admin/gcr/shared";
import {
  CatIcono, FaqChips, FaqDesplegable, contarPorCategoria, etiquetaCat, resaltar,
} from "@/components/faq/piezas";
import { FAQ_CATEGORIAS } from "@/data/faq";
import { useFaq, useFaqCrud } from "@/hooks/useFaq";
import { cn } from "@/lib/utils";
import type { FaqItem } from "@/types/catalogo";
import { FAQ_INICIAL, PREGUNTA_MAX, RESPUESTA_MAX, faqSchema, type FaqForm } from "./schema";

/** Las que se pueden asignar: "todas" es sólo un filtro. */
const CATEGORIAS_ASIGNABLES = FAQ_CATEGORIAS.filter((c) => c.id !== "todas");

/** Mensaje para un rechazo del backend: con `code` es de dominio; sin él, técnico. */
function mensajeError(code: string | undefined, accion: "guardar" | "eliminar"): string {
  if (code === "entityNotFound") return "Esta pregunta ya no existe. Recargá el listado para ver los cambios.";
  if (code === "validationError") return "El servidor rechazó los datos. Revisá la pregunta y la respuesta.";
  return accion === "guardar"
    ? "No pudimos guardar la pregunta. Probá de nuevo en unos minutos."
    : "No pudimos eliminar la pregunta. Probá de nuevo en unos minutos.";
}

/* ---- Una entrada del acordeón (con acciones de gestión) ---------------- */
const ACCION = "flex size-[38px] shrink-0 cursor-pointer items-center justify-center rounded-md border border-outline-variant bg-surface transition-colors";

function FaqFila({ item, term, open, onToggle, onEdit, onDelete }: {
  item: FaqItem;
  term: string;
  open: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-surface transition-[border-color,box-shadow] duration-200",
        open ? "border-green-300 shadow-hover" : "border-outline-variant",
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Pregunta: abre y cierra el acordeón */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3.5 bg-transparent p-0 text-left"
        >
          <span
            className={cn(
              "flex size-[38px] shrink-0 items-center justify-center rounded-[10px] transition-colors",
              open ? "bg-green-800 text-white" : "bg-green-050 text-green-800",
            )}
          >
            <HelpCircle className="size-[19px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[16.5px] leading-[1.35] font-semibold text-fg-1">
              {resaltar(item.q, term)}
            </span>
            <span className="t-label mt-1.5 inline-flex items-center gap-[5px] text-[11px]">
              <CatIcono catId={item.cat} className="size-3 text-fg-3" /> {etiquetaCat(item.cat)}
            </span>
          </span>
        </button>

        {/* Acciones de gestión */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            title="Editar"
            aria-label={`Editar: ${item.q}`}
            className={cn(ACCION, "hover:border-green-800 hover:bg-cream-tert")}
          >
            <Pencil className="size-4 text-green-800" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Eliminar"
            aria-label={`Eliminar: ${item.q}`}
            className={cn(ACCION, "hover:border-danger hover:bg-danger-fill")}
          >
            <Trash2 className="size-4 text-danger-fg" />
          </button>
          <button
            type="button"
            onClick={onToggle}
            aria-label={open ? "Contraer" : "Expandir"}
            className={cn(ACCION, "border-transparent bg-transparent")}
          >
            <ChevronDown
              className={cn(
                "size-5 transition-[transform,color] duration-200",
                open ? "rotate-180 text-green-800" : "text-fg-3",
              )}
            />
          </button>
        </div>
      </div>

      <FaqDesplegable open={open} className="pr-4 pb-[18px] pl-[68px]">
        <p className="text-[15px] leading-relaxed text-pretty text-fg-2">{resaltar(item.a, term)}</p>
      </FaqDesplegable>
    </div>
  );
}

/* ---- Estado vacío ------------------------------------------------------- */
function FaqVacio({ kind, term, onClear, onNueva }: {
  kind: "sin-datos" | "sin-busqueda" | "sin-categoria";
  term: string;
  onClear: () => void;
  onNueva: () => void;
}) {
  const buscando = kind !== "sin-datos";
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-sand bg-surface px-8 py-[60px] text-center">
      <span
        className={cn(
          "mb-[18px] flex size-16 items-center justify-center rounded-2xl",
          buscando ? "bg-cream-tert" : "bg-green-050",
        )}
      >
        {buscando
          ? <SearchX className="size-[30px] text-fg-3" />
          : <MessagesSquare className="size-[30px] text-green-800" />}
      </span>
      <h2 className="mb-2 font-display text-xl font-bold text-fg-1">
        {kind === "sin-datos"
          ? "Todavía no cargaste preguntas frecuentes"
          : kind === "sin-categoria"
            ? "No hay preguntas en esta categoría"
            : "No encontramos preguntas relacionadas"}
      </h2>
      <p className="mx-auto mb-5 max-w-[440px] text-[15px] text-fg-2">
        {kind === "sin-datos" ? (
          "Empezá creando la primera. Cada entrada necesita una pregunta y su respuesta."
        ) : kind === "sin-categoria" ? (
          "Probá con otra categoría o seleccioná «Todas» para ver el listado completo."
        ) : (
          <>No hay coincidencias para <strong className="text-fg-1">«{term}»</strong>. Probá con otra palabra.</>
        )}
      </p>
      {kind === "sin-datos" ? (
        <Button onClick={onNueva}><Plus className="size-[17px]" /> Cargá una pregunta</Button>
      ) : (
        <Button variant="neutral" onClick={onClear}><RotateCcw className="size-[17px]" /> Limpiar filtros</Button>
      )}
    </div>
  );
}

/* ---- Editor (alta / edición) ------------------------------------------- */
function FaqEditor({ item, busy, error, onCancel, onSave }: {
  item: FaqItem | null;
  busy: boolean;
  /** Rechazo del backend: el panel queda abierto con lo cargado. */
  error: string | null;
  onCancel: () => void;
  onSave: (datos: FaqForm) => void;
}) {
  const esEdicion = !!item;
  const form = useForm<FaqForm>({
    resolver: zodResolver(faqSchema),
    mode: "onTouched",
    defaultValues: item ? { q: item.q, a: item.a, cat: item.cat } : FAQ_INICIAL,
  });
  const q = useWatch({ control: form.control, name: "q" });
  const a = useWatch({ control: form.control, name: "a" });
  const cat = useWatch({ control: form.control, name: "cat" });

  const { setFocus } = form;
  useEffect(() => { setFocus("q"); }, [setFocus]);

  const cerrar = busy ? () => {} : onCancel;

  return (
    <GcrFormShell onCancel={cerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={esEdicion ? "Editar pregunta frecuente" : "Nueva pregunta frecuente"}
        className="flex min-h-0 flex-1 flex-col"
      >
        {/* Cabecera */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-outline-variant px-[26px] py-[22px]">
          <div className="flex min-w-0 items-center gap-[13px]">
            <span className="flex size-[42px] shrink-0 items-center justify-center rounded-xl border border-green-100 bg-green-050 text-green-800">
              {esEdicion ? <Pencil className="size-5" /> : <Plus className="size-5" />}
            </span>
            <div className="min-w-0">
              <span className="t-label">{esEdicion ? "Editar entrada" : "Nueva entrada"}</span>
              <h2 className="mt-[3px] font-display text-xl leading-tight font-bold text-fg-1">
                {esEdicion ? "Editar pregunta frecuente" : "Cargá una pregunta frecuente"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar"
            className="flex size-[42px] shrink-0 cursor-pointer items-center justify-center rounded-md border border-outline-variant bg-surface"
          >
            <X className="size-5 text-fg-2" />
          </button>
        </div>

        {/* Cuerpo */}
        <Form {...form}>
          <form
            noValidate
            onSubmit={form.handleSubmit(onSave)}
            className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-[26px] py-[22px]"
          >
            <FormField
              control={form.control}
              name="q"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required className="font-display text-[14.5px] font-semibold">Pregunta</FormLabel>
                  <FormControl>
                    <TextField
                      {...field}
                      maxLength={PREGUNTA_MAX}
                      placeholder="Ej.: ¿Cómo reservo una experiencia?"
                    />
                  </FormControl>
                  <FormMessage />
                  {!form.formState.errors.q && (
                    <FormDescription className="flex items-center justify-between gap-2.5 text-[12.5px]">
                      <span>Redactá la duda tal como la haría un usuario.</span>
                      <span className="font-mono">{q.length}/{PREGUNTA_MAX}</span>
                    </FormDescription>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="a"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required className="font-display text-[14.5px] font-semibold">Respuesta</FormLabel>
                  <FormControl>
                    <TextArea
                      {...field}
                      rows={5}
                      maxLength={RESPUESTA_MAX}
                      placeholder="Escribí una respuesta clara y completa para resolver la consulta."
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <FormMessage />
                  {!form.formState.errors.a && (
                    <FormDescription className="flex items-center justify-between gap-2.5 text-[12.5px]">
                      <span>Aparecerá justo debajo de la pregunta al desplegarla.</span>
                      <span className="font-mono">{a.length}/{RESPUESTA_MAX}</span>
                    </FormDescription>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-display text-[14.5px] font-semibold">Categoría</FormLabel>
                  <FormControl>
                    <SimpleSelect
                      {...field}
                      icon={<CatIcono catId={cat} />}
                      options={CATEGORIAS_ASIGNABLES.map((c) => ({ value: c.id, label: c.label }))}
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription className="text-[12.5px]">
                    Agrupa la pregunta dentro de la base de conocimiento.
                  </FormDescription>
                </FormItem>
              )}
            />
          </form>
        </Form>

        <GcrFormFooter
          onCancel={cerrar}
          onSave={form.handleSubmit(onSave)}
          saveLabel={esEdicion ? "Guardar cambios" : "Crear pregunta"}
          saveIcon={busy ? <Loader className="spin size-[17px]" /> : <Check className="size-[17px]" />}
          busy={busy}
          error={error}
        />
      </div>
    </GcrFormShell>
  );
}

/* ---- Confirmación de eliminación --------------------------------------- */
function FaqEliminar({ item, busy, error, onCancel, onConfirm }: {
  item: FaqItem;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (busy) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <Modal onClose={onCancel} dismissable={!busy} padding="p-0" className="w-[480px] overflow-hidden">
      <div className="px-[26px] pt-[26px] pb-1.5 text-center" aria-label="Eliminar pregunta frecuente">
        <span className="mb-4 inline-flex size-14 items-center justify-center rounded-[14px] bg-danger-fill">
          <Trash2 className="size-[26px] text-danger-fg" />
        </span>
        <h2 className="mb-2 font-display text-xl font-bold text-fg-1">¿Eliminar esta pregunta?</h2>
        <p className="mx-auto max-w-[380px] text-[14.5px] leading-normal text-fg-2">
          Se quitará de la base de conocimiento y dejará de mostrarse a los usuarios. Esta acción no se puede deshacer.
        </p>
        <div className="mt-[18px] flex items-start gap-[11px] rounded-md border border-outline-variant bg-cream-tert px-3.5 py-3 text-left">
          <HelpCircle className="mt-px size-[18px] shrink-0 text-fg-3" />
          <span className="font-display text-[14.5px] leading-[1.4] font-semibold text-fg-1">{item.q}</span>
        </div>
        {error && <Alert className="mt-4 text-left">{error}</Alert>}
      </div>
      <div className="flex flex-wrap justify-center gap-3 px-[26px] pt-[18px] pb-6">
        <Button variant="neutral" onClick={onCancel} disabled={busy}>
          <X className="size-[17px]" /> Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>
          {busy ? <Loader className="spin size-[17px]" /> : <Trash2 className="size-[17px]" />} Eliminar
        </Button>
      </div>
    </Modal>
  );
}

/* ---- Esqueleto del listado --------------------------------------------- */
function FaqEsqueleto() {
  return (
    <div aria-busy="true" aria-label="Cargando preguntas…">
      <Skeleton className="mb-4 h-11 max-w-[420px]" />
      <div className="mb-[22px] flex flex-wrap gap-2">
        {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-9 w-28 rounded-pill" />)}
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-[74px] rounded-lg" />)}
      </div>
    </div>
  );
}

/* ---- Listado + gestión -------------------------------------------------- */
function FaqGestion({ initial, editor, setEditor }: {
  initial: FaqItem[];
  editor: { item: FaqItem | null } | null;
  setEditor: (e: { item: FaqItem | null } | null) => void;
}) {
  const [items, setItems] = useState<FaqItem[]>(initial);
  const [term, setTerm] = useState("");
  const [cat, setCat] = useState("todas");
  const [openId, setOpenId] = useState<string | null>(null);
  const [borrar, setBorrar] = useState<FaqItem | null>(null);
  const [errorEditor, setErrorEditor] = useState<string | null>(null);
  const [errorBorrar, setErrorBorrar] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const { crear, actualizar, eliminar, guardando, borrando } = useFaqCrud();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  // 1) Búsqueda por término
  const afterSearch = useMemo(() => {
    const q = term.trim().toLowerCase();
    return q ? items.filter((i) => `${i.q} ${i.a}`.toLowerCase().includes(q)) : items;
  }, [items, term]);
  // 2) Conteos por categoría, sobre el resultado de la búsqueda
  const counts = useMemo(() => contarPorCategoria(afterSearch), [afterSearch]);
  // 3) Filtro por categoría
  const visible = useMemo(
    () => (cat === "todas" ? afterSearch : afterSearch.filter((i) => i.cat === cat)),
    [afterSearch, cat],
  );

  function cerrarEditor() {
    setEditor(null);
    setErrorEditor(null);
  }

  async function guardar(datos: FaqForm) {
    setErrorEditor(null);
    const actual = editor?.item;
    if (actual) {
      const r = await actualizar(actual.id, datos);
      if (!r.ok) { setErrorEditor(mensajeError(r.code, "guardar")); return; }
      setItems((prev) => prev.map((x) => (x.id === actual.id ? { ...x, ...datos } : x)));
      setToast("Pregunta actualizada correctamente.");
    } else {
      const r = await crear(datos);
      if (!r.ok) { setErrorEditor(mensajeError(r.code, "guardar")); return; }
      // Sin id no hay contra qué editar ni borrar después: mejor que la entrada
      // no aparezca hasta recargar a que aparezca y falle al tocarla.
      if (r.id) {
        const nueva = { id: r.id, ...datos };
        setItems((prev) => [nueva, ...prev]);
        setOpenId(nueva.id);
      }
      setToast("Pregunta agregada a la base de conocimiento.");
    }
    cerrarEditor();
  }

  async function confirmarBorrado() {
    if (!borrar) return;
    setErrorBorrar(null);
    const r = await eliminar(borrar.id);
    if (!r.ok) { setErrorBorrar(mensajeError(r.code, "eliminar")); return; }
    setItems((prev) => prev.filter((x) => x.id !== borrar.id));
    if (openId === borrar.id) setOpenId(null);
    setBorrar(null);
    setToast("Pregunta eliminada.");
  }

  const limpiar = () => { setTerm(""); setCat("todas"); };
  const nueva = () => setEditor({ item: null });
  const sinDatos = items.length === 0;
  const noResults = visible.length === 0;

  return (
    <>
      {/* Barra de filtros */}
      {!sinDatos && (
        <div className="mb-[22px] flex flex-col gap-4">
          <div className="max-w-[420px]">
            <TextField
              value={term}
              onChange={setTerm}
              icon={<Search />}
              placeholder="Buscar por pregunta o respuesta…"
              rightSlot={term ? (
                <button
                  type="button"
                  onClick={() => setTerm("")}
                  aria-label="Limpiar búsqueda"
                  className="flex size-[26px] cursor-pointer items-center justify-center rounded-full bg-cream-tert"
                >
                  <X className="size-3.5 text-fg-2" />
                </button>
              ) : undefined}
            />
          </div>
          <FaqChips value={cat} onChange={setCat} counts={counts} />
        </div>
      )}

      {/* Contador */}
      {!sinDatos && !noResults && (
        <div className="mb-3.5 text-[13.5px] text-fg-3">
          {visible.length} {visible.length === 1 ? "pregunta" : "preguntas"}
          {cat !== "todas" && <> · {etiquetaCat(cat).toLowerCase()}</>}
          {term.trim() && <> · resultados para «{term.trim()}»</>}
        </div>
      )}

      {/* Listado / estado vacío */}
      {sinDatos ? (
        <FaqVacio kind="sin-datos" term="" onClear={limpiar} onNueva={nueva} />
      ) : noResults ? (
        <FaqVacio kind={term.trim() ? "sin-busqueda" : "sin-categoria"} term={term.trim()} onClear={limpiar} onNueva={nueva} />
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((it) => (
            <FaqFila
              key={it.id}
              item={it}
              term={term}
              open={openId === it.id}
              onToggle={() => setOpenId(openId === it.id ? null : it.id)}
              onEdit={() => setEditor({ item: it })}
              onDelete={() => { setErrorBorrar(null); setBorrar(it); }}
            />
          ))}
        </div>
      )}

      {editor && (
        <FaqEditor
          key={editor.item?.id ?? "nueva"}
          item={editor.item}
          busy={guardando}
          error={errorEditor}
          onCancel={cerrarEditor}
          onSave={guardar}
        />
      )}
      {borrar && (
        <FaqEliminar
          item={borrar}
          busy={borrando}
          error={errorBorrar}
          onCancel={() => setBorrar(null)}
          onConfirm={confirmarBorrado}
        />
      )}
      {toast && <Toast tone="success" title={toast} />}
    </>
  );
}

/* ---- Página ------------------------------------------------------------- */
export default function FaqAdminClient() {
  const { data, isLoading, error, reload } = useFaq();
  // El editor vive acá arriba porque lo abre el botón del encabezado, que queda
  // fuera del <AsyncBoundary>. Se habilita recién con el listado cargado: el
  // alta se suma a la lista local.
  const [editor, setEditor] = useState<{ item: FaqItem | null } | null>(null);

  return (
    <div className="mx-auto max-w-[920px] px-7 pt-7 pb-[88px]">
      {/* Breadcrumb */}
      <div className="mb-3.5 flex items-center gap-2.5 text-[13.5px] text-fg-3">
        <span>Soporte</span>
        <ChevronRight className="size-[15px]" />
        <span className="font-medium text-fg-2">Preguntas frecuentes</span>
      </div>

      {/* Encabezado */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-[280px]">
          <div className="mb-3 flex items-center gap-3.5">
            <span className="flex size-[50px] shrink-0 items-center justify-center rounded-[14px] border border-green-100 bg-green-050 text-green-800">
              <MessagesSquare className="size-[25px]" />
            </span>
            <h1 className="font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">Preguntas frecuentes</h1>
          </div>
          <p className="max-w-[620px] text-[15.5px] leading-normal text-fg-2">
            Mantené la base de conocimiento que consultan los usuarios. Cada entrada necesita una pregunta y su respuesta.
          </p>
        </div>
        <Button size="lg" onClick={() => setEditor({ item: null })} disabled={isLoading || !!error}>
          <Plus className="size-[18px]" /> Cargá una pregunta
        </Button>
      </div>

      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} skeleton={<FaqEsqueleto />}>
        <FaqGestion initial={data} editor={editor} setEditor={setEditor} />
      </AsyncBoundary>
    </div>
  );
}
