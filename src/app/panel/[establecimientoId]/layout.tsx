import type { ReactNode } from "react";
import GuardEstablecimientoUrl from "@/components/panel/GuardEstablecimientoUrl";

/** Todo lo que cuelga de un establecimiento: primero se valida que sea de la cuenta. */
export default function EstablecimientoLayout({ children }: { children: ReactNode }) {
  return <GuardEstablecimientoUrl>{children}</GuardEstablecimientoUrl>;
}
