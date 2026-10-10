import type { Metadata } from "next";
import RolesClient from "./RolesClient";

export const metadata: Metadata = {
  title: "Roles y permisos · Panel del productor · Mendoza AgroTours",
  description: "Creá roles para tu personal y definí qué puede hacer cada uno en la finca.",
};

/**
 * El layout de /panel ya exige el rol de productor. El permiso de lectura
 * (LEER_ROLES_PRODUCTOR) lo chequea el cliente: vale por establecimiento y el
 * activo lo elige el switcher del shell.
 */
export default function RolesPage() {
  return <RolesClient />;
}
