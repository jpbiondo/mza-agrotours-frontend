"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"

/*
 * Diálogo centrado sobre el `Dialog` de Base UI: trae la trampa de foco,
 * Escape, el bloqueo de scroll y la semántica que `Modal.tsx` no tiene. Mismo
 * velo, caja y capa (z-140) que `Modal`, para que convivan mientras se migra.
 *
 * Es la base de `<ConfirmDialog>`; un diálogo de formulario nuevo también
 * debería ir sobre esto y no sobre `Modal`.
 */

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogContent({ className, children, ...props }: DialogPrimitive.Popup.Props) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        data-slot="dialog-overlay"
        className="fixed inset-0 z-140 bg-fg-1/50 backdrop-blur-[2px] transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none"
      />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-140 max-h-[calc(100dvh-48px)] w-[468px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-outline-variant bg-surface p-[28px_28px_24px] shadow-pop outline-hidden",
          "transition-[opacity,transform] duration-200 ease-[cubic-bezier(.2,0,0,1)] data-[ending-style]:translate-y-[calc(-50%+8px)] data-[ending-style]:opacity-0 data-[starting-style]:translate-y-[calc(-50%+8px)] data-[starting-style]:opacity-0 motion-reduce:transition-none",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
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

/** Pie con los botones: "Cancelar" a la izquierda, la acción a la derecha. */
function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

export { Dialog, DialogClose, DialogContent, DialogTitle, DialogDescription, DialogFooter }
