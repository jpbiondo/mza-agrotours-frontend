import {
  C, FORMATO_PESOS, armarCsv, cargarPdf, encabezarFila, filaCsv as fila, marcaPdf, nuevoLibro, pieDePaginaPdf,
} from "@/lib/exportar";
import { fmtCodigoReserva, moneyAr } from "@/lib/format";
import { fechaLarga } from "@/lib/gestion-dias";
import type { EstadoReservaDia, ReservaDia, ResumenDia } from "@/types/reservas-dia";

/*
 * La planilla de asistencia de un día: las reservas con quiénes vienen y
 * columnas vacías para marcar en el momento si cada visitante vino o no. Se
 * arma en el navegador; la asistencia no se registra en el sistema.
 */

const ETIQUETA_ESTADO: Record<EstadoReservaDia, string> = {
  pendiente: "Pendiente",
  pagada: "Pagada",
  cancelada_con_reembolso: "Cancelada con reembolso",
  cancelada_sin_reembolso: "Cancelada sin reembolso",
  finalizada: "Finalizada",
  expirada: "Expirada",
};

const horario = (r: ResumenDia) => (r.horaInicio ? `${r.horaInicio} – ${r.horaFin} h` : "");
const lugar = (r: ResumenDia) => [r.establecimiento, r.departamento].filter(Boolean).join(" · ");
const visitantesDe = (reservas: ReservaDia[]) => reservas.reduce((n, x) => n + x.personas, 0);

/**
 * Una fila por visitante. Una reserva que no trae el detalle de visitantes
 * igual ocupa una fila, para que no desaparezca de la planilla.
 */
function filasPorVisitante(r: ReservaDia) {
  return r.visitantes.length ? r.visitantes : [{ nombre: "", tipo: "", edad: null }];
}

/** "planilla-cosecha-de-uva-2026-06-04" */
export function nombrePlanilla(r: ResumenDia): string {
  const slug = r.nombre.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return ["planilla", slug, r.fecha].filter(Boolean).join("-");
}

const COLUMNAS = ["Reserva", "Estado", "Personas", "Total reserva (ARS)", "Visitante", "Tipo", "Edad", "Asistió", "Observaciones"];

/* ---- CSV ------------------------------------------------------------------ */

/** La planilla como CSV, con «Asistió» y «Observaciones» vacías para completar. */
export function planillaACsv(dia: ResumenDia, reservas: ReservaDia[]): string {
  const lineas = [
    fila("Actividad", dia.nombre),
    fila("Establecimiento", lugar(dia)),
    fila("Fecha", dia.fecha ? fechaLarga(dia.fecha) : ""),
    fila("Horario", horario(dia)),
    fila("Visitantes esperados", visitantesDe(reservas)),
    "",
    fila(...COLUMNAS),
  ];
  for (const r of reservas) {
    for (const v of filasPorVisitante(r)) {
      lineas.push(fila(fmtCodigoReserva(r.id), ETIQUETA_ESTADO[r.estado], r.personas, r.total, v.nombre, v.tipo, v.edad, "", ""));
    }
  }
  return armarCsv(lineas);
}

/* ---- Excel ---------------------------------------------------------------- */

/** La planilla como .xlsx: «Asistió» trae una lista Sí/No para marcar en la hoja. */
export async function planillaAXlsx(dia: ResumenDia, reservas: ReservaDia[]): Promise<ArrayBuffer> {
  const libro = await nuevoLibro();
  const hoja = libro.addWorksheet("Asistencia");
  hoja.columns = [
    { width: 14 }, { width: 14 }, { width: 10 }, { width: 20, style: { numFmt: FORMATO_PESOS } },
    { width: 32 }, { width: 14 }, { width: 8 }, { width: 10 }, { width: 40 },
  ];

  hoja.addRow(["Actividad", dia.nombre]);
  hoja.addRow(["Establecimiento", lugar(dia)]);
  hoja.addRow(["Fecha", dia.fecha ? fechaLarga(dia.fecha) : ""]);
  hoja.addRow(["Horario", horario(dia)]);
  hoja.addRow(["Visitantes esperados", visitantesDe(reservas)]);
  for (let i = 1; i <= 5; i++) hoja.getCell(i, 1).font = { bold: true };
  hoja.addRow([]);

  const cabecera = hoja.addRow(COLUMNAS).number;
  encabezarFila(hoja, cabecera);

  for (const r of reservas) {
    filasPorVisitante(r).forEach((v, i) => {
      const f = hoja.addRow([fmtCodigoReserva(r.id), ETIQUETA_ESTADO[r.estado], r.personas, r.total, v.nombre, v.tipo, v.edad, "", ""]);
      // Una línea arriba de cada reserva para que se lean agrupadas.
      if (i === 0) f.border = { top: { style: "thin", color: { argb: "FFD9D2C2" } } };
      f.getCell(8).dataValidation = { type: "list", allowBlank: true, formulae: ['"Sí,No"'] };
    });
  }
  hoja.views = [{ state: "frozen", ySplit: cabecera }];

  return libro.xlsx.writeBuffer();
}

