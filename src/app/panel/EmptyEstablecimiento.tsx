import Link from "next/link";
import { Sprout, PlusCircle } from "lucide-react";
import ProducerPanelShell from "@/components/panel/ProducerPanelShell";

/** Estado vacío del panel: el productor todavía no tiene un establecimiento. */
export default function EmptyEstablecimiento() {
  return (
    <ProducerPanelShell fincas={[]}>
      <div className="mx-auto flex max-w-[640px] flex-col items-center px-7 pt-16 pb-24 text-center">
        <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-green-050">
          <Sprout className="size-9 text-green-800" />
        </div>
        <h1 className="font-display text-[30px] font-bold tracking-[-.01em] text-fg-1">
          Todavía no tenés un establecimiento
        </h1>
        <p className="mt-3 max-w-[480px] text-[15.5px] leading-relaxed text-fg-2">
          Para publicar experiencias agroturísticas necesitás dar de alta tu finca o bodega.
          Solicitá el alta y un administrador verificará tu documentación.
        </p>
        <Link
          href="/panel/establecimientos/solicitar"
          className="btn btn-primary btn-lg mt-7 inline-flex"
        >
          <PlusCircle className="size-[18px]" /> Solicitar alta de un establecimiento
        </Link>
      </div>
    </ProducerPanelShell>
  );
}
