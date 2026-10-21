"use client";
import { useState } from "react";
import { useForm, useFormState, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight, CalendarPlus, Check, ChevronRight, HandCoins, Info, Lock, Pencil, Percent, Save, Settings2,
  ShieldCheck, Timer, Undo2, Wallet, X,
} from "lucide-react";
import type { ComponentType } from "react";
import { AsyncView } from "@/components/AsyncView";
import { Alert, Button, Card, IconCircle, Skeleton } from "@/components/ui";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { FaltanCampos, useCamposFaltantes } from "@/components/ui/faltan-campos";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { NumberField } from "@/components/ui/number-field";
import { EyeToggle, TextField } from "@/components/ui/text-field";
import { admInitials } from "@/data/admin";
import { PARAM_FIELDS, PARAM_GROUPS } from "@/data/parametros";
import { useAvisoSalida } from "@/hooks/useAvisoSalida";
import { useGuardarParametros, useParametros, useReautenticar } from "@/hooks/useParametros";
import { PermisoAdmin } from "@/lib/permisos";
import { notify } from "@/lib/notify";
import { tienePermiso } from "@/lib/roles";
import { useAuthStore } from "@/stores/authStore";
import type { DatosParametros, ParamField, ParametroKey, Parametros } from "@/types/parametros";
import {
  aDatos, aFormulario, parametrosSchema, reautenticarSchema, type ParametrosForm, type ReautenticarForm,
} from "./schema";

const ICON: Record<string, ComponentType<{ className?: string }>> = {
  percent: Percent, "calendar-plus": CalendarPlus, "undo-2": Undo2, timer: Timer, "hand-coins": HandCoins,
  wallet: Wallet, "settings-2": Settings2,
};

/** Cómo se lee un valor guardado. `null` es un parámetro que todavía no se cargó. */
function mostrar(f: ParamField, v: number | null): string | null {
  if (v === null) return null;
  if (f.kind === "percent") return `${String(v).replace(".", ",")} %`;
  if (f.unit) return `${v} ${v === 1 ? f.unit.replace(/s$/, "") : f.unit}`;
  return String(v);
}

/* ---- Fila de parámetro ------------------------------------------------- */
/** Con `enFormulario`, el título es el `<FormLabel>` del campo: sólo va dentro de un `<FormItem>`. */
function Etiqueta({ f, enFormulario }: { f: ParamField; enFormulario?: boolean }) {
  const Icono = ICON[f.icon] ?? Info;
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="flex size-[38px] shrink-0 items-center justify-center rounded-[10px] border border-green-300 bg-green-050">
        <Icono className="size-[18px] text-green-800" />
      </span>
      <div className="min-w-0">
        {enFormulario ? (
          <FormLabel required className="text-[15px] leading-tight font-semibold">{f.label}</FormLabel>
        ) : (
          <div className="text-[15px] leading-tight font-semibold text-fg-1">{f.label}</div>
        )}
        <div className="mt-[3px] text-[12.5px] leading-snug text-fg-3">{f.hint}</div>
      </div>
    </div>
  );
}

function FilaLectura({ f, valor }: { f: ParamField; valor: number | null }) {
  const texto = mostrar(f, valor);
  return (
    <div className="grid grid-cols-1 items-center gap-3 py-3.5 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] sm:gap-6">
      <Etiqueta f={f} />
      <div className="flex min-w-0 items-center sm:justify-end">
        {texto === null ? (
          <span className="text-[14.5px] text-fg-3 italic">Sin definir</span>
        ) : (
          <span className="min-w-0 font-mono text-[15.5px] font-semibold break-words text-fg-1 sm:text-right">{texto}</span>
        )}
      </div>
    </div>
  );
}

