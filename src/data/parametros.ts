import type { ParamField } from "@/types/parametros";

export const PARAM_FIELDS: ParamField[] = [
  { key: "comision", group: "finanzas", label: "Porcentaje de comisión", icon: "percent", kind: "percent", hint: "Lo que retiene la plataforma de cada reserva. Entre 0 y 100, con hasta 2 decimales.", unit: "%" },
  { key: "diasMaxActividad", group: "reglas", label: "Días futuros máximos para crear una actividad", icon: "calendar-plus", kind: "int", hint: "Con cuánta anticipación se puede programar una actividad. Entero positivo.", unit: "días" },
  { key: "diasMinReembolso", group: "reglas", label: "Días mínimos para reembolso", icon: "undo-2", kind: "int", hint: "Días antes de la actividad hasta los que una cancelación se reembolsa. Entero, puede ser 0.", unit: "días" },
  { key: "ttlReserva", group: "reglas", label: "TTL de la reserva", icon: "timer", kind: "int", hint: "Cuánto queda retenido el cupo de una reserva sin pagar antes de vencer. Entero positivo.", unit: "minutos" },
  { key: "diasImpago", group: "reglas", label: "Días para reembolso impago", icon: "hand-coins", kind: "int", hint: "Días que tiene el productor para pagar un reembolso antes de que pase a impago y lo cubra un administrador. Entero positivo.", unit: "días" },
  { key: "cantidadFicticias", group: "ranking", label: "Cantidad de calificaciones ficticias", icon: "users", kind: "int", hint: "Cuántas calificaciones imaginarias suma cada actividad y establecimiento al calcular su promedio para los destacados (C). Cuanto más alto, más reseñas reales hacen falta para destacar. Entero positivo.", unit: "calificaciones" },
  { key: "usarPromedioGlobal", group: "ranking", label: "Usar el promedio global como puntaje ficticio", icon: "globe", kind: "flag", hint: "Si está activo, las calificaciones ficticias valen el promedio de todas las calificaciones del sistema, y el puntaje de abajo no se usa." },
  { key: "puntajeFicticio", group: "ranking", label: "Puntaje de las calificaciones ficticias", icon: "star", kind: "decimal", hint: "Cuánto vale cada calificación ficticia (m). Mayor a 0 y hasta 5, con hasta 2 decimales.", unit: "estrellas" },
];

export const PARAM_GROUPS: { id: ParamField["group"]; label: string; icon: string }[] = [
  { id: "finanzas", label: "Configuración financiera", icon: "wallet" },
  { id: "reglas", label: "Reglas de negocio", icon: "settings-2" },
  { id: "ranking", label: "Ranking de destacados", icon: "trophy" },
];
