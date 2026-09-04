"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  BadgeCheck,
  Check,
  ChevronRight,
  CircleCheck,
  Clock,
  Crown,
  Info,
  Loader,
  Mail,
  Pencil,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  UserMinus,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { SinPermiso } from "@/components/GuardRol";
import {
  ActionBtn,
  Alert,
  Button,
  Card,
  IconCircle,
  Modal,
  Panel,
  Skeleton,
  Toast,
} from "@/components/ui";
import type { ToastData } from "@/components/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { TextField } from "@/components/ui/text-field";
import { admInitials } from "@/data/admin";
import { EMAIL_RE } from "@/data/auth";
import { fmtFecha, fmtFechaHora } from "@/lib/format";
import { PermisoProductor, TipoPermiso } from "@/lib/permisos";
import { diasHasta, estaSuspendido, finDelDia, hoyISO } from "@/lib/productores";
import { tienePermiso } from "@/lib/roles";
import type { AmbitoRol } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useEstablecimientos } from "@/hooks/useEstablecimientos";
import {
  useProductorAcciones,
  useProductores,
  useRolesProductores,
} from "@/hooks/useProductores";
import { useUsuarioCard } from "@/hooks/useUsuarioCard";
import { useAuthStore } from "@/stores/authStore";
import type { Productor, RolProductor } from "@/types/productores";
import EmptyEstablecimiento from "../EmptyEstablecimiento";
import {
  levantarSchema,
  nuevoProductorSchema,
  suspensionSchema,
  NUEVO_PRODUCTOR_INICIAL,
  type LevantarForm as LevantarFormValues,
  type NuevoProductorForm,
  type SuspensionForm,
} from "./schema";

const SIN_LECTURA =
  "Tu rol en este establecimiento no incluye ver los productores. Pedíselo al Productor Líder de la finca.";

/** Motivo de los botones apagados cuando falta GESTIONAR_PRODUCTOR. */
const SIN_GESTION = "Necesitás el permiso de gestión de productores";

/** El backend lo rechaza (`P.autoGestionProhibida`); acá se apaga antes. */
const AUTO_GESTION = "No podés gestionar tu propia participación en el establecimiento";

type Accion = "rol" | "suspender" | "borrar";

const MOTIVO_LIDER: Record<Accion, string> = {
  rol: "El rol del Productor Líder no se puede cambiar",
  suspender: "El Productor Líder no se puede suspender",
  borrar: "El Productor Líder no se puede borrar",
};

const MOTIVO_OK: Record<Accion, string> = {
  rol: "Cambiar el rol asignado",
  suspender: "Suspender temporalmente el acceso al sistema",
  borrar: "Quitar este productor del establecimiento",
};

/**
 * Por qué no se puede actuar sobre esta fila, o `null` si sí se puede. El orden
 * importa: sin el permiso de gestión no se puede tocar ninguna fila, así que ése
 * es el motivo que corresponde antes que los propios de cada productor.
 */
function bloqueoDe(
  p: Productor,
  gestionar: boolean,
  propio: boolean,
  accion: Accion,
): string | null {
  if (!gestionar) return SIN_GESTION;
  if (propio) return AUTO_GESTION;
  if (p.esLider) return MOTIVO_LIDER[accion];
  return null;
}

/* ---- Errores de dominio del enum `ProductorError` ------------------------ */

const ERROR_ALTA: Record<string, string> = {
  "P.alreadyExists": "Esa persona ya es productora de este establecimiento.",
  // El backend contesta 404 con este code cuando no encuentra la cuenta.
  badCreds: "No hay ninguna cuenta registrada con ese correo.",
  "P.rolInvalido": "El rol que elegiste ya no se puede asignar. Actualizá la pantalla.",
  "P.establecimientoNotFound": "Este establecimiento ya no está disponible.",
};

/** Los del alta que hablan del correo tipeado: van al campo, no al pie. */
const ALTA_ES_DEL_EMAIL = ["P.alreadyExists", "badCreds"];

const ERROR_ROL: Record<string, string> = {
  "P.liderInmutable": "El rol del Productor Líder no se puede cambiar.",
  "P.autoGestionProhibida": "No podés cambiar tu propio rol en el establecimiento.",
  "P.rolInvalido": "El rol que elegiste ya no se puede asignar. Actualizá la pantalla.",
  "P.notFound": "Ese productor ya no está en el establecimiento. Actualizá la pantalla.",
};

const ERROR_BAJA: Record<string, string> = {
  "P.liderInmutable": "El Productor Líder no se puede borrar.",
  "P.autoGestionProhibida": "No podés darte de baja a vos mismo del establecimiento.",
  "P.notFound": "Ese productor ya no está en el establecimiento. Actualizá la pantalla.",
};

const ERROR_SUSPENSION: Record<string, string> = {
  "P.yaSuspendido": "El productor ya está suspendido. Actualizá la pantalla.",
  "P.noSuspendido": "El productor no tiene una suspensión vigente. Actualizá la pantalla.",
  "P.fechaFinSuspensionInvalida": "La fecha de fin tiene que ser posterior a este momento.",
  "P.motivoRequerido": "Hay que indicar un motivo.",
  "P.suspensionSobreBaja": "No se puede suspender a un productor dado de baja.",
  "P.liderInmutable": MOTIVO_LIDER.suspender + ".",
  "P.autoGestionProhibida": AUTO_GESTION + ".",
  "P.notFound": "Ese productor ya no está en el establecimiento. Actualizá la pantalla.",
};

/**
 * Si vino un código que no está mapeado, el backend rechazó por algo concreto y
 * reintentar no lo va a arreglar; el mensaje genérico habla de reintentar sólo
 * cuando no hay código, que es el caso de un fallo técnico.
 */
