import {
  C, FORMATO_PESOS, armarCsv, cargarPdf, encabezarFila, filaCsv as fila, nuevoLibro, pdfTexto, pieDePaginaPdf, type Doc,
} from "@/lib/exportar";
import { fmtFecha, fmtPctConSigno, moneyAr } from "@/lib/format";
import type { Estadisticas, RangoFechas } from "@/types/estadisticas";

/*
 * El reporte se arma en el navegador con los datos que ya están en pantalla:
 * el backend no tiene un endpoint que lo genere.
 */

/** Qué incluye el reporte: sólo la tabla, o además los KPIs y la serie. */
export type AlcanceReporte = "performance" | "completo";

/** Lo que el reporte nombra y que no viene en las estadísticas. */
export interface EncabezadoReporte {
  establecimiento: string;
  /** Rótulo del período: "Últimos 6 meses". */
  periodo: string;
}

const rango = (r: RangoFechas) => `${fmtFecha(r.desde)} – ${fmtFecha(r.hasta)}`;

const COLUMNAS_ACTIVIDADES = ["Actividad", "Cultivo", "Cupos totales", "Reservas", "Ingresos del período (ARS)", "Ocupación (%)"];

/* ---- CSV ------------------------------------------------------------------ */

/**
 * Las estadísticas como CSV. Los montos van como número pelado, sin "$" ni
 * separador de miles, para que la planilla los pueda sumar.
 */
export function estadisticasACsv(data: Estadisticas, alcance: AlcanceReporte, enc: EncabezadoReporte): string {
  const lineas: string[] = [fila("Establecimiento", enc.establecimiento), fila("Período", `${enc.periodo} (${rango(data.actual)})`)];

  if (alcance === "completo") {
    const { kpis, serie, anterior } = data;
    if (anterior) lineas.push(fila("Período anterior", rango(anterior)));
    lineas.push("");
    lineas.push(fila("Indicador", "Valor"));
    lineas.push(fila("Ocupación (%)", kpis.ocupacionPct));
    lineas.push(fila("Cupos reservados", kpis.ocupacionFilled));
    lineas.push(fila("Cupos ofertados", kpis.ocupacionTotal));
    lineas.push(fila("Beneficios totales (ARS)", kpis.beneficios));
    lineas.push(fila("Variación vs. período anterior (%)", kpis.beneficiosDelta));
    lineas.push(fila("Cancelaciones (%)", kpis.cancelacionPct));
    lineas.push(fila("Reservas canceladas", kpis.cancelacionCount));
    lineas.push("");
    lineas.push(fila(serie.title));
    lineas.push(fila("Período", "Reservas confirmadas", "Ganancia (ARS)"));
    for (const b of serie.bars) lineas.push(fila(b.label, b.value, b.ganancia ?? 0));
  }

  lineas.push("");
  lineas.push(fila(...COLUMNAS_ACTIVIDADES));
  for (const a of data.actividades) {
    lineas.push(fila(a.nombre, a.cultivo, a.cupos, a.reservas, a.ingresos, a.ocupacion));
  }

  return armarCsv(lineas);
}

/* ---- Excel ---------------------------------------------------------------- */

