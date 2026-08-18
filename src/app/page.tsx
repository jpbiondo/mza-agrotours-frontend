import SiteHeader from "@/components/SiteHeader";
import type { NavLink } from "@/components/SiteHeader";
import Hero from "@/components/landing/Hero";
import ActividadesSection from "@/components/landing/ActividadesSection";
import EstablecimientosSection from "@/components/landing/EstablecimientosSection";
import FaqSection from "@/components/landing/FaqSection";
import ContactoSection from "@/components/landing/ContactoSection";
import SiteFooter from "@/components/landing/SiteFooter";

// El landing navega por anclas de sección (misma página), no por rutas.
const LANDING_LINKS: NavLink[] = [
  { id: "actividades", href: "#actividades", label: "Actividades" },
  { id: "establecimientos", href: "#establecimientos", label: "Establecimientos" },
  { id: "faq", href: "#faq", label: "Preguntas frecuentes" },
  { id: "contacto", href: "#contacto", label: "Contacto" },
];

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-bg)" }}>
      <SiteHeader navLinks={LANDING_LINKS} maxWidth={1160} />
      <main>
        <Hero />
        <ActividadesSection />
        <EstablecimientosSection />
        <FaqSection />
        <ContactoSection />
      </main>
      <SiteFooter />
    </div>
  );
}
