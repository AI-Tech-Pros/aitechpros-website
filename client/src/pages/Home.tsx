/*
 * Design: Quantum Glass — Luminous Glassmorphism
 * Home: Stealth-mode venture positioning — single-page layout
 * Sections: Hero → AI Dilemma → Runtime Engine → Production Workflows → Roadmap → Contact → Footer
 */
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import DesignPartnerSection from "@/components/DesignPartnerSection";
import TrustSection from "@/components/TrustSection";
import TechEdgeSection from "@/components/TechEdgeSection";
import RoadmapSection from "@/components/RoadmapSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0B0D17]">
      <Navbar />
      <HeroSection />
      <DesignPartnerSection />
      <TechEdgeSection />
      <TrustSection />
      <RoadmapSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
