import { notFound } from "next/navigation";

/**
 * Atrapa toda URL de /admin que no es una pantalla. Sin esto Next la manda al
 * `not-found` raíz, con la navbar del sitio; así cae en `admin/not-found.tsx`,
 * dentro del shell y del guard del layout.
 */
export default function AdminRutaInexistente() {
  notFound();
}
