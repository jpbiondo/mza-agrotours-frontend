"use client";

import type { ReactNode } from "react";
import { Check, Loader, Pencil, X } from "lucide-react";
import { Button, Card } from "@/components/ui";

/**
 * Tarjeta de una sección de "Datos del establecimiento". Alterna lectura y
 * edición, y en las secciones de sólo lectura (`locked`) deja el encabezado
 * libre para lo que le pase `aside`.
 */
export function SectionCard({
  title,
  icon,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  canSave = true,
  saving,
  locked,
  aside,
  children,
}: {
  title: string;
  icon: ReactNode;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave?: () => void;
  canSave?: boolean;
  saving?: boolean;
  /** Sección de sólo lectura: no ofrece editar. */
  locked?: boolean;
  /** Reemplaza los botones del encabezado en las secciones `locked`. */
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="mb-6 overflow-hidden">
      <header className="flex items-center justify-between gap-4 border-b border-cream-tert px-7 py-5">
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-green-050">
            {icon}
          </span>
          <h2 className="font-display text-[18px] font-semibold text-fg-1">
            {title}
          </h2>
        </div>
        {locked ? (
          aside
        ) : !isEditing ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-sm"
            onClick={onEdit}
          >
            <Pencil className="size-[15px]" /> Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm"
              onClick={onCancel}
              disabled={saving}
            >
              <X className="size-[15px]" /> Cancelar
            </Button>
            <Button
              size="sm"
              className="text-sm"
              onClick={onSave}
              disabled={!canSave || saving}
            >
              {saving ? (
                <Loader className="spin size-[15px]" />
              ) : (
                <Check className="size-[15px]" />
              )}
              Guardar cambios
            </Button>
          </div>
        )}
      </header>
      <div className="px-7 pt-2 pb-7">{children}</div>
    </Card>
  );
}
