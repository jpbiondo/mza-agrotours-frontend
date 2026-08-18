import type { FaqCategoria, FaqItem } from "@/types/catalogo";

/** Categorías de la base de conocimiento. (`todas` es solo filtro). */
export const FAQ_CATEGORIAS: FaqCategoria[] = [
  { id: "todas", label: "Todas", icon: "layout-grid" },
  { id: "general", label: "Generales", icon: "info" },
  { id: "reservas", label: "Reservas", icon: "calendar-check" },
  { id: "cuenta", label: "Cuenta y acceso", icon: "user-round" },
  { id: "productores", label: "Productores", icon: "tractor" },
  { id: "pagos", label: "Pagos", icon: "wallet" },
];

/** Base de conocimiento completa (US — Consultar FAQ). */
export const FAQ_ITEMS: FaqItem[] = [
  { id: "q-que-es", cat: "general", q: "¿Qué es Mendoza AgroTours?", a: "Es la plataforma que conecta visitantes con productores rurales de Mendoza. Desde acá podés descubrir fincas, reservar experiencias participativas —cosechas, podas, degustaciones— y vivir el campo mendocino de la mano de quienes lo trabajan." },
  { id: "q-perfiles", cat: "general", q: "¿Qué puedo hacer según mi tipo de usuario?", a: "Como visitante, descubrís y reservás experiencias. Como productor, cargás y gestionás las actividades de tu finca, el cronograma de cultivos y las reservas recibidas. Como administrador, supervisás usuarios, roles y el contenido publicado en la plataforma." },
  { id: "q-reservar", cat: "reservas", q: "¿Cómo reservo una experiencia?", a: "Entrá a Explorar experiencias, elegí la finca y la actividad que te interesen, seleccioná una fecha con cupo disponible y confirmá. Vas a recibir un código de reserva (por ejemplo RES-2K9F) y el detalle por correo." },
  { id: "q-cancelar", cat: "reservas", q: "¿Puedo cancelar o reprogramar una reserva?", a: "Sí. Desde Mis reservas abrí la reserva y elegí Cancelar o Reprogramar. Las cancelaciones con más de 48 horas de anticipación no tienen costo; dentro de las 48 horas previas puede aplicarse una retención según la política de cada finca." },
  { id: "q-estados", cat: "reservas", q: "¿Qué significan los estados de una reserva?", a: "Pendiente: el productor todavía no confirmó tu lugar. Confirmada: tu cupo está asegurado para la fecha elegida. Finalizada: la experiencia ya ocurrió. Cancelada: la reserva fue dada de baja por vos o por la finca." },
  { id: "q-registro", cat: "cuenta", q: "¿Cómo creo una cuenta?", a: "Tocá Registrarse en la página de inicio, ingresá tus datos y elegí tu perfil (visitante o productor). Vas a recibir un correo para verificar tu cuenta. Los administradores son dados de alta por el equipo de la plataforma." },
  { id: "q-contrasena", cat: "cuenta", q: "Olvidé mi contraseña, ¿cómo la recupero?", a: "En la pantalla de acceso tocá ¿Olvidaste tu contraseña?, ingresá tu correo y te enviamos un enlace para crear una nueva. El enlace vence a las 2 horas por seguridad." },
  { id: "q-datos", cat: "cuenta", q: "¿Cómo actualizo mis datos personales?", a: "Ingresá a tu perfil desde el menú de tu cuenta. Ahí podés editar nombre, correo, teléfono y foto. Algunos cambios sensibles, como el correo, requieren una nueva verificación." },
  { id: "q-cargar-exp", cat: "productores", q: "Soy productor, ¿cómo cargo una experiencia?", a: "Desde tu panel entrá a Experiencias y tocá Cargá una experiencia. Completá los datos de la actividad, la disponibilidad y el cupo, sumá fotos de la finca y publicá. Podés guardarla como borrador y publicarla más adelante." },
  { id: "q-cronograma", cat: "productores", q: "¿Para qué sirve el cronograma de cultivos?", a: "El cronograma te permite registrar las etapas de cada cultivo —crecimiento, cosecha, descanso— y asociarlas a las experiencias. Así los visitantes ven en qué momento del año pueden participar de cada actividad." },
  { id: "q-gestion-reservas", cat: "productores", q: "¿Cómo gestiono las reservas que recibo?", a: "En Reservas vas a ver las solicitudes de cada experiencia. Podés confirmarlas, ver los datos del visitante y la cantidad de personas, y marcar la actividad como finalizada una vez realizada." },
  { id: "q-pagos-medios", cat: "pagos", q: "¿Qué medios de pago puedo usar?", a: "Podés pagar con tarjeta de crédito o débito y con los medios electrónicos habilitados. El importe se muestra siempre en pesos argentinos, con el detalle de la experiencia antes de confirmar." },
  { id: "q-pagos-reembolso", cat: "pagos", q: "Si cancelo, ¿cómo recibo el reembolso?", a: "El reembolso se acredita por el mismo medio de pago utilizado. Según el banco o billetera, puede demorar entre 5 y 10 días hábiles en verse reflejado. El monto depende de la política de cancelación de la finca." },
  { id: "q-soporte", cat: "general", q: "No encuentro mi duda acá, ¿cómo contacto a soporte?", a: "Usá el asistente de ayuda disponible en la plataforma o escribinos a soporte@mendozaagrotours.ar. Te respondemos por correo dentro de las 24 horas hábiles." },
];

/** Subconjunto destacado para la landing. */
export const FAQ_DESTACADAS: FaqItem[] = [
  "q-que-es", "q-reservar", "q-cancelar", "q-registro", "q-cargar-exp", "q-pagos-medios",
].map((id) => FAQ_ITEMS.find((f) => f.id === id)!).filter(Boolean);
