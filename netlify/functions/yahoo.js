const https = require('https');

exports.handler = async function(event) {
  const { ticker, interval, range } = event.queryStringParameters || {};

  if (!ticker || !interval || !range) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing parameters' })
    };
  }

  // Sanitise ticker to prevent injection
  const safeTicker = ticker.replace(/[^A-Z0-9.\-]/g, '').toUpperCase();
  const safeInterval = interval.replace(/[^a-z0-9]/g, '');
  const safeRange = range.replace(/[^a-z0-9]/g, '');

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${safeTicker}?interval=${safeInterval}&range=${safeRange}&includePrePost=false`;

  try {
    const data = await new Promise((resolve, reject) => {
      const req = https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
        timeout: 10000
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch { reject(new Error('Invalid JSON')); }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60'
      },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
