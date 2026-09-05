import type { ComponentType } from "react";

/**
 * Todo lo que cambia entre la pantalla de roles de /admin y la del panel del
 * productor. La mecánica —tabla, editor de permisos, alta, baja— es la misma en
 * las dos, así que lo único que se parametriza es cómo se llama cada cosa: un
 * rol de administrador se asigna a administradores, uno de productor al
 * personal de la finca.
 *
 * Cada pantalla define su propio objeto: el copy vive al lado de quien lo usa,
 * no acumulado acá.
 */
export interface TextosRoles {
  /** Migas de pan: sección y pantalla. */
  breadcrumb: [string, string];
  titulo: string;
  bajada: string;
  /** Encabezado de la primera columna de la tabla. */
  columnaRol: string;
  /** Encabezado de la columna con el contador de personas. */
  columnaUsuarios: string;
  /** Rótulo de la tarjeta con el total de personas con rol. */
  statUsuarios: string;
  /** Icono de esa tarjeta; el resto son iguales en las dos pantallas. */
  iconoUsuarios: ComponentType<{ className?: string }>;
  /** Tabla sin filas. */
  vacio: string;
  /** Motivo de los botones deshabilitados para quien no puede gestionar. */
  sinGestion: string;
  /** "1 administrador asignado" / "3 usuarios asignados". */
  usuariosAsignados: (n: number) => string;
  /** Aclaración al pie de una fila que no se puede borrar por tener gente. */
  notaBorrar: string;
  /** Qué se pierde al dar de baja, en el diálogo de confirmación. */
  bajaAdvertencia: string;
  form: {
    /** Título del panel al crear; al editar se muestra el nombre del rol. */
    tituloCrear: string;
    /** Bajada del panel al crear. */
    bajadaCrear: string;
    nombrePlaceholder: string;
    /** Ayuda debajo del nombre: quién va a ver este rol. */
    nombreAyuda: string;
    descPlaceholder: string;
    /** Tope de caracteres del nombre; lo fija cada pantalla. */
    maxNombre: number;
  };
}
