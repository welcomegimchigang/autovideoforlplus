const fs = require('fs');

async function testExact() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const keyMatch = envFile.match(/TYPECAST_API_KEY=([^\r\n]+)/);
  const apiKey = keyMatch ? keyMatch[1].trim() : '';

  console.log('Testing with API key:', apiKey.slice(0, 10));

  const response = await fetch('https://api.typecast.ai/v1/text-to-speech', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      voice_id: 'tc_5c547544fcfee90007fed455',
      text: '우리가 피땀 흘려 세운 회사가, 고작 종이 한 장에 넘어갔다고?',
      model: 'ssfm-v30',
    }),
  });

  console.log('Status:', response.status);
  const text = await response.text();
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  console.log('Response body (length):', text.length);
  if (!response.ok) {
    console.log('Error content:', text);
  } else {
    console.log('Success byte length:', text.length);
  }
}

testExact().catch(console.error);
