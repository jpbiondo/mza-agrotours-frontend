"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { Alert, Button } from "@/components/ui";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SelectorFormato } from "@/components/ui/selector-formato";
import type { FormatoExport } from "@/lib/exportar";
import { fechaLarga } from "@/lib/gestion-dias";
import type { FechaISO } from "@/types/gestion-dias";

/**
 * Elige el formato de la planilla de asistencia del día y la descarga. La
 * planilla trae las reservas pagadas y finalizadas con un casillero para
 * marcar a mano la asistencia.
 */
export function PlanillaDiaDialog({ fecha, generando, onDescargar, onCerrar }: {
  fecha: FechaISO;
  generando: boolean;
  /** Devuelve el mensaje de error, o `null` si se descargó. */
  onDescargar: (f: FormatoExport) => Promise<string | null>;
  onCerrar: () => void;
}) {
  const [formato, setFormato] = useState<FormatoExport>("pdf");
  const [error, setError] = useState<string | null>(null);

  const cerrar = () => { if (!generando) onCerrar(); };

  async function descargar() {
    setError(null);
    setError(await onDescargar(formato));
  }

  return (
    <Dialog open onOpenChange={(abierto) => { if (!abierto) cerrar(); }} disablePointerDismissal={generando}>
      <DialogContent size="md">
        <DialogHeader closeDisabled={generando}>
          <DialogTitle>Planilla del día</DialogTitle>
          <DialogDescription className="mt-1.5 text-[13.5px] text-fg-2">
            {fecha ? fechaLarga(fecha) : "Reservas del día"}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-5">
          <p className="text-sm leading-normal text-fg-2">
            Incluye las reservas pagadas con cada visitante, su tipo de tarifa y su edad, y columnas para marcar
            la asistencia y anotar observaciones.
          </p>
          <Alert tone="info">La asistencia se marca a mano sobre la planilla: no queda registrada en el sistema.</Alert>
          <div>
            <div className="t-label mb-2.5">Formato</div>
            <SelectorFormato value={formato} onChange={setFormato} name="formato-planilla" />
          </div>
        </DialogBody>
        <DialogFooter alert={error && <Alert>{error}</Alert>}>
          <Button variant="neutral" onClick={cerrar} disabled={generando}>Cancelar</Button>
          <Button onClick={descargar} loading={generando}>
            <Download className="size-[17px]" /> Descargar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
