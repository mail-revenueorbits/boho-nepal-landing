import React from 'react';
import { CheckSquare } from 'lucide-react';
import './FeaturesSection.css';

const FeaturesSection = () => {
  const features = [
    { title: 'एकदमै बाक्लो र लामो समय टिक्ने Hemp कपडा' },
    { title: 'Hemp Cloth Material (गाँजाले बनेको ब्याग)' },
    { title: 'नेपालमै बनेको १००% हस्तनिर्मित (100% Made in Nepal)' },
    { title: 'Compact Design तर धेरै Storage - सजिलै अट्ने Mobile, Charger र Keys' },
    { title: '२ वटा किन्दा मात्र रु. १६०० (Free Delivery)' },
    { title: '100% Genuine Product Guarantee' },
  ];

  return (
    <section className="features-section section-padding">
      <div className="container">
        
        <div className="features-checklist">
          {features.map((feature, index) => (
            <div key={index} className="checklist-item">
              <CheckSquare size={24} color="#16A34A" className="check-icon" />
              <span className="checklist-text">{feature.title}</span>
            </div>
          ))}
        </div>

        <div className="features-image-wrapper">
          <div className="features-image-header">
            स्टाइलिस र कम्फर्टेबल लुक ! (Stylish & Comfortable Look!)
          </div>
          <img src="/Lifestyle shot 1.webp" alt="How to style hemp bag" className="features-lifestyle-img" />
        </div>

      </div>
    </section>
  );
};

export default FeaturesSection;
