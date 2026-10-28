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
