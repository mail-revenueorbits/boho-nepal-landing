import React from 'react';
import './Navbar.css'; // Optional: if you need component-specific styles

const Navbar = () => {
  return (
    <nav className="navbar glass-panel">
      <div className="container navbar-content">
        <div className="logo-container" style={{ width: '100%', textAlign: 'center' }}>
          <img src="/bohonepal-logo.png" alt="Boho Nepal Logo" className="logo" style={{ margin: '0 auto' }} />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
