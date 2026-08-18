/* Validaciones de los campos editables del establecimiento (US-EST-05). */

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
