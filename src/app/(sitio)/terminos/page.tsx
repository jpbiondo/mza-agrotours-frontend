import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos y condiciones · Mendoza AgroTours",
  description: "Condiciones de uso de Mendoza AgroTours para visitantes y productores.",
};

/*
 * TODO legal: borrador escrito a partir de cómo funciona la plataforma, no por
 * un abogado. Antes de salir a producción lo tiene que revisar alguien que
 * sepa: sobre todo responsabilidad, reembolsos y datos personales.
 */
const ACTUALIZACION = "26 de octubre de 2026";

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="m-0 font-display text-[22px] font-bold text-fg-1">{titulo}</h2>
      <div className="mt-3 flex flex-col gap-3 text-[15.5px] leading-[1.65] text-fg-2">{children}</div>
    </section>
  );
}

export default function TerminosPage() {
  return (
    <article className="mx-auto max-w-[760px] px-7 pt-10 pb-24">
      <h1 className="m-0 font-display text-[38px] leading-[1.1] font-bold tracking-[-.015em] text-fg-1">
        Términos y condiciones
      </h1>
      <p className="mt-3 mb-0 text-sm text-fg-3">Última actualización: {ACTUALIZACION}</p>
      <p className="mt-6 mb-0 text-base leading-[1.65] text-fg-2">
        Estos términos regulan el uso de Mendoza AgroTours. Al crear una cuenta o hacer una reserva, aceptás lo que
        sigue. Si no estás de acuerdo con alguna parte, no uses la plataforma.
      </p>

      <Seccion titulo="1. Qué es Mendoza AgroTours">
        <p className="m-0">
          Mendoza AgroTours es una plataforma que conecta a visitantes con establecimientos rurales de Mendoza que
          ofrecen experiencias participativas: cosechas, podas, recorridos, degustaciones y actividades similares.
        </p>
        <p className="m-0">
          Las actividades las organiza y las lleva a cabo cada establecimiento. Mendoza AgroTours publica la oferta,
          gestiona las reservas y procesa los pagos, pero no es quien presta la experiencia.
        </p>
      </Seccion>

      <Seccion titulo="2. Tu cuenta">
        <p className="m-0">
          Para reservar o publicar actividades necesitás una cuenta. Los datos que cargues tienen que ser verdaderos y
          estar al día. Sos responsable de cuidar tu contraseña y de lo que se haga desde tu cuenta.
        </p>
        <p className="m-0">
          Podemos suspender o dar de baja una cuenta que incumpla estos términos o que se use para engañar a otras
          personas. Vos podés darla de baja cuando quieras desde la configuración de tu cuenta.
        </p>
      </Seccion>

      <Seccion titulo="3. Reservas">
        <p className="m-0">
          Al reservar elegís una actividad, una fecha con cupo y la cantidad de personas. La reserva queda confirmada
          cuando se acredita el pago. Antes de confirmar vas a ver el detalle de lo que incluye la actividad, lo que
          no incluye y el precio total.
        </p>
        <p className="m-0">
          El establecimiento puede reprogramar o cancelar una fecha por clima, por causas propias de la actividad
          rural o por fuerza mayor. Si eso pasa, te avisamos y podés elegir otra fecha o pedir el reembolso.
        </p>
      </Seccion>

      <Seccion titulo="4. Pagos">
        <p className="m-0">
          Los precios se muestran en pesos argentinos. Los pagos se procesan a través de Mercado Pago, con los medios
          que ofrezca en cada momento. Mendoza AgroTours no guarda los datos de tus tarjetas.
        </p>
      </Seccion>

      <Seccion titulo="5. Cancelaciones y reembolsos">
        <p className="m-0">
          Cada establecimiento define su política de cancelación, que se informa antes de confirmar la reserva. El
          reembolso, cuando corresponda, se acredita por el mismo medio de pago; los plazos dependen de Mercado Pago y
          de tu banco o billetera.
        </p>
        <p className="m-0">
          Esto no limita el derecho de revocación ni los demás derechos que te reconoce la Ley de Defensa del
          Consumidor (Ley 24.240).
        </p>
      </Seccion>

      <Seccion titulo="6. Productores y establecimientos">
        <p className="m-0">
          Para publicar actividades, un productor solicita el alta de su establecimiento y adjunta la documentación
          que se le pida. Revisamos cada solicitud y podemos aprobarla, pedir correcciones o rechazarla.
        </p>
        <p className="m-0">
          Quien publica es responsable de que la información sea cierta, de contar con las habilitaciones que exija su
          actividad, de cumplir lo publicado y de la seguridad de los visitantes durante la experiencia. Podemos
          suspender un establecimiento o despublicar actividades que incumplan estos términos.
        </p>
      </Seccion>

      <Seccion titulo="7. Reseñas y contenido">
        <p className="m-0">
          Después de una experiencia podés dejar una reseña. Tiene que referirse a lo que viviste y no puede incluir
          insultos, datos personales de terceros ni contenido ilegal. Podemos quitar las que no cumplan con esto.
        </p>
      </Seccion>

      <Seccion titulo="8. Riesgos de las actividades rurales">
        <p className="m-0">
          Las experiencias se hacen en fincas en funcionamiento, al aire libre y a veces con herramientas o animales.
          Seguí siempre las indicaciones del establecimiento, usá la ropa y el calzado que se recomiende y avisá antes
          de cualquier condición de salud que importe para la actividad.
        </p>
        <p className="m-0">
          Mendoza AgroTours responde por el funcionamiento de la plataforma. La prestación de la actividad está a
          cargo del establecimiento, sin perjuicio de la responsabilidad que fije la ley.
        </p>
      </Seccion>

      <Seccion titulo="9. Datos personales">
        <p className="m-0">
          Usamos tus datos para gestionar tu cuenta, tus reservas y tus pagos, y le compartimos al establecimiento sólo
          lo necesario para recibirte. No los vendemos ni los cedemos a terceros con otros fines.
        </p>
        <p className="m-0">
          Podés pedir el acceso, la rectificación o la supresión de tus datos en los términos de la Ley 25.326 de
          Protección de los Datos Personales. La Agencia de Acceso a la Información Pública es el órgano de control de
          esa ley y recibe las denuncias por su incumplimiento.
        </p>
      </Seccion>

      <Seccion titulo="10. Cambios en estos términos">
        <p className="m-0">
          Podemos actualizar estos términos. Cuando el cambio sea importante te lo vamos a avisar antes de que entre en
          vigencia, y la fecha de arriba siempre indica la última versión.
        </p>
      </Seccion>

      <Seccion titulo="11. Ley aplicable">
        <p className="m-0">
          Estos términos se rigen por las leyes de la República Argentina. Ante un conflicto, intervienen los
          tribunales ordinarios de la Ciudad de Mendoza, sin perjuicio de la jurisdicción que te corresponda como
          consumidor.
        </p>
      </Seccion>

      <Seccion titulo="12. Contacto">
        <p className="m-0">
          Para cualquier consulta o reclamo sobre estos términos, escribinos desde{" "}
          <Link href="/incidencias" className="font-semibold text-green-800 underline-offset-2 hover:underline">
            Incidencias
          </Link>
          .
        </p>
      </Seccion>
    </article>
  );
}
