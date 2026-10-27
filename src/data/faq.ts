import type { FaqCategoria } from "@/types/catalogo";

/** Categorías de la base de conocimiento. (`todas` es solo filtro). */
export const FAQ_CATEGORIAS: FaqCategoria[] = [
  { id: "todas", label: "Todas", icon: "layout-grid" },
  { id: "general", label: "Generales", icon: "info" },
  { id: "reservas", label: "Reservas", icon: "calendar-check" },
  { id: "cuenta", label: "Cuenta y acceso", icon: "user-round" },
  { id: "productores", label: "Productores", icon: "tractor" },
  { id: "pagos", label: "Pagos", icon: "wallet" },
];
