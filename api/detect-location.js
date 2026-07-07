export default function handler(req, res) {
  // Read location headers automatically injected by Vercel's Edge Network
  const cityHeader = req.headers['x-vercel-ip-city'] || '';
  const countryHeader = req.headers['x-vercel-ip-country'] || '';
  
  if (!cityHeader) {
    // In local development or if headers are absent, default to inside valley
    return res.status(200).json({ 
      location: 'inside', 
      city: 'unknown', 
      country: countryHeader 
    });
  }

  const city = decodeURIComponent(cityHeader).toLowerCase();

  // Comprehensive list of known Kathmandu Valley cities/districts/municipalities
  const valleyKeywords = [
    'kathmandu',
    'lalitpur',
    'bhaktapur',
    'patan',
    'kirtipur',
    'thimi',
    'suryabinayak',
    'mahalaxmi',
    'budhanilkantha',
    'tokha',
    'gokarneshwar',
    'kageshwari',
    'nagarjun',
    'tarakeshwar',
    'godawari',
    'changunarayan',
    'shankharapur'
  ];

  // If the user's city matches any of these, they are inside the Kathmandu Valley
  const isInsideValley = valleyKeywords.some(keyword => city.includes(keyword));

  return res.status(200).json({
    location: isInsideValley ? 'inside' : 'outside',
    city: city,
    country: countryHeader
  });
}
