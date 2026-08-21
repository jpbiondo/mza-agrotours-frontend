"use client";

import { useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  ChevronRight, Info, KeyRound, Loader, Lock, Pencil, Plus, ShieldCheck, Trash2,
} from "lucide-react";
import { Alert, Button, Card, IconCircle, Modal, Skeleton, Toast } from "@/components/ui";
import type { ToastData } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { AccionesRoles, DatosRol, GrupoPermiso, RolDetalle } from "@/types/roles";
import { PermSummary } from "./permisos-ui";
import { Panel, RoleForm } from "./RoleForm";
import type { TextosRoles } from "./textos";

/**
 * Errores de dominio del enum `RolError` del backend, que es el mismo para los
 * roles de administrador y los de productor. Lo que no esté acá cae en el
 * mensaje genérico: hablar de reintentar sólo tiene sentido si el problema
 * puede ser pasajero.
 */
const ERROR_GUARDAR: Record<string, string> = {
  // Vale para el alta y para el renombre.
  "rol.rolAlreadyExists": "Ya existe un rol con ese nombre. Elegí otro.",
  "rol.permisoInvalido": "Alguno de los permisos que elegiste no se puede asignar a este rol.",
  "rol.malaRequest": "Revisá los datos del rol: el sistema los rechazó.",
  "rol.notFound": "Este rol ya no existe. Actualizá la pantalla.",
};

function mensajeGuardar(code: string | undefined, editando: boolean): string {
  return (
    (code && ERROR_GUARDAR[code]) ||
    (editando
      ? "No pudimos guardar los cambios. Probá de nuevo en unos minutos."
      : "No pudimos crear el rol. Probá de nuevo en unos minutos.")
  );
}

const ERROR_BAJA: Record<string, string> = {
  // Pasa si le asignaron a alguien entre que se abrió el diálogo y se confirmó.
  "rol.bajaTieneUsuarios":
    "No se puede dar de baja: el rol tiene personas asignadas. Actualizá la pantalla.",
  "rol.notFound": "Este rol ya no existe. Actualizá la pantalla.",
};

/**
 * Si vino un código que no está mapeado, el backend rechazó por algo concreto y
 * reintentar no lo va a arreglar.
 */
function mensajeBaja(code?: string): string {
  if (code) return ERROR_BAJA[code] ?? "No se pudo dar de baja el rol.";
  return "No pudimos dar de baja el rol. Probá de nuevo en unos minutos.";
}

/* ---- Marco de la pantalla ------------------------------------------------
   Lo comparten el esqueleto y la pantalla con datos. Si cada uno dibujara su
   versión, al llegar los roles se movería todo de lugar apenas cambiara un
   padding en uno solo. */

function Encabezado({ textos, accion }: { textos: TextosRoles; accion: ReactNode }) {
  const [seccion, pantalla] = textos.breadcrumb;
  return (
    <>
      <div className="mb-3.5 flex items-center gap-2.5 text-[13.5px] text-fg-3">
        <span>{seccion}</span>
        <ChevronRight className="size-[15px]" />
        <span className="font-medium text-fg-2">{pantalla}</span>
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-[280px]">
          <h1 className="font-display text-[34px] font-bold tracking-[-.01em] text-fg-1">
            {textos.titulo}
          </h1>
          <p className="mt-2.5 max-w-[660px] text-[15.5px] leading-relaxed text-fg-2">
            {textos.bajada}
          </p>
        </div>
        {accion}
      </div>
    </>
  );
}

function Stats({ textos, valores }: { textos: TextosRoles; valores: ReactNode[] }) {
  const stats: { icono: ComponentType<{ className?: string }>; label: string }[] = [
    { icono: ShieldCheck, label: "Roles activos" },
    { icono: textos.iconoUsuarios, label: textos.statUsuarios },
    { icono: KeyRound, label: "Permisos disponibles" },
  ];
  return (
    <div className="mb-5 flex flex-wrap gap-3.5">
      {stats.map((s, i) => (
        <Card key={s.label} className="flex min-w-[190px] items-center gap-3 px-4 py-3">
          <span className="flex size-[42px] shrink-0 items-center justify-center rounded-[10px] bg-green-050">
            <s.icono className="size-5 text-green-800" />
          </span>
          <span>
            <span className="block font-mono text-xl font-bold text-fg-1">{valores[i]}</span>
            <span className="block text-[12.5px] text-fg-2">{s.label}</span>
          </span>
        </Card>
      ))}
    </div>
  );
}

/**
 * Anchos fijos por columna. Con el layout automático el navegador los calcula
 * a partir del contenido, así que las barras del esqueleto —que nunca miden
 * exactamente lo mismo que un nombre o dos botones— daban columnas de otro
 * ancho, y al llegar los datos saltaba todo. Se nota sobre todo en Acciones,
 * que va alineada a la derecha.
 *
 * Las dos primeras van sin ancho: se reparten lo que sobra, que es lo que
 * conviene para nombres y listas de permisos de largo variable.
 */
const ANCHOS = [undefined, undefined, "w-[170px]", "w-[260px]"];

