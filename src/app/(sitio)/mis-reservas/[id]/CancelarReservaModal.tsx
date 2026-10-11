"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader, RotateCcw, XCircle } from "lucide-react";
import { Alert, Button, IconCircle, Modal } from "@/components/ui";
import { useCancelarReserva } from "@/hooks/useReservas";
import { fmtDiaLocal, fmtFranja, moneyAr } from "@/lib/format";
import type {
  CondicionCancelacion, ErrorCancelacion, ReservaDetalle, ResultadoCancelacion,
} from "@/types/reservas";

type Fase =
  | { tipo: "consultando" }
  | { tipo: "errorConsulta"; error: ErrorCancelacion }
  /** `error`: el POST falló y la reserva sigue como estaba. */
  | { tipo: "confirmar"; condicion: CondicionCancelacion; error?: ErrorCancelacion }
  | { tipo: "hecho"; resultado: ResultadoCancelacion };

/** Copy propio para cada error: el `message` del backend es técnico y no se muestra. */
const MENSAJE_ERROR: Record<ErrorCancelacion, string> = {
  noEncontrada: "No encontramos esta reserva entre las tuyas.",
  estadoInvalido: "Esta reserva ya no se puede cancelar: sólo se pueden cancelar las reservas pagadas.",
  yaTermino: "La actividad ya terminó, así que la reserva no se puede cancelar.",
  tecnico: "No pudimos completar la operación. Revisá tu conexión y volvé a intentarlo.",
};

/** Con estos errores reintentar no sirve: la reserva cambió o no es del visitante. */
const DEFINITIVO: Record<ErrorCancelacion, boolean> = {
  noEncontrada: true, estadoInvalido: true, yaTermino: true, tecnico: false,
};

/* TODO backend: la cancelación todavía no manda notificaciones, así que el copy
   no promete avisos ni al visitante ni al productor. */
function resultadoCopy(resultado: ResultadoCancelacion, total: string): { titulo: string; texto: string } {
  switch (resultado) {
    case "sinReembolso":
      return { titulo: "Reserva cancelada", texto: "La reserva quedó cancelada, sin reembolso." };
    case "reembolsado":
      return { titulo: "Reserva cancelada y reembolsada", texto: `Ya se realizó el reembolso de ${total}.` };
    case "reembolsoEnProceso":
      return {
        titulo: "Reserva cancelada",
        texto: `El reembolso de ${total} está en proceso; podés ver su estado en Mis reservas.`,
      };
    case "reembolsoManual":
      return {
        titulo: "Reserva cancelada",
        texto: `El reembolso de ${total} sigue correspondiéndote: el establecimiento lo realizará manualmente. Podés ver su estado en Mis reservas.`,
      };
    default:
      return { titulo: "Reserva cancelada", texto: "La reserva quedó cancelada." };
  }
}

const titulo = "font-display text-[19px] leading-tight font-bold text-fg-1";
const lead = "text-[13.5px] leading-normal text-fg-2";

/**
 * Flujo de cancelación: al montarse consulta qué pasaría (reembolso o no), pide
 * confirmación y cancela. `onCambio` avisa que la reserva cambió en el backend
 * —se canceló, o resultó no cancelable— para que la pantalla la vuelva a pedir.
 */
