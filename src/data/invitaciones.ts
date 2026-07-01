import type { Invitacion } from "@/types/invitaciones";

/** Invitaciones a gestionar un establecimiento (llegan por correo). */
export const INVITACIONES: Invitacion[] = [
  {
    id: "inv-2k9f",
    finca: "Finca La Escondida",
    fincaId: "escondida",
    location: "Luján de Cuyo, Mendoza",
    rol: "Productor",
    rolDesc: "Vas a poder cargar y editar experiencias, gestionar las reservas recibidas y el cronograma de cultivos de la finca.",
    invitedBy: "Lucía Funes",
    invitedByRole: "Productora líder",
    sentAt: "28/06/2026 · 14:20",
    email: "camila.rios@gmail.com",
    seed: 3,
    estado: "pendiente",
  },
  {
    id: "inv-7b2l",
    finca: "Bodega Viento Sur",
    fincaId: "vientosur",
    location: "Valle de Uco, Tunuyán",
    rol: "Encargado de reservas",
    rolDesc: "Vas a poder ver y confirmar las reservas recibidas, sin editar las experiencias ni los datos del establecimiento.",
    invitedBy: "Martín Olguín",
    invitedByRole: "Productor líder",
    sentAt: "26/06/2026 · 09:05",
    email: "camila.rios@gmail.com",
    seed: 5,
    estado: "pendiente",
  },
];

/** Iniciales de la finca (descarta palabras genéricas). */
export function fincaInitials(nombre: string): string {
  const skip = new Set(["finca", "bodega", "la", "de", "los", "del", "el", "las"]);
  return nombre.split(/\s+/).filter((w) => !skip.has(w.toLowerCase())).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
