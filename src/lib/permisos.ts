/**
 * Los permisos llegan del backend como códigos sueltos ("LEER_ADMIN") sin
 * etiqueta para mostrar. El recurso ya lo dice el nombre del grupo que los
 * contiene, así que alcanza con traducir el verbo: dentro de "Gestión de
 * administradores", las opciones se leen "Ver" y "Gestionar".
 *
 * Es lo único de los permisos que vive en el front, y degrada solo: ante un
 * verbo desconocido se muestra el código humanizado en vez de inventar nada.
 * Si algún día el catálogo manda `{ codigo, label }`, esto se borra.
 */
const VERBO: Record<string, string> = {
  LEER: "Ver",
  GESTIONAR: "Gestionar",
};

export function etiquetaPermiso(codigo: string): string {
  const verbo = VERBO[codigo.split("_")[0] ?? ""];
  if (verbo) return verbo;
  const texto = codigo.replace(/_/g, " ").trim().toLowerCase();
  return texto ? texto[0].toUpperCase() + texto.slice(1) : codigo;
}
