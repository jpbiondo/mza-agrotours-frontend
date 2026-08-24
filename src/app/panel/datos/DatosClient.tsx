"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Home, MapPin, Phone, Landmark, Sprout, Pencil, X, Check, Lock, Plus,
  Search, Loader, ExternalLink, Inbox, Trash2, AlertTriangle,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { Alert, Button, Card, IconCircle, Modal, Skeleton, Toast } from "@/components/ui";
import type { ToastData } from "@/components/ui";
import { TextField } from "@/components/ui/text-field";
import { validarCvu, validarDescripcion, validarEmail, validarTelefono } from "@/data/datos";
import { cn } from "@/lib/utils";
import { useEstablecimientos } from "@/hooks/useEstablecimientos";
import {
  useEliminarEstablecimiento,
  useEstablecimientoDatos,
  useGuardarEstablecimiento,
} from "@/hooks/useEstablecimientoDatos";
import { useTiposCultivo } from "@/hooks/useTiposCultivo";
import type { CultivoRef, EstablecimientoDatos } from "@/types/datos";

/** Secciones que se pueden editar; una por vez. */
type Seccion = "identidad" | "contacto" | "operacion" | "cultivos";

function mensajeGuardar(code?: string): string {
  // TODO backend: mapear los códigos de dominio del PUT cuando existan.
  return code
    ? "No se pudieron guardar los cambios."
    : "No se pudieron guardar los cambios. Probá de nuevo en unos minutos.";
}

function mensajeBaja(code?: string): string {
  // TODO backend: mapear los códigos de dominio del DELETE cuando existan.
  return code
    ? "No se pudo eliminar el establecimiento."
    : "No se pudo eliminar el establecimiento. Probá de nuevo en unos minutos.";
}

/** Confirmación de la baja: hay que escribir ELIMINAR, como en el diseño. */
function EliminarModal({
  nombre,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  nombre: string;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [texto, setTexto] = useState("");
  const confirmado = texto.trim().toUpperCase() === "ELIMINAR";

  return (
    <Modal onClose={onCancel} dismissable={!busy}>
      <div className="flex items-center gap-3.5">
        <IconCircle tone="danger">
          <AlertTriangle className="size-[22px] text-danger-fg" />
        </IconCircle>
        <h3 className="font-display text-[19px] font-semibold text-fg-1">
          Eliminar establecimiento
        </h3>
      </div>

      <p className="mt-4 text-[14.5px] leading-relaxed text-fg-2">
        Vas a eliminar <strong className="text-fg-1">{nombre}</strong>. Se dan de baja sus
        actividades, cultivos y datos asociados. Esta acción no se puede deshacer.
      </p>

      <div className="field mt-4">
        <label htmlFor="confirmar-baja" className="text-[13.5px] font-semibold text-fg-1">
          Escribí <span className="font-mono text-danger-fg">ELIMINAR</span> para confirmar
        </label>
        <TextField id="confirmar-baja" value={texto} onChange={setTexto} placeholder="ELIMINAR" />
      </div>

      {error && <Alert className="mt-4">{error}</Alert>}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="neutral" onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={!confirmado || busy}>
          {busy ? <Loader className="spin size-[17px]" /> : <Trash2 className="size-[17px]" />}
          Eliminar establecimiento
        </Button>
      </div>
    </Modal>
  );
}

/* ---- Tarjeta de sección ------------------------------------------------- */

function SectionCard({
  title,
  icon,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  canSave = true,
  saving,
  locked,
  children,
}: {
  title: string;
  icon: ReactNode;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave?: () => void;
  canSave?: boolean;
  saving?: boolean;
  /** Sección de sólo lectura: no ofrece editar. */
  locked?: boolean;
  children: ReactNode;
}) {
  return (
    <Card className="mb-6 overflow-hidden">
      <header className="flex items-center justify-between gap-4 border-b border-cream-tert px-7 py-5">
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-050">
            {icon}
          </span>
          <h2 className="font-display text-[18px] font-semibold text-fg-1">{title}</h2>
        </div>
        {locked ? null : !isEditing ? (
          <Button variant="neutral" size="sm" className="text-sm" onClick={onEdit}>
            <Pencil className="size-[15px]" /> Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="neutral" size="sm" className="text-sm" onClick={onCancel} disabled={saving}>
              <X className="size-[15px]" /> Cancelar
            </Button>
            <Button size="sm" className="text-sm" onClick={onSave} disabled={!canSave || saving}>
              {saving ? <Loader className="spin size-[15px]" /> : <Check className="size-[15px]" />}
              Guardar cambios
            </Button>
          </div>
        )}
      </header>
      <div className="px-7 pt-2 pb-7">{children}</div>
    </Card>
  );
}

/** Fila de lectura: rótulo a la izquierda, valor a la derecha. */
function ReadRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-1 border-b border-dashed border-cream-tert py-3.5 sm:grid-cols-[200px_1fr]">
      <div className="t-label">{label}</div>
      <div
        className={cn(
          "break-words",
          mono ? "font-mono text-[14px] font-medium" : "text-[14.5px]",
          value ? "text-fg-1" : "text-fg-3",
        )}
      >
        {value || "—"}
      </div>
    </div>
  );
}

