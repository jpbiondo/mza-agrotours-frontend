"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2, MapPin, Mail, Phone, Landmark, ArrowLeft, Send, Check, Clock,
  LayoutDashboard, AlertTriangle, AlertCircle,
} from "lucide-react";
import ProducerPanelShell from "@/components/panel/ProducerPanelShell";
import { TextField } from "@/components/ui/text-field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { FileUploader } from "@/components/ui/file-uploader";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Button, Modal, SectionLabel } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  REQUISITOS_DOC, UPLOAD_MAX_FILES, UPLOAD_MAX_BYTES,
} from "@/data/establecimiento";
import { useDepartamentos } from "@/hooks/useDepartamentos";
import { useSolicitarEstablecimiento } from "@/hooks/useSolicitarEstablecimiento";
import {
  solicitarAltaSchema, SOLICITAR_ALTA_INICIAL, type SolicitarAltaForm,
} from "./schema";

const LABEL = "font-display text-[15px]";

function validarArchivos(files: File[]): string | null {
  if (files.length === 0) return "Cargá al menos un archivo de prueba.";
  if (files.length > UPLOAD_MAX_FILES) return `Podés cargar hasta ${UPLOAD_MAX_FILES} archivos.`;
  if (files.reduce((s, f) => s + f.size, 0) > UPLOAD_MAX_BYTES)
    return "El conjunto de archivos no puede superar los 30 MB.";
  return null;
}

function Counter({ value, max }: { value: string; max: number }) {
  return (
    <span className={cn("font-mono text-xs", value.length > max ? "text-danger" : "text-fg-3")}>
      {value.length} / {max}
    </span>
  );
}