export default function CancelarReservaModal({
  reserva, onClose, onCambio,
}: {
  reserva: ReservaDetalle;
  onClose: () => void;
  onCambio: () => void;
}) {
  const { consultarCondicion, cancelar, cancelando } = useCancelarReserva(reserva.id);
  const [fase, setFase] = useState<Fase>({ tipo: "consultando" });
  const [intento, setIntento] = useState(0);
  const total = moneyAr(reserva.total);

  useEffect(() => {
    let active = true;
    consultarCondicion().then((r) => {
      if (!active) return;
      setFase(r.ok ? { tipo: "confirmar", condicion: r.valor } : { tipo: "errorConsulta", error: r.error });
      if (!r.ok && DEFINITIVO[r.error]) onCambio();
    });
    return () => { active = false; };
    // `intento` fuerza la consulta de nuevo en cada reintento.
  }, [intento, consultarCondicion, onCambio]);

  function reintentarConsulta() {
    setFase({ tipo: "consultando" });
    setIntento((n) => n + 1);
  }

  async function confirmar(condicion: CondicionCancelacion) {
    if (cancelando) return;
    const r = await cancelar();
    if (r.ok) {
      setFase({ tipo: "hecho", resultado: r.valor });
      onCambio();
      return;
    }
    setFase({ tipo: "confirmar", condicion, error: r.error });
    if (DEFINITIVO[r.error]) onCambio();
  }

  if (fase.tipo === "consultando") {
    return (
      <Modal dismissable={false} padding="p-[40px_28px]" className="text-center">
        <Loader size={40} className="spin mx-auto mb-4 block text-green-800" />
        <div className="font-display text-[18px] font-semibold text-fg-1">Verificando condiciones…</div>
        <div className={`mt-1.5 ${lead}`}>Estamos revisando si te corresponde reembolso.</div>
        <div className="mt-5 flex justify-center">
          <Button variant="neutral" onClick={onClose}>No, volver</Button>
        </div>
      </Modal>
    );
  }

  if (fase.tipo === "errorConsulta") {
    const definitivo = DEFINITIVO[fase.error];
    return (
      <Modal onClose={onClose}>
        <IconCircle tone="danger" className="mb-4">
          <AlertTriangle size={26} className="text-danger-fg" />
        </IconCircle>
        <h2 className={`mb-2 ${titulo}`}>No se puede cancelar la reserva</h2>
        <p className={`mb-5 ${lead}`}>{MENSAJE_ERROR[fase.error]}</p>
        <div className="flex gap-3">
          <Button variant="neutral" className="flex-1" onClick={onClose}>Cerrar</Button>
          {!definitivo && (
            <Button className="flex-1" onClick={reintentarConsulta}>
              <RotateCcw size={16} /> Reintentar
            </Button>
          )}
        </div>
      </Modal>
    );
  }

  if (fase.tipo === "hecho") {
    const { titulo: t, texto } = resultadoCopy(fase.resultado, total);
    return (
      <Modal onClose={onClose} className="text-center">
        <IconCircle tone="success" className="mx-auto mb-4">
          <CheckCircle2 size={26} className="text-success-fg" />
        </IconCircle>
        <h2 className={`mb-2 ${titulo}`}>{t}</h2>
        <p className={`mb-6 ${lead}`}>{texto}</p>
        <div className="flex justify-center">
          <Button onClick={onClose}>Entendido</Button>
        </div>
      </Modal>
    );
  }

  const { condicion, error } = fase;
  const bloqueado = !!error && DEFINITIVO[error];

  return (
    <Modal onClose={onClose} dismissable={!cancelando}>
      <div className="flex items-start gap-3.5">
        <IconCircle tone="danger" className="shrink-0">
          <AlertTriangle size={24} className="text-danger-fg" />
        </IconCircle>
        <div className="min-w-0 flex-1">
          <h2 className={titulo}>¿Querés cancelar esta reserva?</h2>
          <p className={`mt-2 ${lead}`}>
            Vas a cancelar <strong className="text-fg-1">{reserva.actividad}</strong>
            {reserva.establecimiento && <> en <strong className="text-fg-1">{reserva.establecimiento}</strong></>}.
            Esta acción no se puede deshacer.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-1.5 rounded-md bg-cream-tert px-3.5 py-3 text-[13px] text-fg-2">
        {reserva.inicio && <div>{fmtDiaLocal(reserva.inicio)} · {fmtFranja(reserva.inicio, reserva.fin)}</div>}
        <div className="truncate font-mono">{reserva.id}</div>
      </div>

      <div className="mt-4">
        {condicion === "conReembolso" && (
          <Alert tone="success">Si cancelás ahora, te devolvemos el total de la reserva: {total}.</Alert>
        )}
        {condicion === "sinReembolso" && (
          <Alert tone="danger">
            <strong>Si cancelás ahora, no vas a recibir reembolso.</strong> Perdés los {total} que pagaste.
          </Alert>
        )}
        {condicion === "desconocida" && (
          <Alert tone="warning">No pudimos confirmar si te corresponde reembolso.</Alert>
        )}
      </div>

      {error && (
        <Alert tone="danger" className="mt-3">{MENSAJE_ERROR[error]}</Alert>
      )}

      <div className="mt-5 flex gap-3">
        <Button variant="neutral" className="flex-1" onClick={onClose} disabled={cancelando}>
          {bloqueado ? "Cerrar" : "No, volver"}
        </Button>
        {!bloqueado && (
          <Button variant="danger" className="flex-1" onClick={() => confirmar(condicion)} disabled={cancelando}>
            {cancelando
              ? <><Loader size={16} className="spin" /> Cancelando…</>
              : <><XCircle size={17} /> Sí, cancelar reserva</>}
          </Button>
        )}
      </div>
    </Modal>
  );
}