function FilaEdicion({ f, form }: { f: ParamField; form: UseFormReturn<ParametrosForm> }) {
  return (
    <FormField
      control={form.control}
      name={f.key}
      render={({ field }) => (
        <FormItem className="grid grid-cols-1 items-start gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:gap-6">
          <Etiqueta f={f} enFormulario />
          <div className="flex min-w-0 flex-col gap-[7px]">
            <FormControl>
              <NumberField {...field} decimales={f.kind === "percent" ? 2 : 0} sufijo={f.unit} placeholder={f.kind === "percent" ? "Ej.: 12,5" : undefined} />
            </FormControl>
            <div className="flex min-h-5 items-center">
              <FormMessage />
            </div>
          </div>
        </FormItem>
      )}
    />
  );
}

/* ---- Reconfirmación de identidad --------------------------------------- */
function Reautenticar({ onCancel, onOk }: { onCancel: () => void; onOk: () => void }) {
  const nombre = useAuthStore((s) => s.nombre);
  const email = useAuthStore((s) => s.email);
  const { reautenticar, isLoading } = useReautenticar();
  const [ver, setVer] = useState(false);
  const [rechazo, setRechazo] = useState<string | null>(null);
  const form = useForm<ReautenticarForm>({
    resolver: zodResolver(reautenticarSchema),
    mode: "onTouched",
    defaultValues: { pass: "" },
  });

  async function enviar({ pass }: ReautenticarForm) {
    setRechazo(null);
    const r = await reautenticar(pass);
    if (r.ok) { onOk(); return; }
    if (r.code === "badPass") { form.setError("pass", { type: "server", message: r.mensaje }, { shouldFocus: true }); return; }
    setRechazo(r.mensaje ?? null);
  }

  return (
    <Dialog open onOpenChange={(abierto) => { if (!abierto && !isLoading) onCancel(); }} disablePointerDismissal={isLoading}>
      <DialogContent>
        <div className="flex items-center gap-3.5">
          <IconCircle tone="success" className="shrink-0">
            <ShieldCheck className="size-[22px] text-green-800" aria-hidden />
          </IconCircle>
          <DialogTitle>Confirmá tu identidad</DialogTitle>
        </div>
        <DialogDescription className="mt-4">Para modificar los parámetros del sistema, reingresá tu contraseña.</DialogDescription>

        <Form {...form}>
          <form noValidate onSubmit={form.handleSubmit(enviar)} className="mt-5 flex flex-col gap-4">
            <div className="flex items-center gap-[11px] rounded-md border border-outline-variant bg-cream-tert px-3.5 py-[11px]">
              <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-brown-700 text-[13px] font-semibold text-white">
                {admInitials(nombre ?? email ?? "")}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-fg-1">{nombre}</span>
                <span className="block truncate font-mono text-xs text-fg-3">{email}</span>
              </span>
            </div>
            <FormField
              control={form.control}
              name="pass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Contraseña</FormLabel>
                  <FormControl>
                    <TextField
                      {...field}
                      type={ver ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      rightSlot={<EyeToggle shown={ver} onToggle={() => setVer((v) => !v)} />}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {rechazo && <Alert>{rechazo}</Alert>}
            <DialogFooter className="mt-2">
              <Button variant="neutral" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
              <Button type="submit" loading={isLoading}><Check className="size-[17px]" /> Verificar identidad</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ---- Resumen de cambios ------------------------------------------------ */
function ResumenCambios({ antes, despues }: { antes: Parametros; despues: DatosParametros }) {
  const cambios = PARAM_FIELDS.filter((f) => antes[f.key] !== despues[f.key]);
  return (
    <ul className="flex flex-col divide-y divide-cream-tert rounded-md border border-outline-variant px-4">
      {cambios.map((f) => (
        <li key={f.key} className="py-3">
          <div className="text-[13px] font-medium text-fg-2">{f.label}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px]">
            <span className="font-mono text-fg-3 line-through">{mostrar(f, antes[f.key]) ?? "Sin definir"}</span>
            <ArrowRight aria-label="pasa a" className="size-3.5 shrink-0 text-fg-3" />
            <span className="font-mono font-semibold text-green-800">{mostrar(f, despues[f.key])}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---- Pantalla ---------------------------------------------------------- */
function Pantalla({ inicial }: { inicial: Parametros }) {
  const accesos = useAuthStore((s) => s.accesos);
  // LEER_PARAMETROS ya lo exige el guard de la ruta; acá se distingue quién además puede modificarlos.
  const puedeGestionar = tienePermiso(accesos, PermisoAdmin.GESTIONAR_PARAMETROS);
  const [guardado, setGuardado] = useState(inicial);
  const [editando, setEditando] = useState(false);
  const [reautenticando, setReautenticando] = useState(false);
  /** Los datos ya validados: con ellos se abre el resumen. */
  const [aConfirmar, setAConfirmar] = useState<DatosParametros | null>(null);
  /** Falló el guardado desde el resumen: queda abierto con el aviso. */
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  /** El backend rechazó algo que no es de ningún campo del formulario. */
  const [rechazo, setRechazo] = useState<string | null>(null);
  const { guardar, isLoading: guardando } = useGuardarParametros();

  const form = useForm<ParametrosForm>({
    resolver: zodResolver(parametrosSchema),
    mode: "onTouched",
    defaultValues: aFormulario(inicial),
  });
  const { isDirty } = useFormState({ control: form.control });
  const { faltan, verQueFalta } = useCamposFaltantes(form, parametrosSchema);
  const { confirmarDescarte } = useAvisoSalida(editando && isDirty);

  const sinDefinir = PARAM_FIELDS.filter((f) => guardado[f.key] === null).length;

  async function cancelar() {
    if (!(await confirmarDescarte())) return;
    form.reset(aFormulario(guardado));
    setRechazo(null);
    setEditando(false);
  }

  async function confirmar() {
    if (!aConfirmar) return;
    setErrorGuardar(null);
    const r = await guardar(aConfirmar);
    if (r.ok) {
      const nuevo: Parametros = r.parametros ?? aConfirmar;
      setGuardado(nuevo);
      form.reset(aFormulario(nuevo));
      setAConfirmar(null);
      setRechazo(null);
      setEditando(false);
      notify.success("Los parámetros del sistema se guardaron.");
      return;
    }
    if (r.code === "validationError") {
      // De vuelta al formulario, con cada mensaje bajo su campo.
      setAConfirmar(null);
      for (const [campo, msg] of Object.entries(r.errores ?? {})) {
        form.setError(campo as ParametroKey, { type: "server", message: msg });
      }
      setRechazo(r.mensaje ?? null);
      return;
    }
    setErrorGuardar(r.mensaje ?? null);
  }

  return (
    <div className="mx-auto max-w-[980px] px-4 pt-7 pb-24 sm:px-7">
      <div className="mb-3.5 flex items-center gap-2.5 text-[13.5px] text-fg-3">
        <span>Parámetros</span>
        <ChevronRight size={15} />
        <span className="font-medium text-fg-2">Parámetros del sistema</span>
      </div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-[640px] min-w-0">
          <h1 className="font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">Parámetros del sistema</h1>
          <p className="mt-2.5 text-[15.5px] leading-normal text-fg-2">
            Configuración financiera y reglas de operación de la plataforma. Para modificarlas, vas a tener que
            reconfirmar tu identidad.
          </p>
        </div>
        {/* En edición, guardar y cancelar van al pie del formulario, junto al contador de lo que falta. */}
        {!editando && (
          <Button
            onClick={() => setReautenticando(true)}
            disabled={!puedeGestionar}
            disabledReason="Tu rol no incluye el permiso para modificar los parámetros."
          >
            {puedeGestionar ? <Pencil className="size-[18px]" /> : <Lock className="size-[18px]" />} Modificar parámetros
          </Button>
        )}
      </div>

      {editando ? (
        <Alert tone="info" icon={<Pencil size={18} />} className="mb-5">
          Estás editando los parámetros. Los cambios no se guardan hasta que los confirmes.
        </Alert>
      ) : sinDefinir > 0 && (
        <Alert tone="info" className="mb-5">
          {sinDefinir === 1 ? "Hay 1 parámetro sin definir." : `Hay ${sinDefinir} parámetros sin definir.`}
          {puedeGestionar && " Cargalos desde “Modificar parámetros”."}
        </Alert>
      )}

      <Form {...form}>
        <form noValidate onSubmit={form.handleSubmit((v) => { setErrorGuardar(null); setAConfirmar(aDatos(v)); })}>
          <div className="flex flex-col gap-5">
            {PARAM_GROUPS.map((g) => {
              const GIcon = ICON[g.icon] ?? Info;
              const campos = PARAM_FIELDS.filter((f) => f.group === g.id);
              return (
                <Card key={g.id} className="overflow-hidden">
                  <div className="flex items-center gap-2.5 border-b border-outline-variant bg-cream-tert px-[22px] py-4">
                    <GIcon className="size-[17px] text-brown-700" />
                    <h2 className="t-label">{g.label}</h2>
                  </div>
                  <div className="divide-y divide-cream-tert">
                    {campos.map((f) => (
                      <div key={f.key} className="px-[22px] py-1.5">
                        {editando ? <FilaEdicion f={f} form={form} /> : <FilaLectura f={f} valor={guardado[f.key]} />}
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>

          {editando && (
            <div className="mt-5 flex flex-col gap-3">
              {rechazo && <Alert>{rechazo}</Alert>}
              <div className="flex flex-wrap justify-end gap-3">
                <Button variant="neutral" onClick={cancelar}><X className="size-[18px]" /> Cancelar cambios</Button>
                <Button type="submit" disabled={!isDirty || faltan > 0}>
                  <Save className="size-[18px]" /> Guardar cambios
                </Button>
              </div>
              <FaltanCampos faltan={faltan} para="guardar" onVerQueFalta={verQueFalta} className="self-end" />
            </div>
          )}
        </form>
      </Form>

      <div className="mt-4 flex items-center gap-[9px] text-[13px] text-fg-3">
        <Info className="size-4 shrink-0" />
        Estos valores afectan a toda la plataforma. Los cambios se aplican una vez confirmados.
      </div>

      {reautenticando && (
        <Reautenticar
          onCancel={() => setReautenticando(false)}
          onOk={() => {
            setReautenticando(false);
            form.reset(aFormulario(guardado));
            setRechazo(null);
            setEditando(true);
          }}
        />
      )}

      <ConfirmDialog
        open={!!aConfirmar}
        onCancel={() => { setAConfirmar(null); setErrorGuardar(null); }}
        onConfirm={confirmar}
        busy={guardando}
        error={errorGuardar}
        tone="primary"
        icon={<Save className="size-[22px] text-info-fg" aria-hidden />}
        title="Revisá los cambios"
        description="Así van a quedar los parámetros que modificaste. Se aplican a toda la plataforma apenas los guardes."
        confirmLabel="Guardar parámetros"
        cancelLabel="Seguir editando"
      >
        {aConfirmar && <ResumenCambios antes={guardado} despues={aConfirmar} />}
      </ConfirmDialog>
    </div>
  );
}

function ParametrosSkeleton() {
  return (
    <div className="mx-auto max-w-[980px] px-4 pt-7 pb-24 sm:px-7">
      <Skeleton className="h-4 w-56" />
      <Skeleton className="mt-4 h-9 w-80" />
      <Skeleton className="mt-3 mb-6 h-4 w-full max-w-[560px]" />
      <div className="flex flex-col gap-5">
        {/* Una tarjeta por grupo, con su cantidad de filas: 1 y 4. */}
        <Skeleton className="h-[126px] rounded-lg" />
        <Skeleton className="h-[336px] rounded-lg" />
      </div>
    </div>
  );
}

export default function ParametrosClient() {
  const query = useParametros();
  return (
    <AsyncView query={query} skeleton={<ParametrosSkeleton />}>
      {(p) => <Pantalla inicial={p} />}
    </AsyncView>
  );
}