function mensaje(
  code: string | undefined,
  mapa: Record<string, string>,
  generico: string,
): string {
  if (!code) return generico;
  return mapa[code] ?? "El sistema rechazó la operación. Actualizá la pantalla y probá de nuevo.";
}

/* ---- Piezas chicas ------------------------------------------------------- */

function ErrMsg({ children }: { children: ReactNode }) {
  return (
    <div className="err-msg">
      <AlertCircle className="size-[15px] text-danger" /> {children}
    </div>
  );
}

/** Círculo con las iniciales del productor. */
function Avatar({ nombre, className = "" }: { nombre: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-[42px] shrink-0 items-center justify-center rounded-full border border-green-300 bg-green-050 font-display text-[15.5px] font-bold text-green-800",
        className,
      )}
    >
      {admInitials(nombre)}
    </span>
  );
}

/** Estado del productor, con lo que queda de suspensión cuando corresponde. */
function EstadoPill({ productor }: { productor: Productor }) {
  const susp = estaSuspendido(productor);
  const dias = susp ? diasHasta(productor.fechaHoraFinSuspension) : null;
  // El motivo viaja para cualquier tramo de estado abierto, así que sólo se
  // muestra estando suspendido: en uno activo diría "Alta de productor".
  const title = susp
    ? [
        productor.fechaHoraFinSuspension
          ? `Suspendido hasta el ${fmtFecha(productor.fechaHoraFinSuspension)}`
          : "Suspendido: no puede ingresar al sistema",
        productor.motivoSuspension && `Motivo: ${productor.motivoSuspension}`,
      ]
        .filter(Boolean)
        .join(" · ")
    : "Puede ingresar al sistema con normalidad";

  return (
    <span
      title={title}
      className={cn(
        "inline-flex cursor-default items-center gap-1.5 rounded-pill border px-2.5 py-[5px] text-[13px] font-semibold whitespace-nowrap",
        susp
          ? "border-danger bg-danger-fill text-danger-fg"
          : "border-green-300 bg-green-050 text-green-800",
      )}
    >
      {susp ? <UserX className="size-3.5" /> : <CircleCheck className="size-3.5" />}
      {susp ? "Suspendido" : "Activo"}
      {/* Corto a propósito: el pill vive en una columna de ancho fijo y la fecha
          completa ya está en el title. Negativo = la fecha pasó pero el sistema
          todavía no la levantó; el vencimiento lo procesa una tarea periódica. */}
      {susp && dias !== null && (
        <span className="font-mono text-[11.5px] font-medium opacity-85">
          {dias === 0 ? "· hoy" : dias < 0 ? "· vencida" : `· ${dias} d`}
        </span>
      )}
    </span>
  );
}

