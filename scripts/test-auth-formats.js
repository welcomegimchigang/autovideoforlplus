const fs = require('fs');

async function testAuthHeaders() {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const apiKeyMatch = envContent.match(/TYPECAST_API_KEY=([^\r\n]+)/);
  const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : '';

  const url = 'https://typecast.ai/api/actor';

  const headerVariants = [
    { name: 'Bearer', headers: { Authorization: `Bearer ${apiKey}` } },
    { name: 'Token', headers: { Authorization: `Token ${apiKey}` } },
    { name: 'Raw API Key', headers: { Authorization: apiKey } },
    { name: 'X-API-KEY', headers: { 'x-api-key': apiKey } },
    { name: 'X-Auth-Token', headers: { 'x-auth-token': apiKey } },
  ];

  for (const variant of headerVariants) {
    try {
      console.log(`Testing auth format: ${variant.name}...`);
      const res = await fetch(url, {
        headers: {
          ...variant.headers,
          'Content-Type': 'application/json',
        },
      });

      console.log(`[${variant.name}] Status:`, res.status);
      const text = await res.text();
      console.log(`[${variant.name}] Response:`, text.slice(0, 150));
      if (res.ok) {
        console.log(`SUCCESS with ${variant.name}!`);
        const json = JSON.parse(text);
        console.log('Result count or sample:', Array.isArray(json) ? json.length : Object.keys(json));
        return json;
      }
    } catch (e) {
      console.log(`Error with ${variant.name}:`, e.message);
    }
  }
}

testAuthHeaders().catch(console.error);