/** Card, scroll y cabecera: lo que comparten el esqueleto y la tabla con datos. */
function Tabla({ textos, children }: { textos: TextosRoles; children: ReactNode }) {
  const columnas = [textos.columnaRol, "Permisos", textos.columnaUsuarios, "Acciones"];
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] table-fixed border-collapse">
          <colgroup>
            {ANCHOS.map((w, i) => (
              <col key={i} className={w} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columnas.map((h, i) => (
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
          {children}
        </table>
      </div>
    </Card>
  );
}

function NotaProtegidos() {
  return (
    <div className="mt-4 flex items-center gap-2 text-[13px] text-fg-3">
      <Info className="size-4" /> Los roles marcados como{" "}
      <strong className="font-semibold text-fg-2">Protegidos</strong> son del sistema: no se pueden
      modificar ni dar de baja.
    </div>
  );
}

/** Anchos por fila, para que el esqueleto no se lea como una grilla perfecta. */
const FILAS_SKELETON = [
  { nombre: "w-[190px]", desc: "w-[280px]", chips: ["w-[128px]", "w-[104px]"] },
  { nombre: "w-[150px]", desc: "w-[240px]", chips: ["w-[112px]"] },
  { nombre: "w-[210px]", desc: "w-[300px]", chips: ["w-[128px]", "w-[92px]"] },
  { nombre: "w-[170px]", desc: "w-[220px]", chips: ["w-[104px]"] },
];

/**
 * Mismo marco que la pantalla con datos, con el contenido variable en gris. Los
 * contadores muestran "—" y no un cero, que se leería como un dato real: "0
 * roles activos" es una afirmación, y todavía no sabemos nada.
 */
export function RolesSkeleton({ textos }: { textos: TextosRoles }) {
  return (
    <div className="mx-auto max-w-[1240px] px-7 pt-7 pb-[72px]" aria-busy>
      <span role="status" className="sr-only">
        Cargando roles…
      </span>

      <Encabezado
        textos={textos}
        accion={
          <Button size="lg" disabled>
            <Plus className="size-[18px]" /> Agregar rol
          </Button>
        }
      />

      <Stats textos={textos} valores={["—", "—", "—"]} />

      <Tabla textos={textos}>
        <tbody>
          {FILAS_SKELETON.map((f, i) => (
            <tr key={i} className="border-b border-cream-tert">
              <td className="p-4 align-top">
                <Skeleton className={cn("h-[17px]", f.nombre)} />
                <Skeleton className={cn("mt-2.5 h-[13px]", f.desc)} />
              </td>
              <td className="p-4 align-top">
                <div className="flex flex-wrap gap-1.5">
                  {f.chips.map((c) => (
                    <Skeleton key={c} className={cn("h-[26px] rounded-pill", c)} />
                  ))}
                </div>
              </td>
              <td className="p-4 align-top">
                <Skeleton className="mx-auto h-[17px] w-9" />
              </td>
              <td className="p-4 align-top">
                <div className="flex justify-end gap-2.5">
                  <Skeleton className="h-[34px] w-[108px]" />
                  <Skeleton className="h-[34px] w-[88px]" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Tabla>

      <NotaProtegidos />
    </div>
  );
}

/**
 * La pantalla de roles: tabla, alta, modificación y baja. La comparten /admin y
 * el panel del productor, que sólo difieren en el copy (`textos`), en los
 * endpoints que hay detrás (`acciones`) y en quién puede gestionar.
 *
 * `puedeGestionar` es control de navegación, no de seguridad: apaga botones para
 * no ofrecer lo que la cuenta no puede hacer. Quien rechaza cada request es el
 * backend.
 */
export function RolesScreen({
  initial,
  grupos,
  textos,
  acciones,
  puedeGestionar,
}: {
  initial: RolDetalle[];
  grupos: GrupoPermiso[];
  textos: TextosRoles;
  acciones: AccionesRoles;
  puedeGestionar: boolean;
}) {
  // Copia local: el backend confirma cada mutación pero no devuelve la lista
  // entera, así que la fila se inserta, se pisa o se saca acá.
  const [roles, setRoles] = useState<RolDetalle[]>(initial);
  const [form, setForm] = useState<{ open: boolean; initial: RolDetalle | null }>({
    open: false,
    initial: null,
  });
  const [toDelete, setToDelete] = useState<RolDetalle | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  const totalUsuarios = roles.reduce((s, r) => s + r.cantidadUsuarios, 0);
  // Un mismo código puede repetirse en dos grupos: se cuentan los distintos.
  const permisosDisponibles = new Set(grupos.flatMap((g) => g.permisos.map((p) => p.codigo))).size;

  function notify(title: string) {
    setToast({ tone: "success", title });
    setTimeout(() => setToast((t) => (t?.title === title ? null : t)), 3200);
  }

  function abrirForm(initial: RolDetalle | null) {
    setFormError(null);
    setForm({ open: true, initial });
  }

  function cerrarForm() {
    setFormError(null);
    setForm({ open: false, initial: null });
  }

  async function saveRole(role: RolDetalle) {
    setFormError(null);
    const editando = !!form.initial;
    // El cuerpo es el mismo para el alta y la modificación.
    const datos: DatosRol = {
      nombre: role.nombre,
      descripcion: role.descripcion,
      permisos: role.permisos,
    };

    if (editando) {
      const res = await acciones.actualizar(role.id, datos);
      if (!res.ok) {
        setFormError(mensajeGuardar(res.code, true));
        return;
      }
      setRoles((prev) => prev.map((r) => (r.id === role.id ? role : r)));
      cerrarForm();
      notify(`Se guardaron los cambios del rol «${role.nombre}».`);
      return;
    }

    const res = await acciones.crear(datos);
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

  function pedirBaja(role: RolDetalle | null) {
    setDeleteError(null);
    setToDelete(role);
  }

  async function confirmDelete(role: RolDetalle) {
    setDeleteError(null);
    const res = await acciones.darBaja(role.id);
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
      <Encabezado
        textos={textos}
        accion={
          <Button
            size="lg"
            disabled={!puedeGestionar}
            title={puedeGestionar ? "Crear un rol nuevo" : textos.sinGestion}
            onClick={() => abrirForm(null)}
          >
            <Plus className="size-[18px]" /> Agregar rol
          </Button>
        }
      />

      <Stats textos={textos} valores={[roles.length, totalUsuarios, permisosDisponibles]} />

      <Tabla textos={textos}>
        <tbody>
          {roles.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-12 text-center text-[15px] text-fg-2">
                {textos.vacio}
              </td>
            </tr>
          )}
          {roles.map((r) => {
            const tieneUsuarios = r.cantidadUsuarios > 0;
            const noBorrable = tieneUsuarios || r.esProtegido || !puedeGestionar;
            // Sin poder gestionar no se puede actuar sobre ninguna fila, así que
            // ése es el motivo que corresponde antes que los de cada rol.
            const delTitle = !puedeGestionar
              ? textos.sinGestion
              : r.esProtegido
                ? "Este rol está protegido y no se puede dar de baja"
                : tieneUsuarios
                  ? `No se puede dar de baja: tiene ${textos.usuariosAsignados(r.cantidadUsuarios)}`
                  : "Dar de baja este rol";
            const editTitle = !puedeGestionar
              ? textos.sinGestion
              : r.esProtegido
                ? "Este rol está protegido y no se puede modificar"
                : "Modificar este rol";

            return (
              <tr key={r.id} className="border-b border-cream-tert">
                {/* Sin max-w: con table-fixed el ancho lo manda el <colgroup>. */}
                <td className="p-4 align-top">
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

                <td className="p-4 align-top">
                  <PermSummary perms={r.permisos} grupos={grupos} />
                </td>

                <td className="p-4 text-center align-top">
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 font-mono text-base font-bold",
                      tieneUsuarios ? "text-fg-1" : "text-fg-3",
                    )}
                  >
                    <textos.iconoUsuarios
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
                      disabled={r.esProtegido || !puedeGestionar}
                      title={editTitle}
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
                  {/* Sólo si ése es el motivo real: sin poder gestionar, la
                      aclaración distrae del que importa. */}
                  {puedeGestionar && tieneUsuarios && !r.esProtegido && (
                    <div className="mt-2 flex items-center justify-end gap-1.5 text-[11.5px] text-fg-3">
                      <Lock className="size-[13px]" /> {textos.notaBorrar}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Tabla>

      <NotaProtegidos />

      {form.open && (
        <Panel onClose={cerrarForm}>
          <RoleForm
            initial={form.initial}
            grupos={grupos}
            existingNames={roles
              .filter((r) => !form.initial || r.id !== form.initial!.id)
              .map((r) => r.nombre)}
            textos={textos}
            busy={acciones.guardando}
            error={formError}
            onCancel={cerrarForm}
            onSave={saveRole}
          />
        </Panel>
      )}

      {toDelete && (
        <Modal onClose={() => pedirBaja(null)} dismissable={!acciones.borrando}>
          <div className="flex items-center gap-3.5">
            <IconCircle tone="danger">
              <Trash2 className="size-[22px] text-danger" />
            </IconCircle>
            <h3 className="font-display text-xl font-bold text-fg-1">Dar de baja el rol</h3>
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-fg-2">
            ¿Seguro que querés dar de baja el rol{" "}
            <strong className="text-fg-1">«{toDelete.nombre}»</strong>? {textos.bajaAdvertencia}
          </p>
          {deleteError && <Alert className="mt-4">{deleteError}</Alert>}
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="neutral" onClick={() => pedirBaja(null)} disabled={acciones.borrando}>
              No, volver
            </Button>
            <Button
              variant="danger"
              onClick={() => confirmDelete(toDelete)}
              disabled={acciones.borrando}
            >
              {acciones.borrando ? (
                <Loader className="spin size-[17px]" />
              ) : (
                <Trash2 className="size-[17px]" />
              )}
              Sí, dar de baja
            </Button>
          </div>
        </Modal>
      )}

      {toast && <Toast {...toast} />}
    </div>
  );
}
