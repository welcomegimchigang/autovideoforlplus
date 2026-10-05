async function fetchExact() {
  const apiKey = '__pltJde6MnZH6A7UDisQsWnFYmTAWDWhNUoZqThtxZ58';
  const url = 'https://api.typecast.ai/v3/voices';

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'X-API-KEY': apiKey,
    },
  });

  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response body:', text.slice(0, 500));

  if (res.ok) {
    const data = JSON.parse(text);
    const voices = Array.isArray(data) ? data : (data.voices || data.result || []);
    console.log('Count:', voices.length);
    const matched = voices.filter(v => {
      const kor = v.voice_name?.kor || v.name_kor || v.name || '';
      return kor.includes('찬구') || kor.includes('서현');
    });
    console.log('Matched:', JSON.stringify(matched, null, 2));
  }
}

fetchExact().catch(console.error);
