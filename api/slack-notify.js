export default async function handler(req, res) {
  // Only allow POST requests for Slack notifications
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { name, phone, address, quantity, location, totalPrice } = req.body;

  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

  // Safe fallback if Slack Webhook URL is not set
  if (!slackWebhookUrl) {
    console.warn('[Slack Notification Mock] SLACK_WEBHOOK_URL environment variable is missing.');
    return res.status(200).json({
      success: true,
      message: 'Slack notification simulated in MOCK mode (Missing webhook url).',
      debug: { name, phone, address, quantity, location, totalPrice }
    });
  }

  try {
    const formattedLocation = location === 'inside' ? 'Inside Kathmandu Valley' : 'Outside Valley';
    
    const slackPayload = {
      text: `🚨 *New Order Placed!* 🚨`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `🚨 *NEW BOHO NEPAL ORDER!* 🚨\n\n` +
                  `👤 *Customer*: \`${name}\`\n` +
                  `📞 *Phone Number*: \`${phone}\`\n` +
                  `📍 *Delivery Address*: \`${address}\`\n` +
                  `📦 *Quantity Ordered*: \`${quantity} Bag(s)\`\n` +
                  `🌍 *Delivery Area*: \`${formattedLocation}\`\n` +
                  `💰 *Grand Total (COD)*: *Rs. ${totalPrice}*\n\n` +
                  `🚚 _Please prepare the Bohemian Hemp Sidebag and process this order._`
          }
        },
        {
          type: "divider"
        }
      ]
    };

    const response = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(slackPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Slack Notification Error]', errorText);
      return res.status(response.status).json({ success: false, error: errorText });
    }

    console.log('[Slack Notification Success] Order notification sent to Slack successfully.');
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[Slack Notification Exception]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
