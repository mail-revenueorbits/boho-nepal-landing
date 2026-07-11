import React, { useState, useEffect } from 'react';
import { ShoppingCart, Check, X } from 'lucide-react';
import './OfferSection.css';
import { supabase } from '../utils/supabaseClient';
import { getCookie } from '../utils/facebook-pixel';
import { trackEvent } from '../utils/analytics';

const OfferSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phoneNumber: '',
    quantity: 1,
    location: 'inside', // 'inside' = Kathmandu Valley, 'outside' = Outside Valley
  });

  // Silent automatic geolocation detection on mount
  useEffect(() => {
    const detectUserLocation = async () => {
      try {
        const res = await fetch('/api/detect-location');
        if (res.ok) {
          const data = await res.json();
          if (data && data.location) {
            setFormData(prev => ({
              ...prev,
              location: data.location
            }));
            
            // Log automatic detection to analytics
            trackEvent('Location_Auto_Detected', { 
              detected_location: data.location, 
              city: data.city || 'unknown',
              country: data.country || 'unknown'
            });
          }
        }
      } catch (err) {
        console.error('Silent location pre-selection failed:', err);
      }
    };
    detectUserLocation();
  }, []);

  const [modalStep, setModalStep] = useState('none'); // 'none', 'confirm', 'success'
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Focus state for field-level mobile analytics funnel
  const [trackedFields, setTrackedFields] = useState({
    name: false,
    phoneNumber: false,
    address: false,
    quantity: false,
    location: false
  });

  const handleFieldFocus = (fieldName) => {
    if (!trackedFields[fieldName]) {
      setTrackedFields(prev => ({ ...prev, [fieldName]: true }));
      
      // If it's the very first field they touch, fire "Form_Start"
      const isFirstField = !Object.values(trackedFields).some(val => val);
      if (isFirstField) {
        trackEvent('Form_Start', { first_field: fieldName });
      }

      trackEvent('Form_Field_Focus', { field_name: fieldName });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formError) setFormError('');
    // Track user typing focus
    handleFieldFocus(name);
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    const finalVal = name === 'quantity' ? parseInt(value) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: finalVal,
    }));
    if (formError) setFormError('');

    // Track user selection focus
    handleFieldFocus(name);

    if (name === 'quantity') {
      trackEvent('Select_Offer', {
        selected_quantity: finalVal,
        subtotal: finalVal === 1 ? 899 : finalVal === 2 ? 1600 : finalVal * 800
      });
    } else if (name === 'location') {
      trackEvent('Select_Location', {
        selected_location: value
      });
    }
  };

  // Pricing calculations
  // - 1 unit: Rs. 899
  // - 2 units: Rs. 1600 (Special offer)
  // - 3+ units: Rs. 800 per bag
  // - Delivery: Rs. 100 inside, Rs. 150 outside. FREE if Qty >= 2.
  const calculatePricing = () => {
    const qty = formData.quantity;
    let bagsTotal = 0;

    if (qty === 1) {
      bagsTotal = 899;
    } else if (qty === 2) {
      bagsTotal = 1600;
    } else {
      bagsTotal = qty * 800;
    }

    const deliveryCharge = qty >= 2 ? 0 : (formData.location === 'inside' ? 100 : 150);
    const grandTotal = bagsTotal + deliveryCharge;

    // Tracked value for Meta: subtract Rs. 350 base cost per unit from the product subtotal
    const metaTrackedValue = Math.max(0, bagsTotal - (qty * 350));

    return { bagsTotal, deliveryCharge, grandTotal, metaTrackedValue };
  };

  const { bagsTotal, deliveryCharge, grandTotal, metaTrackedValue } = calculatePricing();

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      const errorMsg = 'कृपया तपाईंको नाम लेख्नुहोस् (Please enter your name)';
      setFormError(errorMsg);
      trackEvent('Form_Validation_Failed', { field: 'name', error_type: 'missing_name', message: errorMsg });
      return;
    }
    if (!formData.phoneNumber.trim()) {
      const errorMsg = 'कृपया फोन नम्बर लेख्नुहोस् (Please enter your phone number)';
      setFormError(errorMsg);
      trackEvent('Form_Validation_Failed', { field: 'phoneNumber', error_type: 'missing_phone', message: errorMsg });
      return;
    }

    const phoneRegex = /^[0-9\s-+]{7,15}$/;
    if (!phoneRegex.test(formData.phoneNumber.trim())) {
      const errorMsg = 'सहि फोन नम्बर राख्नुहोला (Please enter a valid phone number)';
      setFormError(errorMsg);
      trackEvent('Form_Validation_Failed', { field: 'phoneNumber', error_type: 'invalid_phone_pattern', message: errorMsg });
      return;
    }

    if (!formData.address.trim()) {
      const errorMsg = 'कृपया डेलिभरी ठेगाना लेख्नुहोस् (Please enter your delivery address)';
      setFormError(errorMsg);
      trackEvent('Form_Validation_Failed', { field: 'address', error_type: 'missing_address', message: errorMsg });
      return;
    }

    // Track Initiate_Checkout in the unified analytics manager upon successful validation
    trackEvent('Initiate_Checkout', {
      value: metaTrackedValue,
      currency: 'NPR',
      origin: 'Boho Nepal Checkout Form Submit',
      quantity: formData.quantity,
      location: formData.location
    });

    setModalStep('confirm');
  };

  const handleConfirmOrder = async () => {
    setFormError('');
    setIsSubmitting(true);

    try {
      // 1. Insert checkout details into Supabase public.orders table
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            name: formData.name,
            phone: formData.phoneNumber,
            address: formData.address,
            quantity: formData.quantity,
            location: formData.location,
            total_price: grandTotal
          }
        ]);

      if (error) {
        throw new Error(error.message);
      }

      // Generate a unique eventID for Meta browser-pixel and server-CAPI deduplication
      const eventId = `boho-nepal-order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // 2. Track unified Purchase Success event
      trackEvent('Purchase_Success', {
        value: metaTrackedValue,
        currency: 'NPR',
        content_name: 'Bohemian Hemp Sidebag',
        quantity: formData.quantity,
        total_price: grandTotal,
        delivery_location: formData.location
      }, { eventID: eventId });

      // 3. Dispatch server-side Conversions API (CAPI) event
      const userData = {
        name: formData.name,
        phone: formData.phoneNumber,
        fbp: getCookie('_fbp'),
        fbc: getCookie('_fbc'),
      };

      fetch('/api/facebook-capi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventName: 'Purchase',
          eventId: eventId,
          eventSourceUrl: window.location.href,
          userData,
          customData: {
            value: metaTrackedValue,
            currency: 'NPR'
          }
        })
      }).catch((capiErr) => {
        console.error('[Meta CAPI Frontend Post Exception]', capiErr);
      });

      // 4. Send Slack webhook notification (securely via serverless function)
      fetch('/api/slack-notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phoneNumber,
          address: formData.address,
          quantity: formData.quantity,
          location: formData.location,
          totalPrice: grandTotal
        })
      }).catch((slackErr) => {
        console.error('[Slack Frontend Post Exception]', slackErr);
      });

      // 5. Update state to show checkout success modal
      setOrderPlaced(true);
      setModalStep('success');

    } catch (err) {
      console.error('[Checkout Error]', err);
      setFormError('अर्डर सुरक्षित गर्दा समस्या भयो। कृपया फेरि प्रयास गर्नुहोला। (There was a problem submitting your order. Please try again.)');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setModalStep('none');
    // Reset form
    setFormData({
      name: '',
      address: '',
      phoneNumber: '',
      quantity: 1,
      location: 'inside',
    });
  };

  return (
    <section className="offer-section section-padding">
      <div className="container">
        
        {/* Special Offer Highlight Box */}
        <div className="offer-box">
          <div className="offer-header">
            सीमित अवधिको विशेष अफर !
          </div>
          <div className="offer-content">
            <h2 className="nepali-title">
              नेपालमै बनेको १००% नेचुरल र स्टाइलिस ब्याग !
            </h2>
            <p className="nepali-desc">
              "नेपालको मौलिकता झल्कने यो ब्याग अर्डर गर्न तलको फारम भरी अर्डर गर्नुहोस्।"
            </p>
          </div>
        </div>

        {/* Flat Minimalist Order Form Container */}
        <div id="order-form" className="order-form-container">
          <div className="form-header">
            <h3>अर्डर फारम (Order Form)</h3>
          </div>

          {orderPlaced ? (
            <div className="success-inline-message animate-fade-in" style={{ padding: '3rem 1.5rem', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '12px', marginTop: '1.5rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
              <h3 style={{ fontSize: '1.5rem', color: '#111827', marginBottom: '0.75rem', fontWeight: 'bold' }}>अर्डर सफल भयो !</h3>
              <p style={{ color: '#4b5563', lineHeight: '1.5' }}>
                तपाईंको अर्डर प्राप्त भयो। हामी डेलिभरी अघि कल गरेर मात्र सामान पठाउनेछौं। धन्यवाद!
              </p>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="actual-form">
              
              <div className="form-grid">
              
              {/* Full Name */}
              <div className="form-group">
                <input
                  type="text"
                  name="name"
                  placeholder="तपाईंको पूरा नाम (Your Name) *"
                  value={formData.name}
                  onChange={handleInputChange}
                  onFocus={() => handleFieldFocus('name')}
                  className="form-input"
                />
              </div>

              {/* Phone Number */}
              <div className="form-group">
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="फोन नम्बर (Phone Number) *"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  onFocus={() => handleFieldFocus('phoneNumber')}
                  className="form-input"
                />
              </div>

              {/* Delivery Address */}
              <div className="form-group">
                <input
                  type="text"
                  name="address"
                  placeholder="डेलिभरी ठेगाना (Delivery Address) *"
                  value={formData.address}
                  onChange={handleInputChange}
                  onFocus={() => handleFieldFocus('address')}
                  className="form-input"
                />
              </div>

              {/* Dual Selector Row (Quantity & Location) */}
              <div className="form-selectors-row">
                
                {/* Quantity Dropdown */}
                <div className="form-group">
                  <select
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleSelectChange}
                    onFocus={() => handleFieldFocus('quantity')}
                    className="form-select"
                  >
                    <option value={1}>1 Bag — रु. 899</option>
                    <option value={2}>2 Bags — रु. 1600 (Free Shipping)</option>
                    <option value={3}>3 Bags — रु. 2400 (Free Shipping)</option>
                    <option value={4}>4 Bags — रु. 3200 (Free Shipping)</option>
                  </select>
                </div>

                {/* Location Dropdown */}
                <div className="form-group">
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleSelectChange}
                    onFocus={() => handleFieldFocus('location')}
                    className="form-select"
                  >
                    <option value="inside">Inside Valley (रु. १०० डेलिभरी)</option>
                    <option value="outside">Outside Valley (रु. १५० डेलिभरी)</option>
                  </select>
                </div>

              </div>

            </div>

            {/* Error Message */}
            {formError && (
              <div className="form-error-alert animate-fade-in">
                {formError}
              </div>
            )}

            {/* Direct minimalist checkout action button */}
            <button type="submit" className="btn btn-primary order-submit-btn">
              रु. {grandTotal} — अर्डर गर्नुहोस् (Order Now)
            </button>
            
            <p className="payment-note">
              🚚 डेलिभरी: {formData.quantity >= 2 ? 'निःशुल्क (FREE)' : (formData.location === 'inside' ? 'रु. १००' : 'रु. १५०')} • Cash on Delivery (सामान पाएपछि मात्र पैसा बुझाउनुहोस्)
            </p>

          </form>
          )}
        </div>

      </div>

      {/* --- Confirmation & Success Popup Modal Flow --- */}
      {modalStep !== 'none' && (
        <div className="modal-overlay">
          {modalStep === 'confirm' && (
            <div className="modal-card confirm-modal animate-fade-in">
              <button 
                className="modal-close-btn" 
                onClick={() => !isSubmitting && setModalStep('none')} 
                disabled={isSubmitting}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
              
              <div className="modal-body confirm-body">
                <h3 className="modal-title">अर्डर निश्चित गर्नुहोस्</h3>
                <p className="modal-subtitle">विवरण सही भए "अर्डर गर्नुहोस्" बटन थिच्नुहोला।</p>
                
                <div className="confirm-details-list">
                  <div className="confirm-detail-row">
                    <span className="detail-label">नाम (Name):</span>
                    <span className="detail-value">{formData.name}</span>
                  </div>
                  <div className="confirm-detail-row">
                    <span className="detail-label">फोन नम्बर (Phone):</span>
                    <span className="detail-value">{formData.phoneNumber}</span>
                  </div>
                  <div className="confirm-detail-row">
                    <span className="detail-label">ठेगाना (Address):</span>
                    <span className="detail-value">{formData.address}</span>
                  </div>
                  <div className="confirm-detail-row">
                    <span className="detail-label">परिमाण (Quantity):</span>
                    <span className="detail-value">{formData.quantity} ब्याग (Bag)</span>
                  </div>
                  <div className="confirm-detail-row">
                    <span className="detail-label">डेलिभरी (Delivery):</span>
                    <span className="detail-value">
                      {deliveryCharge === 0 ? 'निःशुल्क (FREE)' : `रु. ${deliveryCharge}`}
                    </span>
                  </div>
                  <div className="confirm-detail-row total-row">
                    <span className="detail-label">जम्मा (Total Price):</span>
                    <span className="detail-value highlight-price">रु. {grandTotal}</span>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={handleConfirmOrder} 
                  className="btn btn-primary confirm-btn-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'प्रक्रियामा छ (Submitting...)' : 'अर्डर गर्नुहोस् (Confirm)'}
                </button>
              </div>
            </div>
          )}

          {modalStep === 'success' && (
            <div className="modal-card success-modal animate-fade-in">
              <div className="modal-body success-body text-center">
                <div className="success-icon-wrapper">
                  <Check size={36} className="success-checkmark" />
                </div>
                <h3 className="modal-title success-title">अर्डर सफल भयो ! 🎉</h3>
                <p className="success-subtitle">
                  हामी तपाईंको अर्डर डेलिभरी गर्नु अघि कल गर्नेछौं। धन्यवाद! ❤️
                </p>
                
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  className="btn btn-primary success-close-btn-cta"
                >
                  बन्द गर्नुहोस् (Close)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </section>
  );
};

export default OfferSection;
