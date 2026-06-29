import React from 'react';
import './GallerySection.css';

const GallerySection = () => {
  const images = [
    { src: '/Lifestyle shot 1.webp', alt: 'Hemp Bag Lifestyle 1', style: 'large' },
    { src: '/Product Shot.webp', alt: 'Hemp Bag Product Shot', style: 'small' },
    { src: '/White Background Product Shot.webp', alt: 'Hemp Bag White BG', style: 'small' },
    { src: '/Lifestyle shot 3.webp', alt: 'Hemp Bag Lifestyle 3', style: 'wide' }
  ];

  return (
    <section className="gallery-section section-padding">
      <div className="container">
        <div className="gallery-header text-center">
          <h2>See It In Action</h2>
          <p>Explore the Bohemian Hemp Sidebag up close.</p>
        </div>
        
        <div className="gallery-grid">
          {images.map((img, index) => (
            <div key={index} className={`gallery-item ${img.style}`}>
              <img src={img.src} alt={img.alt} loading="lazy" />
              <div className="gallery-overlay"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
