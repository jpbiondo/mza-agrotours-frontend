/**
 * GET /usuario/card/{email}: sólo confirma que la cuenta existe y quién es. No
 * dice nada del rol que tenga en el sistema ni en un establecimiento — eso se
 * resuelve comparando contra la lista vigente de cada pantalla.
 */
export interface UsuarioCard {
  nombre: string;
  identificacion: string;
}
