"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

/*
 * Hoja que sube desde abajo, sobre el `Dialog` de Base UI: trae la trampa de
 * foco, Escape, el bloqueo de scroll y la semántica de diálogo que `Modal.tsx`
 * no tiene. Por ahora sólo existe el lado de abajo, que es el único que pide
 * el diseño (la hoja de reserva del detalle en móvil).
 */

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

/**
 * En angosto (< 600px) ocupa toda la pantalla; más ancho queda como hoja con
 * las esquinas de arriba redondeadas y hasta el 92% del alto.
 */
function SheetContent({ className, children, ...props }: SheetPrimitive.Popup.Props) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Backdrop
        data-slot="sheet-overlay"
        className="fixed inset-0 z-[145] bg-[rgba(42,38,32,.32)] transition-opacity duration-200 ease-[cubic-bezier(.2,0,0,1)] data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none"
      />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed inset-x-0 top-0 bottom-0 z-[146] flex flex-col bg-surface outline-hidden transition-transform duration-[220ms] ease-[cubic-bezier(.2,0,0,1)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full motion-reduce:transition-none",
          "sm:top-auto sm:max-h-[92vh] sm:rounded-t-2xl sm:border-t sm:border-outline-variant sm:shadow-[0_-8px_24px_rgba(45,90,39,.12)]",
          className
        )}
        {...props}
      >
        {children}
      </SheetPrimitive.Popup>
    </SheetPrimitive.Portal>
  )
}

/** Barra de arriba con el título y la cruz de cerrar (44px: es un blanco táctil). */
function SheetHeader({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex shrink-0 items-center justify-between gap-3 border-b border-outline-variant py-2 pr-2 pl-4", className)}
      {...props}
    >
      {children}
      <SheetPrimitive.Close
        aria-label="Cerrar"
        className="flex size-11 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-fg-1 hover:bg-cream-tert"
      >
        <X size={22} aria-hidden />
      </SheetPrimitive.Close>
    </div>
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("m-0 font-display text-lg font-bold text-fg-1", className)}
      {...props}
    />
  )
}

/** Cuerpo scrolleable; el scroll no se le pasa a la página de atrás. */
function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-body"
      className={cn("flex-1 overflow-y-auto overscroll-contain", className)}
      {...props}
    />
  )
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetBody }
