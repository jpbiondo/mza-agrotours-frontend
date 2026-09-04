import type { Coincidencias, EstabVigente, EstadoSolicitud, Solicitud } from "@/types/solicitudes";

/** Establecimientos vigentes — fuente de verdad para detectar coincidencias. */
export const ESTAB_VIGENTES: EstabVigente[] = [
  { nombre: "Finca La Escondida", cuil: "30-71845239-4", razonSocial: "La Escondida S.R.L.", email: "hola@fincalaescondida.com.ar" },
  { nombre: "Finca Los Álamos", cuil: "30-71500988-2", razonSocial: "Los Álamos S.A.", email: "contacto@losalamos.com.ar" },
  { nombre: "Bodega Viento Sur", cuil: "30-71622045-7", razonSocial: "Viento Sur S.R.L.", email: "reservas@vientosur.com.ar" },
  { nombre: "Olivícola Don Aldo", cuil: "27-92044118-3", razonSocial: "Don Aldo e Hijos S.H.", email: "ventas@donaldo.com.ar" },
];

export const SOLICITUDES_SEED: Solicitud[] = [
  {
    id: "sol-1042", nombreEstablecimiento: "Finca El Mirador", cuil: "30-71500012-9", razonSocial: "El Mirador del Valle S.A.",
    descripcion: "Establecimiento dedicado al cultivo de cerezas y duraznos en altura. Buscamos ofrecer experiencias de cosecha guiada y degustación de conservas artesanales elaboradas en la finca.",
    domicilioLegal: "Camino a Villa Seca, km 8, Tunuyán", departamento: "Tunuyán", email: "contacto@elmirador.com.ar", telefono: "+54 9 261 544-8810",
    pruebas: [
      { name: "dni-titular-frente.jpg", type: "jpg", size: 1_820_000 },
      { name: "dni-titular-dorso.jpg", type: "jpg", size: 1_640_000 },
      { name: "constancia-cuit-arca.pdf", type: "pdf", size: 240_000 },
    ],
    productor: { nombre: "Esteban Roldán", dni: "28.114.905", email: "esteban.roldan@gmail.com", miembroDesde: "02/2026" },
    estado: "pendiente", solicitado: "21/06/2026 · 09:42", observacion: "",
  },
  {
    id: "sol-1041", nombreEstablecimiento: "Finca La Escondida (sucursal)", cuil: "30-71845239-4", razonSocial: "La Escondida del Sur S.R.L.",
    descripcion: "Nueva sucursal de la finca familiar orientada a degustaciones de Malbec y visitas al viñedo histórico.",
    domicilioLegal: "Ruta 40 km 12, Luján de Cuyo", departamento: "Luján de Cuyo", email: "sucursal@laescondida.com.ar", telefono: "+54 9 261 555-2210",
    pruebas: [
      { name: "habilitacion-municipal.pdf", type: "pdf", size: 520_000 },
      { name: "frente-establecimiento.webp", type: "webp", size: 980_000 },
    ],
    productor: { nombre: "Lucía Funes", dni: "30.118.774", email: "lucia.funes@gmail.com", miembroDesde: "03/2024" },
    estado: "pendiente", solicitado: "20/06/2026 · 17:08", observacion: "",
  },
  {
    id: "sol-1039", nombreEstablecimiento: "Bodega Altos del Río", cuil: "30-71988220-1", razonSocial: "Altos del Río S.A.", email: "hola@fincalaescondida.com.ar",
    descripcion: "Bodega boutique con producción de vinos de altura. Ofrecemos recorridos por la sala de barricas y maridajes.",
    domicilioLegal: "Calle Los Cerezos 450, San Carlos", departamento: "San Carlos", telefono: "+54 9 2622 41-9930",
    pruebas: [
      { name: "inscripcion-inv.pdf", type: "pdf", size: 410_000 },
      { name: "certificado-rut.pdf", type: "pdf", size: 360_000 },
      { name: "vista-aerea.png", type: "png", size: 2_240_000 },
    ],
    productor: { nombre: "Marcos Videla", dni: "27.660.512", email: "marcos.videla@gmail.com", miembroDesde: "01/2026" },
    estado: "pendiente", solicitado: "19/06/2026 · 11:25", observacion: "",
  },
  {
    id: "sol-1036", nombreEstablecimiento: "Olivar Santa Marta", cuil: "30-71744301-5", razonSocial: "Santa Marta Olivos S.R.L.",
    descripcion: "Producción de aceite de oliva extra virgen. Visitas a la almazara y catas dirigidas.",
    domicilioLegal: "Carril Norte 1200, Maipú", departamento: "Maipú", email: "info@olivarsantamarta.com.ar", telefono: "+54 9 261 533-7741",
    pruebas: [
      { name: "constancia-cuit.pdf", type: "pdf", size: 230_000 },
      { name: "habilitacion.pdf", type: "pdf", size: 480_000 },
    ],
    productor: { nombre: "Renata Ibáñez", dni: "33.018.220", email: "renata.ibanez@gmail.com", miembroDesde: "11/2025" },
    estado: "validada", solicitado: "12/06/2026 · 14:10", observacion: "Documentación completa y verificada con el RUT provincial. Se aprueba el alta.", resueltoPor: "Paula Bianchi", resuelto: "13/06/2026 · 10:02",
  },
  {
    id: "sol-1031", nombreEstablecimiento: "Finca Sin Nombre", cuil: "30-99000000-0", razonSocial: "Emprendimientos Varios S.A.",
    descripcion: "Solicitud sin documentación de respaldo suficiente.",
    domicilioLegal: "Sin especificar", departamento: "Capital", email: "varios@correo.com", telefono: "+54 9 261 500-0000",
    pruebas: [{ name: "foto-borrosa.jpg", type: "jpg", size: 120_000 }],
    productor: { nombre: "Usuario Anónimo", dni: "20.000.000", email: "anonimo@correo.com", miembroDesde: "06/2026" },
    estado: "rechazada", solicitado: "08/06/2026 · 08:55", observacion: "La prueba cargada no permite verificar la titularidad del establecimiento. Falta constancia de CUIT y habilitación. Se rechaza la solicitud.", resueltoPor: "Diego Ferreyra", resuelto: "09/06/2026 · 09:30",
  },
];

export const SOL_ESTADO_META: Record<EstadoSolicitud, { label: string; tone: "warning" | "success" | "danger" }> = {
  pendiente: { label: "Pendiente", tone: "warning" },
  validada: { label: "Validada", tone: "success" },
  rechazada: { label: "Rechazada", tone: "danger" },
};

function normCrit(v: string): string {
  return (v || "").toString().toLowerCase().replace(/[\s-]/g, "");
}

export function chequearCoincidencias(sol: Solicitud): Coincidencias {
  const cuil = ESTAB_VIGENTES.some((e) => normCrit(e.cuil) === normCrit(sol.cuil));
  const razonSocial = ESTAB_VIGENTES.some((e) => normCrit(e.razonSocial) === normCrit(sol.razonSocial));
  const email = ESTAB_VIGENTES.some((e) => normCrit(e.email) === normCrit(sol.email));
  return { cuil, razonSocial, email, alguna: cuil || razonSocial || email };
}

export function vigenteQueCoincide(campo: "cuil" | "razonSocial" | "email", valor: string): EstabVigente | null {
  return ESTAB_VIGENTES.find((e) => normCrit(e[campo]) === normCrit(valor)) || null;
}

export { fmtBytes } from "@/lib/utils";
