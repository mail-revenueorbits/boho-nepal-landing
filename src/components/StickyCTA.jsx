import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import './StickyCTA.css';
import { trackPixelEvent } from '../utils/facebook-pixel';

const StickyCTA = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroBtn = document.getElementById('hero-cta-btn');
      const formElement = document.getElementById('order-form');

      let heroPassed = false;
      if (heroBtn) {
        const rect = heroBtn.getBoundingClientRect();
        // If the bottom of the hero button goes above the top of the viewport, hero is passed
        heroPassed = rect.bottom < 0;
      } else {
        // Fallback if button isn't loaded yet
        heroPassed = window.scrollY > 450;
      }

      let formIsOnScreen = false;
      if (formElement) {
        const rect = formElement.getBoundingClientRect();
        // Check if the form is within the visible viewport bounds
        formIsOnScreen = rect.top < window.innerHeight && rect.bottom > 0;
      }

      // Show sticky CTA only if the hero button is scrolled past, AND the order form is NOT visible on screen
      setIsVisible(heroPassed && !formIsOnScreen);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Run immediately on mount

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStickyClick = () => {
    trackPixelEvent('InitiateCheckout', { content_name: 'Sticky CTA' });
    const formElement = document.getElementById('order-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={`sticky-cta-container ${isVisible ? 'visible' : ''}`}>
      <button className="sticky-btn" onClick={handleStickyClick}>
        <ShoppingCart size={20} />
        <div className="sticky-text">
          <span className="main-text">Order Now - Cash on Delivery</span>
          <span className="sub-text">Free Delivery on 2+ Items</span>
        </div>
      </button>
    </div>
  );
};

export default StickyCTA;
