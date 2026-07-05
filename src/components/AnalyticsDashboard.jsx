import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { BarChart2, Users, Smartphone, Clock, Filter, AlertCircle } from 'lucide-react';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError('');
    try {
      let query = supabase.from('analytics_events').select('*').order('created_at', { ascending: false });

      if (timeRange !== 'all') {
        const date = new Date();
        if (timeRange === '24h') date.setHours(date.getHours() - 24);
        if (timeRange === '7d') date.setDate(date.getDate() - 7);
        if (timeRange === '30d') date.setDate(date.getDate() - 30);
        query = query.gte('created_at', date.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.message || 'Could not load analytics data. Ensure RLS allows read access for authenticated users.');
    } finally {
      setIsLoading(false);
    }
  };

  const uniqueSessions = new Set(events.map(e => e.session_id)).size;
  const pageViews = events.filter(e => e.event_name === 'PageView').length;
  const mobileVisits = new Set(events.filter(e => e.is_mobile).map(e => e.session_id)).size;
  const purchases = events.filter(e => e.event_name === 'Purchase_Success').length;
  const conversionRate = uniqueSessions > 0 ? ((purchases / uniqueSessions) * 100).toFixed(2) : 0;
  const formStarts = events.filter(e => e.event_name === 'Form_Start').length;
  const checkouts = events.filter(e => e.event_name === 'Initiate_Checkout').length;

  const scroll25 = events.filter(e => e.event_name === 'Scroll_Depth_Milestone' && e.event_data?.depth_percent === 25).length;
  const scroll50 = events.filter(e => e.event_name === 'Scroll_Depth_Milestone' && e.event_data?.depth_percent === 50).length;
  const scroll75 = events.filter(e => e.event_name === 'Scroll_Depth_Milestone' && e.event_data?.depth_percent === 75).length;
  const scroll100 = events.filter(e => e.event_name === 'Scroll_Depth_Milestone' && e.event_data?.depth_percent === 100).length;

  const validationErrors = events.filter(e => e.event_name === 'Form_Validation_Failed');
  const errorCounts = validationErrors.reduce((acc, curr) => {
    const field = curr.event_data?.field || 'unknown';
    acc[field] = (acc[field] || 0) + 1;
    return acc;
  }, {});

  if (isLoading) return <div className="analytics-loading"><div className="loading-spinner"></div><p>Loading analytics...</p></div>;
  if (error) return <div className="analytics-error"><AlertCircle size={20} /> {error}</div>;

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header-controls">
        <h2>In-House Analytics</h2>
        <div className="time-filter">
          <Filter size={16} style={{marginRight: '8px'}} />
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="filter-select">
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-card-icon"><Users size={40} /></div>
          <span className="metric-card-label">Unique Sessions</span>
          <span className="metric-card-value">{uniqueSessions}</span>
        </div>
        <div className="metric-card">
          <div className="metric-card-icon"><BarChart2 size={40} /></div>
          <span className="metric-card-label">Page Views</span>
          <span className="metric-card-value">{pageViews}</span>
        </div>
        <div className="metric-card">
          <div className="metric-card-icon"><Smartphone size={40} /></div>
          <span className="metric-card-label">Mobile Traffic</span>
          <span className="metric-card-value">{uniqueSessions > 0 ? ((mobileVisits / uniqueSessions) * 100).toFixed(0) : 0}%</span>
        </div>
        <div className="metric-card" style={{borderLeft: '4px solid #37b24d'}}>
          <div className="metric-card-icon"><Clock size={40} /></div>
          <span className="metric-card-label">Conversion Rate</span>
          <span className="metric-card-value" style={{color: '#37b24d'}}>{conversionRate}%</span>
        </div>
      </div>

      <div className="analytics-row">
        <div className="analytics-panel">
          <h3>Checkout Funnel</h3>
          <div className="funnel-chart">
            <div className="funnel-step">
              <span className="funnel-label">Unique Visitors</span>
              <span className="funnel-value">{uniqueSessions}</span>
              <div className="funnel-bar"><div className="funnel-fill" style={{width: '100%'}}></div></div>
            </div>
            <div className="funnel-step">
              <span className="funnel-label">Form Started</span>
              <span className="funnel-value">{formStarts}</span>
              <div className="funnel-bar"><div className="funnel-fill" style={{width: `${uniqueSessions > 0 ? (formStarts/uniqueSessions)*100 : 0}%`}}></div></div>
            </div>
            <div className="funnel-step">
              <span className="funnel-label">Initiated Checkout</span>
              <span className="funnel-value">{checkouts}</span>
              <div className="funnel-bar"><div className="funnel-fill" style={{width: `${uniqueSessions > 0 ? (checkouts/uniqueSessions)*100 : 0}%`}}></div></div>
            </div>
            <div className="funnel-step">
              <span className="funnel-label">Purchased</span>
              <span className="funnel-value" style={{color: '#37b24d', fontWeight: 'bold'}}>{purchases}</span>
              <div className="funnel-bar"><div className="funnel-fill" style={{width: `${uniqueSessions > 0 ? (purchases/uniqueSessions)*100 : 0}%`, background: '#37b24d'}}></div></div>
            </div>
          </div>
        </div>

        <div className="analytics-panel">
          <h3>Scroll Depth Drop-off</h3>
          <div className="funnel-chart">
            <div className="funnel-step"><span className="funnel-label">25% Scrolled</span><span className="funnel-value">{scroll25}</span></div>
            <div className="funnel-step"><span className="funnel-label">50% Scrolled</span><span className="funnel-value">{scroll50}</span></div>
            <div className="funnel-step"><span className="funnel-label">75% Scrolled</span><span className="funnel-value">{scroll75}</span></div>
            <div className="funnel-step"><span className="funnel-label">100% Scrolled (Bottom)</span><span className="funnel-value">{scroll100}</span></div>
          </div>
        </div>
      </div>

      <div className="analytics-row">
        <div className="analytics-panel">
          <h3>Form Validation Blockers (Errors)</h3>
          {validationErrors.length === 0 ? (
            <p className="no-data-text">No users have been blocked by form errors in this time range.</p>
          ) : (
            <table className="desktop-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Error Count</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(errorCounts).sort((a,b) => b[1] - a[1]).map(([field, count]) => (
                  <tr key={field}>
                    <td style={{fontWeight: 'bold', textTransform: 'capitalize'}}>{field}</td>
                    <td style={{color: '#e03131', fontWeight: 'bold'}}>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
