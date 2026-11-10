import type { Metadata } from "next";
import Link from "next/link";
import { DocumentoLegal, LINK_LEGAL, Seccion } from "@/components/legal/DocumentoLegal";
import { ComisionSistema } from "@/components/legal/ComisionSistema";

export const metadata: Metadata = {
  title: "Términos para productores · Mendoza AgroTours",
  description: "Condiciones para publicar actividades en Mendoza AgroTours: alta del establecimiento, responsabilidades y comisiones.",
};

/*
 * TODO legal: borrador escrito a partir de cómo funciona la plataforma, no por
 * un abogado. Antes de salir a producción lo tiene que revisar alguien que sepa.
 *
 * Se aceptan con el checkbox de la solicitud de alta (mis-solicitudes/nueva):
 * sin tildarlo no se puede enviar, así que toda solicitud implica la aceptación.
 */
const ACTUALIZACION = "9 de noviembre de 2026";

export default function TerminosProductoresPage() {
  return (
    <DocumentoLegal
      titulo="Términos para productores"
      actualizacion={ACTUALIZACION}
      intro={
        <p className="m-0">
          Estos términos se suman a los{" "}
          <Link href="/terminos" className={LINK_LEGAL}>
            términos y condiciones generales
          </Link>{" "}
          y regulan la publicación de actividades en Mendoza AgroTours. Al solicitar el alta de un establecimiento,
          aceptás lo que sigue.
        </p>
      }
    >
      <Seccion titulo="1. Alta del establecimiento">
        <p className="m-0">
          Para publicar actividades, solicitás el alta de tu establecimiento y adjuntás la documentación que se te
          pida. Revisamos cada solicitud y podemos aprobarla, pedir correcciones o rechazarla.
        </p>
      </Seccion>

      <Seccion titulo="2. Responsabilidades">
        <p className="m-0">
          Sos responsable de que la información publicada sea cierta, de contar con las habilitaciones que exija tu
          actividad, de cumplir lo publicado y de la seguridad de los visitantes durante la experiencia.
        </p>
        <p className="m-0">
          Podemos suspender un establecimiento o despublicar actividades que incumplan estos términos o los generales.
        </p>
      </Seccion>

      <Seccion id="comisiones" titulo="3. Comisiones">
        <p className="m-0">
          Por cada reserva cobrada, Mendoza AgroTours retiene una comisión{" "}
          <ComisionSistema prefijo="del " sinDato="porcentual" /> sobre el total
          de la reserva. Lo que queda, descontada también la comisión de Mercado Pago, es para vos.
        </p>
        <p className="m-0">
          La comisión de Mercado Pago es aparte: la cobra Mercado Pago por procesar el pago, depende del medio de pago
          que use el visitante y no la fija Mendoza AgroTours.
        </p>
        <p className="m-0">
          En el panel, cada reserva muestra cuánto se descontó y cuánto te queda.
        </p>
      </Seccion>

      <Seccion titulo="4. Cancelaciones">
        <p className="m-0">
          Si una reserva se cancela con reembolso, al visitante se le devuelve el total: no cobrás esa reserva y
          Mendoza AgroTours no retiene comisión.
        </p>
        <p className="m-0">
          Si se cancela sin reembolso, la cobrás con las mismas comisiones que una reserva pagada.
        </p>
      </Seccion>

      <Seccion titulo="5. Cambios en las comisiones y en estos términos">
        <p className="m-0">
          El porcentaje de la comisión puede cambiar. Vamos a avisarlo al menos 7 días antes de que entre en vigencia,
          y cada reserva conserva el porcentaje que estaba vigente cuando se pagó.
        </p>
        <p className="m-0">
          Podemos actualizar también el resto de estos términos. La fecha de arriba siempre indica la última versión.
        </p>
      </Seccion>

      <Seccion titulo="6. Contacto">
        <p className="m-0">
          Para cualquier consulta sobre estos términos, escribinos desde{" "}
          <Link href="/incidencias" className={LINK_LEGAL}>
            Incidencias
          </Link>
          .
        </p>
      </Seccion>
    </DocumentoLegal>
  );
}