function RequisitosDoc() {
  return (
    <div className="mb-4.5 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {REQUISITOS_DOC.map((r) => (
        <div
          key={r.id}
          className="rounded-md border border-outline-variant bg-cream-tert px-[18px] py-4"
        >
          <div className="mb-2.5 flex items-center gap-2.5">
            <r.icon className="size-[17px] text-brown-700" />
            <h4 className="font-display text-[14.5px] font-semibold text-fg-1">{r.titulo}</h4>
          </div>
          <ul className="flex flex-col gap-2">
            {r.items.map((it, i) => (
              <li key={i} className="flex gap-2 text-[12.8px] leading-snug text-fg-2">
                <Check className="mt-0.5 size-[13px] shrink-0 text-green-800" />
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Confirmacion({ nombre }: { nombre: string }) {
  return (
    <div className="mx-auto max-w-[640px] px-7 pt-12 pb-20">
      <div className="rounded-lg border border-outline-variant bg-surface px-10 py-12 text-center">
        <div className="mx-auto mb-[22px] flex size-[76px] items-center justify-center rounded-full bg-success-fill">
          <Check className="size-[38px] text-success-fg" />
        </div>
        <h1 className="mb-3 font-display text-[28px] font-bold text-fg-1">
          ¡Tu solicitud fue creada correctamente!
        </h1>
        <p className="mx-auto mb-6 max-w-[460px] text-[15.5px] leading-relaxed text-fg-2">
          Registramos la solicitud de alta de{" "}
          <strong className="text-fg-1">{nombre || "tu establecimiento"}</strong>. Pronto nos
          pondremos en comunicación para informarte sobre el estado de la verificación.
        </p>
        <div className="mb-7 inline-flex items-center gap-2.5 rounded-pill bg-warning-fill px-4 py-2.5 text-[13.5px] font-semibold text-warning-fg">
          <Clock className="size-[15px]" /> Estado de la solicitud: Pendiente
        </div>
        <div className="mb-7 flex items-start gap-2.5 rounded-md border border-outline-variant bg-cream-tert px-4 py-3.5 text-left">
          <Mail className="size-[17px] shrink-0 text-green-800" />
          <span className="text-[13.5px] leading-normal text-fg-2">
            Notificamos a los administradores del sistema por correo y por la plataforma para que
            revisen la verificación de tu establecimiento.
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="primary" onClick={() => (window.location.href = "/panel")}>
            <LayoutDashboard className="size-[17px]" /> Ir al panel
          </Button>
          <Button variant="neutral" onClick={() => (window.location.href = "/explorar")}>
            Explorar experiencias
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SolicitarAltaClient() {
  const router = useRouter();
  const { departamentos, isLoading: deptoLoading, error: deptoError } = useDepartamentos();
  const { solicitar } = useSolicitarEstablecimiento();
  const [files, setFiles] = useState<File[]>([]);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [leaving, setLeaving] = useState<string | null>(null); // destino pendiente del modal de abandono

  const form = useForm<SolicitarAltaForm>({
    resolver: zodResolver(solicitarAltaSchema),
    defaultValues: SOLICITAR_ALTA_INICIAL,
    mode: "onTouched",
  });

  const dirty =
    !submitted &&
    (files.length > 0 || form.formState.isDirty);

  function addFiles(incoming: File[]) {
    setFilesError(null);
    const next = [...files];
    for (const f of incoming) {
      if (next.length >= UPLOAD_MAX_FILES) {
        setFilesError(`Podés cargar hasta ${UPLOAD_MAX_FILES} archivos.`);
        break;
      }
      if (next.reduce((s, x) => s + x.size, 0) + f.size > UPLOAD_MAX_BYTES) {
        setFilesError("El conjunto de archivos no puede superar los 30 MB. Se omitieron algunos archivos.");
        continue;
      }
      next.push(f);
    }
    setFiles(next);
  }

  async function onValid(data: SolicitarAltaForm) {
    const fErr = validarArchivos(files);
    if (fErr) {
      setFilesError(fErr);
      return;
    }
    setSubmitError(null);
    const r = await solicitar(data);
    if (r.ok) {
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    setSubmitError(
      "No pudimos registrar la solicitud. Revisá los datos e intentá de nuevo en unos minutos.",
    );
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  // Salir del formulario: si hay datos cargados, confirmar el abandono.
  function irA(destino: string) {
    if (dirty) setLeaving(destino);
    else router.push(destino);
  }

  const nombre = useWatch({ control: form.control, name: "nombre" });

  return (
    <ProducerPanelShell active="datos">
      {submitted ? (
        <Confirmacion nombre={nombre} />
      ) : (
        <div className="mx-auto max-w-[820px] px-7 pt-7 pb-24">
          <button
            type="button"
            onClick={() => irA("/panel")}
            className="mb-3.5 inline-flex cursor-pointer items-center gap-1.5 text-[13.5px] font-semibold text-green-800"
          >
            <ArrowLeft className="size-4" /> Volver
          </button>

          <div className="mb-7">
            <h1 className="font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">
              Solicitar alta de establecimiento
            </h1>
            <p className="mt-1.5 text-[15px] text-fg-2">
              Completá los datos del establecimiento y cargá la documentación de respaldo. Un
              administrador revisará tu solicitud.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onValid)} noValidate>
              <div className="rounded-lg border border-outline-variant bg-surface px-[30px] pt-7 pb-[30px]">
                {/* Datos del establecimiento */}
                <SectionLabel>Datos del establecimiento</SectionLabel>
                <div className="mt-3.5 mb-2 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <div className="flex items-baseline justify-between gap-3">
                          <FormLabel required className={LABEL}>Nombre del establecimiento</FormLabel>
                          <Counter value={field.value} max={100} />
                        </div>
                        <FormControl>
                          <TextField {...field} icon={<Building2 />} maxLength={100} placeholder="Ej: Finca La Escondida" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="razonSocial"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-baseline justify-between gap-3">
                          <FormLabel required className={LABEL}>Razón social</FormLabel>
                          <Counter value={field.value} max={100} />
                        </div>
                        <FormControl>
                          <TextField {...field} maxLength={100} placeholder="Ej: La Escondida S.R.L." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cuit"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel required className={LABEL}>CUIT</FormLabel>
                        <FormControl>
                          <TextField
                            {...field}
                            onChange={(v) => field.onChange(v.replace(/[^\dkK-]/g, "").slice(0, 11))}
                            maxLength={11}
                            inputMode="numeric"
                            placeholder="30714523941"
                          />
                        </FormControl>
                        {!fieldState.error && <FormDescription>Hasta 11 caracteres.</FormDescription>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Ubicación */}
                <SectionLabel className="mt-1">Ubicación</SectionLabel>
                <div className="mt-3.5 mb-2 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="departamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required className={LABEL}>Departamento</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            {...field}
                            options={departamentos}
                            icon={<MapPin />}
                            placeholder={
                              deptoLoading
                                ? "Cargando departamentos…"
                                : deptoError
                                ? "No se pudieron cargar los departamentos"
                                : "Seleccioná un departamento"
                            }
                            searchPlaceholder="Buscar departamento…"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="domicilio"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-baseline justify-between gap-3">
                          <FormLabel required className={LABEL}>Domicilio legal</FormLabel>
                          <Counter value={field.value} max={200} />
                        </div>
                        <FormControl>
                          <TextField {...field} icon={<MapPin />} maxLength={200} placeholder="Calle, número, localidad" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contacto */}
                <SectionLabel className="mt-1">Contacto</SectionLabel>
                <div className="mt-3.5 mb-2 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-baseline justify-between gap-3">
                          <FormLabel required className={LABEL}>Correo electrónico</FormLabel>
                          <Counter value={field.value} max={100} />
                        </div>
                        <FormControl>
                          <TextField {...field} icon={<Mail />} type="email" maxLength={100} inputMode="email" placeholder="contacto@finca.com.ar" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel required className={LABEL}>Teléfono</FormLabel>
                        <FormControl>
                          <TextField
                            {...field}
                            onChange={(v) => field.onChange(v.replace(/[^\d+\s()-]/g, "").slice(0, 16))}
                            icon={<Phone />}
                            maxLength={16}
                            inputMode="tel"
                            placeholder="+54 9 261 555-1247"
                          />
                        </FormControl>
                        {!fieldState.error && <FormDescription>Entre 7 y 16 caracteres.</FormDescription>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Datos bancarios */}
                <SectionLabel className="mt-1">Datos bancarios</SectionLabel>
                <div className="mt-3.5 mb-2">
                  <FormField
                    control={form.control}
                    name="cvu"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <div className="flex items-baseline justify-between gap-3">
                          <FormLabel required className={LABEL}>CVU</FormLabel>
                          <Counter value={field.value} max={22} />
                        </div>
                        <FormControl>
                          <TextField
                            {...field}
                            onChange={(v) => field.onChange(v.replace(/\D/g, "").slice(0, 22))}
                            icon={<Landmark />}
                            maxLength={22}
                            inputMode="numeric"
                            placeholder="0000003100029723578291"
                          />
                        </FormControl>
                        {!fieldState.error && (
                          <FormDescription>22 dígitos numéricos, sin espacios ni letras.</FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Documentación */}
                <div className="my-[22px] h-px bg-cream-tert" />
                <SectionLabel>Cargar prueba</SectionLabel>
                <p className="mt-2 mb-4 text-[13.5px] leading-normal text-fg-2">
                  Adjuntá la documentación según el tipo de establecimiento:
                </p>
                <RequisitosDoc />
                <FileUploader
                  files={files}
                  onAdd={addFiles}
                  onRemove={(i) => setFiles((cur) => cur.filter((_, idx) => idx !== i))}
                  error={filesError}
                  maxFiles={UPLOAD_MAX_FILES}
                  maxBytes={UPLOAD_MAX_BYTES}
                />
              </div>

              {/* Acciones */}
              <div className="mt-6">
                {submitError && (
                  <div className="mb-3.5 flex items-center gap-2 rounded-md border border-danger bg-danger-fill px-3.5 py-2.5 text-[13.5px] text-danger-fg">
                    <AlertCircle className="size-[15px] shrink-0" />
                    {submitError}
                  </div>
                )}
                <div className="flex justify-end gap-3">
                  <Button variant="neutral" onClick={() => irA("/panel")}>Cancelar</Button>
                  <Button type="submit" variant="primary" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      "Enviando…"
                    ) : (
                      <>
                        <Send className="size-[18px]" /> Enviar solicitud
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      )}

      {leaving && (
        <Modal onClose={() => setLeaving(null)}>
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-[9px] bg-warning-fill">
              <AlertTriangle className="size-[18px] text-warning-fg" />
            </span>
            <h3 className="font-display text-[18.5px] font-semibold text-fg-1">
              ¿Desea abandonar el formulario?
            </h3>
          </div>
          <p className="mt-3 text-[14.5px] leading-relaxed text-fg-2">
            Los datos no se guardarán. Si abandonás ahora, vas a perder la información cargada en el
            formulario.
          </p>
          <div className="mt-5 flex justify-end gap-2.5">
            <Button variant="neutral" onClick={() => setLeaving(null)}>Seguir editando</Button>
            <Button variant="danger" onClick={() => router.push(leaving)}>Abandonar</Button>
          </div>
        </Modal>
      )}
    </ProducerPanelShell>
  );
}
