import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  LogOut, 
  RefreshCw, 
  Search, 
  Edit, 
  Trash2, 
  Phone, 
  MapPin, 
  DollarSign, 
  ShoppingCart, 
  Check, 
  X,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import './AdminPage.css';

const AdminPage = () => {
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal States
  const [editingOrder, setEditingOrder] = useState(null);
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    address: '',
    quantity: 1,
    total_price: 0,
    status: 'pending',
    location: 'inside'
  });

  // Check existing session and listen for auth state updates
  useEffect(() => {
    const checkSessionAndLoad = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        await loadOrders();
      } else {
        setIsLoading(false);
      }
    };

    checkSessionAndLoad();

    // Listen for sign-in / sign-out events automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setIsAuthenticated(true);
        await loadOrders();
      } else {
        setIsAuthenticated(false);
        setOrders([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign in using Supabase Auth
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setLoginError('कृपया इमेल र पासवर्ड प्रविष्ट गर्नुहोस् (Please enter email and password)');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (error) throw error;
    } catch (err) {
      console.error('[Supabase Auth Login Error]', err);
      setLoginError(err.message || 'लगइन असफल भयो। विवरण जाँच्नुहोस्।');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Sign out using Supabase Auth
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[Sign Out Error]', err);
    }
  };

  // Fetch orders directly from Supabase (JWT authentication token automatically attached)
  const loadOrders = async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('[Load Orders Error]', err);
      setFetchError(err.message || 'अर्डरहरू लोड गर्न सकिएन।');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick status update directly from the table or card view
  const handleQuickStatusChange = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Optimistically update status in state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      alert(`Status Update Failed: ${err.message}`);
    }
  };

  // Open edit modal and populate data
  const openEditModal = (order) => {
    setEditingOrder(order);
    setEditFormData({
      name: order.name || '',
      phone: order.phone || '',
      address: order.address || '',
      quantity: order.quantity || 1,
      total_price: order.total_price || 0,
      status: order.status || 'pending',
      location: order.location || 'inside'
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'total_price' ? Number(value) : value
    }));
  };

  // Update order fields
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;

    setActionInProgress(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          name: editFormData.name,
          phone: editFormData.phone,
          address: editFormData.address,
          quantity: Number(editFormData.quantity),
          location: editFormData.location,
          total_price: Number(editFormData.total_price),
          status: editFormData.status
        })
        .eq('id', editingOrder.id);

      if (error) throw error;

      // Update state locally
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === editingOrder.id ? { ...order, ...editFormData } : order
        )
      );
      setEditingOrder(null);
    } catch (err) {
      alert(`Edit Failed: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  // Delete Order Execution
  const handleDeleteConfirm = async () => {
    if (!deletingOrderId) return;

    setActionInProgress(true);
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', deletingOrderId);

      if (error) throw error;

      // Remove from local state
      setOrders(prevOrders => prevOrders.filter(order => order.id !== deletingOrderId));
      setDeletingOrderId(null);
    } catch (err) {
      alert(`Delete Failed: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ne-NP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Filter & Search Logic
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.phone || '').includes(searchTerm) ||
      (order.address || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const normalizedStatus = order.status || 'pending';
    const matchesStatus = statusFilter === 'all' || normalizedStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const metrics = {
    total: orders.length,
    revenue: orders
      .filter(o => (o.status || 'pending') !== 'cancelled')
      .reduce((sum, o) => sum + (o.total_price || 0), 0),
    pending: orders.filter(o => (o.status || 'pending') === 'pending').length,
    shipping: orders.filter(o => o.status === 'shipping').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  };

  // Render Login overlay if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-card">
          <div className="login-icon-box">
            <Lock size={32} />
          </div>
          <h2 className="login-brand-title">Boho Nepal</h2>
          <p className="login-brand-subtitle">अर्डर व्यवस्थापन - एडमिन लगइन</p>

          <form onSubmit={handleLoginSubmit} className="login-form">
            {loginError && <div className="login-error">{loginError}</div>}
            
            <div className="form-group">
              <input
                type="email"
                placeholder="इमेल (Email)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                style={{ marginBottom: '1rem' }}
                disabled={isLoggingIn}
                required
                autoFocus
              />
              <input
                type="password"
                placeholder="पासवर्ड (Password)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                disabled={isLoggingIn}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="login-btn"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? 'लगइन गर्दै...' : 'लगइन गर्नुहोस्'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Navbar Header */}
      <header className="admin-navbar">
        <div className="nav-brand-group">
          <div className="nav-logo-icon">
            <ShoppingCart size={20} />
          </div>
          <div className="nav-title-group">
            <h1>Boho Nepal</h1>
            <span>एडमिन अर्डर ड्यासबोर्ड</span>
          </div>
        </div>

        <div className="nav-action-group">
          <button 
            onClick={loadOrders} 
            className="nav-btn" 
            title="Refresh Orders"
            disabled={isLoading}
          >
            <RefreshCw size={18} className={isLoading ? 'spin' : ''} />
          </button>
          <button 
            onClick={handleLogout} 
            className="nav-btn logout-btn" 
            title="Log Out"
          >
            <LogOut size={18} />
            <span className="logout-btn-text">बाहिरिनुहोस्</span>
          </button>
        </div>
      </header>

      {/* Main dashboard content */}
      <main className="admin-dashboard-content">
        
        {/* KPI metrics row */}
        <section className="metrics-grid">
          <div className="metric-card">
            <div className="metric-card-icon"><ShoppingCart size={60} /></div>
            <span className="metric-card-label">जम्मा अर्डर (Total)</span>
            <span className="metric-card-value">{metrics.total}</span>
          </div>
          <div className="metric-card">
            <div className="metric-card-icon"><DollarSign size={60} /></div>
            <span className="metric-card-label">जम्मा बिक्री (Sales)</span>
            <span className="metric-card-value" style={{color: '#1e3f20'}}>रु {metrics.revenue}</span>
          </div>
          <div className="metric-card" style={{borderLeft: '4px solid #f59f00'}}>
            <div className="metric-card-icon"><ClockIcon /></div>
            <span className="metric-card-label">प्रक्रियामा (Pending)</span>
            <span className="metric-card-value" style={{color: '#f59f00'}}>{metrics.pending}</span>
          </div>
          <div className="metric-card" style={{borderLeft: '4px solid #1c7ed6'}}>
            <div className="metric-card-icon"><TruckIcon /></div>
            <span className="metric-card-label">पठाएको (Shipping)</span>
            <span className="metric-card-value" style={{color: '#1c7ed6'}}>{metrics.shipping}</span>
          </div>
          <div className="metric-card" style={{borderLeft: '4px solid #37b24d'}}>
            <div className="metric-card-icon"><Check size={60} /></div>
            <span className="metric-card-label">डेलिभर (Delivered)</span>
            <span className="metric-card-value" style={{color: '#37b24d'}}>{metrics.delivered}</span>
          </div>
        </section>

        {/* Search and Filters panel */}
        <section className="controls-card">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="नाम, फोन नम्बर, वा ठेगाना खोज्नुहोस्..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">सबै अर्डर स्थिति (All Status)</option>
            <option value="pending">प्रक्रियामा (Pending)</option>
            <option value="shipping">डेलिभरीमा (Shipping)</option>
            <option value="delivered">डेलिभर भएको (Delivered)</option>
            <option value="cancelled">रद्द गरिएको (Cancelled)</option>
          </select>
        </section>

        {fetchError && (
          <div className="admin-login-wrapper" style={{ minHeight: 'auto', padding: '1rem 0' }}>
            <div className="login-error" style={{ width: '100%', maxWidth: 'none', marginBottom: 0 }}>
              <AlertTriangle size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              त्रुटि: {fetchError}. अर्डरहरू लोड गर्न सकिएन। कृपया जाँच्नुहोस् कि Supabase मा RLS अर्डरहरू तालिकाका लागि सक्षम छ र तपाईंको इमेल प्रमाणीकरण गरिएको छ।
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && orders.length === 0 ? (
          <div className="admin-loading-wrapper">
            <div className="loading-spinner"></div>
            <p>अर्डरहरू लोड हुँदैछ...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Empty state */
          <div className="admin-empty-state">
            <ShoppingCart size={48} className="text-muted" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3 className="empty-state-title">कुनै अर्डर भेटिएन</h3>
            <p className="empty-state-subtitle">तपाईंको खोजी वा फिल्टरसँग मिल्ने कुनै अर्डरहरू छैनन्।</p>
          </div>
        ) : (
          <>
            {/* MOBILE CARD LAYOUT */}
            <div className="orders-list-wrapper">
              {filteredOrders.map((order) => (
                <div key={order.id} className="order-mobile-card">
                  <div className="mobile-card-header">
                    <div>
                      <h4 className="customer-name-heading">{order.name}</h4>
                      <span className="order-time-text">{formatDate(order.created_at)}</span>
                    </div>
                    <span className={`status-badge status-${order.status || 'pending'}`}>
                      {order.status === 'shipping' ? 'Shipping' : 
                       order.status === 'delivered' ? 'Delivered' : 
                       order.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                    </span>
                  </div>

                  <div className="mobile-card-body">
                    <div className="info-row">
                      <Phone size={14} />
                      <a href={`tel:${order.phone}`} className="order-phone-link">{order.phone}</a>
                    </div>
                    <div className="info-row">
                      <MapPin size={14} />
                      <span>{order.address} ({order.location === 'inside' ? 'Inside Valley' : 'Outside Valley'})</span>
                    </div>
                    <div className="info-row" style={{ marginTop: '0.25rem' }}>
                      <ShoppingCart size={14} />
                      <span>
                        <span className="quantity-badge">{order.quantity} Qty</span>
                        कुल मूल्य: <span className="price-display-bold">रु {order.total_price}</span>
                      </span>
                    </div>
                  </div>

                  <div className="mobile-card-actions">
                    <select
                      value={order.status || 'pending'}
                      onChange={(e) => handleQuickStatusChange(order.id, e.target.value)}
                      className="quick-status-selector"
                    >
                      <option value="pending">Pending</option>
                      <option value="shipping">Shipping</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <div className="card-action-buttons">
                      <button 
                        onClick={() => openEditModal(order)} 
                        className="action-btn action-edit"
                        title="Edit Order"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => setDeletingOrderId(order.id)} 
                        className="action-btn action-delete"
                        title="Delete Order"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE LAYOUT */}
            <div className="desktop-table-card">
              <table className="desktop-table">
                <thead>
                  <tr>
                    <th>अर्डर मिति (Date)</th>
                    <th>ग्राहकको नाम (Customer)</th>
                    <th>फोन नम्बर (Phone)</th>
                    <th>डेलिभरी ठेगाना (Address)</th>
                    <th>परिमाण (Qty)</th>
                    <th>जम्मा मूल्य (Total)</th>
                    <th>स्थिति (Status)</th>
                    <th style={{ textAlign: 'right' }}>कार्यहरू (Actions)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(order.created_at)}</td>
                      <td style={{ fontWeight: '700' }}>{order.name}</td>
                      <td>
                        <a href={`tel:${order.phone}`} className="order-phone-link">{order.phone}</a>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', display: 'block', color: 'var(--admin-text-muted)' }}>
                          {order.location === 'inside' ? 'Kathmandu Valley' : 'Outside Valley'}
                        </span>
                        {order.address}
                      </td>
                      <td style={{ fontWeight: '700' }}>{order.quantity}</td>
                      <td style={{ fontWeight: '800', color: '#1e3f20' }}>रु {order.total_price}</td>
                      <td>
                        <select
                          value={order.status || 'pending'}
                          onChange={(e) => handleQuickStatusChange(order.id, e.target.value)}
                          className="quick-status-selector"
                          style={{ fontWeight: 700 }}
                        >
                          <option value="pending">⏳ Pending</option>
                          <option value="shipping">🚚 Shipping</option>
                          <option value="delivered">✅ Delivered</option>
                          <option value="cancelled">❌ Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <div className="card-action-buttons" style={{ justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => openEditModal(order)} 
                            className="action-btn action-edit"
                            title="Edit details"
                          >
                            <Edit size={15} />
                          </button>
                          <button 
                            onClick={() => setDeletingOrderId(order.id)} 
                            className="action-btn action-delete"
                            title="Delete order"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {/* EDIT ORDER DIALOG MODAL */}
      {editingOrder && (
        <div className="modal-overlay" onClick={() => setEditingOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>अर्डर सम्पादन गर्नुहोस् (Edit Order)</h3>
              <button onClick={() => setEditingOrder(null)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="admin-form-group">
                  <label>ग्राहकको नाम (Customer Name)</label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditFormChange}
                    className="admin-form-input"
                    required
                  />
                </div>

                <div className="form-row-grid">
                  <div className="admin-form-group">
                    <label>फोन नम्बर (Phone Number)</label>
                    <input
                      type="tel"
                      name="phone"
                      value={editFormData.phone}
                      onChange={handleEditFormChange}
                      className="admin-form-input"
                      required
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>डेलिभरी क्षेत्र (Location)</label>
                    <select
                      name="location"
                      value={editFormData.location}
                      onChange={handleEditFormChange}
                      className="admin-form-select"
                    >
                      <option value="inside">Kathmandu Valley</option>
                      <option value="outside">Outside Valley</option>
                    </select>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>ठेगाना (Delivery Address)</label>
                  <input
                    type="text"
                    name="address"
                    value={editFormData.address}
                    onChange={handleEditFormChange}
                    className="admin-form-input"
                    required
                  />
                </div>

                <div className="form-row-grid">
                  <div className="admin-form-group">
                    <label>परिमाण (Quantity)</label>
                    <input
                      type="number"
                      name="quantity"
                      min="1"
                      value={editFormData.quantity}
                      onChange={handleEditFormChange}
                      className="admin-form-input"
                      required
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>जम्मा मूल्य (Total Price)</label>
                    <input
                      type="number"
                      name="total_price"
                      min="0"
                      value={editFormData.total_price}
                      onChange={handleEditFormChange}
                      className="admin-form-input"
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>अर्डर स्थिति (Order Status)</label>
                  <select
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditFormChange}
                    className="admin-form-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="shipping">Shipping</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setEditingOrder(null)} 
                  className="modal-btn btn-secondary"
                  disabled={actionInProgress}
                >
                  रद्द गर्नुहोस् (Cancel)
                </button>
                <button 
                  type="submit" 
                  className="modal-btn btn-primary-save"
                  disabled={actionInProgress}
                >
                  {actionInProgress ? 'सुरक्षित गर्दै...' : 'सुरक्षित गर्नुहोस् (Save Changes)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG MODAL */}
      {deletingOrderId && (
        <div className="modal-overlay" onClick={() => setDeletingOrderId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-body" style={{ padding: '2rem' }}>
              <div className="delete-warning-box">
                <AlertTriangle size={36} className="delete-warning-icon" />
                <div>
                  <h3 className="delete-warning-title">अर्डर डिलिट गर्नुहोस्?</h3>
                  <p className="delete-warning-desc">
                    के तपाईं निश्चित हुनुहुन्छ कि यो अर्डर डिलिट गर्न चाहनुहुन्छ? यो कार्य पुन: फर्काउन सकिने छैन।
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ background: '#f8f9fa' }}>
              <button 
                type="button" 
                onClick={() => setDeletingOrderId(null)} 
                className="modal-btn btn-secondary"
                disabled={actionInProgress}
              >
                होइन (No)
              </button>
              <button 
                type="button" 
                onClick={handleDeleteConfirm} 
                className="modal-btn btn-danger"
                disabled={actionInProgress}
              >
                {actionInProgress ? 'डिलिट गर्दै...' : 'अर्डर डिलिट गर्नुहोस्'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// SVG components for KPIs
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{opacity: 0.05, transform: 'scale(2.2)', position: 'absolute', right: '-5px', bottom: '-5px'}}>
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const TruckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{opacity: 0.05, transform: 'scale(2.2)', position: 'absolute', right: '-5px', bottom: '-5px'}}>
    <rect x="1" y="3" width="15" height="13"></rect>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
    <circle cx="5.5" cy="18.5" r="2.5"></circle>
    <circle cx="18.5" cy="18.5" r="2.5"></circle>
  </svg>
);

export default AdminPage;