/** Las estadísticas como .xlsx: una hoja por bloque, con los montos como número y formato de pesos. */
export async function estadisticasAXlsx(data: Estadisticas, alcance: AlcanceReporte, enc: EncabezadoReporte): Promise<ArrayBuffer> {
  const libro = await nuevoLibro();

  if (alcance === "completo") {
    const { kpis, serie, anterior } = data;

    const resumen = libro.addWorksheet("Resumen");
    resumen.columns = [{ width: 38 }, { width: 28 }];
    resumen.addRow(["Establecimiento", enc.establecimiento]);
    resumen.addRow(["Período", `${enc.periodo} (${rango(data.actual)})`]);
    if (anterior) resumen.addRow(["Período anterior", rango(anterior)]);
    resumen.addRow([]);
    encabezarFila(resumen, resumen.addRow(["Indicador", "Valor"]).number);
    resumen.addRow(["Ocupación (%)", kpis.ocupacionPct]);
    resumen.addRow(["Cupos reservados", kpis.ocupacionFilled]);
    resumen.addRow(["Cupos ofertados", kpis.ocupacionTotal]);
    resumen.addRow(["Beneficios totales", kpis.beneficios]).getCell(2).numFmt = FORMATO_PESOS;
    resumen.addRow(["Variación vs. período anterior (%)", kpis.beneficiosDelta ?? "Sin datos"]);
    resumen.addRow(["Cancelaciones (%)", kpis.cancelacionPct]);
    resumen.addRow(["Reservas canceladas", kpis.cancelacionCount]);
    resumen.getColumn(1).font = { bold: true };

    const hojaSerie = libro.addWorksheet("Serie");
    hojaSerie.columns = [{ width: 14 }, { width: 24 }, { width: 18, style: { numFmt: FORMATO_PESOS } }];
    encabezarFila(hojaSerie, hojaSerie.addRow(["Período", "Reservas confirmadas", "Ganancia"]).number);
    for (const b of serie.bars) hojaSerie.addRow([b.label, b.value, b.ganancia ?? 0]);
  }

  const hojaAct = libro.addWorksheet("Actividades");
  hojaAct.columns = [
    { width: 40 }, { width: 28 }, { width: 14 }, { width: 12 },
    { width: 24, style: { numFmt: FORMATO_PESOS } }, { width: 14 },
  ];
  encabezarFila(hojaAct, hojaAct.addRow(COLUMNAS_ACTIVIDADES).number);
  for (const a of data.actividades) hojaAct.addRow([a.nombre, a.cultivo, a.cupos, a.reservas, a.ingresos, a.ocupacion]);
  hojaAct.views = [{ state: "frozen", ySplit: 1 }];

  return libro.xlsx.writeBuffer();
}

/* ---- PDF ------------------------------------------------------------------ */

/** Las estadísticas como PDF A4: encabezado, KPIs y gráfico (si es completo) y la tabla. */
export async function estadisticasAPdf(data: Estadisticas, alcance: AlcanceReporte, enc: EncabezadoReporte): Promise<ArrayBuffer> {
  const { jsPDF, autoTable } = await cargarPdf();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const M = 15; // margen
  const ancho = doc.internal.pageSize.getWidth() - M * 2;
  let y = M + 4;

  // Encabezado.
  doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(...C.fg1);
  doc.text("Estadísticas y reportes", M, y);
  y += 7;
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...C.fg2);
  doc.text(`${enc.establecimiento} · ${enc.periodo} · ${rango(data.actual)}`, M, y);
  y += 4;
  doc.setDrawColor(...C.linea).setLineWidth(0.3).line(M, y, M + ancho, y);
  y += 8;

  if (alcance === "completo") {
    y = kpisPdf(doc, data, M, y, ancho);
    y = seriePdf(doc, data, M, y + 8, ancho);
    y += 10;
  }

  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...C.fg1);
  doc.text("Performance por actividad", M, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [["Actividad", "Cupos", "Reservas", "Ingresos", "Ocupación"]],
    body: data.actividades.length
      ? data.actividades.map((a) => [
          a.cultivo ? `${a.nombre}\n${a.cultivo}` : a.nombre,
          a.cupos, a.reservas, moneyAr(a.ingresos), `${a.ocupacion}%`,
        ])
      : [[{ content: "No hay actividades vigentes en este período.", colSpan: 5, styles: { halign: "center", textColor: C.fg3 } }]],
    styles: { font: "helvetica", fontSize: 9, textColor: C.fg1, lineColor: C.linea, cellPadding: 2.5 },
    headStyles: { fillColor: C.verde, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: C.crema },
    columnStyles: {
      1: { halign: "right" }, 2: { halign: "right" },
      3: { halign: "right", fontStyle: "bold" }, 4: { halign: "right" },
    },
  });

  pieDePaginaPdf(doc, M);

  return doc.output("arraybuffer");
}