/** Campo de edición. `disabled` marca los datos que no se pueden tocar. */
function Campo({
  label,
  value,
  onChange,
  type = "text",
  area,
  hint,
  disabled,
  error,
  maxLength,
  count,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  area?: boolean;
  hint?: string;
  disabled?: boolean;
  error?: string | null;
  maxLength?: number;
  count?: number;
}) {
  const id = `campo-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="field">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-display text-base font-semibold text-fg-1">
          {label}
        </label>
        {count != null && (
          <span
            className={cn(
              "font-mono text-xs",
              value.length > count ? "text-danger" : "text-fg-3",
            )}
          >
            {value.length} / {count}
          </span>
        )}
      </div>

      {area ? (
        <textarea
          id={id}
          value={value}
          disabled={disabled}
          maxLength={maxLength}
          rows={4}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn("textarea min-h-[110px]", error && "err", disabled && "bg-cream-tert text-fg-2")}
        />
      ) : (
        <TextField
          id={id}
          type={type}
          value={value}
          maxLength={maxLength}
          onChange={(v) => onChange?.(v)}
          aria-invalid={!!error}
        />
      )}

      {disabled && (
        <div className="flex items-center gap-1.5 text-xs text-fg-3">
          <Lock className="size-3" /> Este dato no puede modificarse
        </div>
      )}
      {!disabled && hint && !error && <div className="text-[12.5px] text-fg-3">{hint}</div>}
      {error && <div className="err-msg">{error}</div>}
    </div>
  );
}

/* ---- Cultivos ----------------------------------------------------------- */

function CultivoChip({
  nombre,
  removable,
  onRemove,
}: {
  nombre: string;
  removable?: boolean;
  onRemove?: () => void;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-pill border border-green-100 bg-green-050 text-[14px] font-semibold text-green-800",
        removable ? "py-1.5 pr-1.5 pl-3.5" : "px-4 py-2",
      )}
    >
      <Sprout className="size-[15px] text-green-700" />
      {nombre}
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar ${nombre}`}
          title="Quitar cultivo"
          className="inline-flex size-[22px] cursor-pointer items-center justify-center rounded-full bg-green-100"
        >
          <X className="size-[13px] text-green-800" />
        </button>
      )}
    </span>
  );
}

