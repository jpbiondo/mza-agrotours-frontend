import { DIAS } from "@/data/actividad-form";
import type { ActividadFormData, TarifaFila } from "@/types/actividad-form";

/**
 * Validaciones del formulario de actividad. Son funciones puras y sin React a
 * propósito: el formulario las corre en cada tecla para pintar los errores, y
 * el submit las vuelve a correr sobre el estado del momento para decidir si
 * manda. Con un solo lugar donde vive la regla, las dos pasadas no se pueden
 * ir de sincronía.
 *
 * Las claves de error son planas (`nombre`, `tar_<id>_min`, `day_lunes`) porque
 * cada campo pregunta por la suya y `pasoDelError` sabe volver del error al
 * paso del asistente donde vive ese campo.
 */
export type ErroresActividad = Record<string, string>;

export const EDAD_MIN = 0;
export const EDAD_MAX = 120;
/** Tope de la vigencia, contado desde hoy. */
export const DIAS_VIGENCIA_MAX = 120;

const REQUERIDO = "Este campo es requerido";
const BASE_DUPLICADA = "No puedes tener más de una tarifa base en la misma actividad.";

const edadOk = (v: string) => /^[0-9]{1,3}$/.test(v) && +v >= EDAD_MIN && +v <= EDAD_MAX;
const precioOk = (v: string) => /^[0-9]+$/.test(v);
const enteroPositivo = (v: string) => /^[0-9]+$/.test(v) && parseInt(v, 10) > 0;

/** Sólo dígitos, para los campos numéricos. */
export const soloDigitos = (s: string) => s.replace(/[^0-9]/g, "");
/** Los ítems y las FAQ aceptan texto, no números. */
export const soloTexto = (s: string) => s.replace(/[0-9]/g, "");

let secuencia = 0;
/** Fila nueva, siempre desde el cliente (el usuario apretó "Agregar rango"). */
export function nuevaTarifa(): TarifaFila {
  secuencia += 1;
  return { id: `tar-${secuencia}-${Math.random().toString(36).slice(2, 6)}`, nombre: "", min: "", max: "", precio: "", on: true, base: false };
}

/* ---- Tarifas -------------------------------------------------------------
   Se validan aparte porque el solapamiento, los nombres repetidos y la base
   duplicada bloquean el guardado y se muestran en vivo, sin esperar al submit. */

export function erroresDeTarifas(filas: TarifaFila[]): ErroresActividad {
  const e: ErroresActividad = {};
  const activas = filas.filter((r) => r.on);

  if (activas.length === 0) e.tarNone = "Es obligatorio configurar al menos un rango etario.";

  activas.forEach((r) => {
    if (!r.nombre.trim()) e[`tar_${r.id}_nombre`] = REQUERIDO;
    if (!precioOk(r.precio)) e[`tar_${r.id}_precio`] = r.precio === "" ? REQUERIDO : "Ingresá un monto válido";
    if (!edadOk(r.min)) e[`tar_${r.id}_min`] = r.min === "" ? REQUERIDO : `Ingresá un número entero entre ${EDAD_MIN} y ${EDAD_MAX}`;
    if (!edadOk(r.max)) e[`tar_${r.id}_max`] = r.max === "" ? REQUERIDO : `Ingresá un número entero entre ${EDAD_MIN} y ${EDAD_MAX}`;
    if (edadOk(r.min) && edadOk(r.max) && +r.min > +r.max) {
      e[`tar_${r.id}_orden`] = "La edad mínima no puede ser mayor a la edad máxima.";
    }
  });

  const bases = activas.filter((r) => r.base);
  if (bases.length === 0) e.tarBase = "Es obligatorio marcar un rango etario como tarifa base.";
  else if (bases.length > 1) e.tarBase = BASE_DUPLICADA;

  const vistos = new Map<string, string>();
  activas.forEach((r) => {
    const k = r.nombre.trim().toLowerCase();
    if (!k) return;
    const previo = vistos.get(k);
    if (previo) {
      e.tarDup = "No puedes registrar más de una tarifa con el mismo nombre.";
      e[`tar_${r.id}_dup`] = e.tarDup;
      e[`tar_${previo}_dup`] = e.tarDup;
    }
    vistos.set(k, r.id);
  });

  // Solapamiento: se reporta el primer par que se pisa y se corta. Listar todos
  // los pares no ayuda —arreglado el primero, los demás se recalculan— y sí
  // llenaría la pantalla de mensajes.
  const validas = activas.filter((r) => edadOk(r.min) && edadOk(r.max) && +r.min <= +r.max);
  for (let i = 0; i < validas.length; i++) {
    for (let j = i + 1; j < validas.length; j++) {
      const a = validas[i], b = validas[j];
      if (+a.min <= +b.max && +b.min <= +a.max) {
        const msg = `Solapamiento detectado: el rango ${a.nombre.trim() || "sin nombre"} tiene solapamiento de edades con el rango ${b.nombre.trim() || "sin nombre"}.`;
        e.tarOverlap = msg;
        e[`tar_${a.id}_overlap`] = msg;
        e[`tar_${b.id}_overlap`] = msg;
        return e;
      }
    }
  }
  return e;
}

