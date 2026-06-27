import Image from "next/image";
import Link from "next/link";
import { AtSign, Globe } from "lucide-react";

const COLS = [
  {
    title: "Explorar",
    links: [
      { href: "#actividades", label: "Actividades" },
      { href: "#establecimientos", label: "Establecimientos" },
      { href: "#faq", label: "Preguntas frecuentes" },
    ],
  },
  {
    title: "Cuenta",
    links: [
      { href: "/acceso", label: "Iniciar sesión" },
      { href: "/registro?vista=registro", label: "Registrarse" },
      { href: "#contacto", label: "Contacto" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer style={{ background: "var(--green-900)", color: "var(--fg-on-dark)" }}>
      <div
        style={{
          maxWidth: 1160, margin: "0 auto", padding: "56px 28px 32px",
          display: "grid", gridTemplateColumns: "minmax(0,1.4fr) repeat(2, minmax(0,1fr))", gap: 40,
        }}
        className="footer-grid"
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
            <Image src="/logo-mark.svg" width={36} height={36} alt="" />
            <div style={{ lineHeight: 1 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#fff" }}>Mendoza</div>
              <div style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600, color: "var(--green-300)", marginTop: 2 }}>AgroTours</div>
            </div>
          </div>
          <p style={{ fontSize: 14, color: "rgba(247,245,241,.7)", lineHeight: 1.6, maxWidth: 320, margin: 0 }}>
            Turismo rural participativo que conecta visitantes con los productores de Mendoza.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            {[AtSign, Globe].map((Icon, i) => (
              <a
                key={i}
                href="#"
                style={{
                  width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,.08)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff",
                }}
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        {COLS.map((col) => (
          <div key={col.title}>
            <div style={{ fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--green-300)", marginBottom: 16 }}>
              {col.title}
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 11 }}>
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} style={{ fontSize: 14, color: "rgba(247,245,241,.78)", textDecoration: "none" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,.1)" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "20px 28px", fontSize: 13, color: "rgba(247,245,241,.6)" }}>
          © {new Date().getFullYear()} Mendoza AgroTours. Todos los derechos reservados.
        </div>
      </div>

      <style>{`
        @media (max-width: 720px) { .footer-grid { grid-template-columns: 1fr 1fr !important; } }
      `}</style>
    </footer>
  );
}
