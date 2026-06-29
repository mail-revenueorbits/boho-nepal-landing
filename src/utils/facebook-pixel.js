// Meta Pixel Utility for Boho Nepal

export const PIXEL_ID = import.meta.env.VITE_FACEBOOK_PIXEL_ID || '';

/**
 * Initializes the Facebook Pixel on the client side
 */
export const initPixel = () => {
  if (typeof window === 'undefined') return;

  if (!PIXEL_ID) {
    console.warn('[Meta Pixel] ID is missing! Running in mock mode.');
    return;
  }

  if (window.fbq) return; // Already initialized

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
  console.log(`[Meta Pixel] Initialized successfully with ID: ${PIXEL_ID}`);
};

/**
 * Helper to retrieve specific cookies like _fbp and _fbc
 * @param {string} name 
 * @returns {string}
 */
export const getCookie = (name) => {
  if (typeof document === 'undefined') return '';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return '';
};

/**
 * Tracks a standard or custom Meta Pixel event
 * @param {string} eventName 
 * @param {Object} data 
 * @param {Object} options
 */
export const trackPixelEvent = (eventName, data = {}, options = {}) => {
  if (typeof window === 'undefined') return;

  if (window.fbq && PIXEL_ID) {
    window.fbq('track', eventName, data, options);
    console.log(`[Meta Pixel] Fired event: ${eventName}`, data, options);
  } else {
    console.log(`[Meta Pixel Mock] Fired event: ${eventName}`, data, options);
  }
};
