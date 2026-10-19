"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { IconCircle } from "@/components/ui/IconCircle";
import { TextField } from "@/components/ui/text-field";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { useConfirmStore, type ConfirmOptions } from "@/stores/confirmStore";

export type { ConfirmOptions };

export interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean;
  /** Se llama al cancelar (botón, Escape o click afuera). No se llama mientras `busy`. */
  onCancel: () => void;
  onConfirm: () => void;
  /** La acción está en curso: spinner en el botón y el diálogo no se puede cerrar. */
  busy?: boolean;
  /** El backend rechazó la acción: el diálogo queda abierto con el aviso. */
  error?: string | null;
  /** Deshabilita la acción, p. ej. hasta completar el motivo que va en `children`. */
  confirmDisabled?: boolean;
  /** Contenido extra entre la descripción y el pie: un campo de motivo, un resumen. */
  children?: ReactNode;
}

/**
 * Diálogo de confirmación. Cuándo se usa (ver docs/ui-guidelines.md,
 * "Confirmaciones"): acciones irreversibles o que afectan a otra persona. Las
 * reversibles no se confirman (toast con Deshacer) y un formulario enviado
 * tampoco (el formulario ya es la confirmación).
 *
 * Para una pregunta de sí o no sin estado de envío alcanza con `confirm()`.
 * Este componente es para cuando la acción puede fallar y el error tiene que
 * verse adentro del diálogo, o cuando lleva un campo (motivo).
 */
export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  busy = false,
  error,
  confirmDisabled = false,
  children,
  ...opciones
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(abierto) => { if (!abierto && !busy) onCancel(); }}
      disablePointerDismissal={busy}
    >
      <DialogContent>
        {/* Adentro del popup: Base UI lo desmonta al cerrar, así lo escrito no sobrevive a la próxima apertura. */}
        <Cuerpo
          {...opciones}
          busy={busy}
          error={error}
          confirmDisabled={confirmDisabled}
          onCancel={onCancel}
          onConfirm={onConfirm}
        >
          {children}
        </Cuerpo>
      </DialogContent>
    </Dialog>
  );
}

function Cuerpo({
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  tone = "danger",
  icon,
  requireText,
  busy,
  error,
  confirmDisabled,
  onCancel,
  onConfirm,
  children,
}: Omit<ConfirmDialogProps, "open">) {
  const [escrito, setEscrito] = useState("");
  const campoId = useId();
  const falta = !!requireText && escrito.trim() !== requireText;

  return (
    <>
      <div className="flex items-center gap-3.5">
        <IconCircle tone={tone === "danger" ? "danger" : "info"} className="shrink-0">
          {icon ?? (tone === "danger"
            ? <AlertTriangle className="size-[22px] text-danger-fg" aria-hidden />
            : <HelpCircle className="size-[22px] text-info-fg" aria-hidden />)}
        </IconCircle>
        <DialogTitle>{title}</DialogTitle>
      </div>

      {description && <DialogDescription className="mt-4">{description}</DialogDescription>}

      {children && <div className="mt-4">{children}</div>}

      {requireText && (
        <div className="mt-4 flex flex-col gap-2">
          <label htmlFor={campoId} className="text-sm text-fg-2">
            Para confirmar, escribí <strong className="font-mono text-fg-1">{requireText}</strong>
          </label>
          <TextField
            id={campoId}
            value={escrito}
            onChange={setEscrito}
            autoComplete="off"
            disabled={busy}
          />
        </div>
      )}

      {error && <Alert className="mt-4">{error}</Alert>}

      <DialogFooter>
        <Button variant="neutral" onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </Button>
        <Button
          variant={tone === "danger" ? "danger" : "primary"}
          onClick={onConfirm}
          loading={busy}
          disabled={confirmDisabled || falta}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * Pregunta de sí o no que devuelve una promesa: `true` si confirmó.
 *
 * ```ts
 * if (!(await confirm({ title: "¿Eliminar la receta?", confirmLabel: "Eliminar receta" }))) return;
 * ```
 *
 * Necesita `<ConfirmHost>` montado (está en el layout raíz).
 */
export function confirm(opciones: ConfirmOptions): Promise<boolean> {
  return useConfirmStore.getState().pedir(opciones);
}

/** Dibuja el diálogo de `confirm()`. Se monta una sola vez, en el layout raíz. */
export function ConfirmHost() {
  const pedido = useConfirmStore((s) => s.pedido);
  const responder = useConfirmStore((s) => s.responder);
  return (
    <ConfirmDialog
      // Un pedido nuevo es un diálogo nuevo: lo escrito no pasa de uno al otro.
      key={pedido?.id ?? 0}
      {...(pedido?.opciones ?? { title: "", confirmLabel: "" })}
      open={!!pedido}
      onCancel={() => responder(false)}
      onConfirm={() => responder(true)}
    />
  );
}
