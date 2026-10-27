import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/landing/Hero";
import ActividadesSection from "@/components/landing/ActividadesSection";
import EstablecimientosSection from "@/components/landing/EstablecimientosSection";
import FaqSection from "@/components/landing/FaqSection";
import ProductoresSection from "@/components/landing/ProductoresSection";
import SiteFooter from "@/components/landing/SiteFooter";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-bg)" }}>
      <SiteHeader />
      <main>
        <Hero />
        <ActividadesSection />
        <EstablecimientosSection />
        <FaqSection />
        <ProductoresSection />
      </main>
      <SiteFooter />
    </div>
  );
}
