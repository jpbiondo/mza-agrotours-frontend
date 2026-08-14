"use client";

import { useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  Plus, X, AlertCircle, ShieldCheck, Lock, Pencil, Trash2, Info, ChevronRight, Check,
  KeyRound, Users, Lightbulb, UserCog, ClipboardCheck, Warehouse, CalendarCheck, Loader,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import AdminShell from "@/components/admin/AdminShell";
import { Alert, Button, Card, IconCircle, Modal, Toast } from "@/components/ui";
import type { ToastData } from "@/components/ui";
import { TextField } from "@/components/ui/text-field";
import { genId } from "@/lib/id";
import { cn } from "@/lib/utils";
import { useRoles, useCrearRol, useActualizarRol, useDarBajaRol } from "@/hooks/useRoles";
import type { GrupoPermiso, RolAdminDetalle } from "@/types/admin";

/**
 * Errores de dominio al guardar. Lo que no esté acá cae en el mensaje genérico:
 * hablar de reintentar sólo tiene sentido si el problema puede ser pasajero.
 */
const ERROR_GUARDAR: Record<string, string> = {
  // Vale para el alta y para el renombre.
  "rol.rolAlreadyExists": "Ya existe un rol con ese nombre. Elegí otro.",
};

function mensajeGuardar(code: string | undefined, editando: boolean): string {
  return (
    (code && ERROR_GUARDAR[code]) ||
    (editando
      ? "No pudimos guardar los cambios. Probá de nuevo en unos minutos."
      : "No pudimos crear el rol. Probá de nuevo en unos minutos.")
  );
}

/**
 * La baja no define códigos de dominio todavía, pero si vino uno el backend
 * rechazó por algo concreto y reintentar no lo va a arreglar. TODO backend:
 * mapear los que aparezcan, p. ej. si al rol le asignaron un administrador
 * entre que se abrió el diálogo y se confirmó.
 */
function mensajeBaja(code?: string): string {
  return code
    ? "No se pudo dar de baja el rol."
    : "No pudimos dar de baja el rol. Probá de nuevo en unos minutos.";
}

/**
 * Los iconos son componentes, así que el slug que manda el backend se resuelve
 * acá. Es lo único del catálogo que el front tiene que conocer, y un slug nuevo
 * cae en el genérico en vez de romper la pantalla.
 */
const GRUPO_ICONO: Record<string, ComponentType<{ className?: string }>> = {
  "user-cog": UserCog,
  "shield-check": ShieldCheck,
  "clipboard-check": ClipboardCheck,
  "calendar-check": CalendarCheck,
  "key-round": KeyRound,
  warehouse: Warehouse,
  users: Users,
};

function IconoGrupo({ icono, className }: { icono: string; className?: string }) {
  const Icono = GRUPO_ICONO[icono] ?? ShieldCheck;
  return <Icono className={className} />;
}

/** "Gestión de administradores" → "Administradores", para las píldoras de la tabla. */
function etiquetaGrupo(nombre: string): string {
  const corto = nombre.replace(/^gesti[oó]n de\s+/i, "").trim();
  return corto ? corto[0].toUpperCase() + corto.slice(1) : nombre;
}

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

/** Casillero cuadrado del editor de permisos; `mixed` = grupo a medio marcar. */
function BigCheck({ state, className }: { state: "on" | "off" | "mixed"; className?: string }) {
  const filled = state !== "off";
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[7px] border-2",
        filled ? "border-green-800 bg-green-800" : "border-sand bg-surface",
        className,
      )}
    >
      {state === "on" && <Check className="size-[14px] text-white" />}
      {state === "mixed" && <span className="h-[3px] w-3 rounded-sm bg-white" />}
    </span>
  );
}

