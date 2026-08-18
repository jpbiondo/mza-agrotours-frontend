"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2, User } from "lucide-react";
import { TextField } from "@/components/ui/text-field";

/** Etiqueta + campo. Local porque es el único formulario del landing. */
function Campo({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={htmlFor} className="text-[13.5px] font-semibold text-fg-1">
        {label}
      </label>
      {children}
    </div>
  );
}

const INFO = [
  { icon: <Mail size={18} color="var(--green-800)" />, label: "Correo", value: "hola@mendozaagrotours.ar" },
  { icon: <Phone size={18} color="var(--green-800)" />, label: "Teléfono", value: "+54 9 261 555-0100" },
  { icon: <MapPin size={18} color="var(--green-800)" />, label: "Ubicación", value: "Ciudad de Mendoza, Argentina" },
];

export default function ContactoSection() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [sent, setSent] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // MOCK — reemplazar por el envío real cuando el backend esté listo
    setSent(true);
  }

  return (
    <section style={{ background: "var(--cream-tert)", borderTop: "1px solid var(--outline-variant)" }}>
      <div
        id="contacto"
        style={{
          maxWidth: 1000, margin: "0 auto", padding: "80px 28px",
          display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.2fr)", gap: 48, alignItems: "start",
        }}
        className="contacto-grid"
      >
        <div>
          <div className="t-label" style={{ color: "var(--brown-700)", marginBottom: 10 }}>CONTACTANOS</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--fg-1)", margin: 0, letterSpacing: "-.01em" }}>
            ¿Tenés una consulta?
          </h2>
          <p style={{ fontSize: 16, color: "var(--fg-2)", lineHeight: 1.55, margin: "12px 0 28px" }}>
            Escribinos y te respondemos dentro de las 24 horas hábiles. Si sos productor y querés
            sumar tu finca, también es por acá.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {INFO.map(({ icon, label, value }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 13 }}>
                <span
                  style={{
                    width: 40, height: 40, borderRadius: 10, background: "var(--green-050)",
                    display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  {icon}
                </span>
                <div>
                  <div style={{ fontSize: 12.5, color: "var(--fg-3)" }}>{label}</div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--fg-1)" }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: "28px 30px" }}>
          {sent ? (
            <div className="pop" style={{ textAlign: "center", padding: "24px 0" }}>
              <div
                style={{
                  width: 72, height: 72, borderRadius: "50%", background: "var(--success-fill)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px",
                }}
              >
                <CheckCircle2 size={38} color="var(--success-fg)" />
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "var(--fg-1)", margin: 0 }}>
                ¡Mensaje enviado!
              </h3>
              <p style={{ fontSize: 14.5, color: "var(--fg-2)", lineHeight: 1.55, margin: "10px 0 0" }}>
                Gracias por escribirnos{nombre ? `, ${nombre.split(" ")[0]}` : ""}. Te vamos a responder a la brevedad.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Campo label="Nombre y apellido" htmlFor="ct-nombre">
                <TextField id="ct-nombre" icon={<User />} value={nombre} placeholder="Tu nombre" autoComplete="name" onChange={setNombre} />
              </Campo>
              <Campo label="Correo" htmlFor="ct-email">
                <TextField id="ct-email" icon={<Mail />} type="email" value={email} placeholder="nombre@dominio.com" inputMode="email" autoComplete="email" onChange={setEmail} />
              </Campo>
              <Campo label="Mensaje" htmlFor="ct-msg">
                <textarea
                  id="ct-msg"
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Contanos en qué podemos ayudarte…"
                  rows={4}
                  className="textarea"
                />
              </Campo>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }}>
                <Send size={18} /> Enviar mensaje
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 760px) { .contacto-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
