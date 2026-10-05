const fs = require('fs');

async function testTTS() {
  const apiKey = '__pltJde6MnZH6A7UDisQsWnFYmTAWDWhNUoZqThtxZ58';
  const url = 'https://api.typecast.ai/v1/text-to-speech';

  const testCases = [
    { name: '찬구 (Plue)', voiceId: 'tc_5c547544fcfee90007fed455', text: '우리가 피땀 흘려 세운 회사가, 고작 종이 한 장에 넘어갔다고?' },
    { name: '서현 (Beom)', voiceId: 'tc_69f2e455ea79fd197aa0476f', text: '플루, 지금 안 찍으면 투자금 날아간다고!' },
  ];

  for (const tc of testCases) {
    console.log(`\nTesting TTS for ${tc.name} (${tc.voiceId})...`);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({
        voice_id: tc.voiceId,
        text: tc.text,
        model: 'ssfm-v30',
      }),
    });

    console.log('Status:', res.status, res.statusText);
    const contentType = res.headers.get('content-type');
    console.log('Content-Type:', contentType);

    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      console.log(`Audio binary received! Byte size: ${buffer.length} bytes`);
      const sampleFile = `scratch/${tc.name.includes('찬구') ? 'changu' : 'seohyeon'}.wav`;
      fs.mkdirSync('scratch', { recursive: true });
      fs.writeFileSync(sampleFile, buffer);
      console.log(`Saved to ${sampleFile}`);
    } else {
      const err = await res.text();
      console.log('Error:', err);
    }
  }
}

testTTS().catch(console.error);