/** Las tres tarjetas de KPI en fila. Devuelve dónde terminan. */
function kpisPdf(doc: Doc, data: Estadisticas, x: number, y: number, ancho: number): number {
  const { kpis, anterior } = data;
  const gap = 5;
  const w = (ancho - gap * 2) / 3;
  const h = 32;

  const delta = kpis.beneficiosDelta == null
    ? "Sin período anterior para comparar"
    : `${pdfTexto(fmtPctConSigno(kpis.beneficiosDelta))} vs. período anterior`;

  const tarjetas = [
    { titulo: "OCUPACIÓN", valor: `${kpis.ocupacionPct}%`, pie: `${kpis.ocupacionFilled} de ${kpis.ocupacionTotal} cupos reservados` },
    { titulo: "BENEFICIOS TOTALES", valor: moneyAr(kpis.beneficios), pie: delta, nota: anterior ? `(${rango(anterior)})` : undefined },
    { titulo: "CANCELACIONES", valor: `${kpis.cancelacionPct}%`, pie: `${kpis.cancelacionCount} ${kpis.cancelacionCount === 1 ? "reserva cancelada" : "reservas canceladas"}` },
  ];

  tarjetas.forEach((t, i) => {
    const tx = x + i * (w + gap);
    doc.setDrawColor(...C.linea).setLineWidth(0.3).roundedRect(tx, y, w, h, 2, 2, "S");
    doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(...C.fg2);
    doc.text(t.titulo, tx + 4, y + 6);
    doc.setFontSize(18).setTextColor(...C.fg1);
    doc.text(t.valor, tx + 4, y + 16);
    doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...C.fg2);
    doc.text(t.pie, tx + 4, y + 23, { maxWidth: w - 8 });
    if (t.nota) {
      doc.setTextColor(...C.fg3);
      doc.text(t.nota, tx + 4, y + 27);
    }
  });

  return y + h;
}

/** El gráfico de barras dibujado en vectores, igual que en pantalla. Devuelve dónde termina. */
function seriePdf(doc: Doc, data: Estadisticas, x: number, y: number, ancho: number): number {
  const { serie } = data;
  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...C.fg1);
  doc.text(serie.title || "Reservas totales", x, y);
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...C.fg3);
  doc.text("Reservas confirmadas por período; debajo, la ganancia.", x, y + 5);

  const top = y + 12;
  const altoBarras = 50;
  const base = top + altoBarras;
  const izq = x + 8; // lugar para los rótulos del eje
  const anchoBarras = ancho - 8;

  const max = Math.max(10, ...serie.bars.map((b) => b.value));
  const tope = max <= 20 ? Math.ceil(max / 5) * 5 : max <= 100 ? Math.ceil(max / 20) * 20 : Math.ceil(max / 50) * 50;

  // Grilla.
  doc.setFontSize(7).setTextColor(...C.fg3);
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    const gy = base - t * altoBarras;
    doc.setDrawColor(...C.linea).setLineWidth(t === 0 ? 0.35 : 0.2);
    doc.setLineDashPattern(t === 0 ? [] : [1, 1.2], 0);
    doc.line(izq, gy, izq + anchoBarras, gy);
    doc.text(String(Math.round(tope * t)), izq - 2, gy + 1, { align: "right" });
  }
  doc.setLineDashPattern([], 0);

  const slot = anchoBarras / Math.max(1, serie.bars.length);
  const wBarra = Math.min(14, slot * 0.62);
  serie.bars.forEach((b, i) => {
    const cx = izq + slot * i + slot / 2;
    const h = (b.value / tope) * altoBarras;
    if (h > 0) {
      doc.setFillColor(...C.verdeBarra).setDrawColor(...C.verdeBorde).setLineWidth(0.35);
      // Con una barra muy baja, el redondeo sería más grande que ella.
      if (h > 3) doc.roundedRect(cx - wBarra / 2, base - h, wBarra, h, 1.2, 1.2, "FD");
      else doc.rect(cx - wBarra / 2, base - h, wBarra, h, "FD");
      doc.setFont("helvetica", "bold").setFontSize(7).setTextColor(...C.verde);
      doc.text(String(b.value), cx, base - h - 1.5, { align: "center" });
    }
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...C.fg2);
    doc.text(b.label, cx, base + 5, { align: "center" });
    doc.setFontSize(6.5).setTextColor(...C.fg3);
    doc.text(moneyAr(b.ganancia ?? 0), cx, base + 9, { align: "center" });
  });

  return base + 9;
}
