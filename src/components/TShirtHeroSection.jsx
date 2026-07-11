import React, { useState } from 'react';

const TShirtHeroSection = () => {
  const images = [
    '/t-shirt-images/t-shirt-1.png',
    '/t-shirt-images/t-shirt-2.png',
    '/t-shirt-images/t-shirt-3.png',
    '/t-shirt-images/t-shirt-4.png',
    '/t-shirt-images/t-shirt-5.png',
    '/t-shirt-images/t-shirt-6.png',
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToForm = () => {
    const formElement = document.getElementById('tshirt-order-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleScroll = (e) => {
    const container = e.target;
    const scrollPosition = container.scrollLeft;
    const slideWidth = container.clientWidth;
    if (slideWidth > 0) {
      const index = Math.round(scrollPosition / slideWidth);
      if (index !== activeIndex) {
        setActiveIndex(index);
      }
    }
  };

  const scrollToSlide = (index) => {
    const container = document.getElementById('tshirt-slider');
    if (container) {
      const slideWidth = container.clientWidth;
      container.scrollTo({ left: index * slideWidth, behavior: 'smooth' });
      setActiveIndex(index);
    }
  };

  return (
    <section className="t-hero-section">
      <div className="t-hero-image-slider">
        <div 
          id="tshirt-slider"
          style={{ 
            display: 'flex', 
            overflowX: 'auto', 
            scrollSnapType: 'x mandatory', 
            scrollbarWidth: 'none', 
            width: '100%', 
            height: '100%' 
          }}
          onScroll={handleScroll}
        >
          {images.map((src, idx) => (
            <img 
              key={idx}
              src={src} 
              alt={`T-Shirt view ${idx + 1}`} 
              style={{ flex: '0 0 100%', width: '100%', height: '100%', objectFit: 'cover', scrollSnapAlign: 'start' }} 
            />
          ))}
        </div>
        
        {/* Gallery Dots */}
        <div style={{ position: 'absolute', bottom: '1rem', left: '0', width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToSlide(idx)}
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: activeIndex === idx ? 'var(--t-accent)' : 'var(--t-ink-muted)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                opacity: activeIndex === idx ? 1 : 0.5
              }}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="container">

      <h1 className="t-hero-title">Wear Something They'll Read Twice.</h1>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <span style={{ color: 'var(--t-ink)', fontSize: '1.25rem' }}>★★★★★</span>
        <span style={{ color: 'var(--t-ink-muted)', fontSize: '0.875rem' }}>(Premium Quality)</span>
      </div>

      <ul className="t-feature-list">
        <li className="t-feature-item" style={{ color: 'var(--t-accent)', fontWeight: 800 }}>
          <span className="t-feature-icon">✓</span> Size: XL (Free Size)
        </li>
        <li className="t-feature-item">
          <span className="t-feature-icon">✓</span> Oversized Fit
        </li>
        <li className="t-feature-item">
          <span className="t-feature-icon">✓</span> Premium Cotton
        </li>
        <li className="t-feature-item">
          <span className="t-feature-icon">✓</span> Made in Nepal
        </li>
        <li className="t-feature-item">
          <span className="t-feature-icon">✓</span> Cash on Delivery
        </li>
      </ul>

      <div className="pricing-grid">
        <div className="pricing-tier">
          <div>
            <div className="pricing-tier-name">1 T-Shirt</div>
            <div className="pricing-tier-desc">+ Delivery Charge</div>
          </div>
          <div className="pricing-tier-price">Rs. 899</div>
        </div>
        <div className="pricing-tier" style={{ borderColor: 'var(--t-ink)', backgroundColor: 'oklch(22% 0 0)' }}>
          <div>
            <div className="pricing-tier-name">2 T-Shirts</div>
            <div className="pricing-tier-desc" style={{ color: 'var(--t-ink)' }}>FREE Delivery 🚚</div>
          </div>
          <div className="pricing-tier-price">Rs. 1699</div>
        </div>
      </div>

      <button onClick={scrollToForm} className="btn">
        Place Your Order Now
      </button>
      </div>
    </section>
  );
};

export default TShirtHeroSection;
