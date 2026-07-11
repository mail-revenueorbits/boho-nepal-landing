import React, { useEffect } from 'react';
import './TShirtTheme.css';
import TShirtHeroSection from './TShirtHeroSection';
import TShirtOrderForm from './TShirtOrderForm';

const TShirtLandingPage = () => {
  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
    // Set a custom title for the T-Shirt
    document.title = "Wear Something They'll Read Twice | Boho Nepal";
  }, []);

  return (
    <div className="tshirt-theme">
      {/* Minimal Navbar for T-Shirt Landing */}
      <header style={{ padding: '1.5rem', borderBottom: '1px solid oklch(25% 0 0)', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Boho Nepal</h2>
      </header>

      <main>
        <TShirtHeroSection />
        <TShirtOrderForm />
      </main>

      <footer style={{ padding: '3rem 1.5rem', textAlign: 'center', borderTop: '1px solid oklch(25% 0 0)', color: 'var(--t-ink-muted)' }}>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>© {new Date().getFullYear()} Boho Nepal. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default TShirtLandingPage;

