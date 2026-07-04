import { supabase } from './supabaseClient';

// Simple session ID generator
const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Store or retrieve session ID
let sessionId = '';
if (typeof window !== 'undefined') {
  sessionId = sessionStorage.getItem('boho_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('boho_session_id', sessionId);
  }
}

/**
 * Initializes In-House Analytics
 */
export const initAnalytics = () => {
  if (typeof window === 'undefined') return;
  console.log('[In-House Analytics] Initialized tracking for session:', sessionId);
  trackEvent('PageView');
};

/**
 * Tracks a custom event to Supabase
 * @param {string} eventName 
 * @param {Object} params 
 */
export const trackEvent = async (eventName, params = {}) => {
  if (typeof window === 'undefined') return;

  const augmentedParams = {
    ...params,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    timestamp: new Date().toISOString()
  };

  const isMobile = window.innerWidth <= 768;
  const pagePath = window.location.pathname;

  console.log(`[Analytics Event] Fired: ${eventName}`, augmentedParams);

  try {
    // Fire and forget to Supabase
    await supabase.from('analytics_events').insert([{
      session_id: sessionId,
      event_name: eventName,
      page_path: pagePath,
      is_mobile: isMobile,
      event_data: augmentedParams
    }]);
  } catch (err) {
    console.error('[Analytics Error]', err);
  }
};

/**
 * Attaches automated scroll depth and session time trackers
 * @returns {Function} Cleanup function
 */
export const setupBehavioralTracking = () => {
  if (typeof window === 'undefined') return () => {};

  // Track UTM Campaign Parameters on session start
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium');
  const utmCampaign = urlParams.get('utm_campaign');
  const utmContent = urlParams.get('utm_content');
  const fbclid = urlParams.get('fbclid');

  const campaignTracked = sessionStorage.getItem('boho_campaign_tracked');

  if (!campaignTracked && (utmSource || utmCampaign || fbclid)) {
    trackEvent('Campaign_Session_Start', {
      utm_source: utmSource || 'none',
      utm_medium: utmMedium || 'none',
      utm_campaign: utmCampaign || 'none',
      utm_content: utmContent || 'none',
      has_fbclid: !!fbclid
    });
    sessionStorage.setItem('boho_campaign_tracked', 'true');
  }

  // A. Scroll Depth Milestones (25%, 50%, 75%, 100%)
  const scrollMilestones = { 25: false, 50: false, 75: false, 100: false };
  
  const handleScroll = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;

    const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);

    [25, 50, 75, 100].forEach((milestone) => {
      if (scrollPercent >= milestone && !scrollMilestones[milestone]) {
        scrollMilestones[milestone] = true;
        trackEvent('Scroll_Depth_Milestone', { depth_percent: milestone });
      }
    });
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  // B. Time on Site Milestones (seconds)
  const timeMilestones = [15, 45, 90, 180];
  const timers = timeMilestones.map((seconds) => {
    return setTimeout(() => {
      trackEvent('Time_On_Site_Milestone', { duration_seconds: seconds });
    }, seconds * 1000);
  });

  // Return cleanup function to React's useEffect
  return () => {
    window.removeEventListener('scroll', handleScroll);
    timers.forEach((t) => clearTimeout(t));
  };
};
