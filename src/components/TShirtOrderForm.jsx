import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { trackEvent } from '../utils/analytics';

const TShirtOrderForm = ({ selectedQuantity, setSelectedQuantity }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phoneNumber: '',
    location: 'inside', // 'inside' = Kathmandu Valley, 'outside' = Outside Valley
    color: 'Black',
  });

  const [modalStep, setModalStep] = useState('none'); // 'none', 'confirm', 'success'
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Focus state for field-level mobile analytics funnel
  const [trackedFields, setTrackedFields] = useState({});

  useEffect(() => {
    const detectUserLocation = async () => {
      try {
        const res = await fetch('/api/detect-location');
        if (res.ok) {
          const data = await res.json();
          if (data && data.location) {
            setFormData(prev => ({ ...prev, location: data.location }));
          }
        }
      } catch (err) {
        // Silent fail
      }
    };
    detectUserLocation();
  }, []);

  const handleFieldFocus = (fieldName) => {
    if (!trackedFields[fieldName]) {
      setTrackedFields(prev => ({ ...prev, [fieldName]: true }));
      const isFirstField = !Object.values(trackedFields).some(val => val);
      if (isFirstField) {
        trackEvent('TShirt_Form_Start', { first_field: fieldName });
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
    handleFieldFocus(name);
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    if (name === 'quantity') {
      setSelectedQuantity(parseInt(value));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (formError) setFormError('');
    handleFieldFocus(name);
  };

  const calculatePricing = () => {
    const qty = selectedQuantity;
    let bagsTotal = 0;

    if (qty === 1) {
      bagsTotal = 899;
    } else if (qty === 2) {
      bagsTotal = 1699;
    } else if (qty === 3) {
      bagsTotal = 2549;
    } else {
      bagsTotal = 3398;
    }

    const deliveryCharge = qty >= 2 ? 0 : (formData.location === 'inside' ? 100 : 150);
    const grandTotal = bagsTotal + deliveryCharge;

    return { bagsTotal, deliveryCharge, grandTotal };
  };

  const { bagsTotal, deliveryCharge, grandTotal } = calculatePricing();

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.phoneNumber.trim() || !formData.address.trim()) {
      setFormError('Please fill out all required fields to continue.');
      return;
    }

    const phoneRegex = /^[0-9\s-+]{7,15}$/;
    if (!phoneRegex.test(formData.phoneNumber.trim())) {
      setFormError('Please enter a valid phone number.');
      return;
    }

    setModalStep('confirm');
  };

  const handleConfirmOrder = async () => {
    setFormError('');
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('orders')
        .insert([
          {
            name: formData.name,
            phone: formData.phoneNumber,
            address: `${formData.address} [T-Shirt - ${formData.color}]`,
            quantity: selectedQuantity,
            location: formData.location,
            total_price: grandTotal
          }
        ]);

      if (error) throw new Error(error.message);

      // Send Slack webhook notification (securely via serverless function)
      fetch('/api/slack-notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phoneNumber,
          address: formData.address,
          quantity: selectedQuantity,
          location: formData.location,
          totalPrice: grandTotal,
          productName: `Premium Boho T-Shirt`,
          productVariant: formData.color
        })
      }).catch((slackErr) => {
        console.error('[Slack Frontend Post Exception]', slackErr);
      });

      trackEvent('TShirt_Purchase_Success', {
        value: grandTotal,
        currency: 'NPR',
        quantity: selectedQuantity,
      });

      setOrderPlaced(true);
      setModalStep('success');

    } catch (err) {
      console.error('[Checkout Error]', err);
      setFormError('There was a problem submitting your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setModalStep('none');
    setFormData({ name: '', address: '', phoneNumber: '', location: 'inside', color: 'Black' });
    setSelectedQuantity(1);
  };

  return (
    <section id="tshirt-order-form" className="container" style={{ paddingBottom: '4rem' }}>
      <h2 style={{ borderBottom: '1px solid oklch(25% 0 0)', paddingBottom: '1rem', marginBottom: '2rem' }}>
        Complete Your Order
      </h2>

      {orderPlaced ? (
        <div style={{ padding: '4rem 1.5rem', textAlign: 'center', backgroundColor: 'var(--t-surface)', border: '1px solid oklch(25% 0 0)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🎉</div>
          <h3 style={{ fontSize: '1.75rem', marginBottom: '1rem', fontWeight: '800' }}>Order Received!</h3>
          <p style={{ color: 'var(--t-ink-muted)', fontSize: '1.125rem', lineHeight: '1.6' }}>
            Thank you for shopping with Boho Nepal. We have successfully received your details and will call you shortly to confirm the delivery.
          </p>
        </div>
      ) : (
        <form onSubmit={handleFormSubmit}>
          <div className="t-form-group">
          <label className="t-form-label">Full Name *</label>
          <input
            type="text"
            name="name"
            placeholder="e.g. Ram Bahadur"
            value={formData.name}
            onChange={handleInputChange}
            onFocus={() => handleFieldFocus('name')}
            className="t-form-input"
          />
        </div>

        <div className="t-form-group">
          <label className="t-form-label">Phone Number *</label>
          <input
            type="tel"
            name="phoneNumber"
            placeholder="e.g. 9841234567"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            onFocus={() => handleFieldFocus('phoneNumber')}
            className="t-form-input"
          />
        </div>

        <div className="t-form-group">
          <label className="t-form-label">Delivery Address *</label>
          <input
            type="text"
            name="address"
            placeholder="e.g. Baneshwor, Kathmandu"
            value={formData.address}
            onChange={handleInputChange}
            onFocus={() => handleFieldFocus('address')}
            className="t-form-input"
          />
        </div>

        <div className="t-form-group">
          <label className="t-form-label">Color *</label>
          <select
            name="color"
            value={formData.color}
            onChange={handleSelectChange}
            className="t-form-select"
          >
            <option value="Black">Black</option>
            <option value="White">White</option>
          </select>
        </div>

        <div className="t-form-group">
          <label className="t-form-label">Quantity</label>
          <select
            name="quantity"
            value={selectedQuantity}
            onChange={handleSelectChange}
            className="t-form-select"
          >
            <option value={1}>1 T-Shirt (Rs. 899)</option>
            <option value={2}>2 T-Shirts (Rs. 1699) - FREE Delivery</option>
            <option value={3}>3 T-Shirts (Rs. 2549) - FREE Delivery</option>
            <option value={4}>4 T-Shirts (Rs. 3398) - FREE Delivery</option>
          </select>
        </div>

        <div className="t-form-group">
          <label className="t-form-label">Location</label>
          <select
            name="location"
            value={formData.location}
            onChange={handleSelectChange}
            className="t-form-select"
          >
            <option value="inside">Inside Valley (+ Rs. 100 Delivery)</option>
            <option value="outside">Outside Valley (+ Rs. 150 Delivery)</option>
          </select>
        </div>

        {formError && (
          <div style={{ 
            backgroundColor: 'oklch(35% 0.1 25)', 
            color: 'oklch(90% 0.05 25)', 
            padding: '1rem', 
            border: '1px solid oklch(50% 0.15 25)', 
            margin: '1rem 0', 
            fontWeight: '600',
            fontSize: '0.9rem'
          }}>
            {formError}
          </div>
        )}

        <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'var(--t-surface)', border: '1px solid oklch(25% 0 0)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--t-ink-muted)' }}>Subtotal:</span>
            <span>Rs. {bagsTotal}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid oklch(25% 0 0)', paddingBottom: '1rem' }}>
            <span style={{ color: 'var(--t-ink-muted)' }}>Delivery:</span>
            <span>{deliveryCharge === 0 ? 'FREE' : `Rs. ${deliveryCharge}`}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>
            <span>Total:</span>
            <span>Rs. {grandTotal}</span>
          </div>
          
          <button type="submit" className="btn">
            Order Now (COD)
          </button>
        </div>
      </form>
      )}

      {/* Confirmation & Success Popups */}
      {modalStep !== 'none' && (
        <div className="t-modal-overlay">
          {modalStep === 'confirm' && (
            <div className="t-modal-content">
              <h3 style={{ marginBottom: '1rem' }}>Confirm Your Order</h3>
              <p style={{ color: 'var(--t-ink-muted)', marginBottom: '1.5rem' }}>Please verify your details below.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--t-ink-muted)' }}>Name:</span>
                  <strong>{formData.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--t-ink-muted)' }}>Phone:</span>
                  <strong>{formData.phoneNumber}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--t-ink-muted)' }}>Address:</span>
                  <strong>{formData.address}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--t-ink-muted)' }}>Quantity:</span>
                  <strong>{selectedQuantity} T-Shirt(s)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--t-ink-muted)' }}>Color:</span>
                  <strong>{formData.color}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid oklch(25% 0 0)' }}>
                  <span>Total Amount:</span>
                  <strong style={{ fontSize: '1.25rem' }}>Rs. {grandTotal}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => !isSubmitting && setModalStep('none')} className="btn btn-secondary" disabled={isSubmitting} style={{ flex: 1, padding: '1rem' }}>
                  Cancel
                </button>
                <button onClick={handleConfirmOrder} className="btn" disabled={isSubmitting} style={{ flex: 2, padding: '1rem' }}>
                  {isSubmitting ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          )}

          {modalStep === 'success' && (
            <div className="t-modal-content t-modal-success">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
              <h3 style={{ marginBottom: '1rem' }}>Order Successful!</h3>
              <p style={{ color: 'var(--t-ink-muted)', marginBottom: '2rem' }}>
                Thank you. We will call you before delivery to verify your order.
              </p>
              <button onClick={handleCloseModal} className="btn">
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default TShirtOrderForm;
