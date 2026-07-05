// Boho Nepal Unified Analytics Utility (GA4, Microsoft Clarity, & Meta Pixel + Supabase)
import { supabase } from './supabaseClient';

export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
export const CLARITY_PROJECT_ID = import.meta.env.VITE_CLARITY_PROJECT_ID || '';
export const PIXEL_ID = import.meta.env.VITE_FACEBOOK_PIXEL_ID || '';

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
 * Initializes GA4, Microsoft Clarity, and Meta Pixel dynamically
 */
export const initAnalytics = () => {
  if (typeof window === 'undefined') return;

  // 1. Initialize Meta Pixel (if loaded)
  if (PIXEL_ID && !window.fbq) {
    /* eslint-disable */
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
    console.log(`[Analytics] Meta Pixel initialized with ID: ${PIXEL_ID}`);
  } else if (!PIXEL_ID) {
    console.log('[Analytics Console] Meta Pixel running in Mock Mode (VITE_FACEBOOK_PIXEL_ID missing)');
  }

  // 2. Initialize Google Analytics 4 (GA4)
  if (GA_MEASUREMENT_ID && !window.gtag) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: true,
      cookie_flags: 'SameSite=None;Secure'
    });
    console.log(`[Analytics] Google Analytics 4 initialized with ID: ${GA_MEASUREMENT_ID}`);
  } else if (!GA_MEASUREMENT_ID) {
    console.log('[Analytics Console] GA4 running in Mock Mode (VITE_GA_MEASUREMENT_ID missing)');
  }

  // 3. Initialize Microsoft Clarity (Perfect for mobile click tracking and heatmaps)
  if (CLARITY_PROJECT_ID && !window.clarity) {
    /* eslint-disable */
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY_PROJECT_ID);
    /* eslint-enable */
    console.log(`[Analytics] Microsoft Clarity initialized with ID: ${CLARITY_PROJECT_ID}`);
  } else if (!CLARITY_PROJECT_ID) {
    console.log('[Analytics Console] Microsoft Clarity running in Mock Mode (VITE_CLARITY_PROJECT_ID missing)');
  }
};

/**
 * Tracks a unified custom event to Meta Pixel, GA4, and Microsoft Clarity
 * @param {string} eventName 
 * @param {Object} params 
 * @param {Object} options Options passed to Meta Pixel (e.g. { eventID })
 */
export const trackEvent = (eventName, params = {}, options = {}) => {
  if (typeof window === 'undefined') return;

  // Add standard tracking parameters (device, page, viewport width)
  const augmentedParams = {
    ...params,
    page_path: window.location.pathname,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    is_mobile: window.innerWidth <= 768,
    timestamp: new Date().toISOString()
  };

  console.log(`[Analytics Unified Event] Fired: ${eventName}`, augmentedParams, options);

  // 1. Dispatch to Meta Pixel
  if (window.fbq && PIXEL_ID) {
    let mappedPixelName = eventName;
    let pixelData = { ...augmentedParams };

    // Map unified custom events to Meta Standard events where applicable
    if (eventName === 'Purchase_Success') {
      mappedPixelName = 'Purchase';
    } else if (eventName === 'Initiate_Checkout') {
      mappedPixelName = 'InitiateCheckout';
    } else if (eventName === 'Form_Start') {
      mappedPixelName = 'Lead';
    } else if (eventName === 'Select_Offer') {
      mappedPixelName = 'CustomizeProduct';
    }

    window.fbq('track', mappedPixelName, pixelData, options);
  }

  // 2. Dispatch to GA4
  if (window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('event', eventName, augmentedParams);
  }

  // 3. Dispatch to Microsoft Clarity
  if (window.clarity && CLARITY_PROJECT_ID) {
    window.clarity('event', eventName);
  }

  // 4. Dispatch to In-House Supabase Database
  try {
    supabase.from('analytics_events').insert([{
      session_id: sessionId,
      event_name: eventName,
      page_path: window.location.pathname,
      is_mobile: window.innerWidth <= 768,
      event_data: augmentedParams
    }]).then(({error}) => {
      if (error) console.error('[Supabase Analytics Error]', error);
    });
  } catch (err) {
    console.error('[Supabase Analytics Error]', err);
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

  if (utmSource || utmCampaign || fbclid) {
    trackEvent('Campaign_Session_Start', {
      utm_source: utmSource || 'none',
      utm_medium: utmMedium || 'none',
      utm_campaign: utmCampaign || 'none',
      utm_content: utmContent || 'none',
      has_fbclid: !!fbclid
    });
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
