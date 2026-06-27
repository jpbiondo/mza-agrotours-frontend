import type { FaqItem } from "@/types/catalogo";

/** Preguntas frecuentes destacadas para la landing (US — Consultar FAQ). */
export const FAQ_DESTACADAS: FaqItem[] = [
  {
    id: "q-que-es",
    cat: "general",
    q: "¿Qué es Mendoza AgroTours?",
    a: "Es la plataforma que conecta visitantes con productores rurales de Mendoza. Desde acá podés descubrir fincas, reservar experiencias participativas —cosechas, podas, degustaciones— y vivir el campo mendocino de la mano de quienes lo trabajan.",
  },
  {
    id: "q-reservar",
    cat: "reservas",
    q: "¿Cómo reservo una experiencia?",
    a: "Entrá a Explorar experiencias, elegí la finca y la actividad que te interesen, seleccioná una fecha con cupo disponible y confirmá. Vas a recibir un código de reserva (por ejemplo RES-2K9F) y el detalle por correo.",
  },
  {
    id: "q-cancelar",
    cat: "reservas",
    q: "¿Puedo cancelar o reprogramar una reserva?",
    a: "Sí. Desde Mis reservas abrí la reserva y elegí Cancelar o Reprogramar. Las cancelaciones con más de 48 horas de anticipación no tienen costo; dentro de las 48 horas previas puede aplicarse una retención según la política de cada finca.",
  },
  {
    id: "q-registro",
    cat: "cuenta",
    q: "¿Cómo creo una cuenta?",
    a: "Tocá Registrarse en la página de inicio, ingresá tus datos y elegí tu perfil (visitante o productor). Vas a recibir un correo para verificar tu cuenta. Los administradores son dados de alta por el equipo de la plataforma.",
  },
  {
    id: "q-cargar-exp",
    cat: "productores",
    q: "Soy productor, ¿cómo cargo una experiencia?",
    a: "Desde tu panel entrá a Experiencias y tocá Cargá una experiencia. Completá los datos de la actividad, la disponibilidad y el cupo, sumá fotos de la finca y publicá. Podés guardarla como borrador y publicarla más adelante.",
  },
  {
    id: "q-pagos-medios",
    cat: "pagos",
    q: "¿Qué medios de pago puedo usar?",
    a: "Podés pagar con tarjeta de crédito o débito y con los medios electrónicos habilitados. El importe se muestra siempre en pesos argentinos, con el detalle de la experiencia antes de confirmar.",
  },
];