/** Selector de rol, en forma de lista de opciones tipo radio. */
function RolePicker({
  roles,
  value,
  onChange,
}: {
  roles: RolProductor[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (roles.length === 0) {
    return (
      <p className="text-[13px] text-fg-3">
        Todavía no hay roles para asignar en este establecimiento. Creá uno en Roles y permisos.
      </p>
    );
  }
  return (
    <div role="radiogroup" className="flex flex-col gap-2">
      {roles.map((r) => {
        const on = value === r.id;
        return (
          <button
            key={r.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(r.id)}
            className={cn(
              "flex w-full cursor-pointer items-center gap-3.5 rounded-md border px-3.5 py-3 text-left transition-colors",
              on
                ? "border-green-800 bg-green-050 shadow-[inset_0_-2px_0_var(--green-100)]"
                : "border-outline-variant bg-surface hover:bg-cream-tert",
            )}
          >
            <span
              className={cn(
                "flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 bg-surface",
                on ? "border-green-800" : "border-sand",
              )}
            >
              {on && <span className="size-[11px] rounded-full bg-green-800" />}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "block font-display text-[15.5px] font-semibold",
                  on ? "text-green-800" : "text-fg-1",
                )}
              >
                {r.nombre}
              </span>
              <span className="mt-0.5 block text-[12.5px] leading-snug text-fg-3">
                {r.descripcion || "Sin descripción"}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Estado de la cuenta tipeada: confirma quién es, o por qué no sirve. */
function CuentaPreview({
  email,
  yaEsProductor,
  card,
  estado,
}: {
  email: string;
  yaEsProductor: boolean;
  card: { nombre: string; identificacion: string } | null;
  estado: "idle" | "buscando" | "encontrado" | "no-existe" | "error";
}) {
  const hint = (t: string) => <p className="text-[12.5px] text-fg-3">{t}</p>;

  if (!email || !EMAIL_RE.test(email)) {
    return hint("Debe ser el correo de un usuario ya registrado en la plataforma.");
  }
  // Se chequea antes que la card: ese correo ya está en la tabla, no hace falta
  // ninguna consulta para saberlo.
  if (yaEsProductor)
    return <ErrMsg>Esa persona ya es productora de este establecimiento.</ErrMsg>;
  if (estado === "buscando") {
    return (
      <div className="flex items-center gap-2 text-[12.5px] text-fg-3">
        <Loader className="spin size-3.5" /> Buscando la cuenta…
      </div>
    );
  }
  if (estado === "no-existe")
    return <ErrMsg>No hay ninguna cuenta registrada con ese correo.</ErrMsg>;
  if (estado === "error")
    return hint("No pudimos verificar la cuenta. Se validará al confirmar el alta.");
  if (!card) return hint("Debe ser el correo de un usuario ya registrado en la plataforma.");

  return (
    <div className="flex items-center gap-2.5 rounded-md border border-green-300 bg-green-050 px-3 py-2.5">
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-green-300 bg-surface font-display text-[13px] font-bold text-green-800">
        {admInitials(card.nombre)}
      </span>
      <span className="min-w-0">
        <span className="block font-display text-[14.5px] font-semibold text-green-800">
          {card.nombre}
        </span>
        <span className="block text-xs text-fg-2">
          Cuenta registrada{card.identificacion ? ` · ${card.identificacion}` : ""}
        </span>
      </span>
    </div>
  );
}

/** Dato de sólo lectura del productor que se está editando. */
function SummaryRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: ReactNode;
  label: string;
  value: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-dashed border-cream-tert py-2.5 last:border-b-0">
      <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-cream-tert text-fg-2">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="t-label block">{label}</span>
        <span
          className={cn(
            "mt-0.5 block text-[14.5px] break-words",
            value ? "text-fg-1" : "text-fg-3 italic",
            mono && value && "font-mono",
          )}
        >
          {value || "Sin especificar"}
        </span>
      </span>
    </div>
  );
}

/** Cabecera compartida por los tres diálogos del panel lateral. */
function PanelHeader({
  etiqueta,
  titulo,
  bajada,
  icono,
}: {
  etiqueta: string;
  titulo: string;
  bajada: string;
  icono?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 border-b border-outline-variant px-[26px] py-[22px]">
      {icono}
      <div className="min-w-0">
        <div className="t-label mb-1.5">{etiqueta}</div>
        <h2 className="font-display text-2xl font-bold text-fg-1">{titulo}</h2>
        <p className="mt-1.5 max-w-[460px] text-sm leading-relaxed text-fg-2">{bajada}</p>
      </div>
    </div>
  );
}

const LABEL = "block font-display text-base font-semibold text-fg-1";

/* ---- Alta y cambio de rol ------------------------------------------------ */

/**
 * Rol actual de un productor, para preseleccionarlo al editar.
 * El DTO trae `nombreRol` pero no el id, así que se matchea por nombre; si no
 * coincide con ninguno, el selector arranca vacío y zod pide elegir uno.
 * TODO backend: devolver `rolId` en ProductorGetDTO y borrar este rodeo.
 */
function rolPorNombre(roles: RolProductor[], nombreRol: string): string {
  const norm = (s: string) => s.trim().toLowerCase();
  return roles.find((r) => norm(r.nombre) === norm(nombreRol))?.id ?? "";
}

function ProductorForm({
  initial,
  roles,
  rolesLoading,
  existentes,
  acciones,
  onCancel,
  onGuardado,
}: {
  /** `null` da de alta; con un productor, sólo se cambia el rol. */
  initial: Productor | null;
  roles: RolProductor[];
  rolesLoading: boolean;
  existentes: Productor[];
  acciones: ReturnType<typeof useProductorAcciones>;
  onCancel: () => void;
  onGuardado: (p: Productor, editando: boolean) => void;
}) {
  const editando = initial !== null;
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<NuevoProductorForm>({
    resolver: zodResolver(nuevoProductorSchema),
    // Editando, el email no se muestra pero se precarga: viene del backend, así
    // que pasa la validación y permite reusar un único schema para los dos modos.
    defaultValues: initial
      ? { email: initial.emailUsuario, rolId: rolPorNombre(roles, initial.nombreRol) }
      : NUEVO_PRODUCTOR_INICIAL,
    mode: "onTouched",
  });

  const email = useWatch({ control: form.control, name: "email" }).trim();
  const emailValido = !editando && EMAIL_RE.test(email);

  // Se compara contra la lista vigente por email, que es lo que el usuario
  // acaba de tipear: el aviso sale al instante, sin esperar a la card.
  const norm = (s: string) => s.trim().toLowerCase();
  const yaEsProductor =
    emailValido && existentes.some((p) => norm(p.emailUsuario) === norm(email));

  // Si ya está en la finca no hace falta buscar la cuenta: el alta no va a ir.
  const { card, estado } = useUsuarioCard(email, emailValido && !yaEsProductor);

  const bloqueado =
    acciones.guardando ||
    (!editando && (estado === "buscando" || estado === "no-existe" || yaEsProductor));

  // Si el panel se abre antes de que lleguen los roles, `defaultValues` no pudo
  // resolver el actual: se completa cuando la lista aparece.
  useEffect(() => {
    if (!initial || form.getValues("rolId")) return;
    const id = rolPorNombre(roles, initial.nombreRol);
    if (id) form.setValue("rolId", id);
  }, [roles, initial, form]);

  async function onValid(data: NuevoProductorForm) {
    setSubmitError(null);
    const r = editando
      ? await acciones.actualizar(initial.id, data.rolId)
      : await acciones.crear(data.email.trim(), data.rolId);

    if (r.ok && r.productor) {
      onGuardado(r.productor, editando);
      return;
    }
    // En el alta, los errores que son "culpa" del correo se muestran en el campo;
    // el resto (rol, establecimiento, fallo técnico) va al pie del formulario.
    if (!editando && r.code && ALTA_ES_DEL_EMAIL.includes(r.code)) {
      form.setError("email", { message: ERROR_ALTA[r.code] }, { shouldFocus: true });
      return;
    }
    setSubmitError(
      editando
        ? mensaje(r.code, ERROR_ROL, "No pudimos cambiar el rol. Intentá de nuevo en unos minutos.")
        : mensaje(
            r.code,
            ERROR_ALTA,
            "No pudimos agregar al productor. Intentá de nuevo en unos minutos.",
          ),
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onValid)}
        noValidate
        className="flex max-h-[calc(100vh-80px)] flex-col"
      >
        <PanelHeader
          etiqueta={editando ? "Modificar productor" : "Nuevo productor"}
          titulo={editando ? "Cambiar el rol asignado" : "Agregar productor"}
          bajada={
            editando
              ? "Sólo podés cambiar el rol del productor. El resto de los datos no se modifican desde acá."
              : "Ingresá el correo de un usuario registrado y elegí su rol. Queda activo en la finca de inmediato."
          }
        />

        <div className="flex flex-col gap-5 overflow-y-auto px-[26px] py-[22px]">
          {editando ? (
            <div className="rounded-lg border border-outline-variant bg-cream-tert px-4 py-1">
              <SummaryRow
                icon={<User className="size-4" />}
                label="Nombre"
                value={initial.nombreUsuario}
              />
              <SummaryRow
                icon={<Mail className="size-4" />}
                label="Correo electrónico"
                value={initial.emailUsuario}
                mono
              />
              <SummaryRow
                icon={<BadgeCheck className="size-4" />}
                label="Identificación"
                value={initial.identificacion}
                mono
              />
            </div>
          ) : (
            <FormField
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel required className={LABEL}>
                    Correo electrónico
                  </FormLabel>
                  <FormControl>
                    <TextField
                      {...field}
                      type="email"
                      inputMode="email"
                      autoComplete="off"
                      placeholder="nombre@ejemplo.com.ar"
                    />
                  </FormControl>
                  {fieldState.error ? (
                    <FormMessage />
                  ) : (
                    <CuentaPreview
                      email={email}
                      yaEsProductor={yaEsProductor}
                      card={card}
                      estado={estado}
                    />
                  )}
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="rolId"
            render={({ field }) => (
              <FormItem>
                <FormLabel required className={cn(LABEL, "mb-1")}>
                  Rol asignado
                </FormLabel>
                <FormMessage />
                <FormControl>
                  {rolesLoading ? (
                    <div className="flex items-center gap-2 text-[13px] text-fg-3">
                      <Loader className="spin size-[15px]" /> Cargando roles…
                    </div>
                  ) : (
                    <RolePicker roles={roles} value={field.value} onChange={field.onChange} />
                  )}
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="border-t border-outline-variant bg-cream-tert px-[26px] py-4">
          {submitError && <Alert className="mb-3">{submitError}</Alert>}
          <div className="flex justify-end gap-3">
            <Button variant="neutral" onClick={onCancel} disabled={acciones.guardando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={bloqueado}>
              {acciones.guardando ? (
                <Loader className="spin size-[17px]" />
              ) : editando ? (
                <Check className="size-[17px]" />
              ) : (
                <UserPlus className="size-[17px]" />
              )}
              {editando ? "Guardar cambios" : "Agregar productor"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

/* ---- Suspensión ---------------------------------------------------------- */

function SuspenderForm({
  productor,
  acciones,
  onCancel,
  onHecho,
}: {
  productor: Productor;
  acciones: ReturnType<typeof useProductorAcciones>;
  onCancel: () => void;
  onHecho: (p: Productor, hasta: string) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<SuspensionForm>({
    resolver: zodResolver(suspensionSchema),
    defaultValues: { motivo: "", hasta: "" },
    mode: "onTouched",
  });

  const hasta = useWatch({ control: form.control, name: "hasta" });
  const dias = diasHasta(hasta || null);

  async function onValid(data: SuspensionForm) {
    setSubmitError(null);
    const r = await acciones.suspender(
      productor.id,
      data.motivo.trim(),
      finDelDia(data.hasta),
    );
    if (r.ok && r.productor) {
      onHecho(r.productor, data.hasta);
      return;
    }
    setSubmitError(
      mensaje(
        r.code,
        ERROR_SUSPENSION,
        "No pudimos suspender al productor. Intentá de nuevo en unos minutos.",
      ),
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onValid)}
        noValidate
        className="flex max-h-[calc(100vh-80px)] flex-col"
      >
        <PanelHeader
          etiqueta="Suspensión temporal"
          titulo={`Suspender a ${productor.nombreUsuario}`}
          bajada="Durante la suspensión no va a poder ingresar al sistema, pero conserva su rol y sigue formando parte del establecimiento."
          icono={
            <IconCircle tone="danger">
              <UserX className="size-[22px] text-danger" />
            </IconCircle>
          }
        />

        <div className="flex flex-col gap-5 overflow-y-auto px-[26px] py-[22px]">
          <FormField
            control={form.control}
            name="motivo"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel required className={LABEL}>
                  Motivo de la suspensión
                </FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    rows={3}
                    maxLength={300}
                    placeholder="Ej.: Incumplimiento reiterado de los horarios de las visitas guiadas."
                    className={cn("textarea", fieldState.error && "err")}
                  />
                </FormControl>
                {fieldState.error ? (
                  <FormMessage />
                ) : (
                  <p className="text-[12.5px] text-fg-3">
                    Queda registrado junto con la suspensión.
                  </p>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hasta"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel required className={LABEL}>
                  Fecha de fin prevista
                </FormLabel>
                <FormControl>
                  {/* <input type="date"> y no <DateField>: ese primitivo está
                      hecho para fechas pasadas (deshabilita el futuro). */}
                  <input
                    {...field}
                    type="date"
                    min={hoyISO()}
                    className={cn("input max-w-[260px]", fieldState.error && "err")}
                  />
                </FormControl>
                {fieldState.error ? (
                  <FormMessage />
                ) : (
                  <p className="text-[12.5px] text-fg-3">
                    {hasta && dias !== null && dias >= 0
                      ? `Recupera el acceso automáticamente el ${fmtFecha(finDelDia(hasta))}${
                          dias === 0 ? " (hoy)" : ` · ${dias} ${dias === 1 ? "día" : "días"}`
                        }. Podés levantarla antes.`
                      : "Al llegar esa fecha el acceso se restablece solo. También podés levantar la suspensión antes."}
                  </p>
                )}
              </FormItem>
            )}
          />
        </div>

        <div className="border-t border-outline-variant bg-cream-tert px-[26px] py-4">
          {submitError && <Alert className="mb-3">{submitError}</Alert>}
          <div className="flex justify-end gap-3">
            <Button variant="neutral" onClick={onCancel} disabled={acciones.moderando}>
              Cancelar
            </Button>
            <Button type="submit" variant="danger" disabled={acciones.moderando}>
              {acciones.moderando ? (
                <Loader className="spin size-[17px]" />
              ) : (
                <UserX className="size-[17px]" />
              )}
              Suspender productor
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

function LevantarForm({
  productor,
  acciones,
  onCancel,
  onHecho,
}: {
  productor: Productor;
  acciones: ReturnType<typeof useProductorAcciones>;
  onCancel: () => void;
  onHecho: (p: Productor) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<LevantarFormValues>({
    resolver: zodResolver(levantarSchema),
    defaultValues: { motivo: "" },
    mode: "onTouched",
  });

  async function onValid(data: LevantarFormValues) {
    setSubmitError(null);
    const r = await acciones.levantar(productor.id, data.motivo.trim());
    if (r.ok && r.productor) {
      onHecho(r.productor);
      return;
    }
    setSubmitError(
      mensaje(
        r.code,
        ERROR_SUSPENSION,
        "No pudimos levantar la suspensión. Intentá de nuevo en unos minutos.",
      ),
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onValid)}
        noValidate
        className="flex max-h-[calc(100vh-80px)] flex-col"
      >
        <PanelHeader
          etiqueta="Suspensión vigente"
          titulo={`Levantar la suspensión de ${productor.nombreUsuario}`}
          bajada="Recupera el acceso al sistema de inmediato, antes de la fecha prevista."
          icono={
            <IconCircle tone="success">
              <UserCheck className="size-[22px] text-green-800" />
            </IconCircle>
          }
        />

        <div className="flex flex-col gap-5 overflow-y-auto px-[26px] py-[22px]">
          {/* Detalle de la suspensión vigente: sale del tramo de estado abierto.
              No incluye quién la aplicó — eso el backend todavía no lo manda. */}
          <div className="flex flex-col gap-3 rounded-lg border border-outline-variant bg-cream-tert px-4 py-3.5">
            <div>
              <span className="t-label block">Motivo registrado</span>
              <span className="mt-1 block text-[14.5px] leading-relaxed text-fg-1">
                {productor.motivoSuspension || "Sin motivo registrado"}
              </span>
            </div>
            <div className="flex flex-wrap gap-7">
              <div>
                <span className="t-label block">Desde</span>
                <span className="mt-1 block font-mono text-sm text-fg-1">
                  {/* Con hora: una suspensión empieza en un momento puntual. */}
                  {fmtFechaHora(productor.fechaHoraInicioSuspension)}
                </span>
              </div>
              <div>
                <span className="t-label block">Fin previsto</span>
                <span className="mt-1 block font-mono text-sm text-fg-1">
                  {/* Sin hora: siempre es el final del día elegido. */}
                  {fmtFecha(productor.fechaHoraFinSuspension)}
                </span>
              </div>
            </div>
          </div>

          <FormField
            control={form.control}
            name="motivo"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel required className={LABEL}>
                  Motivo del levantamiento
                </FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    rows={2}
                    maxLength={300}
                    placeholder="Ej.: Se resolvió la situación con el productor."
                    className={cn("textarea", fieldState.error && "err")}
                  />
                </FormControl>
                {fieldState.error ? (
                  <FormMessage />
                ) : (
                  <p className="text-[12.5px] text-fg-3">
                    Queda registrado junto con la suspensión que se cierra.
                  </p>
                )}
              </FormItem>
            )}
          />
        </div>

        <div className="border-t border-outline-variant bg-cream-tert px-[26px] py-4">
          {submitError && <Alert className="mb-3">{submitError}</Alert>}
          <div className="flex justify-end gap-3">
            <Button variant="neutral" onClick={onCancel} disabled={acciones.moderando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={acciones.moderando}>
              {acciones.moderando ? (
                <Loader className="spin size-[17px]" />
              ) : (
                <UserCheck className="size-[17px]" />
              )}
              Levantar suspensión
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

/* ---- Tabla ---------------------------------------------------------------
   La cáscara la comparten las filas reales y el esqueleto: si cada uno trajera
   su cabecera, al llegar los datos se moverían las columnas de lugar. */

const COLUMNAS = [
  "Productor",
  "Correo electrónico",
  "Identificación",
  "Rol asignado",
  "Estado",
  "Acciones",
];

/**
 * Anchos fijos por columna: con el layout automático las barras del esqueleto
 * —que nunca miden lo mismo que un nombre o tres botones— darían columnas de
 * otro ancho, y al llegar los datos saltaría todo. Las dos primeras van sin
 * ancho: se reparten lo que sobra, que es lo que conviene para nombres y
 * correos de largo variable.
 *
 * Con `table-fixed` la contracara es que una celda de contenido `nowrap` más
 * ancho que su columna no se recorta: se desborda sobre la vecina. Por eso las
 * dos últimas se miden por su caso más largo y no "a ojo":
 * - Estado: el pill con el sufijo más largo ("Suspendido · vencida") ≈ 190px,
 *   más los 36px de padding de la celda.
 * - Acciones: los tres botones ("Modificar rol" + "Suspender" + "Borrar")
 *   ≈ 380px con sus separaciones, más el mismo padding. Como van alineados a
 *   la derecha, lo que sobraba se desbordaba hacia la izquierda, encima del
 *   pill de estado.
 */
const ANCHOS = [undefined, undefined, "w-[130px]", "w-[190px]", "w-[230px]", "w-[420px]"];

function Tabla({ children }: { children: ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        {/* El mínimo es la suma de las columnas fijas (970) más lo que necesitan
            nombre y correo para no quedar apretados. Por debajo, scroll lateral. */}
        <table className="w-full min-w-[1410px] table-fixed border-collapse">
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
                    "border-b-2 border-outline-variant px-[18px] py-3.5 text-[12.5px] font-bold tracking-[.05em] whitespace-nowrap text-fg-2 uppercase",
                    i === COLUMNAS.length - 1 ? "text-right" : "text-left",
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
    </Card>
  );
}

/** Anchos por fila, para que el esqueleto no se lea como una grilla perfecta. */
const FILAS_SKELETON = [
  { nombre: "w-[150px]", email: "w-[210px]", ident: "w-[92px]", rol: "w-[128px]" },
  { nombre: "w-[186px]", email: "w-[244px]", ident: "w-[84px]", rol: "w-[104px]" },
  { nombre: "w-[132px]", email: "w-[196px]", ident: "w-[96px]", rol: "w-[142px]" },
  { nombre: "w-[168px]", email: "w-[226px]", ident: "w-[88px]", rol: "w-[112px]" },
];

function FilasSkeleton() {
  return (
    <tbody aria-busy>
      {FILAS_SKELETON.map((f, i) => (
        <tr key={i} className="border-b border-cream-tert">
          <td className="px-[18px] py-3.5">
            <div className="flex items-center gap-3.5">
              <Skeleton className="size-[42px] rounded-full" />
              <Skeleton className={cn("h-4", f.nombre)} />
            </div>
          </td>
          <td className="px-[18px] py-3.5">
            <Skeleton className={cn("h-3.5", f.email)} />
          </td>
          <td className="px-[18px] py-3.5">
            <Skeleton className={cn("h-3.5", f.ident)} />
          </td>
          <td className="px-[18px] py-3.5">
            <Skeleton className={cn("h-[27px] rounded-pill", f.rol)} />
          </td>
          <td className="px-[18px] py-3.5">
            <Skeleton className="h-[27px] w-[104px] rounded-pill" />
          </td>
          {/* Las barras miden lo mismo que los botones reales, para que al llegar
              los datos no se corra nada dentro de la celda. */}
          <td className="px-[18px] py-3.5">
            <div className="flex justify-end gap-2.5">
              <Skeleton className="h-[35px] w-[146px]" />
              <Skeleton className="h-[35px] w-[117px]" />
              <Skeleton className="h-[35px] w-[95px]" />
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
}

/* ---- Pantalla ------------------------------------------------------------ */

/** `null` = cerrado; "nuevo" = alta; un productor = cambio de rol. */
type Dialogo =
  | { tipo: "form"; productor: Productor | null }
  | { tipo: "suspender" | "levantar" | "borrar"; productor: Productor }
  | null;

function Pantalla({
  establecimientoId,
  gestionar,
  emailSesion,
}: {
  establecimientoId: string;
  gestionar: boolean;
  emailSesion: string;
}) {
  const { productores, isLoading, error, reload, agregar, reemplazar, quitar } =
    useProductores(establecimientoId);
  const { roles, isLoading: rolesLoading } = useRolesProductores(establecimientoId);
  const acciones = useProductorAcciones(establecimientoId);

  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const [errorBaja, setErrorBaja] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  // El líder siempre primero; el resto en el orden en que los devuelve el backend.
  const ordenados = useMemo(
    () => [...productores].sort((a, b) => Number(b.esLider) - Number(a.esLider)),
    [productores],
  );
  const suspendidos = productores.filter(estaSuspendido).length;
  const esPropio = (p: Productor) =>
    !!emailSesion && p.emailUsuario.trim().toLowerCase() === emailSesion.trim().toLowerCase();

  function notify(title: string) {
    setToast({ tone: "success", title });
    setTimeout(() => setToast((t) => (t?.title === title ? null : t)), 3400);
  }

  function cerrar() {
    setErrorBaja(null);
    setDialogo(null);
  }

  function onGuardado(p: Productor, editando: boolean) {
    if (editando) reemplazar(p);
    else agregar(p);
    cerrar();
    notify(
      editando
        ? `Se actualizó el rol de ${p.nombreUsuario} a «${p.nombreRol}».`
        : `Se agregó a ${p.nombreUsuario} al establecimiento.`,
    );
  }

  async function confirmarBaja(p: Productor) {
    setErrorBaja(null);
    const r = await acciones.eliminar(p.id);
    if (!r.ok) {
      setErrorBaja(
        mensaje(
          r.code,
          ERROR_BAJA,
          "No pudimos quitar al productor. Intentá de nuevo en unos minutos.",
        ),
      );
      return;
    }
    quitar(p.id);
    cerrar();
    notify(`Se quitó a ${p.nombreUsuario} del establecimiento.`);
  }

  const stats = [
    { icon: Users, label: "Productores en la finca", value: isLoading ? "—" : productores.length },
    {
      icon: UserX,
      label: suspendidos === 1 ? "Productor suspendido" : "Productores suspendidos",
      value: isLoading ? "—" : suspendidos,
      alerta: !isLoading && suspendidos > 0,
    },
    {
      icon: ShieldCheck,
      label: "Roles disponibles",
      value: rolesLoading ? "—" : roles.length,
    },
  ];

  return (
    <div className="mx-auto max-w-[1240px] px-7 pt-7 pb-[72px]">
      <div className="mb-3.5 flex items-center gap-2.5 text-[13.5px] text-fg-3">
        <span>Establecimiento</span>
        <ChevronRight className="size-[15px]" />
        <span className="font-medium text-fg-2">Productores</span>
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-[280px]">
          <h1 className="font-display text-[34px] font-bold tracking-[-.01em] text-fg-1">
            Productores del establecimiento
          </h1>
          <p className="mt-2.5 max-w-[660px] text-[15.5px] leading-relaxed text-fg-2">
            Sumá a las personas que trabajan en la finca y asignales un rol. Quedan activas de
            inmediato; el rol define qué puede hacer cada una.
          </p>
        </div>
        <Button
          size="lg"
          disabled={!gestionar}
          title={gestionar ? "Agregar un productor a la finca" : SIN_GESTION}
          onClick={() => setDialogo({ tipo: "form", productor: null })}
        >
          <UserPlus className="size-[18px]" /> Agregar productor
        </Button>
      </div>

      {/* Mientras carga va "—" y no un cero: "0 productores" es una afirmación
          sobre la finca, y todavía no sabemos nada. */}
      <div className="mb-5 flex flex-wrap gap-3.5">
        {stats.map((s) => (
          <Card key={s.label} className="flex min-w-[190px] items-center gap-3 px-4 py-3">
            <span
              className={cn(
                "flex size-[42px] shrink-0 items-center justify-center rounded-[10px]",
                s.alerta ? "bg-danger-fill" : "bg-green-050",
              )}
            >
              <s.icon className={cn("size-5", s.alerta ? "text-danger" : "text-green-800")} />
            </span>
            <span>
              <span className="block font-mono text-xl font-bold text-fg-1">{s.value}</span>
              <span className="block text-[12.5px] text-fg-2">{s.label}</span>
            </span>
          </Card>
        ))}
      </div>

      <AsyncBoundary
        loading={isLoading}
        error={error}
        onRetry={reload}
        pad={72}
        skeleton={
          <Tabla>
            <FilasSkeleton />
          </Tabla>
        }
      >
        <Tabla>
          <tbody>
            {ordenados.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNAS.length}
                  className="px-6 py-14 text-center text-[15px] text-fg-3"
                >
                  Todavía no hay productores en este establecimiento.
                </td>
              </tr>
            ) : (
              ordenados.map((p) => {
                const propio = esPropio(p);
                const susp = estaSuspendido(p);
                const bloqRol = bloqueoDe(p, gestionar, propio, "rol");
                const bloqBorrar = bloqueoDe(p, gestionar, propio, "borrar");
                // Levantar no está protegido por el rol líder en el backend, pero
                // al líder tampoco se lo puede suspender: nunca aparece suspendido.
                const bloqSusp = bloqueoDe(p, gestionar, propio, "suspender");

                return (
                  <tr key={p.id} className="border-b border-cream-tert">
                    <td className="px-[18px] py-3.5">
                      <div className="flex items-center gap-3.5">
                        <Avatar nombre={p.nombreUsuario} />
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="font-display text-base font-semibold text-fg-1">
                            {p.nombreUsuario}
                          </span>
                          {p.esLider && (
                            <span className="inline-flex items-center gap-1.5 rounded-pill border border-sand bg-cream-tert px-2.5 py-[3px] text-[11.5px] font-semibold text-brown-700">
                              <Crown className="size-3" /> Líder
                            </span>
                          )}
                          {propio && (
                            <span className="inline-flex items-center rounded-pill border border-outline-variant bg-surface px-2.5 py-[3px] text-[11.5px] font-semibold text-fg-3">
                              Vos
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Con el layout fijo la columna ya no se estira: un correo
                        largo corta en vez de desbordar la celda. */}
                    <td className="px-[18px] py-3.5 font-mono text-[13.5px] break-words text-fg-1">
                      {p.emailUsuario}
                    </td>
                    <td className="px-[18px] py-3.5 text-sm">
                      {p.identificacion ? (
                        <span className="font-mono text-fg-1">{p.identificacion}</span>
                      ) : (
                        <span className="text-fg-3 italic">Sin especificar</span>
                      )}
                    </td>
                    <td className="px-[18px] py-3.5">
                      <span className="inline-flex items-center gap-2 rounded-pill border border-green-300 bg-green-050 px-2.5 py-[5px] text-[13px] font-semibold whitespace-nowrap text-green-800">
                        <ShieldCheck className="size-3.5 text-green-700" /> {p.nombreRol}
                      </span>
                    </td>
                    <td className="px-[18px] py-3.5">
                      <EstadoPill productor={p} />
                    </td>
                    <td className="px-[18px] py-3.5">
                      <div className="flex justify-end gap-2.5">
                        <ActionBtn
                          icon={<Pencil className="size-[17px]" />}
                          label="Modificar rol"
                          disabled={!!bloqRol}
                          title={bloqRol ?? MOTIVO_OK.rol}
                          onClick={() => setDialogo({ tipo: "form", productor: p })}
                        />
                        {/* Levantar es una acción de alivio, no destructiva: va
                            en neutral aunque suspender vaya en rojo. */}
                        {susp ? (
                          <ActionBtn
                            icon={<UserCheck className="size-[17px]" />}
                            label="Levantar"
                            disabled={!!bloqSusp}
                            title={
                              bloqSusp ??
                              (p.fechaHoraFinSuspension
                                ? `Levantar la suspensión (fin previsto: ${fmtFecha(p.fechaHoraFinSuspension)})`
                                : "Levantar la suspensión")
                            }
                            onClick={() => setDialogo({ tipo: "levantar", productor: p })}
                          />
                        ) : (
                          <ActionBtn
                            icon={<UserX className="size-[17px]" />}
                            label="Suspender"
                            tone="danger"
                            disabled={!!bloqSusp}
                            title={bloqSusp ?? MOTIVO_OK.suspender}
                            onClick={() => setDialogo({ tipo: "suspender", productor: p })}
                          />
                        )}
                        <ActionBtn
                          icon={<Trash2 className="size-[17px]" />}
                          label="Borrar"
                          tone="danger"
                          disabled={!!bloqBorrar}
                          title={bloqBorrar ?? MOTIVO_OK.borrar}
                          onClick={() => {
                            setErrorBaja(null);
                            setDialogo({ tipo: "borrar", productor: p });
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Tabla>
      </AsyncBoundary>

      <div className="mt-4 flex items-center gap-2 text-[13px] text-fg-3">
        <Info className="size-4 shrink-0" /> El{" "}
        <strong className="font-semibold text-fg-2">Productor Líder</strong> es una figura
        protegida: no se puede borrar, suspender ni cambiarle el rol. Nadie puede gestionar su
        propia participación en la finca.
      </div>
      <div className="mt-2 flex items-center gap-2 text-[13px] text-fg-3">
        <Clock className="size-4 shrink-0" /> Suspender es temporal: el productor no ingresa al
        sistema pero conserva su rol y recupera el acceso solo al llegar la fecha de fin prevista.
        Borrar es definitivo.
      </div>

      {dialogo?.tipo === "form" && (
        <Panel onClose={cerrar} width="w-[620px]">
          <ProductorForm
            initial={dialogo.productor}
            roles={roles}
            rolesLoading={rolesLoading}
            existentes={productores}
            acciones={acciones}
            onCancel={cerrar}
            onGuardado={onGuardado}
          />
        </Panel>
      )}

      {dialogo?.tipo === "suspender" && (
        <Panel onClose={cerrar} width="w-[560px]">
          <SuspenderForm
            productor={dialogo.productor}
            acciones={acciones}
            onCancel={cerrar}
            onHecho={(p, hasta) => {
              reemplazar(p);
              cerrar();
              notify(`Se suspendió a ${p.nombreUsuario} hasta el ${fmtFecha(finDelDia(hasta))}.`);
            }}
          />
        </Panel>
      )}

      {dialogo?.tipo === "levantar" && (
        <Panel onClose={cerrar} width="w-[560px]">
          <LevantarForm
            productor={dialogo.productor}
            acciones={acciones}
            onCancel={cerrar}
            onHecho={(p) => {
              reemplazar(p);
              cerrar();
              notify(`Se levantó la suspensión de ${p.nombreUsuario}. Ya puede ingresar.`);
            }}
          />
        </Panel>
      )}

      {dialogo?.tipo === "borrar" && (
        <Modal onClose={cerrar} dismissable={!acciones.borrando}>
          <div className="flex items-center gap-3.5">
            <IconCircle tone="danger">
              <UserMinus className="size-[22px] text-danger" />
            </IconCircle>
            <h3 className="font-display text-xl font-bold text-fg-1">Borrar productor</h3>
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-fg-2">
            ¿Seguro que querés quitar a{" "}
            <strong className="text-fg-1">{dialogo.productor.nombreUsuario}</strong> del
            establecimiento? Perderá el acceso y dejará de figurar en el equipo de la finca.
          </p>
          {errorBaja && <Alert className="mt-4">{errorBaja}</Alert>}
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="neutral" onClick={cerrar} disabled={acciones.borrando}>
              No, volver
            </Button>
            <Button
              variant="danger"
              onClick={() => confirmarBaja(dialogo.productor)}
              disabled={acciones.borrando}
            >
              {acciones.borrando ? (
                <Loader className="spin size-[17px]" />
              ) : (
                <Trash2 className="size-[17px]" />
              )}
              Sí, borrar
            </Button>
          </div>
        </Modal>
      )}

      {toast && <Toast {...toast} />}
    </div>
  );
}

/**
 * Productores del establecimiento activo. Igual que en /panel/roles, el acceso
 * no se puede resolver en la ruta: los permisos de PRODUCTOR valen por
 * establecimiento y cuál está activo lo elige el switcher del shell, del lado
 * del cliente. Por eso el chequeo de lectura vive acá y no en un <GuardRol>.
 */
export default function ProductoresClient() {
  const { activo } = useEstablecimientos();
  const accesos = useAuthStore((s) => s.accesos);
  const emailSesion = useAuthStore((s) => s.email) ?? "";
  const establecimientoId = activo?.id ?? "";

  // Todo se pregunta contra este establecimiento: alguien puede gestionar una
  // finca y no tener nada que ver con otra.
  const ambito: AmbitoRol = {
    tipoPermiso: TipoPermiso.PRODUCTOR,
    establecimientoId,
  };
  const leer = tienePermiso(accesos, PermisoProductor.LEER_PRODUCTOR, ambito);
  const gestionar = tienePermiso(accesos, PermisoProductor.GESTIONAR_PRODUCTOR, ambito);

  if (!activo) return <EmptyEstablecimiento />;
  if (!leer) return <SinPermiso motivo={SIN_LECTURA} />;

  return (
    <Pantalla
      key={establecimientoId}
      establecimientoId={establecimientoId}
      gestionar={gestionar}
      emailSesion={emailSesion}
    />
  );
}
