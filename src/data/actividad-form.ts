import type { ActividadFormData, DiaKey, TarifaFila } from "@/types/actividad-form";
import { getActividad } from "@/data/actividades-prod";

export const DIAS: { key: DiaKey; label: string }[] = [
  { key: "lunes", label: "Lunes" },
  { key: "martes", label: "Martes" },
  { key: "miercoles", label: "Miércoles" },
  { key: "jueves", label: "Jueves" },
  { key: "viernes", label: "Viernes" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

const LABEL_TO_KEY: Record<string, DiaKey> = {
  Lunes: "lunes", Martes: "martes", Miércoles: "miercoles", Jueves: "jueves",
  Viernes: "viernes", Sábado: "sabado", Domingo: "domingo",
};

function emptyDays(): Record<DiaKey, { on: boolean; desde: string; hasta: string }> {
  return DIAS.reduce((acc, d) => { acc[d.key] = { on: false, desde: "", hasta: "" }; return acc; }, {} as Record<DiaKey, { on: boolean; desde: string; hasta: string }>);
}

/**
 * Plantilla de rangos etarios: son sugerencias, no tramos fijos. El productor
 * las renombra, les cambia las edades, agrega o borra.
 *
 * Los ids son fijos y no aleatorios porque el formulario se arma en el server
 * component y viaja serializado: un id nuevo por render cambiaría el payload
 * en cada build sin necesidad. Las filas que agrega el usuario sí se generan
 * al vuelo, ya en el cliente.
 */
export function tarifasIniciales(): TarifaFila[] {
  return [
    { id: "tpl-infantes", nombre: "Infantes", min: "0", max: "2", precio: "", on: false, base: false },
    { id: "tpl-menores", nombre: "Menores", min: "3", max: "17", precio: "", on: false, base: false },
    // Adultos arranca marcada y como base: es el caso de siempre, y así una
    // actividad recién abierta no debe una tarifa base desde el vamos.
    { id: "tpl-adultos", nombre: "Adultos", min: "18", max: "120", precio: "", on: true, base: true },
  ];
}

/** Estado inicial vacío para crear una actividad. */
export function emptyActividadForm(): ActividadFormData {
  return {
    nombre: "",
    descripcion: "",
    cupos: "",
    cultivos: [],
    tarifas: tarifasIniciales(),
    days: emptyDays(),
    fechaDesde: "",
    fechaHasta: "",
    incluye: [""],
    noIncluye: [""],
    faqs: [{ q: "", a: "" }],
  };
}

/** Hidrata el formulario con los datos de una actividad existente (modo editar). */
export function hydrateActividadForm(id: string): ActividadFormData | null {
  const act = getActividad(id);
  if (!act) return null;

  const base = emptyActividadForm();
  act.dias.forEach((d) => {
    const k = LABEL_TO_KEY[d.dia];
    if (k) base.days[k] = { on: true, desde: d.desde, hasta: d.hasta };
  });

  return {
    ...base,
    nombre: act.nombre,
    descripcion: `Viví una experiencia auténtica en Finca La Escondida: «${act.nombre}». Te acompañamos entre las hileras para conocer de cerca el trabajo de la tierra, la familia productora y los sabores de la finca.`,
    cupos: "20",
    // `cultivos` pasó a ser una lista de ids del catálogo, y el mock sólo tiene
    // nombres: metiéndolos acá el formulario mostraría chips con el nombre como
    // id y mandaría basura al guardar. Queda vacío hasta que se wiree el
    // modificar, que va a traer los ids del backend.
    cultivos: [],
    tarifas: [
      { id: "tpl-menores", nombre: "Menores", min: "3", max: "17", precio: String(Math.round(act.precio * 0.6)), on: true, base: false },
      { id: "tpl-adultos", nombre: "Adultos", min: "18", max: "120", precio: String(act.precio), on: true, base: true },
    ],
    incluye: ["Degustación de productos de la finca", "Guía especializada durante toda la experiencia"],
    noIncluye: ["Traslado hasta el establecimiento"],
    faqs: [
      { q: "¿Necesito llevar algo en particular?", a: "Recomendamos calzado cómodo, gorro y protector solar." },
      { q: "¿Es apta para toda la familia?", a: "Sí, podés sumar menores indicando su rango etario al reservar." },
    ],
  };
}
