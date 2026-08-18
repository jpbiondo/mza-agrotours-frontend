import type { ParamField, ParametroKey, Parametros } from "@/types/parametros";

/** Valores actuales de los parámetros (semilla). */
export const PARAM_SEED: Parametros = {
  logo: "/logo-mark.svg",
  nombre: "Mendoza AgroTours",
  moneda: "ARS ($)",
  cvu: "0000003100010000000001",
  diasFuturos: "90",
  diasReembolso: "7",
  ttlReserva: "30",
  comision: "12.5",
};

/** Identidad del administrador que reconfirma (sesión iniciada). */
export const PARAM_ADMIN = { nombre: "Diego Ferreyra", email: "diego.ferreyra@mendozaagrotours.gob.ar" };

export const PARAM_FIELDS: ParamField[] = [
  { key: "logo", group: "identidad", label: "Logo de la empresa", icon: "image", kind: "logo", hint: "Ruta o URL de la imagen. Entre 5 y 200 caracteres.", max: 200 },
  { key: "nombre", group: "identidad", label: "Nombre de la empresa", icon: "building-2", kind: "text", hint: "Entre 5 y 50 caracteres.", max: 50 },
  { key: "moneda", group: "finanzas", label: "Moneda", icon: "coins", kind: "text", hint: "Entre 1 y 20 caracteres.", max: 20 },
  { key: "cvu", group: "finanzas", label: "CVU", icon: "landmark", kind: "text", hint: "Cuenta para acreditar los pagos. Entre 5 y 50 caracteres.", max: 50, mono: true },
  { key: "comision", group: "finanzas", label: "Porcentaje de comisión", icon: "percent", kind: "float", hint: "Número positivo menor a 50.", unit: "%" },
  { key: "diasFuturos", group: "reglas", label: "Días futuros máximo de creación de actividad", icon: "calendar-plus", kind: "int", hint: "Entero positivo.", unit: "días" },
  { key: "diasReembolso", group: "reglas", label: "Días mínimos para reembolso", icon: "undo-2", kind: "int", hint: "Entero positivo.", unit: "días" },
  { key: "ttlReserva", group: "reglas", label: "TTL de la reserva", icon: "timer", kind: "int", hint: "Tiempo de vida de una reserva sin confirmar. Entero positivo.", unit: "minutos" },
];

export const PARAM_GROUPS: { id: "identidad" | "finanzas" | "reglas"; label: string; icon: string }[] = [
  { id: "identidad", label: "Identidad de la empresa", icon: "store" },
  { id: "finanzas", label: "Configuración financiera", icon: "wallet" },
  { id: "reglas", label: "Reglas de negocio", icon: "settings-2" },
];

/** Validación por campo. Devuelve "" si es válido. */
export function paramError(key: ParametroKey, raw: string): string {
  const v = (raw ?? "").trim();
  switch (key) {
    case "logo":
      if (!v) return "El campo no puede estar vacío.";
      if (v.length < 5) return "Debe tener al menos 5 caracteres.";
      if (v.length > 200) return "Puede tener como máximo 200 caracteres.";
      return "";
    case "nombre":
      if (!v) return "El campo no puede estar vacío.";
      if (v.length < 5) return "Debe tener al menos 5 caracteres.";
      if (v.length > 50) return "Puede tener como máximo 50 caracteres.";
      return "";
    case "moneda":
      if (!v) return "El campo no puede estar vacío.";
      if (v.length > 20) return "Puede tener como máximo 20 caracteres.";
      return "";
    case "cvu":
      if (!v) return "El campo no puede estar vacío.";
      if (v.length < 5) return "Debe tener al menos 5 caracteres.";
      if (v.length > 50) return "Puede tener como máximo 50 caracteres.";
      return "";
    case "diasFuturos":
    case "diasReembolso":
    case "ttlReserva":
      if (!v) return "El campo no puede estar vacío.";
      if (!/^\d+$/.test(v)) return "Ingresá un número entero.";
      if (Number(v) <= 0) return "Debe ser un entero positivo.";
      return "";
    case "comision": {
      if (!v) return "El campo no puede estar vacío.";
      if (!/^\d+([.,]\d+)?$/.test(v)) return "Ingresá un número válido.";
      const n = Number(v.replace(",", "."));
      if (n <= 0) return "Debe ser un número positivo.";
      if (n >= 50) return "Debe ser menor a 50.";
      return "";
    }
    default:
      return "";
  }
}

/** Formato de presentación en modo lectura. */
export function paramDisplay(key: ParametroKey, v: string): string {
  if (key === "comision") return `${v} %`;
  if (key === "diasFuturos" || key === "diasReembolso") return `${v} días`;
  if (key === "ttlReserva") return `${v} minutos`;
  return v;
}
