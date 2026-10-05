const fs = require('fs');

async function findActors() {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const apiKeyMatch = envContent.match(/TYPECAST_API_KEY=([^\r\n]+)/);
  const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : '';

  console.log('Using API key:', apiKey.slice(0, 10) + '...');

  const endpoints = [
    'https://typecast.ai/api/actors',
    'https://typecast.ai/api/voices',
    'https://play.typecast.ai/api/actors',
    'https://api.typecast.ai/actors',
    'https://api.typecast.ai/v1/actors',
    'https://typecast.ai/api/actor',
  ];

  for (const url of endpoints) {
    try {
      console.log(`Checking ${url}...`);
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`Status for ${url}:`, res.status);
      if (res.ok) {
        const data = await res.json();
        console.log(`Success on ${url}! Data structure:`, Object.keys(data));
        
        let actors = [];
        if (Array.isArray(data)) actors = data;
        else if (data.result && Array.isArray(data.result)) actors = data.result;
        else if (data.actors && Array.isArray(data.actors)) actors = data.actors;
        else if (data.data && Array.isArray(data.data)) actors = data.data;

        console.log(`Total actors found: ${actors.length}`);
        
        // Search for '찬구' and '서현'
        const targets = ['찬구', '서현'];
        const matched = actors.filter(a => {
          const name = a.name || a.actor_name || a.title || '';
          return targets.some(t => name.includes(t));
        });

        console.log('Matched actors:', JSON.stringify(matched, null, 2));

        if (matched.length > 0) {
          return matched;
        }

        // Print first 5 actors to see format
        console.log('Sample actors:', JSON.stringify(actors.slice(0, 5), null, 2));
        return actors;
      } else {
        const text = await res.text();
        console.log(`Error body for ${url}:`, text.slice(0, 150));
      }
    } catch (e) {
      console.log(`Failed fetching ${url}:`, e.message);
    }
  }
}

findActors().catch(console.error);
