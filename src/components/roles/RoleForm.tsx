"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, Check, Lightbulb, Loader, X } from "lucide-react";
import { Alert, Button } from "@/components/ui";
import { TextField } from "@/components/ui/text-field";
import { genId } from "@/lib/id";
import { cn } from "@/lib/utils";
import type { GrupoPermiso, RolDetalle } from "@/types/roles";
import { PermGroupEditor } from "./permisos-ui";
import type { TextosRoles } from "./textos";

function ErrMsg({ children }: { children: ReactNode }) {
  return (
    <div className="err-msg">
      <AlertCircle className="size-[15px] text-danger" /> {children}
    </div>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block font-display text-base font-semibold text-fg-1">
      {children} <span className="text-danger">*</span>
    </label>
  );
}

/**
 * Alta y modificación de un rol. Devuelve el rol completo por `onSave`: quien lo
 * recibe decide si es un POST o un PUT, que es lo único que cambia entre los dos
 * modos.
 */
export function RoleForm({
  initial,
  grupos,
  existingNames,
  textos,
  busy,
  error,
  onCancel,
  onSave,
}: {
  initial: RolDetalle | null;
  grupos: GrupoPermiso[];
  existingNames: string[];
  textos: TextosRoles;
  busy: boolean;
  /** Error del backend al guardar; mantiene el panel abierto con lo cargado. */
  error: string | null;
  onCancel: () => void;
  onSave: (r: RolDetalle) => void;
}) {
  const { maxNombre } = textos.form;
  const editing = !!initial;
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "");
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initial?.permisos ?? []));
  const [attempted, setAttempted] = useState(false);

  const togglePerm = (codigo: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(codigo)) n.delete(codigo);
      else n.add(codigo);
      return n;
    });

  const toggleGroup = (group: GrupoPermiso) =>
    setSelected((prev) => {
      const n = new Set(prev);
      const codigos = group.permisos.map((p) => p.codigo);
      if (codigos.every((c) => n.has(c))) codigos.forEach((c) => n.delete(c));
      else codigos.forEach((c) => n.add(c));
      return n;
    });

  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const isDup = nombre.trim().length >= 3 && existingNames.map(norm).includes(norm(nombre));
  const errNombre = !nombre.trim()
    ? "Escribí un nombre para el rol."
    : nombre.trim().length < 3
      ? "El nombre debe tener al menos 3 letras."
      : nombre.trim().length > maxNombre
        ? `El nombre no puede superar los ${maxNombre} caracteres.`
        : isDup
          ? "Ya existe un rol con ese nombre. Elegí otro."
          : "";
  const errDesc = !descripcion.trim()
    ? "Escribí una descripción para el rol."
    : descripcion.trim().length > 200
      ? "La descripción no puede superar los 200 caracteres."
      : "";
  const errPerms = selected.size === 0 ? "Marcá al menos un permiso para el rol." : "";
  // El nombre duplicado se avisa mientras se escribe; el resto, recién al guardar.
  const showNombre = (attempted && errNombre) || (isDup ? errNombre : "");
  const showDesc = attempted ? errDesc : "";

  function handleSave() {
    setAttempted(true);
    if (errNombre || errDesc || errPerms) return;
    onSave({
      id: initial?.id ?? genId("rol"),
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      permisos: Array.from(selected),
      cantidadUsuarios: initial?.cantidadUsuarios ?? 0,
      esProtegido: initial?.esProtegido ?? false,
    });
  }

  return (
    <div className="flex max-h-[calc(100vh-80px)] flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-[26px] py-[22px]">
        <div>
          <div className="t-label mb-1.5">{editing ? "Editar rol" : "Nuevo rol"}</div>
          <h2 className="font-display text-2xl font-bold text-fg-1">
            {editing ? nombre || "Editar rol" : textos.form.tituloCrear}
          </h2>
          <p className="mt-1.5 text-sm text-fg-2">
            {editing
              ? "Modificá el nombre, la descripción o los permisos del rol."
              : textos.form.bajadaCrear}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cerrar"
          className="flex size-[42px] shrink-0 cursor-pointer items-center justify-center rounded-md border border-outline-variant bg-surface"
        >
          <X className="size-5 text-fg-2" />
        </button>
      </div>

      <div className="flex flex-col gap-5 overflow-y-auto px-[26px] py-[22px]">
        <div className="field">
          <FieldLabel htmlFor="rol-nombre">Nombre del rol</FieldLabel>
          <TextField
            id="rol-nombre"
            value={nombre}
            onChange={setNombre}
            maxLength={maxNombre}
            placeholder={textos.form.nombrePlaceholder}
            aria-invalid={showNombre !== ""}
          />
          <div className="flex items-center justify-between gap-3">
            {showNombre ? (
              <ErrMsg>{errNombre}</ErrMsg>
            ) : (
              <p className="text-[12.5px] text-fg-3">{textos.form.nombreAyuda}</p>
            )}
            <span
              className={cn(
                "shrink-0 font-mono text-xs",
                nombre.length > maxNombre ? "text-danger" : "text-fg-3",
              )}
            >
              {nombre.length}/{maxNombre}
            </span>
          </div>
        </div>

        <div className="field">
          <FieldLabel htmlFor="rol-desc">Descripción</FieldLabel>
          {/* Sin primitivo de textarea todavía: usa la clase del design system. */}
          <textarea
            id="rol-desc"
            maxLength={200}
            rows={3}
            placeholder={textos.form.descPlaceholder}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className={cn("textarea", showDesc && "err")}
          />
          <div className="flex items-center justify-between gap-3">
            {showDesc ? <ErrMsg>{errDesc}</ErrMsg> : <span />}
            <span
              className={cn(
                "shrink-0 font-mono text-xs",
                descripcion.length > 200 ? "text-danger" : "text-fg-3",
              )}
            >
              {descripcion.length}/200
            </span>
          </div>
        </div>

        <div>
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
            <span className="font-display text-base font-semibold text-fg-1">
              Permisos <span className="text-danger">*</span>
            </span>
            <span
              className={cn(
                "text-[13.5px] font-semibold",
                selected.size ? "text-green-800" : "text-fg-3",
              )}
            >
              {selected.size} {selected.size === 1 ? "permiso seleccionado" : "permisos seleccionados"}
            </span>
          </div>

          <div className="mb-3.5 flex items-center gap-2.5 rounded-md bg-info-fill px-3.5 py-2.5 text-[13.5px] leading-snug text-info-fg">
            <Lightbulb className="size-[17px] shrink-0 text-info" />
            <span>
              Marcá el título de un grupo para activar <strong>todos</strong> sus permisos de una
              vez. Después destildá los que no necesites.
            </span>
          </div>

          {attempted && errPerms && (
            <div className="mb-3">
              <ErrMsg>{errPerms}</ErrMsg>
            </div>
          )}

          <div className="flex flex-col gap-3.5">
            {grupos.length === 0 ? (
              <p className="text-sm text-fg-2">No hay permisos definidos en el sistema todavía.</p>
            ) : (
              grupos.map((g) => (
                <PermGroupEditor
                  key={g.nombre}
                  group={g}
                  selected={selected}
                  onToggleGroup={toggleGroup}
                  onTogglePerm={togglePerm}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-outline-variant bg-cream-tert px-[26px] py-4">
        {error && <Alert className="mb-3">{error}</Alert>}
        <div className="flex justify-end gap-3">
          <Button variant="neutral" onClick={onCancel} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={busy}>
            {busy ? <Loader className="spin size-[17px]" /> : <Check className="size-[17px]" />}
            {editing ? "Guardar cambios" : "Crear rol"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Panel del formulario. No usa <Modal> a propósito: ese primitivo es un diálogo
 * centrado de ancho fijo, y acá hace falta el doble de ancho, anclado arriba y
 * con scroll propio, porque el editor de permisos crece con el catálogo.
 */
export function Panel({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto bg-[rgba(42,38,32,0.45)] px-5 py-10 backdrop-blur-[2px]"
    >
      <div className="pop m-auto w-[720px] max-w-full overflow-hidden rounded-lg border border-outline-variant bg-surface shadow-pop">
        {children}
      </div>
    </div>
  );
}
