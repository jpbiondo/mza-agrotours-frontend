"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Home,
  MapPin,
  Phone,
  Sprout,
  Lock,
  ExternalLink,
  Inbox,
  Trash2,
  Info,
  ArrowRight,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { SinPermiso } from "@/components/GuardRol";
import {
  Alert,
  Button,
  buttonClasses,
  Card,
  ResultScreen,
  Skeleton,
} from "@/components/ui";
import { FaltanCampos, useCamposFaltantes } from "@/components/ui/faltan-campos";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { notify } from "@/lib/notify";
import { TipoPermiso } from "@/lib/permisos";
import { ROL_PRODUCTOR_LIDER, tieneRol } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useEstablecimientos, useRutaPanel } from "@/hooks/useEstablecimientos";
import {
  useEstablecimientoDatos,
  useGuardarEstablecimiento,
} from "@/hooks/useEstablecimientoDatos";
import { useFotoPortada } from "@/hooks/useFotoPortada";
import { CobrosCard } from "./CobrosCard";
import EliminarEstablecimientoFlow from "./EliminarEstablecimientoFlow";
import { PortadaCard } from "./PortadaCard";
import {
  contactoSchema,
  identidadSchema,
  type ContactoForm,
  type IdentidadForm,
} from "./schema";
import { SectionCard } from "./SectionCard";
import type { EstablecimientoDatos, FotoPortada } from "@/types/datos";

/** Secciones que se pueden editar; una por vez. */
type Seccion = "identidad" | "contacto";

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

