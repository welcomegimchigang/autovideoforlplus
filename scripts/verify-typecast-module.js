const fs = require('fs');

// Load .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim();
    process.env[key] = val;
  }
});

// TypeScript compile to js on the fly or test via transpile
const { generateTypecastAudio } = require('./lib/typecast');

async function testModule() {
  console.log('Voice Plue:', process.env.TYPECAST_ACTOR_PLUE);
  console.log('Voice Beom:', process.env.TYPECAST_ACTOR_BEOM);

  console.log('\n--- Testing 찬구 (Plue) ---');
  const plueRes = await generateTypecastAudio('우리가 피땀 흘려 세운 회사가, 고작 종이 한 장에 넘어갔다고?', 'plue');
  console.log('Plue duration:', plueRes.audioDuration, 'seconds. Buffer size:', plueRes.audioBuffer.length);

  console.log('\n--- Testing 서현 (Beom) ---');
  const beomRes = await generateTypecastAudio('플루, 지금 안 찍으면 투자금 날아간다고!', 'beom');
  console.log('Beom duration:', beomRes.audioDuration, 'seconds. Buffer size:', beomRes.audioBuffer.length);
}

testModule().catch(console.error);
