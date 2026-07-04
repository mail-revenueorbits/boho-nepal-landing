import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import OfferSection from './components/OfferSection';
import GallerySection from './components/GallerySection';
import Footer from './components/Footer';
import StickyCTA from './components/StickyCTA';
import AdminPage from './components/AdminPage';
import { initPixel } from './utils/facebook-pixel';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    initPixel();

    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const isAdminPath = currentPath === '/admin' || currentPath === '/admin/';

  if (isAdminPath) {
    return <AdminPage />;
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

