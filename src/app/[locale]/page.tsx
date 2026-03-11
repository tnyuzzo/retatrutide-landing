"use client";

import { useState, useEffect } from "react";
import { sendFbEvent } from '@/lib/fb-tracking';
import { RecentSalesPopup } from "@/components/ui/RecentSalesPopup";
import { HomeStructuredData } from "@/components/seo/HomeStructuredData";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { TrustTicker } from "@/components/landing/TrustTicker";
import { QualityPipeline } from "@/components/landing/QualityPipeline";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { WhyAuraSection } from "@/components/landing/WhyAuraSection";
import { ProductSpecs } from "@/components/landing/ProductSpecs";
import { CalculatorCTA } from "@/components/landing/CalculatorCTA";
import { BuyerProtection } from "@/components/landing/BuyerProtection";
import { FaqSection } from "@/components/landing/FaqSection";
import { Footer } from "@/components/landing/Footer";
import { StickyBar } from "@/components/landing/StickyBar";
import { CoaModal } from "@/components/landing/CoaModal";

export default function Home() {
  const [showCoaModal, setShowCoaModal] = useState(false);

  useEffect(() => {
    sendFbEvent('ViewContent', null, {
      content_name: 'Triple-G',
      content_category: 'product',
      content_ids: ['RET-KIT-1'],
      value: 197,
      currency: 'EUR',
    }, 'homepage');
  }, []);

  return (
    <main className="min-h-screen bg-brand-void text-white overflow-hidden font-sans">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <TrustTicker />
      <QualityPipeline />
      <TestimonialsSection />
      <WhyAuraSection />
      <ProductSpecs />
      <CalculatorCTA />
      <BuyerProtection />
      <FaqSection />
      <Footer />
      <CoaModal open={showCoaModal} onClose={() => setShowCoaModal(false)} />
      <StickyBar />
      <RecentSalesPopup />
      <HomeStructuredData />
    </main>
  );
}
