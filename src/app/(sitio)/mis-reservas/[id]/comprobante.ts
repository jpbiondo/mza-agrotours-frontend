import { ESTADO_LABEL, reservaTotal } from "@/data/reservas";
import type { Reserva } from "@/types/reservas";

function asciiSafe(s: string): string {
  return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\x20-\x7e]/g, " ");
}

/** Genera un PDF mínimo (Helvetica, A4) sin librerías externas. */
function buildComprobantePDF(r: Reserva): string {
  const total = reservaTotal(r);
  const L: string[] = [];
  L.push("MENDOZA AGROTOURS");
  L.push("Comprobante de reserva");
  L.push("");
  L.push("Codigo de reserva:  " + r.id);
  L.push("Estado:             " + ESTADO_LABEL[r.estado]);
  L.push("");
  L.push("Actividad:          " + r.titulo);
  L.push("Establecimiento:    " + r.finca);
  L.push("Direccion:          " + (r.direccion || r.loc));
  L.push("Productor/a:        " + r.productor);
  L.push("");
  L.push("Fecha:              " + r.fechaLabel);
  L.push("Horario:            " + r.horario);
  L.push("Cantidad personas:  " + r.personas);
  L.push("");
  L.push("DESGLOSE DE PAGO");
  L.push("-----------------------------------------------");
  r.desglose.forEach((g) => {
    const sub = g.cantidad * g.precio;
    const left = g.grupo + "  (" + g.cantidad + " x $ " + g.precio.toLocaleString("es-AR") + ")";
    L.push(left.padEnd(38) + "$ " + sub.toLocaleString("es-AR"));
  });
  L.push("-----------------------------------------------");
  L.push("TOTAL".padEnd(38) + "$ " + total.toLocaleString("es-AR"));
  L.push("");
  L.push("Emitido: " + new Date().toLocaleDateString("es-AR") + "   ·   www.mendozaagrotours.ar");

  let content = "BT\n/F1 11 Tf\n15 TL\n56 786 Td\n";
  L.forEach((ln) => {
    const esc = asciiSafe(ln).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
    content += "(" + esc + ") Tj\nT*\n";
  });
  content += "ET";

  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    "<< /Length " + content.length + " >>\nstream\n" + content + "\nendstream",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += i + 1 + " 0 obj\n" + o + "\nendobj\n";
  });
  const xref = pdf.length;
  pdf += "xref\n0 " + (objs.length + 1) + "\n0000000000 65535 f \n";
  offsets.forEach((off) => { pdf += String(off).padStart(10, "0") + " 00000 n \n"; });
  pdf += "trailer\n<< /Size " + (objs.length + 1) + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF";
  return pdf;
}

export function descargarComprobante(r: Reserva): void {
  const blob = new Blob([buildComprobantePDF(r)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Comprobante-" + r.id + ".pdf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