/**
 * Los errores de tarifas que impiden guardar aunque el resto esté completo.
 * No son "campos faltantes" sino configuraciones contradictorias, así que se
 * muestran apenas ocurren y deshabilitan el botón.
 */
export function bloqueoDeTarifas(e: ErroresActividad): string | null {
  return e.tarOverlap || e.tarDup || (e.tarBase === BASE_DUPLICADA ? e.tarBase : null) || null;
}

/** Edades entre 0 y 120 que ningún rango cubre. Es un aviso, no un error. */
export function huecosDeEdad(filas: TarifaFila[]): string[] {
  const rangos = filas
    .filter((r) => r.on && edadOk(r.min) && edadOk(r.max) && +r.min <= +r.max)
    .map((r) => [+r.min, +r.max] as const)
    .sort((a, b) => a[0] - b[0]);

  const huecos: [number, number][] = [];
  let cursor = EDAD_MIN;
  rangos.forEach(([desde, hasta]) => {
    if (desde > cursor) huecos.push([cursor, desde - 1]);
    cursor = Math.max(cursor, hasta + 1);
  });
  if (cursor <= EDAD_MAX) huecos.push([cursor, EDAD_MAX]);

  return huecos.map(([a, b]) => (a === b ? `${a} años` : `${a} a ${b} años`));
}

/* ---- Formulario completo ------------------------------------------------- */

export function erroresDeActividad(v: ActividadFormData): ErroresActividad {
  const e: ErroresActividad = {};

  const nombre = v.nombre.trim();
  if (!nombre) e.nombre = "El nombre es requerido";
  else if (nombre.length < 5) e.nombre = "Debe tener al menos 5 caracteres";

  const desc = v.descripcion.trim();
  if (!desc) e.descripcion = "La descripción es requerida";
  else if (desc.length < 20) e.descripcion = "Debe tener al menos 20 caracteres";

  if (!v.cupos) e.cupos = "Este campo es obligatorio";
  else if (!enteroPositivo(v.cupos)) e.cupos = "El valor debe ser mayor a 0";

  if (v.cultivos.length === 0) e.cultivos = "El tipo de cultivo es requerido";

  Object.assign(e, erroresDeTarifas(v.tarifas));

  const elegidos = DIAS.filter((d) => v.days[d.key].on);
  if (elegidos.length === 0) e.diasNone = "Debe seleccionar y configurar al menos un día de la semana para la actividad";
  elegidos.forEach((d) => {
    const fila = v.days[d.key];
    if (!fila.desde || !fila.hasta) e[`day_${d.key}`] = "horario";
    else if (fila.hasta <= fila.desde) e[`day_${d.key}`] = "orden";
  });
  if (elegidos.some((d) => e[`day_${d.key}`] === "horario")) e.diasHoras = "Debe ingresar los horarios para los días seleccionados";
  if (elegidos.some((d) => e[`day_${d.key}`] === "orden")) e.diasOrden = "La hora de fin debe ser posterior a la de inicio";

  if (!v.fechaDesde) e.fechaDesde = "La fecha desde es requerida";
  if (!v.fechaHasta) e.fechaHasta = "La fecha hasta es requerida";
  else if (v.fechaDesde && v.fechaHasta < v.fechaDesde) e.fechaHasta = "La fecha de fin no puede ser anterior al inicio";

  v.incluye.forEach((t, i) => { const s = t.trim(); if (s && s.length < 5) e[`inc_${i}`] = "Debe tener al menos 5 caracteres"; });
  v.noIncluye.forEach((t, i) => { const s = t.trim(); if (s && s.length < 5) e[`ninc_${i}`] = "Debe tener al menos 5 caracteres"; });

  v.faqs.forEach((f, i) => {
    const q = f.q.trim(), a = f.a.trim();
    if (q && q.length < 5) e[`faq_${i}_q`] = "Debe tener al menos 5 caracteres";
    if (a && a.length < 5) e[`faq_${i}_a`] = "Debe tener al menos 5 caracteres";
    if (q && !a) e[`faq_${i}_a`] = "Completá la respuesta de esta pregunta";
    if (a && !q) e[`faq_${i}_q`] = "Completá la pregunta";
  });

  return e;
}

/* ---- Pasos --------------------------------------------------------------- */

export const PASOS = [
  { n: 1, label: "Información general", sub: "Nombre, descripción y cultivos" },
  { n: 2, label: "Detalles de la experiencia", sub: "Qué incluye y preguntas" },
  { n: 3, label: "Participantes y tarifas", sub: "Cupos y precio según rango" },
  { n: 4, label: "Disponibilidad", sub: "Días y vigencia" },
] as const;

/** En qué paso vive el campo de cada error, para poder llevar ahí al usuario. */
export function pasoDelError(k: string): number {
  if (k === "nombre" || k === "descripcion" || k === "cultivos") return 1;
  if (k.startsWith("inc_") || k.startsWith("ninc_") || k.startsWith("faq_")) return 2;
  if (k === "cupos" || k.startsWith("tar")) return 3;
  return 4;
}
