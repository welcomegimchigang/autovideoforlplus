const fs = require('fs');

async function regen() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const passMatch = envFile.match(/ACCESS_PASSWORD=([^\r\n]+)/);
  const password = passMatch ? passMatch[1].trim() : 'kingsunguk';

  console.log('Regenerating audios for all cuts in EP.00...');

  // 1. Get cuts
  const res = await fetch('http://localhost:3000/api/episodes?episodeId=EP.00', {
    headers: { Cookie: `plue_session=${password}` },
  });
  const data = await res.json();
  const cuts = data.cuts || [];
  console.log(`Found ${cuts.length} cuts.`);

  for (const cut of cuts) {
    console.log(`\nRe-generating audio for cut #${cut.cut_order} (${cut.cut_id}, ${cut.speaker})...`);
    const rerollRes = await fetch('http://localhost:3000/api/reroll-cut', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `plue_session=${password}`,
      },
      body: JSON.stringify({
        cutId: cut.id,
        episodeId: 'EP.00',
        mode: 'audio', // 오디오만 단독 실제 Typecast TTS로 다시 생성!
      }),
    });

    const rerollData = await rerollRes.json();
    console.log(`Cut #${cut.cut_order} result:`, {
      success: rerollData.success,
      duration: rerollData.cut?.audio_duration,
      audio_url: rerollData.cut?.audio_url,
    });
  }

  console.log('\n=== All audios regenerated! Please refresh browser at http://localhost:3000/admin ===');
}

regen().catch(console.error);