function AgregarCultivoModal({
  yaAsociados,
  onCancel,
  onSelect,
}: {
  yaAsociados: CultivoRef[];
  onCancel: () => void;
  onSelect: (cultivos: CultivoRef[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState<Set<string>>(() => new Set());
  const { cultivos, isLoading, error } = useTiposCultivo(true);

  const disponibles = useMemo(() => {
    const tiene = new Set(yaAsociados.map((c) => c.id));
    const q = query.trim().toLowerCase();
    return cultivos
      .filter((c) => !tiene.has(c.id))
      .filter((c) => c.nombre.toLowerCase().includes(q));
  }, [cultivos, yaAsociados, query]);

  const toggle = (id: string) =>
    setSel((cur) => {
      const s = new Set(cur);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });

  return (
    <Modal onClose={onCancel} padding="p-0" className="w-[520px]">
      <div className="flex items-center justify-between gap-4 border-b border-cream-tert px-[22px] py-5">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-green-050">
            <Sprout className="size-4 text-green-800" />
          </span>
          <h3 className="font-display text-[18px] font-semibold text-fg-1">Agregar cultivo</h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cerrar"
          className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-outline-variant bg-surface"
        >
          <X className="size-4 text-fg-2" />
        </button>
      </div>

      <div className="px-[22px] pt-4">
        <TextField
          value={query}
          onChange={setQuery}
          icon={<Search />}
          placeholder="Buscá por nombre del cultivo"
        />
      </div>

      <div className="max-h-[300px] overflow-y-auto px-3.5 py-2.5">
        {isLoading ? (
          <div className="flex flex-col gap-1.5 p-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <Alert className="m-2">{error}</Alert>
        ) : disponibles.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-fg-3">
            {cultivos.length === 0
              ? "Todavía no hay cultivos cargados en el sistema."
              : `No quedan cultivos para asociar${query.trim() ? ` con “${query.trim()}”` : ""}.`}
          </div>
        ) : (
          disponibles.map((c) => {
            const on = sel.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.id)}
                className="flex w-full cursor-pointer items-center gap-3 border-b border-cream-tert px-2 py-2.5 text-left last:border-b-0 hover:bg-cream-tert"
              >
                <span
                  className={cn(
                    "inline-flex size-5 shrink-0 items-center justify-center rounded-[5px] border-[1.5px]",
                    on ? "border-green-800 bg-green-800" : "border-sand bg-surface",
                  )}
                >
                  {on && <Check className="size-3.5 text-white" />}
                </span>
                <span className="inline-flex items-center gap-2 text-[14.5px] font-medium text-fg-1">
                  <Sprout className="size-[15px] text-green-700" /> {c.nombre}
                </span>
              </button>
            );
          })
        )}
      </div>

      <div className="flex justify-end gap-2.5 border-t border-cream-tert px-[22px] py-4">
        <Button variant="neutral" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          disabled={sel.size === 0}
          onClick={() => onSelect(cultivos.filter((c) => sel.has(c.id)))}
        >
          <Check className="size-[17px] shrink-0" />
          Seleccionar{sel.size > 0 ? ` (${sel.size})` : ""}
        </Button>
      </div>
    </Modal>
  );
}

/* ---- Esqueleto ---------------------------------------------------------- */

const SECCIONES_SKELETON = [3, 2, 2, 1, 0];

