import SiteHeader from "@/components/SiteHeader";
import type { NavLink } from "@/components/SiteHeader";
import Hero from "@/components/landing/Hero";
import ActividadesSection from "@/components/landing/ActividadesSection";
import EstablecimientosSection from "@/components/landing/EstablecimientosSection";
import FaqSection from "@/components/landing/FaqSection";
import ContactoSection from "@/components/landing/ContactoSection";
import SiteFooter from "@/components/landing/SiteFooter";

const LANDING_LINKS: NavLink[] = [
  { id: "explorar", href: "#actividades", label: "Actividades" },
  { id: "establecimientos", href: "#establecimientos", label: "Establecimientos" },
  { id: "cultivos", href: "/cultivos", label: "Cultivos" },
  { id: "recetas", href: "/recetas", label: "Recetas" },
  { id: "faq", href: "#faq", label: "Preguntas frecuentes" },
  { id: "contacto", href: "#contacto", label: "Contacto"},
];

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-bg)" }}>
      <SiteHeader navLinks={LANDING_LINKS}/>
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
