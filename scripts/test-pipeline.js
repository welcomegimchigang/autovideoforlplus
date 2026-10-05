async function test() {
  const baseUrl = 'http://localhost:3000';
  const cookieHeader = 'plue_session=plue2026!';

  console.log('--- 1. Testing Auth API ---');
  const authRes = await fetch(`${baseUrl}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'plue2026!' }),
  });
  console.log('Auth status:', authRes.status);
  const authData = await authRes.json();
  console.log('Auth result:', authData);

  console.log('\n--- 2. Testing Parse Script API (Claude Head Agent) ---');
  const sampleScript = `[EP.00: 회귀한 아기 고래의 33% 지분 방어전]
플루: 우리가 피땀 흘려 세운 회사가 고작 종이 한 장에 넘어갔다고?
플루: 하지만 눈을 떠보니 투자 계약서 도장을 찍기 딱 3시간 전이다!
범: 플루, 지금 안 찍으면 투자금 날아간다고!
플루: 잠깐 범아, 등기부등본 확인해 봤어? 페이퍼 컴퍼니야!
플루: 우리의 지분 33%는 거부권의 마지노선이야!`;

  const parseRes = await fetch(`${baseUrl}/api/parse-script`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      episodeId: 'EP.00',
      title: '회귀한 아기 고래의 33% 지분 방어전',
      script: sampleScript,
    }),
  });
  console.log('Parse status:', parseRes.status);
  const parseData = await parseRes.json();
  console.log('Parsed total cuts:', parseData.total_cuts);
  console.log('Cut #1 prompt:', parseData.cuts?.[0]?.visual_prompt);
  console.log('Cut #1 overlay:', parseData.cuts?.[0]?.overlay_type);

  console.log('\n--- 3. Testing 1-by-1 Sequential Queue Worker ---');
  const queueRes = await fetch(`${baseUrl}/api/process-queue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ episodeId: 'EP.00' }),
  });
  console.log('Queue status:', queueRes.status);
  const queueData = await queueRes.json();
  console.log('Processed cut status:', queueData.processed_cut?.status);
  console.log('Speaker & Audio duration:', queueData.processed_cut?.speaker, queueData.processed_cut?.audio_duration + 's');
  console.log('Audio URL:', queueData.processed_cut?.audio_url);
  console.log('Video URL:', queueData.processed_cut?.video_url);

  console.log('\n--- 4. Testing Reroll Cut API ---');
  if (parseData.cuts?.[0]?.id) {
    const rerollRes = await fetch(`${baseUrl}/api/reroll-cut`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        cutId: parseData.cuts[0].id,
        episodeId: 'EP.00',
        mode: 'audio',
      }),
    });
    console.log('Reroll status:', rerollRes.status);
    const rerollData = await rerollRes.json();
    console.log('Reroll success:', rerollData.success, 'New Status:', rerollData.cut?.status);
  }

  console.log('\n--- 5. Testing Episodes and Cuts Query API ---');
  const listRes = await fetch(`${baseUrl}/api/episodes?episodeId=EP.00`, {
    headers: { Cookie: cookieHeader },
  });
  const listData = await listRes.json();
  console.log('Total cuts fetched in EP.00:', listData.cuts?.length);

  console.log('\n=== ALL PIPELINE API TESTS COMPLETED SUCCESSFULLY! ===');
}

test().catch(console.error);
