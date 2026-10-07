"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Loader,
  RotateCcw,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { Alert, Button, IconCircle, Modal } from "@/components/ui";
import { TextField } from "@/components/ui/text-field";
import {
  useCondicionesBaja,
  useEliminarEstablecimiento,
} from "@/hooks/useEstablecimientoDatos";
import type { CondicionBaja } from "@/types/datos";

/**
 * `verificando` → el backend decide; `bloqueado` lista lo que falta cumplir y
 * `confirmar` pide escribir ELIMINAR. `errorVerificacion` es un fallo técnico
 * del chequeo: no sabemos si se puede dar de baja, así que no se ofrece seguir.
 */
type Paso = "verificando" | "bloqueado" | "confirmar" | "errorVerificacion";

function mensajeBaja(code?: string): string {
  // TODO backend: mapear los códigos de dominio del DELETE cuando existan.
  return code
    ? "No se pudo eliminar el establecimiento."
    : "No se pudo eliminar el establecimiento. Probá de nuevo en unos minutos.";
}

/** Fila de una condición incumplida. Siempre en rojo: son las que faltan. */
function CondicionRow({ nombre, descripcion }: CondicionBaja) {
  return (
    <li className="flex gap-3 rounded-md border border-danger bg-danger-fill px-3.5 py-3">
      <span className="mt-px flex size-[22px] shrink-0 items-center justify-center rounded-full bg-danger">
        <X className="size-3.5 text-white" />
      </span>
      <div className="min-w-0">
        <div className="text-sm leading-tight font-semibold text-danger-fg">
          {nombre}
        </div>
        <div className="mt-[3px] text-[13px] leading-normal text-fg-2">
          {descripcion}
        </div>
      </div>
    </li>
  );
}

export default function EliminarEstablecimientoFlow({
  id,
  nombre,
  onCancel,
  onEliminado,
}: {
  id: string;
  nombre: string;
  onCancel: () => void;
  onEliminado: () => void;
}) {
  const [paso, setPaso] = useState<Paso>("verificando");
  const [condiciones, setCondiciones] = useState<CondicionBaja[]>([]);
  const [texto, setTexto] = useState("");
  const [errorBaja, setErrorBaja] = useState<string | null>(null);
  const { verificar } = useCondicionesBaja();
  const { eliminar, isLoading: eliminando } = useEliminarEstablecimiento();

  // El envelope viene `ok` aunque la baja no se pueda hacer: lo que bloquea es
  // que `data` traiga condiciones incumplidas. Sin `ok` es un fallo.
  function aplicar(res: { ok: boolean; condiciones: CondicionBaja[] }) {
    if (!res.ok) {
      setPaso("errorVerificacion");
      return;
    }
    setCondiciones(res.condiciones);
    setPaso(res.condiciones.length > 0 ? "bloqueado" : "confirmar");
  }

  // Al abrir, el backend decide si el establecimiento puede darse de baja.
  useEffect(() => {
    let active = true;
    verificar(id)
      .then((res) => {
        if (active) aplicar(res);
      })
      .catch(() => {
        if (active) setPaso("errorVerificacion");
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function reintentar() {
    setPaso("verificando");
    verificar(id)
      .then(aplicar)
      .catch(() => setPaso("errorVerificacion"));
  }

  async function confirmar() {
    setErrorBaja(null);
    const res = await eliminar(id);
    if (!res.ok) {
      setErrorBaja(mensajeBaja(res.code));
      return;
    }
    onEliminado();
  }

  if (paso === "verificando") {
    return (
      <Modal dismissable={false} padding="px-7 py-10" className="text-center">
        <Loader className="spin mx-auto mb-4.5 block size-[46px] text-green-800" />
        <div className="font-display text-[18px] font-semibold text-fg-1">
          Verificando condiciones…
        </div>
        <div className="mt-1.5 text-[13.5px] text-fg-2">
          Estamos comprobando si el establecimiento puede darse de baja.
        </div>
      </Modal>
    );
  }

  if (paso === "bloqueado") {
    const varias = condiciones.length > 1;
    return (
      <Modal onClose={onCancel}>
        <div className="flex items-center gap-3.5">
          <IconCircle tone="danger">
            <ShieldAlert className="size-[22px] text-danger-fg" />
          </IconCircle>
          <h3 className="font-display text-[19px] font-semibold text-fg-1">
            Todavía no podés eliminar el establecimiento
          </h3>
        </div>

        <p className="mt-4 text-[14.5px] leading-relaxed text-fg-2">
          Para dar de baja{" "}
          <strong className="text-fg-1">{nombre}</strong>, primero{" "}
          {varias
            ? "tenés que cumplir con estas condiciones:"
            : "tenés que cumplir con la siguiente condición:"}
        </p>

        {/* Se listan todas, no sólo la primera: si no, se resuelve una y se
            vuelve a chocar con la siguiente. */}
        <ul className="mt-4 flex list-none flex-col gap-2.5 p-0">
          {condiciones.map((c) => (
            <CondicionRow
              key={c.nombre}
              nombre={c.nombre}
              descripcion={c.descripcion}
            />
          ))}
        </ul>

        <div className="mt-6 flex justify-end">
          <Button onClick={onCancel}>
            <ArrowLeft className="size-4" /> Entendido
          </Button>
        </div>
      </Modal>
    );
  }

  if (paso === "errorVerificacion") {
    return (
      <Modal onClose={onCancel}>
        <div className="flex items-center gap-3.5">
          <IconCircle tone="danger">
            <AlertTriangle className="size-[22px] text-danger-fg" />
          </IconCircle>
          <h3 className="font-display text-[19px] font-semibold text-fg-1">
            No pudimos verificar las condiciones
          </h3>
        </div>

        <p className="mt-4 text-[14.5px] leading-relaxed text-fg-2">
          El establecimiento sigue activo. Probá de nuevo en unos minutos.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>
            Cerrar
          </Button>
          <Button onClick={reintentar}>
            <RotateCcw className="size-4" /> Reintentar
          </Button>
        </div>
      </Modal>
    );
  }

  const confirmado = texto.trim().toUpperCase() === "ELIMINAR";

  return (
    <Modal onClose={onCancel} dismissable={!eliminando}>
      <div className="flex items-center gap-3.5">
        <IconCircle tone="danger">
          <AlertTriangle className="size-[22px] text-danger-fg" />
        </IconCircle>
        <h3 className="font-display text-[19px] font-semibold text-fg-1">
          Eliminar establecimiento
        </h3>
      </div>

      <p className="mt-4 text-[14.5px] leading-relaxed text-fg-2">
        Vas a eliminar <strong className="text-fg-1">{nombre}</strong>. Se dan de
        baja sus actividades, cultivos y datos asociados. Esta acción no se puede
        deshacer.
      </p>

      <div className="field mt-4">
        <label
          htmlFor="confirmar-baja"
          className="text-[13.5px] font-semibold text-fg-1"
        >
          Escribí <span className="font-mono text-danger-fg">ELIMINAR</span> para
          confirmar
        </label>
        <TextField
          id="confirmar-baja"
          value={texto}
          onChange={setTexto}
          placeholder="ELIMINAR"
        />
      </div>

      {errorBaja && <Alert className="mt-4">{errorBaja}</Alert>}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel} disabled={eliminando}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          onClick={confirmar}
          disabled={!confirmado || eliminando}
        >
          {eliminando ? (
            <Loader className="spin size-[17px]" />
          ) : (
            <Trash2 className="size-[17px]" />
          )}
          Eliminar establecimiento
        </Button>
      </div>
    </Modal>
  );
}
