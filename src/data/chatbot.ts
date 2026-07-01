export interface Manual {
  id: string;
  titulo: string;
  desc: string;
  icon: string;
  file: string;
  nombreArchivo: string;
  peso: string;
  paginas: number;
}

export interface MenuOpcion {
  id: string;
  label: string;
  icon: string;
  desc?: string;
}

export const MANUALES: Manual[] = [
  { id: "visitante", titulo: "Manual del visitante", desc: "Descubrir, reservar y vivir experiencias.", icon: "compass", file: "/manuales/Manual del visitante.pdf", nombreArchivo: "Manual del visitante.pdf", peso: "0,9 MB", paginas: 6 },
  { id: "productor", titulo: "Manual del productor", desc: "Gestionar tu finca, experiencias y reservas.", icon: "tractor", file: "/manuales/Manual del productor.pdf", nombreArchivo: "Manual del productor.pdf", peso: "1,0 MB", paginas: 6 },
];

export const MENU_PRINCIPAL: MenuOpcion[] = [
  { id: "manuales", label: "Manuales de usuario", icon: "book-open", desc: "Consultá las guías en PDF" },
  { id: "reservas", label: "Ayuda con reservas", icon: "calendar-check", desc: "Estados, cancelaciones y pagos" },
  { id: "cuenta", label: "Mi cuenta", icon: "user-round", desc: "Datos, contraseña y seguridad" },
  { id: "soporte", label: "Hablar con soporte", icon: "headset", desc: "Te contactamos por correo" },
];
