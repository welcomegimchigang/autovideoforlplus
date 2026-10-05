const fs = require('fs');

async function main() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const passMatch = envFile.match(/ACCESS_PASSWORD=([^\r\n]+)/);
  const password = passMatch ? passMatch[1].trim() : 'kingsunguk';

  console.log('Fetching cuts...');
  const res = await fetch('http://localhost:3000/api/episodes?episodeId=EP.00', {
    headers: { Cookie: `plue_session=${password}` },
  });
  const data = await res.json();
  const cuts = data.cuts || [];

  if (cuts.length === 0) {
    console.log('No cuts found.');
    return;
  }

  // Reroll cut #1 (Plue - 찬구)
  const cut1 = cuts[0];
  console.log(`\nRerolling cut #1 (${cut1.cut_id}, ${cut1.speaker})...`);
  const r1 = await fetch('http://localhost:3000/api/reroll-cut', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `plue_session=${password}`,
    },
    body: JSON.stringify({
      cutId: cut1.id,
      episodeId: 'EP.00',
      mode: 'audio',
    }),
  });

  const d1 = await r1.json();
  console.log('Cut #1 result:', d1.success, d1.cut?.audio_url, 'Duration:', d1.cut?.audio_duration);

  // Check file size on disk
  const fileName = d1.cut?.audio_url?.replace('/generated-audios/', '');
  if (fileName) {
    const filePath = `public/generated-audios/${fileName}`;
    if (fs.existsSync(filePath)) {
      console.log(`Verified file on disk! Path: ${filePath}, Size: ${fs.statSync(filePath).size} bytes`);
    } else {
      console.log(`File not found at ${filePath}`);
    }
  }

  // Reroll cut #3 (Beom - 서현)
  const cut3 = cuts.find(c => c.speaker === 'beom') || cuts[2];
  if (cut3) {
    console.log(`\nRerolling cut #3 (${cut3.cut_id}, ${cut3.speaker})...`);
    const r3 = await fetch('http://localhost:3000/api/reroll-cut', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `plue_session=${password}`,
      },
      body: JSON.stringify({
        cutId: cut3.id,
        episodeId: 'EP.00',
        mode: 'audio',
      }),
    });
    const d3 = await r3.json();
    console.log('Cut #3 result:', d3.success, d3.cut?.audio_url, 'Duration:', d3.cut?.audio_duration);

    const fn3 = d3.cut?.audio_url?.replace('/generated-audios/', '');
    if (fn3) {
      const fp3 = `public/generated-audios/${fn3}`;
      if (fs.existsSync(fp3)) {
        console.log(`Verified file on disk! Path: ${fp3}, Size: ${fs.statSync(fp3).size} bytes`);
      }
    }
  }
}

main().catch(console.error);
