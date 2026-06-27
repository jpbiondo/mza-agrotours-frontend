import LandingHeader from "@/components/landing/LandingHeader";
import Hero from "@/components/landing/Hero";
import ActividadesSection from "@/components/landing/ActividadesSection";
import EstablecimientosSection from "@/components/landing/EstablecimientosSection";
import FaqSection from "@/components/landing/FaqSection";
import ContactoSection from "@/components/landing/ContactoSection";
import SiteFooter from "@/components/landing/SiteFooter";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-bg)" }}>
      <LandingHeader />
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
