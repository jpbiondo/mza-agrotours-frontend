"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Home,
  MapPin,
  Phone,
  Landmark,
  Sprout,
  Pencil,
  X,
  Check,
  Lock,
  Loader,
  ExternalLink,
  Inbox,
  Trash2,
  Info,
  ArrowRight,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import {
  Alert,
  Button,
  buttonClasses,
  Card,
  Skeleton,
  Toast,
} from "@/components/ui";
import type { ToastData } from "@/components/ui";
import { TextField } from "@/components/ui/text-field";
import {
  validarCvu,
  validarDescripcion,
  validarEmail,
  validarNombre,
  validarTelefono,
} from "@/data/datos";
import { cn } from "@/lib/utils";
import { useEstablecimientos } from "@/hooks/useEstablecimientos";
import {
  useEstablecimientoDatos,
  useGuardarEstablecimiento,
} from "@/hooks/useEstablecimientoDatos";
import EliminarEstablecimientoFlow from "./EliminarEstablecimientoFlow";
import type { EstablecimientoDatos } from "@/types/datos";

/** Secciones que se pueden editar; una por vez. */
type Seccion = "identidad" | "contacto" | "operacion";

/** El nombre es único entre establecimientos: el PUT contesta 409 con este código. */
const NOMBRE_DUPLICADO = "E.nombreYaExiste";

/** Errores de dominio del PUT. El resto cae en el genérico. */
const ERROR_GUARDAR: Record<string, string> = {
  [NOMBRE_DUPLICADO]:
    "Ya existe un establecimiento con ese nombre. Probá con otro.",
  // TODO backend: mapear el resto de los códigos del PUT cuando existan.
};

