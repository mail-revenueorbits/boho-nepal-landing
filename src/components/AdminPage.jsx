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
import AnalyticsDashboard from './AnalyticsDashboard';

const AdminPage = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState('orders');

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
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'yesterday', '7d', '30d', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

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

  // Handle full-screen layout on desktop by overriding mobile-first wrappers
  useEffect(() => {
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.classList.add('admin-mode-root');
    }
    document.body.classList.add('admin-mode-body');

    return () => {
      if (rootElement) {
        rootElement.classList.remove('admin-mode-root');
      }
      document.body.classList.remove('admin-mode-body');
    };
  }, []);

  // Sign in using Supabase Auth
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setLoginError('Please enter both email and password.');
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
      setLoginError(err.message || 'Login failed. Please verify your credentials.');
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
      setFetchError(err.message || 'Could not load orders from database.');
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
    return date.toLocaleString('en-US', {
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

    let matchesDate = true;
    if (dateFilter !== 'all' && order.created_at) {
      const orderDate = new Date(order.created_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateFilter === 'today') {
        matchesDate = orderDate >= today;
      } else if (dateFilter === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        matchesDate = orderDate >= yesterday && orderDate < today;
      } else if (dateFilter === '7d') {
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 7);
        matchesDate = orderDate >= last7Days;
      } else if (dateFilter === '30d') {
        const last30Days = new Date(today);
        last30Days.setDate(last30Days.getDate() - 30);
        matchesDate = orderDate >= last30Days;
      } else if (dateFilter === 'custom') {
        if (customStartDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          if (orderDate < start) matchesDate = false;
        }
        if (customEndDate && matchesDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (orderDate > end) matchesDate = false;
        }
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // KPI Calculations
  const metrics = {
    total: filteredOrders.length,
    revenue: filteredOrders
      .filter(o => (o.status || 'pending') !== 'cancelled')
      .reduce((sum, o) => sum + (o.total_price || 0), 0),
    pending: filteredOrders.filter(o => (o.status || 'pending') === 'pending').length,
    shipping: filteredOrders.filter(o => o.status === 'shipping').length,
    delivered: filteredOrders.filter(o => o.status === 'delivered').length,
    cancelled: filteredOrders.filter(o => o.status === 'cancelled').length
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
          <p className="login-brand-subtitle">Order Management - Admin Login</p>

          <form onSubmit={handleLoginSubmit} className="login-form">
            {loginError && <div className="login-error">{loginError}</div>}
            
            <div className="form-group">
              <input
                type="email"
                placeholder="Email Address"
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
                placeholder="Password"
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
              {isLoggingIn ? 'Logging in...' : 'Log In'}
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
            <span>Admin Order Dashboard</span>
          </div>
        </div>

        <div className="nav-action-group">
          <div className="admin-tabs">
            <button 
              className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              Orders
            </button>
            <button 
              className={`admin-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </button>
          </div>
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
            <span className="logout-btn-text">Log Out</span>
          </button>
        </div>
      </header>

      {/* Main dashboard content */}
      <main className="admin-dashboard-content">
        
        {activeTab === 'analytics' ? (
          <AnalyticsDashboard />
        ) : (
          <>
            {/* KPI metrics row */}
        <section className="metrics-grid">
          <div className="metric-card">
            <div className="metric-card-icon"><ShoppingCart size={60} /></div>
            <span className="metric-card-label">Total Orders</span>
            <span className="metric-card-value">{metrics.total}</span>
          </div>
          <div className="metric-card">
            <div className="metric-card-icon"><DollarSign size={60} /></div>
            <span className="metric-card-label">Total Sales</span>
            <span className="metric-card-value" style={{color: '#1e3f20'}}>Rs. {metrics.revenue}</span>
          </div>
          <div className="metric-card" style={{borderLeft: '4px solid #f59f00'}}>
            <div className="metric-card-icon"><ClockIcon /></div>
            <span className="metric-card-label">Pending</span>
            <span className="metric-card-value" style={{color: '#f59f00'}}>{metrics.pending}</span>
          </div>
          <div className="metric-card" style={{borderLeft: '4px solid #1c7ed6'}}>
            <div className="metric-card-icon"><TruckIcon /></div>
            <span className="metric-card-label">Shipping</span>
            <span className="metric-card-value" style={{color: '#1c7ed6'}}>{metrics.shipping}</span>
          </div>
          <div className="metric-card" style={{borderLeft: '4px solid #37b24d'}}>
            <div className="metric-card-icon"><Check size={60} /></div>
            <span className="metric-card-label">Delivered</span>
            <span className="metric-card-value" style={{color: '#37b24d'}}>{metrics.delivered}</span>
          </div>
        </section>

        {/* Search and Filters panel */}
        <section className="controls-card">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search by customer name, phone, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filters-group" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>

            {dateFilter === 'custom' && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input 
                  type="date" 
                  value={customStartDate} 
                  onChange={(e) => setCustomStartDate(e.target.value)} 
                  className="filter-select"
                />
                <span style={{color: 'var(--admin-text-muted)'}}>to</span>
                <input 
                  type="date" 
                  value={customEndDate} 
                  onChange={(e) => setCustomEndDate(e.target.value)} 
                  className="filter-select"
                />
              </div>
            )}

            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Shipping Status</option>
              <option value="pending">Pending</option>
              <option value="shipping">Shipping</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </section>

        {fetchError && (
          <div className="admin-login-wrapper" style={{ minHeight: 'auto', padding: '1rem 0' }}>
            <div className="login-error" style={{ width: '100%', maxWidth: 'none', marginBottom: 0 }}>
              <AlertTriangle size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Error: {fetchError}. Could not load orders. Please verify your Supabase RLS security policies and network connection.
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && orders.length === 0 ? (
          <div className="admin-loading-wrapper">
            <div className="loading-spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Empty state */
          <div className="admin-empty-state">
            <ShoppingCart size={48} className="text-muted" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3 className="empty-state-title">No orders found</h3>
            <p className="empty-state-subtitle">No orders match your search and filter criteria.</p>
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
                        Total Price: <span className="price-display-bold">Rs. {order.total_price}</span>
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
                    <th>Order Date</th>
                    <th>Customer Name</th>
                    <th>Phone Number</th>
                    <th>Delivery Address</th>
                    <th>Quantity</th>
                    <th>Total Price</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
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
                      <td style={{ fontWeight: '800', color: '#1e3f20' }}>Rs. {order.total_price}</td>
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
        </>
        )}
      </main>

      {/* EDIT ORDER DIALOG MODAL */}
      {editingOrder && (
        <div className="modal-overlay" onClick={() => setEditingOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Order</h3>
              <button onClick={() => setEditingOrder(null)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="admin-form-group">
                  <label>Customer Name</label>
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
                    <label>Phone Number</label>
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
                    <label>Delivery Location</label>
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
                  <label>Delivery Address</label>
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
                    <label>Quantity</label>
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
                    <label>Total Price (Rs.)</label>
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
                  <label>Order Status</label>
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
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="modal-btn btn-primary-save"
                  disabled={actionInProgress}
                >
                  {actionInProgress ? 'Saving...' : 'Save Changes'}
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
                  <h3 className="delete-warning-title">Delete Order?</h3>
                  <p className="delete-warning-desc">
                    Are you sure you want to delete this order? This action cannot be undone.
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
                No
              </button>
              <button 
                type="button" 
                onClick={handleDeleteConfirm} 
                className="modal-btn btn-danger"
                disabled={actionInProgress}
              >
                {actionInProgress ? 'Deleting...' : 'Delete Order'}
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
