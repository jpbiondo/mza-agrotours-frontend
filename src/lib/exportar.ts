import { fmtDiaLocal } from "@/lib/format";

/*
 * Lo que comparten los archivos que se arman en el navegador (reporte de
 * estadísticas, planilla del día). Las librerías de Excel y PDF pesan, así que
 * se cargan recién cuando alguien pide el archivo.
 */

export type FormatoExport = "pdf" | "csv" | "xlsx";

const TIPOS: Record<FormatoExport, string> = {
  csv: "text/csv;charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
};

/** Baja un archivo generado en el navegador. */
export function descargar(contenido: BlobPart, nombre: string, formato: FormatoExport) {
  const url = URL.createObjectURL(new Blob([contenido], { type: TIPOS[formato] }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  // Revocar en el mismo tick puede cortar la descarga en algunos navegadores.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/* ---- CSV ------------------------------------------------------------------ */

type Celda = string | number | null;

/** Una celda CSV: entre comillas si trae coma, comilla o salto de línea. */
function celda(v: Celda): string {
  const s = v == null ? "" : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function filaCsv(...celdas: Celda[]): string {
  return celdas.map(celda).join(",");
}

/** Junta las líneas con BOM, para que Excel abra los acentos bien. */
export function armarCsv(lineas: string[]): string {
  return "﻿" + lineas.join("\r\n");
}

/* ---- Excel ---------------------------------------------------------------- */

export const VERDE_XLSX = "FF154212";
export const FORMATO_PESOS = '"$" #,##0';

/** Un libro vacío de exceljs, con el autor puesto. */
export async function nuevoLibro() {
  // exceljs es CommonJS: según el bundler, `Workbook` llega suelto o bajo `default`.
  const mod = await import("exceljs");
  const Workbook = (mod as unknown as { default?: typeof mod }).default?.Workbook ?? mod.Workbook;
  const libro = new Workbook();
  libro.creator = "Mendoza AgroTours";
  libro.created = new Date();
  return libro;
}

type Libro = Awaited<ReturnType<typeof nuevoLibro>>;
export type Hoja = ReturnType<Libro["addWorksheet"]>;

/** Pinta una fila como encabezado de tabla: blanco sobre verde. */
export function encabezarFila(hoja: Hoja, nroFila: number) {
  const f = hoja.getRow(nroFila);
  f.font = { bold: true, color: { argb: "FFFFFFFF" } };
  f.fill = { type: "pattern", pattern: "solid", fgColor: { argb: VERDE_XLSX } };
}

/* ---- PDF ------------------------------------------------------------------ */

// Paleta del sitio, en RGB para jsPDF.
export type RGB = [number, number, number];
export const C = {
  verde: [21, 66, 18] as RGB,
  verdeBorde: [45, 90, 39] as RGB,
  verdeBarra: [234, 241, 226] as RGB,
  fg1: [42, 38, 32] as RGB,
  fg2: [92, 86, 78] as RGB,
  fg3: [138, 130, 120] as RGB,
  linea: [217, 210, 194] as RGB,
  crema: [245, 241, 234] as RGB,
};

/**
 * Las fuentes estándar de PDF no tienen el menos tipográfico (−); con él, el
 * signo saldría como un carácter roto.
 */
export const pdfTexto = (s: string) => s.replace(/−/g, "-");

/** jsPDF y autoTable, cargados a pedido. */
export async function cargarPdf() {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  return { jsPDF, autoTable };
}

export type Doc = InstanceType<typeof import("jspdf").jsPDF>;

/**
 * El logo de `public/logo-pano.svg` dibujado en vectores (sale nítido al
 * imprimir y no hay que cargar una imagen) con «Mendoza AgroTours» al lado,
 * como en el sidebar. Se alinea a la derecha en `derecha`; `arriba` es el borde
 * superior del logo.
 */
export function marcaPdf(doc: Doc, derecha: number, arriba: number) {
  const ALTO = 9;
  const k = ALTO / 64; // el viewBox del SVG es 96 × 64
  const palabra = "Mendoza";
  doc.setFont("helvetica", "bold").setFontSize(11.5);
  const anchoTexto = Math.max(doc.getTextWidth(palabra), 19);
  const xTexto = derecha - anchoTexto;
  const x = xTexto - 2.5 - 96 * k;
  const X = (u: number) => x + u * k;
  const Y = (v: number) => arriba + v * k;

  doc.setFillColor(199, 127, 42).circle(X(46), Y(18), 8.5 * k, "F");
  doc.setFillColor(127, 168, 118).triangle(X(2), Y(42), X(20), Y(24), X(38), Y(42), "F");
  doc.setFillColor(21, 66, 18).triangle(X(58), Y(6), X(88), Y(42), X(28), Y(42), "F");

  // Los surcos son cuadráticas con el control en x = 48; jsPDF sólo dibuja cúbicas.
  doc.setDrawColor(128, 85, 51).setLineWidth(3 * k).setLineCap("round");
  for (const [x0, y0, yc, x2] of [[10, 47, 42.5, 86], [5, 53, 48, 91], [2, 59.5, 54, 94]]) {
    const c1 = [(2 / 3) * (48 - x0), (2 / 3) * (yc - y0)];
    const c2 = [x2 - x0 + (2 / 3) * (48 - x2), (2 / 3) * (yc - y0)];
    doc.lines([[c1[0] * k, c1[1] * k, c2[0] * k, c2[1] * k, (x2 - x0) * k, 0]], X(x0), Y(y0), [1, 1], "S", false);
  }
  doc.setLineCap("butt");

  doc.setTextColor(...C.verde).text(palabra, xTexto, arriba + 4.6);
  doc.setFontSize(6).setTextColor(128, 85, 51).text("AGROTOURS", xTexto, arriba + 8.2, { charSpace: 0.45 });
}

/** Pie en todas las páginas, una vez que se sabe cuántas son. */
export function pieDePaginaPdf(doc: Doc, margen: number) {
  const paginas = doc.getNumberOfPages();
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...C.fg3);
    doc.text(`Generado el ${fmtDiaLocal(new Date())} · Mendoza AgroTours`, margen, alto - 8);
    doc.text(`${i} / ${paginas}`, ancho - margen, alto - 8, { align: "right" });
  }
}
