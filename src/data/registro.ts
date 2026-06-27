import type { FormData } from "@/types/registro";

export const PAISES = [
  { code: "ar", name: "Argentina" },
  { code: "de", name: "Alemania" },
  { code: "au", name: "Australia" },
  { code: "bo", name: "Bolivia" },
  { code: "br", name: "Brasil" },
  { code: "ca", name: "Canadá" },
  { code: "cl", name: "Chile" },
  { code: "cn", name: "China" },
  { code: "co", name: "Colombia" },
  { code: "cr", name: "Costa Rica" },
  { code: "cu", name: "Cuba" },
  { code: "ec", name: "Ecuador" },
  { code: "es", name: "España" },
  { code: "us", name: "Estados Unidos" },
  { code: "fr", name: "Francia" },
  { code: "it", name: "Italia" },
  { code: "jp", name: "Japón" },
  { code: "mx", name: "México" },
  { code: "nz", name: "Nueva Zelanda" },
  { code: "py", name: "Paraguay" },
  { code: "pe", name: "Perú" },
  { code: "pt", name: "Portugal" },
  { code: "gb", name: "Reino Unido" },
  { code: "uy", name: "Uruguay" },
  { code: "ve", name: "Venezuela" },
] as const;

export type Pais = (typeof PAISES)[number];

export const TIPOS_IDENTIFICACION = ["DNI", "Pasaporte", "Otro"] as const;

export const EMAILS_REGISTRADOS = [
  "camila.rios@gmail.com",
  "productor@fincalaescondida.com.ar",
  "admin@mendozaagrotours.com",
  "juan.perez@hotmail.com",
];

export const EMPTY_FORM: FormData = {
  nombre: "",
  email: "",
  pais: "",
  fecha: null,
  tipoId: "",
  numeroId: "",
  telefono: "",
  password: "",
  confirm: "",
  terminos: false,
};
