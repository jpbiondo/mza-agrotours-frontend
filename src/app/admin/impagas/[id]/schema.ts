import { z } from "zod";

/** Tope de `metodoPago` e `idPagoExterno` en el DTO del backend. */
export const TEXTO_MAX = 64;

/** "YYYY-MM-DD" + "HH:MM" en hora local; `null` si alguno no tiene forma. */
export function fechaHoraLocal(fecha: string, hora: string): Date | null {
  const f = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  const h = /^(\d{2}):(\d{2})$/.exec(hora);
  if (!f || !h) return null;
  return new Date(+f[1], +f[2] - 1, +f[3], +h[1], +h[2]);
}

const texto = (vacio: string) =>
  z
    .string()
    .trim()
    .min(1, vacio)
    .max(TEXTO_MAX, `No puede superar los ${TEXTO_MAX} caracteres.`);

/**
 * La transferencia con la que el administrador cubrió el reembolso. El día ya
 * viene acotado a hoy por el calendario, pero hoy mismo la hora todavía puede
 * caer en el futuro: eso se valida contra el par.
 */
export const pagoSchema = z
  .object({
    fecha: z.string().min(1, "Elegí el día de la transferencia."),
    hora: z.string().min(1, "Elegí la hora."),
    metodo: texto("Ingresá el método con el que se pagó."),
    idExterno: texto("Ingresá el ID de la operación."),
  })
  .superRefine((v, ctx) => {
    const cuando = fechaHoraLocal(v.fecha, v.hora);
    if (cuando && cuando > new Date()) {
      ctx.addIssue({ code: "custom", path: ["hora"], message: "La transferencia no puede ser en el futuro." });
    }
  });

export type PagoForm = z.infer<typeof pagoSchema>;
