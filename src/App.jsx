import React, { useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import OfferSection from './components/OfferSection';
import GallerySection from './components/GallerySection';
import Footer from './components/Footer';
import StickyCTA from './components/StickyCTA';
import { initPixel } from './utils/facebook-pixel';

function App() {
  useEffect(() => {
    initPixel();
  }, []);

  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <OfferSection />
        <GallerySection />
      </main>
      <Footer />
      <StickyCTA />
    </>
  );
}

export default App;
