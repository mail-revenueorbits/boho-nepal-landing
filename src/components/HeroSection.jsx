import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Truck, Tag, MessageCircle } from 'lucide-react';
import './HeroSection.css';
import { trackPixelEvent } from '../utils/facebook-pixel';

const HeroSection = () => {
  const images = [
    '/Product Shot.webp',
    '/Lifestyle shot 2.webp',
    '/Lifestyle shot 1.webp',
    '/Lifestyle shot 3.webp',
    '/White Background Product Shot.webp'
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef(null);

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
    if (scrollContainerRef.current) {
      const slideWidth = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollTo({
        left: index * slideWidth,
        behavior: 'smooth'
      });
      setActiveIndex(index);
    }
  };
  
  const scrollToForm = () => {
    trackPixelEvent('InitiateCheckout', { content_name: 'Hero Section CTA' });
    const formElement = document.getElementById('order-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="hero-section">
      <div className="container hero-container">
        
        <div className="hero-gallery-wrapper animate-fade-in">
          <div className="gallery-container-relative">
            <div 
              className="swipe-container" 
              ref={scrollContainerRef}
              onScroll={handleScroll}
            >
              {images.map((src, index) => (
                <div key={index} className="swipe-slide">
                  <img src={src} alt={`Bohemian Hemp Sidebag ${index + 1}`} className="swipe-image" />
                </div>
              ))}
            </div>

            <div className="gallery-dots">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={`gallery-dot ${activeIndex === index ? 'active' : ''}`}
                  onClick={() => scrollToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="thumbnail-row">
            {images.map((src, index) => (
              <div 
                key={index} 
                className={`thumbnail-container ${activeIndex === index ? 'active' : ''}`}
                onClick={() => scrollToSlide(index)}
              >
                <img src={src} alt={`Thumbnail ${index + 1}`} className="thumbnail-image" />
              </div>
            ))}
          </div>
        </div>

        <div className="hero-content animate-fade-in delay-100">
          <h1 className="hero-title">
            Premium Quality को <br/> Boho Hemp Sidebag (गाँजाको कपडाले बनेको)
          </h1>
          
          <div className="reviews-row">
            <span className="stars">★★★★★</span>
            <span className="review-count">5 reviews</span>
          </div>

          <div className="scarcity-badge">
            <span className="sold-text">🔥 11 sold in last 2 hours</span>
          </div>
          
          <div className="pricing-container">
            <div className="price-row">
              <span className="price-sale">रु. 899</span>
              <span className="price-original">रु. 999</span>
            </div>
            <div className="stock-warning">Only 7 left in stock</div>
          </div>

          <div className="hero-actions">
            <button id="hero-cta-btn" onClick={scrollToForm} className="btn btn-primary btn-large pulse-btn">
              Order Now - Cash on Delivery
              <ArrowRight size={20} style={{ marginLeft: '10px' }} />
            </button>
            <p className="free-delivery-text">Free Delivery on 2+ items</p>
          </div>
          
          <div className="trust-badges-row">
            <div className="trust-item">
              <Truck size={24} />
              <span>Free<br/>Shipping</span>
            </div>
            <div className="trust-item">
              <Tag size={24} />
              <span>Cash on<br/>Delivery</span>
            </div>
            <div className="trust-item">
              <MessageCircle size={24} />
              <span>24/7 Chat<br/>Support</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
