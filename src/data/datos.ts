import type { CultivoCat, EstablecimientoDatos } from "@/types/datos";

export const FINCA_DATOS: EstablecimientoDatos = {
  nombre: "Finca La Escondida",
  cuit: "30-71845239-4",
  razonSocial: "La Escondida S.R.L.",
  descripcion:
    "Finca familiar de cuarta generación, ubicada en los cordones del Valle de Uco. " +
    "Ofrecemos experiencias de cosecha, poda y degustación de Malbec y Bonarda, con " +
    "almuerzos preparados con productos de la huerta y carnes de la zona.",
  calle: "Ruta Provincial 89, km 14,5",
  localidad: "Tupungato",
  provincia: "Mendoza",
  telefono: "+54 9 261 555-1247",
  email: "hola@fincalaescondida.com.ar",
  cvu: "0000003100029723578291",
  cultivos: ["uva-malbec", "aceituna-arauco", "durazno", "ciruela"],
};

/** Catálogo de cultivos para asociar. `actividades` > 0 ⇒ no se puede quitar de la finca. */
export const CATALOGO_CULTIVOS: CultivoCat[] = [
  { id: "uva-malbec", nombre: "Uva Malbec", actividades: 2 },
  { id: "aceituna-arauco", nombre: "Aceituna Arauco", actividades: 1 },
  { id: "durazno", nombre: "Durazno", actividades: 1 },
  { id: "ciruela", nombre: "Ciruela D'Agen", actividades: 0 },
  { id: "nuez", nombre: "Nuez Chandler", actividades: 0 },
  { id: "ajo-morado", nombre: "Ajo morado", actividades: 0 },
  { id: "pera", nombre: "Pera Williams", actividades: 0 },
  { id: "manzana", nombre: "Manzana Roja", actividades: 0 },
  { id: "cereza", nombre: "Cereza", actividades: 0 },
  { id: "tomate", nombre: "Tomate Perita", actividades: 0 },
  { id: "membrillo", nombre: "Membrillo", actividades: 0 },
  { id: "almendra", nombre: "Almendra", actividades: 0 },
];

export function findCultivoCat(id: string): CultivoCat | undefined {
  return CATALOGO_CULTIVOS.find((c) => c.id === id);
}

/* ---- Validaciones ------------------------------------------------------ */
export function validarDescripcion(v: string): string | null {
  if (v.length > 2000) return "La descripción no puede superar los 2000 caracteres.";
  return null;
}

export function validarTelefono(v: string): string | null {
  const t = v.trim();
  if (!t) return "El teléfono no puede estar vacío.";
  if (t.length < 7) return "El teléfono debe tener al menos 7 caracteres.";
  if (t.length > 16) return "El teléfono no puede superar los 16 caracteres.";
  return null;
}

export function validarEmail(v: string): string | null {
  const t = v.trim();
  if (!t) return "El email no puede estar vacío.";
  if (t.length > 100) return "El email no puede superar los 100 caracteres.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return "Ingresá un email válido.";
  return null;
}
