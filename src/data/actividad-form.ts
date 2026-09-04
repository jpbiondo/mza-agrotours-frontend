import type { LimitesUploader } from "@/components/ui/uploader";
import type { ActividadFormData, DiaKey, TarifaFila } from "@/types/actividad-form";

/* ---- Fotos de la actividad -----------------------------------------------
   A diferencia de las pruebas documentales, acá no entra el PDF y el tope es
   por imagen, no sobre la suma. */

export const FOTOS_MAX = 10;
export const FOTO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB por imagen

export const UPLOAD_FOTOS: LimitesUploader = {
  maxFiles: FOTOS_MAX,
  maxBytesPorArchivo: FOTO_MAX_BYTES,
  accept: "image/jpeg,image/png",
  acceptLabel: "JPG o PNG",
  extensiones: ["jpg", "jpeg", "png"],
  mimes: ["image/jpeg", "image/png"],
};

export const DIAS: { key: DiaKey; label: string }[] = [
  { key: "lunes", label: "Lunes" },
  { key: "martes", label: "Martes" },
  { key: "miercoles", label: "Miércoles" },
  { key: "jueves", label: "Jueves" },
  { key: "viernes", label: "Viernes" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

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
