/** El manual de usuario vigente: uno solo, para todos los perfiles. */
export interface ManualUsuario {
  nombre: string;
  /** URL firmada de descarga. Vence: no se guarda, se pide de nuevo al cargar. */
  url: string;
}

export interface ResultadoManual {
  ok: boolean;
  code?: string;
  /** Lo que quedó vigente, si salió bien. */
  manual?: ManualUsuario;
  /** Lo que se atajó, para que la pantalla elija el texto con `clasificarError`. */
  error?: unknown;
}
