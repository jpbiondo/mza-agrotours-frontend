/* Validaciones de los campos editables del establecimiento (US-EST-05). */

import {
  NOMBRE_ESTABLECIMIENTO_RE,
  TELEFONO_MSG,
  TELEFONO_RE,
} from "@/data/auth";

export function validarNombre(v: string): string | null {
  const t = v.trim();
  if (!t) return "El nombre del establecimiento no puede estar vacío.";
  if (t.length > 100) return "El nombre no puede superar los 100 caracteres.";
  if (!NOMBRE_ESTABLECIMIENTO_RE.test(t)) {
    return "Solo se permiten letras, números, espacios, guiones y guiones bajos.";
  }
  return null;
}

export function validarDescripcion(v: string): string | null {
  if (!v.trim()) return "La descripción no puede estar vacía.";
  // Sobre el valor sin recortar: es el largo que muestra el contador del campo.
  if (v.length > 2000) return "La descripción no puede superar los 2000 caracteres.";
  return null;
}

export function validarTelefono(v: string): string | null {
  const t = v.trim();
  if (!t) return "El teléfono no puede estar vacío.";
  // El largo ya lo fija TELEFONO_RE; chequearlo aparte sólo le gana por orden
  // al mensaje bueno.
  if (!TELEFONO_RE.test(t)) return TELEFONO_MSG;
  return null;
}

export function validarEmail(v: string): string | null {
  const t = v.trim();
  if (!t) return "El email no puede estar vacío.";
  if (t.length > 100) return "El email no puede superar los 100 caracteres.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return "Ingresá un email válido.";
  return null;
}

/**
 * El CVU argentino son 22 dígitos. TODO backend: confirmar que sea la misma
 * regla del lado del servidor; si allá se acepta algo más flojo, esto bloquea
 * de más.
 */
export function validarCvu(v: string): string | null {
  const t = v.trim();
  if (!t) return "El CVU no puede estar vacío.";
  if (!/^\d+$/.test(t)) return "El CVU sólo puede tener números.";
  if (t.length !== 22) return "El CVU debe tener 22 dígitos.";
  return null;
}

/* ---- Portada del establecimiento -----------------------------------------
   Una sola imagen, la primera que ven los visitantes en el perfil público y en
   las tarjetas de búsqueda, que la muestran en 16:9. */

/**
 * Los formatos salen de `CarpetaArchivo.ESTABLECIMIENTOS` del backend, que
 * rechaza cualquier otro al firmar la subida. El diseño también ofrecía WEBP,
 * pero el backend todavía no lo acepta.
 */
export const PORTADA_EXTENSIONES = ["jpg", "jpeg", "png"] as const;
export const PORTADA_MIMES = ["image/jpeg", "image/png"] as const;
export const PORTADA_ACCEPT = PORTADA_MIMES.join(",");

/** Mismo tope que la carpeta del backend. */
export const PORTADA_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Debajo de este ancho la portada se ve pixelada donde se usa. Es una regla del
 * cliente: el backend no mira las dimensiones.
 */
export const PORTADA_ANCHO_MINIMO = 1200;
