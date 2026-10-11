import type { Metadata } from "next";
import ProductoresClient from "./ProductoresClient";

export const metadata: Metadata = {
  title: "Productores · Panel del productor · Mendoza AgroTours",
  description:
    "Sumá a las personas que trabajan en la finca, asignales un rol y gestioná sus suspensiones.",
};

/**
 * El layout de /panel ya exige el rol de productor. El permiso de lectura
 * (LEER_PRODUCTOR) lo chequea el cliente: vale por establecimiento y el activo
 * lo elige el switcher del shell.
 */
export default function ProductoresPage() {
  return <ProductoresClient />;
}