/** Dato que se muestra en el modo edición pero no se puede tocar (CUIT, razón social). */
function CampoBloqueado({ label, value }: { label: string; value: string }) {
  const id = `campo-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="field">
      <label htmlFor={id} className="font-display text-base font-semibold text-fg-1">
        {label}
      </label>
      <TextField id={id} value={value} onChange={() => {}} disabled />
      <div className="flex items-center gap-1.5 text-xs text-fg-3">
        <Lock className="size-3" /> Este dato no puede modificarse
      </div>
    </div>
  );
}

const LABEL = "font-display text-base font-semibold";

/** Ayuda debajo del campo; cuando hay error, el mensaje ocupa su lugar. */
function Ayuda({ hay, children }: { hay: boolean; children: string }) {
  return hay ? <FormMessage /> : <div className="text-[12.5px] text-fg-3">{children}</div>;
}

/* ---- Secciones editables ------------------------------------------------
   Cada una tiene su formulario: se guardan por separado y una sola puede estar
   abierta. Al abrirla se recarga con lo último que devolvió el servidor. */

type GuardarSeccion = (
  cambios: Partial<EstablecimientoDatos>,
  codigoPropio?: string,
) => Promise<{ ok: boolean; code?: string }>;

interface SeccionProps {
  datos: EstablecimientoDatos;
  editando: boolean;
  saving: boolean;
  onEditar: () => void;
  onCancelar: () => void;
  guardarSeccion: GuardarSeccion;
}

/** Identidad: nombre y descripción se editan; CUIT y razón social no. */
function SeccionIdentidad({ datos, editando, saving, onEditar, onCancelar, guardarSeccion }: SeccionProps) {
  const valoresDe = (d: EstablecimientoDatos): IdentidadForm => ({
    nombre: d.nombre,
    descripcion: d.descripcion,
  });
  const form = useForm<IdentidadForm>({
    resolver: zodResolver(identidadSchema),
    defaultValues: valoresDe(datos),
    mode: "onTouched",
  });
  const { faltan, verQueFalta } = useCamposFaltantes(form, identidadSchema);
  const descripcion = useWatch({ control: form.control, name: "descripcion" });

  const guardar = form.handleSubmit(async (v) => {
    // El nombre duplicado es un problema de ese campo, no de la pantalla: se
    // muestra abajo del input y la sección queda abierta para corregirlo.
    const res = await guardarSeccion(v, NOMBRE_DUPLICADO);
    if (res.code === NOMBRE_DUPLICADO) {
      form.setError("nombre", { message: mensajeGuardar(NOMBRE_DUPLICADO) }, { shouldFocus: true });
    }
  });

  return (
    <SectionCard
      title="Identidad de la finca"
      icon={<Home className="size-4 text-green-800" />}
      isEditing={editando}
      saving={saving}
      canSave={form.formState.isDirty && faltan === 0}
      onEdit={() => {
        form.reset(valoresDe(datos));
        onEditar();
      }}
      onCancel={onCancelar}
      onSave={guardar}
      aviso={<FaltanCampos faltan={faltan} onVerQueFalta={verQueFalta} />}
    >
      {!editando ? (
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
        <Form {...form}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field, fieldState }) => (
                <FormItem className="gap-2 sm:col-span-2">
                  <FormLabel required className={LABEL}>
                    Nombre del establecimiento
                  </FormLabel>
                  <FormControl>
                    <TextField {...field} maxLength={100} />
                  </FormControl>
                  <Ayuda hay={!!fieldState.error}>
                    Hasta 100 caracteres, sin caracteres especiales. Así lo ven los visitantes en el sitio público.
                  </Ayuda>
                </FormItem>
              )}
            />
            <CampoBloqueado label="CUIT" value={datos.cuit} />
            <CampoBloqueado label="Razón social" value={datos.razonSocial} />
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field, fieldState }) => (
                <FormItem className="gap-2 sm:col-span-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <FormLabel required className={LABEL}>
                      Descripción
                    </FormLabel>
                    <span
                      className={cn(
                        "font-mono text-xs",
                        descripcion.length > 2000 ? "text-danger" : "text-fg-3",
                      )}
                    >
                      {descripcion.length} / 2000
                    </span>
                  </div>
                  <FormControl>
                    <TextArea {...field} maxLength={2000} rows={4} className="min-h-[110px]" />
                  </FormControl>
                  <Ayuda hay={!!fieldState.error}>Hasta 2000 caracteres.</Ayuda>
                </FormItem>
              )}
            />
          </div>
        </Form>
      )}
    </SectionCard>
  );
}

function SeccionContacto({ datos, editando, saving, onEditar, onCancelar, guardarSeccion }: SeccionProps) {
  const valoresDe = (d: EstablecimientoDatos): ContactoForm => ({
    telefono: d.telefono,
    email: d.email,
  });
  const form = useForm<ContactoForm>({
    resolver: zodResolver(contactoSchema),
    defaultValues: valoresDe(datos),
    mode: "onTouched",
  });
  const { faltan, verQueFalta } = useCamposFaltantes(form, contactoSchema);

  const guardar = form.handleSubmit(async (v) => {
    await guardarSeccion(v);
  });

  return (
    <SectionCard
      title="Contacto"
      icon={<Phone className="size-4 text-green-800" />}
      isEditing={editando}
      saving={saving}
      canSave={form.formState.isDirty && faltan === 0}
      onEdit={() => {
        form.reset(valoresDe(datos));
        onEditar();
      }}
      onCancel={onCancelar}
      onSave={guardar}
      aviso={<FaltanCampos faltan={faltan} onVerQueFalta={verQueFalta} />}
    >
      {!editando ? (
        <>
          <ReadRow label="Teléfono" value={datos.telefono} mono />
          <ReadRow label="Email" value={datos.email} />
        </>
      ) : (
        <Form {...form}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="telefono"
              render={({ field, fieldState }) => (
                <FormItem className="gap-2">
                  <FormLabel className={LABEL}>Teléfono</FormLabel>
                  <FormControl>
                    <TextField
                      {...field}
                      maxLength={20}
                      onChange={(v) => field.onChange(v.replace(/[^\d+]/g, "").slice(0, 16))}
                    />
                  </FormControl>
                  <Ayuda hay={!!fieldState.error}>
                    Ingresá tu número en formato internacional, sin espacios: primero un + y luego 8 a 15 dígitos (el código de país va incluido).
                  </Ayuda>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <FormItem className="gap-2">
                  <FormLabel className={LABEL}>Email</FormLabel>
                  <FormControl>
                    <TextField {...field} type="email" maxLength={100} />
                  </FormControl>
                  <Ayuda hay={!!fieldState.error}>Hasta 100 caracteres.</Ayuda>
                </FormItem>
              )}
            />
          </div>
        </Form>
      )}
    </SectionCard>
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
          Información general, contacto, cobros y cultivos de la finca. Editá cada
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

/** Segundos que el aviso de baja queda a la vista antes de sacar al usuario. */
const ESPERA_SALIDA_MS = 5000;

/**
 * Se sale del panel, no a otra pantalla de adentro: si éste era el único
 * establecimiento, la cuenta deja de ser productora y el guard de /panel
 * rebotaría con el aviso de sin acceso.
 *
 * Navegación dura a propósito: los establecimientos salen de los accesos del
 * store, y ésos se refrescan recién cuando AuthSync vuelve a pedir el perfil.
 * Sin esto el switcher seguiría ofreciendo el que se dio de baja.
 *
 * Fuera del componente para que el efecto que la difiere dependa sólo del
 * estado de la baja.
 */
function salirDelPanel() {
  window.location.href = "/explorar";
}

function Inner({
  datos,
  onGuardado,
}: {
  datos: EstablecimientoDatos;
  onGuardado: (cambios: Partial<EstablecimientoDatos>) => void;
}) {
  const ruta = useRutaPanel();
  const { guardar, isLoading: saving } = useGuardarEstablecimiento();
  const fotoPortada = useFotoPortada(datos.id, datos.foto);
  const [bajaAbierta, setBajaAbierta] = useState(false);
  const [bajaHecha, setBajaHecha] = useState(false);
  const [editando, setEditando] = useState<Seccion | null>(null);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  /**
   * Tras la baja el aviso queda a la vista un rato y recién después se sale, así
   * el usuario alcanza a leerlo. El cleanup cancela la salida si se desmonta
   * antes —al navegar a otra pantalla del panel—, para no patearlo a /explorar
   * desde donde sea que haya ido.
   */
  useEffect(() => {
    if (!bajaHecha) return;
    const t = setTimeout(salirDelPanel, ESPERA_SALIDA_MS);
    return () => clearTimeout(t);
  }, [bajaHecha]);

  /**
   * La portada no entra en el ciclo de edición de las demás secciones: se elige
   * o se quita y se guarda en el acto.
   */
  async function guardarPortada(portada: FotoPortada | null) {
    await guardarSeccion(
      { foto: portada },
      undefined,
      portada ? "Portada actualizada correctamente." : "Portada eliminada.",
    );
  }

  function abrir(seccion: Seccion) {
    setErrorGuardar(null);
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
    /** Aviso propio de la sección. Por defecto, el genérico de guardado. */
    mensaje = "Cambios guardados correctamente.",
  ): Promise<{ ok: boolean; code?: string }> {
    setErrorGuardar(null);
    const merged = { ...datos, ...cambios };
    const res = await guardar(datos.id, {
      nombre: merged.nombre,
      descripcion: merged.descripcion,
      telefono: merged.telefono,
      email: merged.email,
      // Va SIEMPRE, aunque la sección no la toque: el PUT reemplaza el estado
      // completo y una `foto` ausente le dice al backend que la borre.
      foto: merged.foto ? { key: merged.foto.key, nombre: merged.foto.nombre } : null,
    });
    if (!res.ok) {
      if (!res.code || res.code !== codigoPropio) {
        setErrorGuardar(mensajeGuardar(res.code));
      }
      return res;
    }
    onGuardado(cambios);
    setEditando(null);
    notify.success(mensaje);
    return res;
  }

  // Terminó un proceso que saca al usuario del panel: pantalla de resultado,
  // y la salida diferida del efecto de arriba.
  if (bajaHecha) {
    return (
      <ResultScreen
        title="Establecimiento eliminado correctamente"
        action={<Button onClick={salirDelPanel}>Ir a explorar</Button>}
      >
        En unos segundos te llevamos a explorar experiencias.
      </ResultScreen>
    );
  }

  return (
    <div className="mx-auto max-w-[1000px] px-7 pt-7 pb-20">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-[260px]">
          <h1 className="font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">
            Datos del establecimiento
          </h1>
          <p className="mt-1.5 text-[15px] text-fg-2">
            Información general, contacto, cobros y cultivos de la finca. Editá cada
            sección por separado.
          </p>
        </div>
        <Link
          href={`/establecimientos/${datos.id}`}
          className={buttonClasses({ variant: "neutral", className: "shrink-0" })}
        >
          <ExternalLink className="size-4" /> Ver perfil público
        </Link>
      </div>

      {errorGuardar && <Alert className="mb-5">{errorGuardar}</Alert>}

      <SeccionIdentidad
        datos={datos}
        editando={editando === "identidad"}
        saving={saving}
        onEditar={() => abrir("identidad")}
        onCancelar={() => setEditando(null)}
        guardarSeccion={guardarSeccion}
      />

      <PortadaCard foto={fotoPortada} onGuardar={guardarPortada} guardando={saving} />

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

      <SeccionContacto
        datos={datos}
        editando={editando === "contacto"}
        saving={saving}
        onEditar={() => abrir("contacto")}
        onCancelar={() => setEditando(null)}
        guardarSeccion={guardarSeccion}
      />

      <CobrosCard establecimientoId={datos.id} />

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
          href={ruta("actividades")}
          className={buttonClasses({
            variant: "neutral",
            size: "sm",
            className: "mt-4.5",
          })}
        >
          <ArrowRight className="size-[15px]" /> Ver actividades
        </Link>
      </SectionCard>

      <div className="mt-8 flex justify-end">
        <Button
          variant="danger-outline"
          onClick={() => setBajaAbierta(true)}
        >
          <Trash2 className="size-4" /> Eliminar establecimiento
        </Button>
      </div>

      {bajaAbierta && (
        <EliminarEstablecimientoFlow
          id={datos.id}
          nombre={datos.nombre}
          onCancel={() => setBajaAbierta(false)}
          onEliminado={() => {
            setBajaAbierta(false);
            setBajaHecha(true);
          }}
        />
      )}
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

const SIN_ACCESO =
  "Sólo el Productor Líder puede ver y modificar los datos del establecimiento. Pedíselo al Productor Líder de la finca.";

export default function DatosClient() {
  // El establecimiento activo lo elige el switcher del shell.
  const { activo } = useEstablecimientos();
  const fincaId = activo?.id ?? "";
  const accesos = useAuthStore((s) => s.accesos);

  const esLider = tieneRol(accesos, ROL_PRODUCTOR_LIDER, {
    tipoPermiso: TipoPermiso.PRODUCTOR,
    establecimientoId: fincaId,
  });

  const { datos, isLoading, error, reload, aplicar } = useEstablecimientoDatos(
    esLider ? fincaId : "",
  );

  if (!fincaId) return <SinEstablecimiento />;
  if (!esLider) return <SinPermiso motivo={SIN_ACCESO} />;

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