function DatosSkeleton() {
  return (
    <div className="mx-auto max-w-[1000px] px-7 pt-7 pb-20" aria-busy>
      <span role="status" className="sr-only">
        Cargando los datos del establecimiento…
      </span>
      <div className="mb-6">
        <h1 className="font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">
          Datos del establecimiento
        </h1>
        <p className="mt-1.5 text-[15px] text-fg-2">
          Información general, contacto y cultivos de la finca. Editá cada sección por separado.
        </p>
      </div>
      {SECCIONES_SKELETON.map((filas, i) => (
        <Card key={i} className="mb-6 overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-cream-tert px-7 py-5">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="h-[18px] w-[190px]" />
            </div>
            <Skeleton className="h-[34px] w-[86px]" />
          </div>
          <div className="px-7 pt-2 pb-7">
            {filas > 0 ? (
              Array.from({ length: filas }, (_, f) => (
                <div key={f} className="grid grid-cols-[200px_1fr] gap-6 py-3.5">
                  <Skeleton className="h-3.5 w-[120px]" />
                  <Skeleton className="h-3.5 w-[240px]" />
                </div>
              ))
            ) : (
              <div className="flex gap-2.5 pt-3">
                <Skeleton className="h-9 w-[130px] rounded-pill" />
                <Skeleton className="h-9 w-[110px] rounded-pill" />
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ---- Pantalla ----------------------------------------------------------- */

function Inner({
  datos,
  onGuardado,
}: {
  datos: EstablecimientoDatos;
  onGuardado: (cambios: Partial<EstablecimientoDatos>) => void;
}) {
  const { guardar, isLoading: saving } = useGuardarEstablecimiento();
  const { eliminar, isLoading: eliminando } = useEliminarEstablecimiento();
  const [bajaAbierta, setBajaAbierta] = useState(false);
  const [errorBaja, setErrorBaja] = useState<string | null>(null);
  const [editando, setEditando] = useState<Seccion | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  // Borradores por sección.
  const [descripcion, setDescripcion] = useState("");
  const [descErr, setDescErr] = useState<string | null>(null);
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [contactoErr, setContactoErr] = useState<{ telefono?: string | null; email?: string | null }>({});
  const [cvu, setCvu] = useState("");
  const [cvuErr, setCvuErr] = useState<string | null>(null);
  const [cultivos, setCultivos] = useState<CultivoRef[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [aQuitar, setAQuitar] = useState<CultivoRef | null>(null);

  function notificar(title: string) {
    setToast({ tone: "success", title });
    setTimeout(() => setToast((t) => (t?.title === title ? null : t)), 3400);
  }

  function abrir(seccion: Seccion) {
    setErrorGuardar(null);
    setDescripcion(datos.descripcion);
    setDescErr(null);
    setTelefono(datos.telefono);
    setEmail(datos.email);
    setContactoErr({});
    setCvu(datos.cvu);
    setCvuErr(null);
    setCultivos(datos.cultivos);
    setAddOpen(false);
    setAQuitar(null);
    setEditando(seccion);
  }

  /**
   * El backend tiene un solo endpoint, así que cada guardado manda todo: se
   * parte de lo último conocido del servidor y encima van los cambios de esta
   * sección. Al salir bien se aplican localmente —sabemos exactamente qué se
   * mandó— en vez de volver a pedir la pantalla entera.
   */
  async function guardarSeccion(cambios: Partial<EstablecimientoDatos>) {
    setErrorGuardar(null);
    const merged = { ...datos, ...cambios };
    const res = await guardar(datos.id, {
      descripcion: merged.descripcion,
      telefono: merged.telefono,
      email: merged.email,
      cvu: merged.cvu,
      cultivosIds: merged.cultivos.map((c) => c.id),
    });
    if (!res.ok) {
      setErrorGuardar(mensajeGuardar(res.code));
      return;
    }
    onGuardado(cambios);
    setEditando(null);
    notificar("Cambios guardados correctamente.");
  }

  async function confirmarBaja() {
    setErrorBaja(null);
    const res = await eliminar(datos.id);
    if (!res.ok) {
      setErrorBaja(mensajeBaja(res.code));
      return;
    }
    // Se sale del panel, no a otra pantalla de adentro: si éste era el único
    // establecimiento, la cuenta deja de ser productora y el guard de /panel
    // rebotaría con el aviso de sin acceso.
    //
    // Navegación dura a propósito: los establecimientos salen de los accesos
    // del store, y ésos se refrescan recién cuando AuthSync vuelve a pedir el
    // perfil. Sin esto el switcher seguiría ofreciendo el que se dio de baja.
    window.location.href = "/explorar";
  }

  const enCultivos = editando === "cultivos";
  const listaCultivos = enCultivos ? cultivos : datos.cultivos;
  const cultivosCambiaron =
    cultivos.map((c) => c.id).join() !== datos.cultivos.map((c) => c.id).join();

  return (
    <div className="mx-auto max-w-[1000px] px-7 pt-7 pb-20">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-[260px]">
          <h1 className="font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">
            Datos del establecimiento
          </h1>
          <p className="mt-1.5 text-[15px] text-fg-2">
            Información general, contacto y cultivos de la finca. Editá cada sección por separado.
          </p>
        </div>
        <Link
          href={`/establecimientos/${datos.id}`}
          className="btn btn-neutral inline-flex shrink-0 items-center gap-2 no-underline"
        >
          <ExternalLink className="size-4" /> Ver perfil público
        </Link>
      </div>

      {errorGuardar && <Alert className="mb-5">{errorGuardar}</Alert>}

      {/* Identidad: sólo la descripción se edita. */}
      <SectionCard
        title="Identidad de la finca"
        icon={<Home className="size-4 text-green-800" />}
        isEditing={editando === "identidad"}
        saving={saving}
        canSave={descripcion !== datos.descripcion}
        onEdit={() => abrir("identidad")}
        onCancel={() => setEditando(null)}
        onSave={() => {
          const e = validarDescripcion(descripcion);
          if (e) {
            setDescErr(e);
            return;
          }
          guardarSeccion({ descripcion });
        }}
      >
        {editando !== "identidad" ? (
          <>
            <ReadRow label="Nombre" value={datos.nombre} />
            <ReadRow label="CUIT" value={datos.cuit} mono />
            <ReadRow label="Razón social" value={datos.razonSocial} />
            <div className="pt-3.5">
              <div className="t-label mb-2">Descripción</div>
              <p className="text-[14.5px] leading-relaxed text-pretty text-fg-1">
                {datos.descripcion || "—"}
              </p>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Campo label="CUIT" value={datos.cuit} disabled />
            <Campo label="Razón social" value={datos.razonSocial} disabled />
            <div className="sm:col-span-2">
              <Campo
                area
                label="Descripción"
                value={descripcion}
                count={2000}
                maxLength={2000}
                error={descErr}
                hint="Hasta 2000 caracteres."
                onChange={(v) => {
                  setDescripcion(v);
                  if (descErr) setDescErr(null);
                }}
              />
            </div>
          </div>
        )}
      </SectionCard>

      {/* Ubicación: el backend no la expone para editar. */}
      <SectionCard
        title="Ubicación"
        icon={<MapPin className="size-4 text-green-800" />}
        locked
        isEditing={false}
        onEdit={() => {}}
        onCancel={() => {}}
      >
        <ReadRow label="Dirección" value={datos.ubicacion} />
        <ReadRow label="Localidad (Departamento)" value={datos.localidad} />
        <div className="mt-3 flex items-center gap-1.5 text-xs text-fg-3">
          <Lock className="size-3" /> La ubicación no puede modificarse desde acá.
        </div>
      </SectionCard>

      <SectionCard
        title="Contacto"
        icon={<Phone className="size-4 text-green-800" />}
        isEditing={editando === "contacto"}
        saving={saving}
        canSave={telefono !== datos.telefono || email !== datos.email}
        onEdit={() => abrir("contacto")}
        onCancel={() => setEditando(null)}
        onSave={() => {
          const te = validarTelefono(telefono);
          const me = validarEmail(email);
          if (te || me) {
            setContactoErr({ telefono: te, email: me });
            return;
          }
          guardarSeccion({ telefono: telefono.trim(), email: email.trim() });
        }}
      >
        {editando !== "contacto" ? (
          <>
            <ReadRow label="Teléfono" value={datos.telefono} mono />
            <ReadRow label="Email" value={datos.email} />
          </>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Campo
              label="Teléfono"
              value={telefono}
              maxLength={16}
              error={contactoErr.telefono}
              hint="Entre 7 y 16 caracteres."
              onChange={(v) => {
                setTelefono(v);
                if (contactoErr.telefono) setContactoErr((e) => ({ ...e, telefono: null }));
              }}
            />
            <Campo
              type="email"
              label="Email"
              value={email}
              maxLength={100}
              error={contactoErr.email}
              hint="Hasta 100 caracteres."
              onChange={(v) => {
                setEmail(v);
                if (contactoErr.email) setContactoErr((e) => ({ ...e, email: null }));
              }}
            />
          </div>
        )}
      </SectionCard>

      {/* Operación: el CVU ahora sí se edita. */}
      <SectionCard
        title="Operación"
        icon={<Landmark className="size-4 text-green-800" />}
        isEditing={editando === "operacion"}
        saving={saving}
        canSave={cvu !== datos.cvu}
        onEdit={() => abrir("operacion")}
        onCancel={() => setEditando(null)}
        onSave={() => {
          const e = validarCvu(cvu);
          if (e) {
            setCvuErr(e);
            return;
          }
          guardarSeccion({ cvu: cvu.trim() });
        }}
      >
        {editando !== "operacion" ? (
          <ReadRow label="CVU" value={datos.cvu} mono />
        ) : (
          <Campo
            label="CVU"
            value={cvu}
            maxLength={22}
            error={cvuErr}
            hint="22 dígitos. Es la cuenta donde se acreditan los pagos de las reservas."
            onChange={(v) => {
              setCvu(v);
              if (cvuErr) setCvuErr(null);
            }}
          />
        )}
      </SectionCard>

      <SectionCard
        title="Cultivos asociados"
        icon={<Sprout className="size-4 text-green-800" />}
        isEditing={enCultivos}
        saving={saving}
        canSave={cultivosCambiaron}
        onEdit={() => abrir("cultivos")}
        onCancel={() => setEditando(null)}
        onSave={() => guardarSeccion({ cultivos })}
      >
        {listaCultivos.length === 0 ? (
          <p className="pt-2 text-sm text-fg-3">
            No hay cultivos asociados a este establecimiento.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2.5 pt-1">
            {listaCultivos.map((c) => (
              <CultivoChip
                key={c.id}
                nombre={c.nombre || c.id}
                removable={enCultivos}
                onRemove={() => setAQuitar(c)}
              />
            ))}
          </div>
        )}

        {enCultivos && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-sand bg-surface px-4 py-2.5 text-[13.5px] font-semibold text-green-800 hover:border-green-800 hover:bg-green-050"
          >
            <Plus className="size-4" /> Agregar cultivo
          </button>
        )}
      </SectionCard>

      <div className="mt-8 flex justify-end">
        <Button
          variant="neutral"
          className="border-danger text-danger"
          onClick={() => {
            setErrorBaja(null);
            setBajaAbierta(true);
          }}
        >
          <Trash2 className="size-4" /> Eliminar establecimiento
        </Button>
      </div>

      {bajaAbierta && (
        <EliminarModal
          nombre={datos.nombre}
          busy={eliminando}
          error={errorBaja}
          onCancel={() => setBajaAbierta(false)}
          onConfirm={confirmarBaja}
        />
      )}

      {addOpen && (
        <AgregarCultivoModal
          yaAsociados={cultivos}
          onCancel={() => setAddOpen(false)}
          onSelect={(nuevos) => {
            setCultivos((cur) => [...cur, ...nuevos]);
            setAddOpen(false);
          }}
        />
      )}

      {aQuitar && (
        <Modal onClose={() => setAQuitar(null)}>
          <h3 className="font-display text-[19px] font-semibold text-fg-1">
            ¿Quitar este cultivo?
          </h3>
          <p className="mt-3 text-[14.5px] leading-relaxed text-fg-2">
            Se saca el cultivo del establecimiento. El cambio se aplica cuando guardes la sección.
          </p>
          <div className="mt-4">
            <CultivoChip nombre={aQuitar.nombre || aQuitar.id} />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="neutral" onClick={() => setAQuitar(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setCultivos((cur) => cur.filter((c) => c.id !== aQuitar.id));
                setAQuitar(null);
              }}
            >
              Quitar
            </Button>
          </div>
        </Modal>
      )}

      {toast && <Toast {...toast} />}
    </div>
  );
}

/** Sin establecimientos el panel no tiene nada que mostrar acá. */
function SinEstablecimiento() {
  return (
    <div className="mx-auto max-w-[640px] px-7 pt-16 pb-24 text-center">
      <Inbox className="mx-auto size-8 text-fg-3" />
      <p className="mt-3.5 text-[15px] text-fg-2">
        Todavía no administrás ningún establecimiento.
      </p>
    </div>
  );
}

export default function DatosClient() {
  // El establecimiento activo lo elige el switcher del shell.
  const { activo } = useEstablecimientos();
  const fincaId = activo?.id ?? "";
  const { datos, isLoading, error, reload, aplicar } = useEstablecimientoDatos(fincaId);

  if (!fincaId) return <SinEstablecimiento />;

  return (
    <AsyncBoundary
      loading={isLoading}
      error={error}
      onRetry={reload}
      skeleton={<DatosSkeleton />}
    >
      {/* El key remonta al cambiar de establecimiento: así no quedan borradores
          ni secciones abiertas del anterior. */}
      {datos && <Inner key={fincaId} datos={datos} onGuardado={aplicar} />}
    </AsyncBoundary>
  );
}