/* ---- PDF ------------------------------------------------------------------ */

/**
 * La planilla como PDF A4 para imprimir: una fila por visitante, con la
 * reserva agrupando a los suyos, un casillero para marcar la asistencia y
 * lugar para anotar observaciones a mano.
 */
export async function planillaAPdf(dia: ResumenDia, reservas: ReservaDia[]): Promise<ArrayBuffer> {
  const { jsPDF, autoTable } = await cargarPdf();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const M = 15; // margen
  const ancho = doc.internal.pageSize.getWidth() - M * 2;
  const alto = doc.internal.pageSize.getHeight();
  let y = M + 4;

  // Encabezado, con la marca arriba a la derecha.
  marcaPdf(doc, M + ancho, M - 2);
  doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(...C.fg1);
  doc.text("Planilla de asistencia", M, y);
  y += 7;
  // Un nombre o un lugar largos bajan de renglón y empujan lo que sigue.
  // El nombre va más angosto para no pisar la marca.
  doc.setFontSize(12);
  const nombre = doc.splitTextToSize(dia.nombre, ancho - 45) as string[];
  doc.text(nombre, M, y);
  y += 5.5 * nombre.length;
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...C.fg2);
  const datos = doc.splitTextToSize(
    [dia.fecha ? fechaLarga(dia.fecha) : "", horario(dia), lugar(dia)].filter(Boolean).join(" · "),
    ancho,
  ) as string[];
  doc.text(datos, M, y);
  y += 5 * datos.length;
  const n = visitantesDe(reservas);
  doc.text(
    `${reservas.length} ${reservas.length === 1 ? "reserva" : "reservas"} · ${n} ${n === 1 ? "visitante esperado" : "visitantes esperados"}`,
    M, y,
  );
  y += 4;
  doc.setDrawColor(...C.linea).setLineWidth(0.3).line(M, y, M + ancho, y);
  y += 6;

  const COL_ASISTENCIA = 4;

  const body = reservas.flatMap((r) =>
    filasPorVisitante(r).map((v, i) => [
      ...(i === 0
        ? [{
            content: `${fmtCodigoReserva(r.id)}\n${r.personas} ${r.personas === 1 ? "persona" : "personas"}\n${ETIQUETA_ESTADO[r.estado]} · ${moneyAr(r.total)}`,
            rowSpan: filasPorVisitante(r).length,
            styles: { valign: "top" as const, fillColor: C.crema },
          }]
        : []),
      v.nombre || "Sin detalle de visitantes",
      v.tipo,
      v.edad == null ? "" : String(v.edad),
      "", "",
    ]),
  );

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M, bottom: 16 },
    theme: "grid",
    // Una reserva cortada al pie deja su código en una hoja y el estado en la otra.
    rowPageBreak: "avoid",
    head: [["Reserva", "Visitante", "Tipo", "Edad", "Asistió", "Observaciones"]],
    body: body.length
      ? body
      : [[{ content: "No hay reservas pagadas para este día.", colSpan: 6, styles: { halign: "center", textColor: C.fg3 } }]],
    styles: { font: "helvetica", fontSize: 9, textColor: C.fg1, lineColor: C.linea, lineWidth: 0.2, cellPadding: 2.2, minCellHeight: 12, valign: "middle" },
    headStyles: { fillColor: C.verde, textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 34, fontSize: 8 },
      2: { cellWidth: 20 },
      3: { cellWidth: 12, halign: "right" },
      [COL_ASISTENCIA]: { cellWidth: 18 },
      // Se queda con el ancho que libera no tener «No vino».
      5: { cellWidth: 50 },
    },
    // Casillero vacío para marcar con birome.
    didDrawCell: (h) => {
      if (h.section !== "body" || !body.length || h.column.index !== COL_ASISTENCIA) return;
      const lado = 4;
      doc.setDrawColor(...C.fg2).setLineWidth(0.3);
      doc.rect(h.cell.x + (h.cell.width - lado) / 2, h.cell.y + (h.cell.height - lado) / 2, lado, lado, "S");
    },
  });

  // Totales y firma al pie de la tabla; si no entran, en una hoja nueva.
  const finTabla = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  let yPie = finTabla + 12;
  if (yPie + 14 > alto - 16) {
    doc.addPage();
    yPie = M + 10;
  }
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...C.fg1);
  doc.text(`Presentes: ________ de ${n}`, M, yPie);
  doc.text("Firma del responsable: ______________________________", M + ancho, yPie, { align: "right" });

  pieDePaginaPdf(doc, M);
  return doc.output("arraybuffer");
}
