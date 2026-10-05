const fs = require('fs');

async function check() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const passMatch = envFile.match(/ACCESS_PASSWORD=([^\r\n]+)/);
  const password = passMatch ? passMatch[1].trim() : 'kingsunguk';

  const res = await fetch('http://localhost:3000/api/episodes', {
    headers: {
      Cookie: `plue_session=${password}`,
    }
  });

  const data = await res.json();
  console.log('Episodes data:', data);

  const epId = data.episodes?.[0]?.id || 'EP.00';
  const cutsRes = await fetch(`http://localhost:3000/api/episodes?episodeId=${epId}`, {
    headers: {
      Cookie: `plue_session=${password}`,
    }
  });

  const cutsData = await cutsRes.json();
  console.log('Cuts count:', cutsData.cuts?.length);
  console.log('Cuts audio info:', cutsData.cuts?.map(c => ({
    cut_id: c.cut_id,
    speaker: c.speaker,
    duration: c.audio_duration,
    audio_url: c.audio_url,
  })));
}

check().catch(console.error);
