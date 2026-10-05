const fs = require('fs');

async function getVoices() {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const apiKeyMatch = envContent.match(/TYPECAST_API_KEY=([^\r\n]+)/);
  const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : '';

  console.log('Testing with API key:', apiKey.slice(0, 8) + '...');

  const endpoints = [
    'https://api.typecast.ai/v3/voices',
    'https://api.typecast.ai/v1/voices',
    'https://typecast.ai/api/v3/voices'
  ];

  for (const url of endpoints) {
    try {
      console.log(`\nFetching ${url}...`);
      const res = await fetch(url, {
        headers: {
          'X-API-KEY': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      });

      console.log('Status:', res.status);
      if (res.ok) {
        const data = await res.json();
        const voices = Array.isArray(data) ? data : (data.result || data.voices || data.data || []);
        console.log(`Total voices retrieved: ${voices.length}`);

        // Search for '찬구' and '서현'
        const results = {};
        for (const v of voices) {
          const korName = v.voice_name?.kor || v.name_kor || v.name || '';
          const engName = v.voice_name?.eng || v.name_eng || '';
          const voiceId = v.voice_id || v.actor_id || v.id;

          if (korName.includes('찬구') || engName.toLowerCase().includes('changu') || korName.includes('changu')) {
            results['찬구'] = { voiceId, korName, engName, full: v };
          }
          if (korName.includes('서현') || engName.toLowerCase().includes('seohyun') || korName.includes('seohyun')) {
            results['서현'] = { voiceId, korName, engName, full: v };
          }
        }

        console.log('\n--- Search Results ---');
        console.log(JSON.stringify(results, null, 2));

        if (voices.length > 0 && (!results['찬구'] || !results['서현'])) {
          console.log('\nSample 10 voice names:');
          voices.slice(0, 10).forEach(v => {
            console.log(v.voice_id || v.id, ':', v.voice_name?.kor || v.name);
          });
        }
        return;
      } else {
        const errText = await res.text();
        console.log('Error text:', errText.slice(0, 200));
      }
    } catch (e) {
      console.log('Fetch error:', e.message);
    }
  }
}

getVoices().catch(console.error);
