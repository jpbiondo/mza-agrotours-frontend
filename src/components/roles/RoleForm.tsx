"use client";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Check, Lightbulb, X } from "lucide-react";
import { Alert, Button, IconButton } from "@/components/ui";
import { FaltanCampos, useCamposFaltantes } from "@/components/ui/faltan-campos";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { genId } from "@/lib/id";
import { cn } from "@/lib/utils";
import type { GrupoPermiso, RolDetalle } from "@/types/roles";
import { PermGroupEditor } from "./permisos-ui";
import { rolSchema, type RolForm } from "./schema";
import type { TextosRoles } from "./textos";

const LABEL = "font-display text-base font-semibold";

function ErrMsg({ children }: { children: ReactNode }) {
  return (
    <div className="err-msg">
      <AlertCircle className="size-[15px] text-danger" /> {children}
    </div>
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

  // `existingNames` llega como un array nuevo en cada render de la pantalla;
  // el schema se rearma sólo cuando cambia su contenido.
  const ocupados = existingNames.join("\n");
  const schema = useMemo(() => rolSchema(maxNombre, ocupados ? ocupados.split("\n") : []), [maxNombre, ocupados]);

  const form = useForm<RolForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: initial?.nombre ?? "",
      descripcion: initial?.descripcion ?? "",
      permisos: initial?.permisos ?? [],
    },
    // `onChange` y no `onTouched`: un nombre que ya existe se avisa mientras se
    // escribe, no recién al salir del campo.
    mode: "onChange",
  });
  const { control } = form;
  const { faltan, verQueFalta } = useCamposFaltantes(form, schema);
  const nombre = useWatch({ control, name: "nombre" });
  const descripcion = useWatch({ control, name: "descripcion" });

  const guardar = form.handleSubmit((v) =>
    onSave({
      id: initial?.id ?? genId("rol"),
      nombre: v.nombre,
      descripcion: v.descripcion,
      permisos: v.permisos,
      cantidadUsuarios: initial?.cantidadUsuarios ?? 0,
      esProtegido: initial?.esProtegido ?? false,
    }),
  );

  return (
    <Form {...form}>
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
          <IconButton onClick={onCancel} aria-label="Cerrar">
            <X />
          </IconButton>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto px-[26px] py-[22px]">
          <FormField
            control={control}
            name="nombre"
            render={({ field, fieldState }) => (
              <FormItem className="gap-2">
                <FormLabel required className={LABEL}>
                  Nombre del rol
                </FormLabel>
                <FormControl>
                  <TextField {...field} maxLength={maxNombre} placeholder={textos.form.nombrePlaceholder} />
                </FormControl>
                <div className="flex items-center justify-between gap-3">
                  {fieldState.error ? (
                    <FormMessage />
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
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="descripcion"
            render={({ field }) => (
              <FormItem className="gap-2">
                <FormLabel required className={LABEL}>
                  Descripción
                </FormLabel>
                <FormControl>
                  <TextArea {...field} maxLength={200} rows={3} placeholder={textos.form.descPlaceholder} />
                </FormControl>
                <div className="flex items-center justify-between gap-3">
                  <FormMessage />
                  <span
                    className={cn(
                      "ml-auto shrink-0 font-mono text-xs",
                      descripcion.length > 200 ? "text-danger" : "text-fg-3",
                    )}
                  >
                    {descripcion.length}/200
                  </span>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="permisos"
            render={({ field, fieldState }) => {
              const selected = new Set(field.value);
              const togglePerm = (codigo: string) =>
                field.onChange(
                  selected.has(codigo) ? field.value.filter((c) => c !== codigo) : [...field.value, codigo],
                );
              const toggleGroup = (group: GrupoPermiso) => {
                const codigos = group.permisos.map((p) => p.codigo);
                field.onChange(
                  codigos.every((c) => selected.has(c))
                    ? field.value.filter((c) => !codigos.includes(c))
                    : [...field.value, ...codigos.filter((c) => !selected.has(c))],
                );
              };

              return (
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
                      {selected.size}{" "}
                      {selected.size === 1 ? "permiso seleccionado" : "permisos seleccionados"}
                    </span>
                  </div>

                  <Alert tone="info" icon={<Lightbulb size={18} />} className="mb-3.5">
                    Marcá el título de un grupo para activar <strong>todos</strong> sus permisos de
                    una vez. Después destildá los que no necesites.
                  </Alert>

                  {fieldState.error && (
                    <div className="mb-3">
                      <ErrMsg>{fieldState.error.message}</ErrMsg>
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
              );
            }}
          />
        </div>

        <div className="border-t border-outline-variant bg-cream-tert px-[26px] py-4">
          {error && <Alert className="mb-3">{error}</Alert>}
          <div className="flex justify-end gap-3">
            <Button variant="neutral" onClick={onCancel} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={faltan > 0} loading={busy}>
              <Check className="size-[17px]" />
              {editing ? "Guardar cambios" : "Crear rol"}
            </Button>
          </div>
          <FaltanCampos
            faltan={faltan}
            para={editing ? "guardar" : "crear el rol"}
            onVerQueFalta={verQueFalta}
            className="mt-2"
          />
        </div>
      </div>
    </Form>
  );
}
