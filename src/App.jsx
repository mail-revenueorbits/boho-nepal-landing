import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import OfferSection from './components/OfferSection';
import GallerySection from './components/GallerySection';
import Footer from './components/Footer';
import StickyCTA from './components/StickyCTA';
import AdminPage from './components/AdminPage';
import TShirtLandingPage from './components/TShirtLandingPage';
import { initAnalytics, setupBehavioralTracking } from './utils/analytics';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    // Start GA4, Microsoft Clarity and Meta Pixel
    initAnalytics();

    // Start tracking user scrolls, sessions, and UTMs
    const cleanupBehavioral = setupBehavioralTracking();

    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      cleanupBehavioral();
    };
  }, []);

  const isAdminPath = currentPath === '/admin' || currentPath === '/admin/';
  const isTShirtLanding = currentPath === '/landing/t-shirt' || currentPath === '/landing/t-shirt/';

  if (isAdminPath) {
    return <AdminPage />;
  }

  if (isTShirtLanding) {
    return <TShirtLandingPage />;
  }

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

