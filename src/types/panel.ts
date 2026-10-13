/** Lo que el inicio del panel marca para resolver en el establecimiento activo. */
export interface PendientesPanel {
  /** Reembolsos que Mercado Pago no pudo hacer y esperan al productor. */
  reembolsos: number;
  /** Cuándo se pidió el más antiguo; `null` sin reembolsos pendientes. */
  reembolsoMasAntiguo: Date | null;
  /** Actividades en borrador (sin contar las dadas de baja). */
  borradores: number;
  mercadoPagoVinculado: boolean;
  /** Vencimiento del token de la cuenta vinculada; `null` sin cuenta. */
  mercadoPagoTokenExpira: Date | null;
}

export interface ReservaProxima {
  id: string;
  actividadId: string;
  actividadDiaId: string;
  inicio: Date | null;
  actividad: string;
  visitante: string;
  personas: number;
}

/** Reservas de un mismo día, ya ordenadas por hora. */
export interface DiaReservas {
  /** "AAAA-MM-DD". */
  fecha: string;
  reservas: ReservaProxima[];
}

export interface ReseniaReciente {
  puntaje: number;
  texto: string;
  fecha: Date | null;
  visitante: string;
  actividad: string;
}

export interface ReseniasPanel {
  /** `null` si todavía no hay reseñas. */
  promedio: number | null;
  total: number;
  ultimas: ReseniaReciente[];
}

export interface ResumenPanel {
  pendientes: PendientesPanel;
  /** Próximos 3 días; sólo los días que tienen reservas. */
  proximas: DiaReservas[];
  resenias: ReseniasPanel;
}
