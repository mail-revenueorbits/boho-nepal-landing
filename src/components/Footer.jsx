import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer section-padding">
      <div className="container footer-container">
        <div className="footer-brand">
          <img src="/bohonepal-logo.png" alt="Boho Nepal Logo" className="footer-logo" />
          <p className="footer-desc">
            Bringing authentic Bohemian and Hemp products straight from Nepal to you.
          </p>
        </div>
        <div className="footer-links">
          <h4>Customer Service</h4>
          <ul>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">Shipping & Returns</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Boho Nepal. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