function mensajeGuardar(code?: string): string {
  if (code) return ERROR_GUARDAR[code] ?? "No se pudieron guardar los cambios.";
  return "No se pudieron guardar los cambios. Probá de nuevo en unos minutos.";
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
  aside,
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
  /** Reemplaza los botones del encabezado en las secciones `locked`. */
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="mb-6 overflow-hidden">
      <header className="flex items-center justify-between gap-4 border-b border-cream-tert px-7 py-5">
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-green-050">
            {icon}
          </span>
          <h2 className="font-display text-[18px] font-semibold text-fg-1">
            {title}
          </h2>
        </div>
        {locked ? (
          aside
        ) : !isEditing ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-sm"
            onClick={onEdit}
          >
            <Pencil className="size-[15px]" /> Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm"
              onClick={onCancel}
              disabled={saving}
            >
              <X className="size-[15px]" /> Cancelar
            </Button>
            <Button
              size="sm"
              className="text-sm"
              onClick={onSave}
              disabled={!canSave || saving}
            >
              {saving ? (
                <Loader className="spin size-[15px]" />
              ) : (
                <Check className="size-[15px]" />
              )}
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
function ReadRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
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
  required,
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
  required?: boolean;
}) {
  const id = `campo-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="field">
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="font-display text-base font-semibold text-fg-1"
        >
          {label}
          {/* aria-hidden: el asterisco es decorativo, lo obligatorio lo dice el
              mensaje de error. Mismo patrón que el FormLabel de ui/form.tsx. */}
          {required && (
            <span aria-hidden className="ml-[3px] text-danger">
              *
            </span>
          )}
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
          className={cn(
            "textarea min-h-[110px]",
            error && "err",
            disabled && "bg-cream-tert text-fg-2",
          )}
        />
      ) : (
        <TextField
          id={id}
          type={type}
          value={value}
          maxLength={maxLength}
          onChange={(v) => onChange?.(v)}
          aria-invalid={!!error}
          disabled={disabled}
        />
      )}

      {disabled && (
        <div className="flex items-center gap-1.5 text-xs text-fg-3">
          <Lock className="size-3" /> Este dato no puede modificarse
        </div>
      )}
      {!disabled && hint && !error && (
        <div className="text-[12.5px] text-fg-3">{hint}</div>
      )}
      {error && <div className="err-msg">{error}</div>}
    </div>
  );
}

/* ---- Cultivos ----------------------------------------------------------- */

/** Sólo lectura: los cultivos salen de las actividades, no se editan acá. */
function CultivoChip({ nombre }: { nombre: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-pill border border-green-100 bg-green-050 px-4 py-2 text-[14px] font-semibold text-green-800">
      <Sprout className="size-[15px] text-green-700" />
      {nombre}
    </span>
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
          Información general, contacto y cultivos de la finca. Editá cada
          sección por separado.
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
                <div
                  key={f}
                  className="grid grid-cols-[200px_1fr] gap-6 py-3.5"
                >
                  <Skeleton className="h-3.5 w-[120px]" />
                  <Skeleton className="h-3.5 w-[240px]" />
                </div>
              ))
            ) : (
              // Cultivos: la nota de "se deriva de las actividades", los chips
              // y el link a actividades.
              <div className="pt-1">
                <Skeleton className="h-[62px] w-full rounded-md" />
                <div className="mt-4.5 flex gap-2.5">
                  <Skeleton className="h-9 w-[130px] rounded-pill" />
                  <Skeleton className="h-9 w-[110px] rounded-pill" />
                </div>
                <Skeleton className="mt-4.5 h-[34px] w-[140px]" />
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
  const [bajaAbierta, setBajaAbierta] = useState(false);
  const [editando, setEditando] = useState<Seccion | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  // Borradores por sección.
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [identidadErr, setIdentidadErr] = useState<{
    nombre?: string | null;
    descripcion?: string | null;
  }>({});
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [contactoErr, setContactoErr] = useState<{
    telefono?: string | null;
    email?: string | null;
  }>({});
  const [cvu, setCvu] = useState("");
  const [cvuErr, setCvuErr] = useState<string | null>(null);

  function notificar(title: string) {
    setToast({ tone: "success", title });
    setTimeout(() => setToast((t) => (t?.title === title ? null : t)), 3400);
  }

  function abrir(seccion: Seccion) {
    setErrorGuardar(null);
    setNombre(datos.nombre);
    setDescripcion(datos.descripcion);
    setIdentidadErr({});
    setTelefono(datos.telefono);
    setEmail(datos.email);
    setContactoErr({});
    setCvu(datos.cvu);
    setCvuErr(null);
    setEditando(seccion);
  }

  /**
   * El backend tiene un solo endpoint, así que cada guardado manda todo: se
   * parte de lo último conocido del servidor y encima van los cambios de esta
   * sección. Al salir bien se aplican localmente —sabemos exactamente qué se
   * mandó— en vez de volver a pedir la pantalla entera.
   */
  async function guardarSeccion(
    cambios: Partial<EstablecimientoDatos>,
    /** Código que la sección muestra en su propio campo: no va al aviso de arriba. */
    codigoPropio?: string,
  ): Promise<{ ok: boolean; code?: string }> {
    setErrorGuardar(null);
    const merged = { ...datos, ...cambios };
    const res = await guardar(datos.id, {
      nombre: merged.nombre,
      descripcion: merged.descripcion,
      telefono: merged.telefono,
      email: merged.email,
      cvu: merged.cvu,
    });
    if (!res.ok) {
      if (!res.code || res.code !== codigoPropio) {
        setErrorGuardar(mensajeGuardar(res.code));
      }
      return res;
    }
    onGuardado(cambios);
    setEditando(null);
    notificar("Cambios guardados correctamente.");
    return res;
  }

  function salirDelPanel() {
    // Se sale del panel, no a otra pantalla de adentro: si éste era el único
    // establecimiento, la cuenta deja de ser productora y el guard de /panel
    // rebotaría con el aviso de sin acceso.
    //
    // Navegación dura a propósito: los establecimientos salen de los accesos
    // del store, y ésos se refrescan recién cuando AuthSync vuelve a pedir el
    // perfil. Sin esto el switcher seguiría ofreciendo el que se dio de baja.
    window.location.href = "/explorar";
  }

  return (
    <div className="mx-auto max-w-[1000px] px-7 pt-7 pb-20">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-[260px]">
          <h1 className="font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">
            Datos del establecimiento
          </h1>
          <p className="mt-1.5 text-[15px] text-fg-2">
            Información general, contacto y cultivos de la finca. Editá cada
            sección por separado.
          </p>
        </div>
        <Link
          href={`/establecimientos/${datos.id}`}
          className={buttonClasses({ variant: "ghost", className: "shrink-0" })}
        >
          <ExternalLink className="size-4" /> Ver perfil público
        </Link>
      </div>

      {errorGuardar && <Alert className="mb-5">{errorGuardar}</Alert>}

      {/* Identidad: nombre y descripción se editan; CUIT y razón social no. */}
      <SectionCard
        title="Identidad de la finca"
        icon={<Home className="size-4 text-green-800" />}
        isEditing={editando === "identidad"}
        saving={saving}
        canSave={nombre !== datos.nombre || descripcion !== datos.descripcion}
        onEdit={() => abrir("identidad")}
        onCancel={() => setEditando(null)}
        onSave={async () => {
          const ne = validarNombre(nombre);
          const de = validarDescripcion(descripcion);
          if (ne || de) {
            setIdentidadErr({ nombre: ne, descripcion: de });
            return;
          }
          // El nombre duplicado es un problema de ese campo, no de la pantalla:
          // se muestra abajo del input y la sección queda abierta para corregirlo.
          const res = await guardarSeccion(
            { nombre: nombre.trim(), descripcion },
            NOMBRE_DUPLICADO,
          );
          if (res.code === NOMBRE_DUPLICADO) {
            setIdentidadErr({ nombre: mensajeGuardar(NOMBRE_DUPLICADO) });
          }
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
            <div className="sm:col-span-2">
              <Campo
                required
                label="Nombre del establecimiento"
                value={nombre}
                maxLength={80}
                error={identidadErr.nombre}
                hint="Entre 3 y 80 caracteres. Así lo ven los visitantes en el sitio público."
                onChange={(v) => {
                  setNombre(v);
                  if (identidadErr.nombre)
                    setIdentidadErr((e) => ({ ...e, nombre: null }));
                }}
              />
            </div>
            <Campo label="CUIT" value={datos.cuit} disabled />
            <Campo label="Razón social" value={datos.razonSocial} disabled />
            <div className="sm:col-span-2">
              <Campo
                area
                label="Descripción"
                value={descripcion}
                count={2000}
                maxLength={2000}
                error={identidadErr.descripcion}
                hint="Hasta 2000 caracteres."
                onChange={(v) => {
                  setDescripcion(v);
                  if (identidadErr.descripcion)
                    setIdentidadErr((e) => ({ ...e, descripcion: null }));
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
          <Lock className="size-3" /> La ubicación no puede modificarse desde
          acá.
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
                if (contactoErr.telefono)
                  setContactoErr((e) => ({ ...e, telefono: null }));
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
                if (contactoErr.email)
                  setContactoErr((e) => ({ ...e, email: null }));
              }}
            />
          </div>
        )}
      </SectionCard>

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

      {/* Derivada: los cultivos salen de las actividades, no se editan acá. */}
      <SectionCard
        title="Cultivos asociados"
        icon={<Sprout className="size-4 text-green-800" />}
        isEditing={false}
        locked
        onEdit={() => {}}
        onCancel={() => {}}
        aside={
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-outline-variant px-3 py-1.5 text-xs text-fg-3">
            <Lock className="size-3" /> Se actualiza solo
          </span>
        }
      >
        <div className="mt-1 mb-4.5 flex items-start gap-2.5 rounded-md border border-outline-variant bg-cream-tert px-3.5 py-3 text-[13.5px] leading-normal text-pretty text-fg-2">
          <Info className="mt-px size-[15px] shrink-0 text-info-fg" />
          <span>
            Esta lista se genera a partir de los cultivos cargados en las
            actividades de la finca. Para agregar o quitar un cultivo, editá los
            cultivos de la actividad correspondiente.
          </span>
        </div>

        {datos.cultivos.length === 0 ? (
          <p className="py-1 text-sm text-fg-3">
            Todavía no hay cultivos asociados. Se mostrarán acá cuando cargues
            actividades con cultivos.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {datos.cultivos.map((c) => (
              <CultivoChip key={c.id} nombre={c.nombre || c.id} />
            ))}
          </div>
        )}

        <Link
          href="/panel/actividades"
          className={buttonClasses({
            variant: "ghost",
            size: "sm",
            className: "mt-4.5 text-sm",
          })}
        >
          <ArrowRight className="size-[15px]" /> Ver actividades
        </Link>
      </SectionCard>

      <div className="mt-8 flex justify-end">
        <Button variant="danger" onClick={() => setBajaAbierta(true)}>
          <Trash2 className="size-4" /> Eliminar establecimiento
        </Button>
      </div>

      {bajaAbierta && (
        <EliminarEstablecimientoFlow
          id={datos.id}
          nombre={datos.nombre}
          onCancel={() => setBajaAbierta(false)}
          onEliminado={salirDelPanel}
        />
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
  const { datos, isLoading, error, reload, aplicar } =
    useEstablecimientoDatos(fincaId);

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