function PermGroupEditor({
  group,
  selected,
  onToggleGroup,
  onTogglePerm,
}: {
  group: GrupoPermiso;
  selected: Set<string>;
  onToggleGroup: (g: GrupoPermiso) => void;
  onTogglePerm: (codigo: string) => void;
}) {
  const count = group.permisos.filter((p) => selected.has(p.codigo)).length;
  const groupState = count === 0 ? "off" : count === group.permisos.length ? "on" : "mixed";

  return (
    <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface">
      <button
        type="button"
        onClick={() => onToggleGroup(group)}
        className={cn(
          "flex w-full cursor-pointer items-center gap-3.5 border-b border-outline-variant px-4 py-3.5 text-left",
          groupState === "off" ? "bg-cream-tert" : "bg-green-050",
        )}
      >
        <BigCheck state={groupState} className="size-[25px]" />
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-outline-variant bg-surface">
          <IconoGrupo icono={group.icono} className="size-[19px] text-green-800" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[16.5px] font-semibold text-fg-1">
            {group.nombre}
          </span>
          <span className="mt-0.5 block text-[12.5px] text-fg-3">{group.descripcion}</span>
        </span>
        <span
          className={cn(
            "rounded-pill border px-[11px] py-1 font-mono text-[12.5px] font-semibold whitespace-nowrap",
            count
              ? "border-green-300 bg-green-100 text-green-800"
              : "border-outline-variant bg-surface text-fg-3",
          )}
        >
          {count}/{group.permisos.length}
        </span>
      </button>

      <div className="flex flex-col gap-[3px] py-2.5 pr-2.5 pl-11">
        {group.permisos.map((p) => {
          const on = selected.has(p.codigo);
          return (
            <button
              key={p.codigo}
              type="button"
              onClick={() => onTogglePerm(p.codigo)}
              className={cn(
                "flex w-full cursor-pointer items-center gap-3.5 rounded-md border px-3.5 py-2.5 text-left",
                on ? "border-green-300 bg-green-050" : "border-transparent",
              )}
            >
              <BigCheck state={on ? "on" : "off"} className="size-[23px]" />
              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-[15.5px]",
                    on ? "font-semibold text-green-800" : "font-medium text-fg-1",
                  )}
                >
                  {p.nombre || p.codigo}
                </span>
                {p.descripcion && (
                  <span className="mt-0.5 block text-[12.5px] text-fg-3">{p.descripcion}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PermSummary({ perms, grupos }: { perms: string[]; grupos: GrupoPermiso[] }) {
  if (!perms.length) return <span className="text-[13px] text-fg-3">Sin permisos</span>;

  const tiene = new Set(perms);
  const conteos = grupos
    .map((g) => ({ grupo: g, count: g.permisos.filter((p) => tiene.has(p.codigo)).length }))
    .filter((x) => x.count > 0);

  return (
    <span className="flex flex-wrap gap-1.5">
      {conteos.map(({ grupo, count }) => (
        <span
          key={grupo.nombre}
          className="inline-flex items-center gap-1.5 rounded-pill border border-green-300 bg-green-050 px-2.5 py-1 text-[12.5px] font-semibold whitespace-nowrap text-green-800"
        >
          <IconoGrupo icono={grupo.icono} className="size-[14px] text-green-700" />{" "}
          {etiquetaGrupo(grupo.nombre)} <span className="font-mono opacity-80">{count}</span>
        </span>
      ))}
    </span>
  );
}

function RoleForm({
  initial,
  grupos,
  existingNames,
  busy,
  error,
  onCancel,
  onSave,
}: {
  initial: RolAdminDetalle | null;
  grupos: GrupoPermiso[];
  existingNames: string[];
  busy: boolean;
  /** Error del backend al guardar; mantiene el panel abierto con lo cargado. */
  error: string | null;
  onCancel: () => void;
  onSave: (r: RolAdminDetalle) => void;
}) {
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
      : nombre.trim().length > 40
        ? "El nombre no puede superar los 40 caracteres."
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
      id: initial?.id ?? genId("ar"),
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
            {editing ? nombre || "Editar rol" : "Crear rol de administrador"}
          </h2>
          <p className="mt-1.5 text-sm text-fg-2">
            {editing
              ? "Modificá el nombre, la descripción o los permisos del rol."
              : "Definí qué puede hacer un administrador con este rol."}
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
          <FieldLabel htmlFor="ar-nombre">Nombre del rol</FieldLabel>
          <TextField
            id="ar-nombre"
            value={nombre}
            onChange={setNombre}
            maxLength={40}
            placeholder="Ej. Moderador de establecimientos"
            aria-invalid={showNombre !== ""}
          />
          <div className="flex items-center justify-between gap-3">
            {showNombre ? (
              <ErrMsg>{errNombre}</ErrMsg>
            ) : (
              <p className="text-[12.5px] text-fg-3">
                Así verán este rol el resto de los administradores.
              </p>
            )}
            <span
              className={cn(
                "shrink-0 font-mono text-xs",
                nombre.length > 40 ? "text-danger" : "text-fg-3",
              )}
            >
              {nombre.length}/40
            </span>
          </div>
        </div>

        <div className="field">
          <FieldLabel htmlFor="ar-desc">Descripción</FieldLabel>
          {/* Sin primitivo de textarea todavía: usa la clase del design system. */}
          <textarea
            id="ar-desc"
            maxLength={200}
            rows={3}
            placeholder="Contá para qué sirve este rol dentro del sistema."
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
function Panel({ onClose, children }: { onClose: () => void; children: ReactNode }) {
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

function Inner({ initial, grupos }: { initial: RolAdminDetalle[]; grupos: GrupoPermiso[] }) {
  // Copia local: el alta y la baja todavía son mocks (ver useRoles). Cuando se
  // wireen, esto pasa a ser `reload()` sobre el hook.
  const [roles, setRoles] = useState<RolAdminDetalle[]>(initial);
  const [form, setForm] = useState<{ open: boolean; initial: RolAdminDetalle | null }>({
    open: false,
    initial: null,
  });
  const [toDelete, setToDelete] = useState<RolAdminDetalle | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const { crear, isLoading: creating } = useCrearRol();
  const { actualizar, isLoading: saving } = useActualizarRol();
  const { darBaja, isLoading: deleting } = useDarBajaRol();

  const totalAdmins = roles.reduce((s, r) => s + r.cantidadUsuarios, 0);
  // Un mismo código puede repetirse en dos grupos: se cuentan los distintos.
  const permisosDisponibles = new Set(grupos.flatMap((g) => g.permisos.map((p) => p.codigo))).size;

  const stats = [
    { icon: <ShieldCheck className="size-5 text-green-800" />, label: "Roles activos", value: roles.length },
    { icon: <UserCog className="size-5 text-green-800" />, label: "Administradores con rol", value: totalAdmins },
    { icon: <KeyRound className="size-5 text-green-800" />, label: "Permisos disponibles", value: permisosDisponibles },
  ];

  function notify(title: string) {
    setToast({ tone: "success", title });
    setTimeout(() => setToast((t) => (t?.title === title ? null : t)), 3200);
  }

  function abrirForm(initial: RolAdminDetalle | null) {
    setFormError(null);
    setForm({ open: true, initial });
  }

  function cerrarForm() {
    setFormError(null);
    setForm({ open: false, initial: null });
  }

  async function saveRole(role: RolAdminDetalle) {
    setFormError(null);
    const editando = !!form.initial;
    // El cuerpo es el mismo para el alta y la modificación.
    const datos = {
      nombre: role.nombre,
      descripcion: role.descripcion,
      permisos: role.permisos,
    };

    if (editando) {
      const res = await actualizar(role.id, datos);
      if (!res.ok) {
        setFormError(mensajeGuardar(res.code, true));
        return;
      }
      setRoles((prev) => prev.map((r) => (r.id === role.id ? role : r)));
      cerrarForm();
      notify(`Se guardaron los cambios del rol «${role.nombre}».`);
      return;
    }

    const res = await crear(datos);
    if (!res.ok) {
      // El panel queda abierto con lo cargado: reescribir todo sería cruel,
      // sobre todo con los permisos ya tildados.
      setFormError(mensajeGuardar(res.code, false));
      return;
    }
    // El id lo asigna el backend; el de `role` es el provisorio de genId.
    setRoles((prev) => [...prev, { ...role, id: res.id ?? role.id }]);
    cerrarForm();
    notify(`Se creó el rol «${role.nombre}».`);
  }

  function pedirBaja(role: RolAdminDetalle | null) {
    setDeleteError(null);
    setToDelete(role);
  }

  async function confirmDelete(role: RolAdminDetalle) {
    setDeleteError(null);
    const res = await darBaja(role.id);
    if (!res.ok) {
      setDeleteError(mensajeBaja(res.code));
      return;
    }
    setRoles((prev) => prev.filter((r) => r.id !== role.id));
    setToDelete(null);
    notify(`El rol «${role.nombre}» fue dado de baja.`);
  }

  return (
    <div className="mx-auto max-w-[1240px] px-7 pt-7 pb-[72px]">
      <div className="mb-3.5 flex items-center gap-2.5 text-[13.5px] text-fg-3">
        <span>Acceso</span>
        <ChevronRight className="size-[15px]" />
        <span className="font-medium text-fg-2">Roles de administrador</span>
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-[280px]">
          <h1 className="font-display text-[34px] font-bold tracking-[-.01em] text-fg-1">
            Roles de administrador
          </h1>
          <p className="mt-2.5 max-w-[660px] text-[15.5px] leading-relaxed text-fg-2">
            Creá roles para el equipo de administración y elegí qué puede hacer cada uno dentro del
            sistema.
          </p>
        </div>
        <Button size="lg" onClick={() => abrirForm(null)}>
          <Plus className="size-[18px]" /> Agregar rol
        </Button>
      </div>

      <div className="mb-5 flex flex-wrap gap-3.5">
        {stats.map((s) => (
          <Card key={s.label} className="flex min-w-[190px] items-center gap-3 px-4 py-3">
            <span className="flex size-[42px] shrink-0 items-center justify-center rounded-[10px] bg-green-050">
              {s.icon}
            </span>
            <span>
              <span className="block font-mono text-xl font-bold text-fg-1">{s.value}</span>
              <span className="block text-[12.5px] text-fg-2">{s.label}</span>
            </span>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr>
                {["Rol de administrador", "Permisos", "Administradores", "Acciones"].map((h, i) => (
                  <th
                    key={h}
                    className={cn(
                      "border-b-2 border-outline-variant px-4 py-3.5 text-[12.5px] font-bold tracking-[.05em] whitespace-nowrap text-fg-2 uppercase",
                      i === 2 ? "text-center" : i === 3 ? "text-right" : "text-left",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-[15px] text-fg-2">
                    Todavía no hay roles de administrador.
                  </td>
                </tr>
              )}
              {roles.map((r) => {
                const tieneUsuarios = r.cantidadUsuarios > 0;
                const noBorrable = tieneUsuarios || r.esProtegido;
                const delTitle = r.esProtegido
                  ? "Este rol está protegido y no se puede dar de baja"
                  : tieneUsuarios
                    ? `No se puede dar de baja: tiene ${r.cantidadUsuarios} ${r.cantidadUsuarios === 1 ? "administrador asignado" : "administradores asignados"}`
                    : "Dar de baja este rol";

                return (
                  <tr key={r.id} className="border-b border-cream-tert">
                    <td className="max-w-[340px] p-4 align-top">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-display text-[16.5px] font-semibold text-fg-1">
                          {r.nombre}
                        </span>
                        {r.esProtegido && (
                          <span className="inline-flex items-center gap-1.5 rounded-pill border border-sand bg-cream-tert px-2.5 py-[3px] text-[11.5px] font-semibold text-brown-700">
                            <Lock className="size-3 text-brown-700" /> Protegido
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-[13.5px] leading-snug text-fg-2">
                        {r.descripcion || "—"}
                      </div>
                    </td>

                    <td className="max-w-[380px] p-4 align-top">
                      <PermSummary perms={r.permisos} grupos={grupos} />
                    </td>

                    <td className="p-4 text-center align-top">
                      <span
                        className={cn(
                          "inline-flex items-center gap-2 font-mono text-base font-bold",
                          tieneUsuarios ? "text-fg-1" : "text-fg-3",
                        )}
                      >
                        <Users
                          className={cn("size-4", tieneUsuarios ? "text-brown-700" : "text-fg-3")}
                        />{" "}
                        {r.cantidadUsuarios}
                      </span>
                    </td>

                    <td className="p-4 align-top">
                      <div className="flex justify-end gap-2.5">
                        <Button
                          variant="neutral"
                          size="sm"
                          className="text-sm text-green-800"
                          disabled={r.esProtegido}
                          title={
                            r.esProtegido
                              ? "Este rol está protegido y no se puede modificar"
                              : "Modificar este rol"
                          }
                          onClick={() => abrirForm(r)}
                        >
                          <Pencil className="size-[17px]" /> Modificar
                        </Button>
                        {/* Danger de contorno: <Button variant="danger"> es relleno,
                            demasiado peso para una acción secundaria de la fila. */}
                        <Button
                          variant="neutral"
                          size="sm"
                          className="border-danger text-sm text-danger"
                          disabled={noBorrable}
                          title={delTitle}
                          onClick={() => pedirBaja(r)}
                        >
                          <Trash2 className="size-[17px]" /> Borrar
                        </Button>
                      </div>
                      {tieneUsuarios && !r.esProtegido && (
                        <div className="mt-2 flex items-center justify-end gap-1.5 text-[11.5px] text-fg-3">
                          <Lock className="size-[13px]" /> No se puede borrar con administradores
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-4 flex items-center gap-2 text-[13px] text-fg-3">
        <Info className="size-4" /> Los roles marcados como{" "}
        <strong className="font-semibold text-fg-2">Protegidos</strong> son del sistema: no se
        pueden modificar ni dar de baja.
      </div>

      {form.open && (
        <Panel onClose={cerrarForm}>
          <RoleForm
            initial={form.initial}
            grupos={grupos}
            existingNames={roles
              .filter((r) => !form.initial || r.id !== form.initial!.id)
              .map((r) => r.nombre)}
            busy={creating || saving}
            error={formError}
            onCancel={cerrarForm}
            onSave={saveRole}
          />
        </Panel>
      )}

      {toDelete && (
        <Modal onClose={() => pedirBaja(null)} dismissable={!deleting}>
          <div className="flex items-center gap-3.5">
            <IconCircle tone="danger">
              <Trash2 className="size-[22px] text-danger" />
            </IconCircle>
            <h3 className="font-display text-xl font-bold text-fg-1">Dar de baja el rol</h3>
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-fg-2">
            ¿Seguro que querés dar de baja el rol{" "}
            <strong className="text-fg-1">«{toDelete.nombre}»</strong>? Dejará de estar disponible
            para asignar a nuevos administradores.
          </p>
          {deleteError && (
            <Alert className="mt-4">{deleteError}</Alert>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="neutral" onClick={() => pedirBaja(null)} disabled={deleting}>
              No, volver
            </Button>
            <Button variant="danger" onClick={() => confirmDelete(toDelete)} disabled={deleting}>
              {deleting ? <Loader className="spin size-[17px]" /> : <Trash2 className="size-[17px]" />}
              Sí, dar de baja
            </Button>
          </div>
        </Modal>
      )}

      {toast && <Toast {...toast} />}
    </div>
  );
}

export default function RolesClient() {
  const { roles, grupos, isLoading, error, reload } = useRoles();
  return (
    <AdminShell active="roles">
      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} loadingLabel="Cargando roles…">
        <Inner initial={roles} grupos={grupos} />
      </AsyncBoundary>
    </AdminShell>
  );
}
