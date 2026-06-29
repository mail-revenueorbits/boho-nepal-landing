import crypto from 'crypto';

/**
 * SHA-256 hashing helper for Meta Conversions API compliance
 */
function sha256(string) {
  if (!string) return '';
  return crypto.createHash('sha256').update(string.trim().toLowerCase()).digest('hex');
}

/**
 * Normalizes phone numbers for higher Meta event match quality
 */
const normalizePhone = (phone) => {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('9')) {
    digits = '977' + digits; // Nepal Country Code
  }
  return digits;
};

/**
 * Normalizes full name to extract the first name
 */
const normalizeName = (name) => {
  if (!name) return '';
  return name.trim().split(/\s+/)[0].toLowerCase();
};

export default async function handler(req, res) {
  // Only allow POST requests for CAPI tracking
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const {
    eventName,
    eventId,
    eventSourceUrl,
    userData = {},
    customData = {}
  } = req.body;

  // Retrieve environment variables
  const pixelId = process.env.FACEBOOK_PIXEL_ID || process.env.VITE_FACEBOOK_PIXEL_ID;
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

  // Safe fallback for local testing
  if (!pixelId || !accessToken) {
    console.warn('[Meta CAPI Mock] FACEBOOK_PIXEL_ID or FACEBOOK_ACCESS_TOKEN environment variable is missing.');
    return res.status(200).json({
      success: true,
      message: 'Event processed in MOCK mode (Missing keys).',
      debug: {
        eventName,
        eventId,
        normalizedName: normalizeName(userData.name),
        normalizedPhone: normalizePhone(userData.phone),
        customData
      }
    });
  }

  try {
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress || '').split(',')[0].trim();

    // Prepare client-side details for server-side match
    const metaUserData = {
      client_ip_address: ipAddress,
      client_user_agent: userAgent,
    };

    if (userData.name) {
      metaUserData.fn = [sha256(normalizeName(userData.name))];
    }
    if (userData.phone) {
      metaUserData.ph = [sha256(normalizePhone(userData.phone))];
    }
    if (userData.fbp) {
      metaUserData.fbp = userData.fbp;
    }
    if (userData.fbc) {
      metaUserData.fbc = userData.fbc;
    }

    const payload = {
      data: [
        {
          event_name: eventName || 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          event_source_url: eventSourceUrl || req.headers['referer'] || '',
          action_source: 'website',
          user_data: metaUserData,
          custom_data: {
            currency: customData.currency || 'NPR',
            value: Number(customData.value || 0),
          }
        }
      ]
    };

    const response = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Meta CAPI API Error]', result);
      return res.status(response.status).json({ success: false, error: result });
    }

    console.log(`[Meta CAPI Success] Event ${eventName} successfully dispatched to Meta.`, result);
    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error('[Meta CAPI Exception Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
