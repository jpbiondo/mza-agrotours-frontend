export type DiaKey = "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo";

export interface AgeTier {
  on: boolean;
  price: string;
}

export interface DiaCfg {
  on: boolean;
  desde: string;
  hasta: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface ActividadFormData {
  nombre: string;
  descripcion: string;
  cupos: string;
  cultivos: string[];
  ages: { infantes: AgeTier; menores: AgeTier; adultos: AgeTier };
  days: Record<DiaKey, DiaCfg>;
  fechaDesde: string;
  fechaHasta: string;
  incluye: string[];
  noIncluye: string[];
  faqs: FaqItem[];
}
