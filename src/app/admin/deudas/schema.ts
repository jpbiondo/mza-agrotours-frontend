import { z } from "zod";
import { fechaHoraLocal, moneyAr } from "@/lib/format";

/** Tope de `motivo` en el DTO del backend. */
export const MOTIVO_MAX = 255;
/** Tope de `metodoPago` e `idPagoExterno` en el DTO del backend. */
export const TEXTO_MAX = 64;

/** "4000,5" → 4000.5; `null` si está vacío o no es un número. */
export function leerMonto(texto: string): number | null {
  const t = texto.trim();
  if (!t) return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Para comparar montos sin el ruido de los decimales de punto flotante. */
export const aCentavos = (n: number) => Math.round(n * 100);

/** Una devolución siempre lleva pago; un acuerdo, sólo si se tildó "Agregar pago". */
export function llevaPago(v: { tipo: string; conPago: boolean }): boolean {
  return v.tipo === "devolucion" || v.conPago;
}

/**
 * Resolver una deuda con `pendiente` por devolver. Los campos del pago sólo se
 * validan cuando el pago va, así que todas las reglas viven en el `superRefine`
 * sobre campos sueltos: con reglas en los campos, zod no correría el refine
 * mientras faltara alguno, y el conteo de lo que falta saltaría a mitad de camino.
 */
export function resolverDeudaSchema(pendiente: number) {
  return z
    .object({
      tipo: z.enum(["devolucion", "acuerdo"]),
      motivo: z.string(),
      conPago: z.boolean(),
      fecha: z.string(),
      hora: z.string(),
      monto: z.string(),
      metodo: z.string(),
      idExterno: z.string(),
    })
    .superRefine((v, ctx) => {
      const issue = (campo: string, message: string) => ctx.addIssue({ code: "custom", path: [campo], message });
      const texto = (campo: "metodo" | "idExterno", vacio: string) => {
        const t = v[campo].trim();
        if (!t) issue(campo, vacio);
        else if (t.length > TEXTO_MAX) issue(campo, `No puede superar los ${TEXTO_MAX} caracteres.`);
      };

      const motivo = v.motivo.trim();
      if (!motivo) issue("motivo", "Contá por qué cambia el estado de la deuda.");
      else if (motivo.length > MOTIVO_MAX) issue("motivo", `No puede superar los ${MOTIVO_MAX} caracteres.`);

      if (!llevaPago(v)) return;

      if (!v.fecha) issue("fecha", "Elegí el día del pago.");
      if (!v.hora) issue("hora", "Elegí la hora.");
      // El día ya viene acotado a hoy por el calendario, pero hoy mismo la hora
      // todavía puede caer en el futuro: eso se valida contra el par.
      const cuando = fechaHoraLocal(v.fecha, v.hora);
      if (cuando && cuando > new Date()) issue("hora", "El pago no puede ser en el futuro.");

      const monto = leerMonto(v.monto);
      if (monto === null) issue("monto", "Ingresá el monto del pago.");
      else if (aCentavos(monto) <= 0) issue("monto", "El monto tiene que ser mayor a cero.");
      else if (aCentavos(monto) > aCentavos(pendiente)) issue("monto", `No puede superar lo que queda por devolver (${moneyAr(pendiente)}).`);

      texto("metodo", "Ingresá el método con el que se pagó.");
      texto("idExterno", "Ingresá el ID de la operación.");
    });
}

export type ResolverDeudaForm = z.infer<ReturnType<typeof resolverDeudaSchema>>;
