const { generateTypecastAudio } = require('./lib/typecast');

async function testReal() {
  console.log('Generating real audio for Plue (찬구)...');
  const plueResult = await generateTypecastAudio(
    '우리가 피땀 흘려 세운 회사가, 고작 종이 한 장에 넘어갔다고?',
    'plue'
  );

  console.log('Plue Result:', {
    duration: plueResult.audioDuration,
    byteSize: plueResult.audioBuffer.length,
    mimeType: plueResult.mimeType,
  });

  console.log('\nGenerating real audio for Beom (서현)...');
  const beomResult = await generateTypecastAudio(
    '플루, 지금 안 찍으면 투자금 날아간다고!',
    'beom'
  );

  console.log('Beom Result:', {
    duration: beomResult.audioDuration,
    byteSize: beomResult.audioBuffer.length,
    mimeType: beomResult.mimeType,
  });
}

testReal().catch(console.error);
