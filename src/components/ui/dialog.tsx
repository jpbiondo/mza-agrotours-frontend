"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { X } from "lucide-react"

import { IconButton } from "@/components/ui/IconButton"
import { cn } from "@/lib/utils"

/*
 * Diálogo centrado sobre el `Dialog` de Base UI: trae la trampa de foco,
 * Escape, el bloqueo de scroll y la semántica que `Modal.tsx` no tiene. Mismo
 * velo, caja y capa (z-140) que `Modal`, para que convivan mientras se migra.
 *
 * Es la base de `<ConfirmDialog>`; un diálogo de formulario nuevo también
 * debería ir sobre esto y no sobre `Modal`.
 *
 * Se arma en tres zonas (ver docs/ui-guidelines.md, "Diálogos"):
 *
 *   <DialogContent>
 *     <DialogHeader>…título…</DialogHeader>   fija, con la cruz
 *     <DialogBody>…</DialogBody>              lo único que scrollea
 *     <DialogFooter alert={…}>…</DialogFooter> fija, con las acciones
 *   </DialogContent>
 *
 * Con un formulario, el `<form>` envuelve cuerpo y pie con
 * `className="flex min-h-0 flex-1 flex-col"`, para que el botón de envío quede
 * adentro y el scroll siga siendo sólo del cuerpo.
 */

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

/** Lo que se puede escribir o elegir: si el cuerpo trae un campo, el foco arranca ahí. */
const CAMPO = 'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])'

function DialogContent({ className, children, initialFocus, ...props }: DialogPrimitive.Popup.Props) {
  const popupRef = React.useRef<HTMLDivElement>(null)
  // Sin esto, el foco cae en el primer elemento enfocable, que es la cruz de la
  // cabecera. En un diálogo con motivo o formulario conviene empezar a escribir;
  // sin campos, queda el default de Base UI.
  const focoInicial = React.useCallback(
    () => popupRef.current?.querySelector<HTMLElement>(`[data-slot="dialog-body"] :is(${CAMPO})`) ?? true,
    []
  )
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        data-slot="dialog-overlay"
        className="fixed inset-0 z-140 bg-fg-1/50 backdrop-blur-[2px] transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none"
      />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-140 flex max-h-[calc(100dvh-48px)] w-[468px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface shadow-pop outline-hidden",
          "transition-[opacity,transform] duration-200 ease-[cubic-bezier(.2,0,0,1)] data-[ending-style]:translate-y-[calc(-50%+8px)] data-[ending-style]:opacity-0 data-[starting-style]:translate-y-[calc(-50%+8px)] data-[starting-style]:opacity-0 motion-reduce:transition-none",
          className
        )}
        ref={popupRef}
        initialFocus={initialFocus ?? focoInicial}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}

/**
 * Cabecera fija: el título (y lo que lo acompañe) a la izquierda y la cruz de
 * cerrar arriba a la derecha. La cruz cierra como Escape y el click afuera, así
 * que pasa por el mismo `onOpenChange`: si hay cambios sin guardar, pregunta.
 */
function DialogHeader({
  className,
  children,
  closeDisabled = false,
  hideClose = false,
  ...props
}: React.ComponentProps<"div"> & {
  /** Mientras se procesa la acción: el diálogo no se puede cerrar. */
  closeDisabled?: boolean
  /** Pasos sin salida (verificando, resultado final): no hay nada que cerrar. */
  hideClose?: boolean
}) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex shrink-0 items-start justify-between gap-4 border-b border-outline-variant px-6.5 py-5", className)}
      {...props}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {!hideClose && (
        <DialogPrimitive.Close
          disabled={closeDisabled}
          render={<IconButton aria-label="Cerrar" className="-mt-1 -mr-2" />}
        >
          <X aria-hidden />
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

/** Cuerpo: lo único que scrollea. El scroll no se le pasa a la página de atrás. */
function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-6.5 py-5.5", className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("m-0 font-display text-xl font-bold text-fg-1", className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("m-0 text-[15px] leading-relaxed text-fg-2", className)}
      {...props}
    />
  )
}

/**
 * Pie fijo con los botones: "Cancelar" a la izquierda, la acción a la derecha.
 * Queda siempre a la vista, y con él lo que explica la acción: el error del
 * backend arriba (`alert`) y el "faltan N campos" debajo (`note`).
 */
function DialogFooter({
  className,
  alert,
  note,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  /** El `<Alert>` con el rechazo del backend. */
  alert?: React.ReactNode
  /** Lo que va debajo de los botones, p. ej. `<FaltanCampos>`. */
  note?: React.ReactNode
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("shrink-0 border-t border-outline-variant bg-cream-tert px-6.5 py-4", className)}
      {...props}
    >
      {alert && <div className="mb-3">{alert}</div>}
      <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">{children}</div>
      {note && <div className="mt-2">{note}</div>}
    </div>
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogDescription,
  DialogFooter,
}
