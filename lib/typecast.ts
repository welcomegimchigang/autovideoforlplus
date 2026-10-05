export interface TypecastSynthesisResult {
  audioBuffer: Buffer;
  audioDuration: number; // in seconds
  mimeType: string;
}

function getValidApiKey(): string {
  try {
    const fs = require('fs');
    if (fs.existsSync('.env.local')) {
      const envFile = fs.readFileSync('.env.local', 'utf8');
      const match = envFile.match(/TYPECAST_API_KEY=([^\r\n]+)/);
      if (match && match[1].trim() && !match[1].includes('...')) {
        return match[1].trim();
      }
    }
  } catch (e) {}
  const envKey = process.env.TYPECAST_API_KEY;
  if (envKey && envKey.length > 10 && !envKey.includes('...')) {
    return envKey;
  }
  return '';
}

function getValidVoiceId(speaker: 'plue' | 'beom' | 'none'): string {
  if (speaker === 'plue') {
    const raw = process.env.TYPECAST_ACTOR_PLUE;
    if (raw && raw.startsWith('tc_')) return raw;
    return 'tc_5c547544fcfee90007fed455'; // 찬구
  }
  if (speaker === 'beom') {
    const raw = process.env.TYPECAST_ACTOR_BEOM;
    if (raw && raw.startsWith('tc_')) return raw;
    return 'tc_69f2e455ea79fd197aa0476f'; // 서현
  }
  return '';
}

function extractWavDuration(buffer: Buffer): number | null {
  try {
    if (buffer.length < 44) return null;
    if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
      return null;
    }
    const byteRate = buffer.readUInt32LE(28);
    if (byteRate > 0) {
      const dataSize = buffer.length - 44;
      const duration = dataSize / byteRate;
      return Math.round(duration * 10) / 10;
    }
  } catch (e) {}
  return null;
}

/**
 * Typecast TTS 음성 합성 및 오디오 길이(duration, 초) 추출
 */
export async function generateTypecastAudio(
  text: string,
  speaker: 'plue' | 'beom' | 'none' = 'plue'
): Promise<TypecastSynthesisResult> {
  const apiKey = getValidApiKey();

  if (speaker === 'none' || !text.trim()) {
    return {
      audioBuffer: Buffer.from([]),
      audioDuration: 0,
      mimeType: 'audio/wav',
    };
  }

  // Fallback / Mock 모드: API Key가 없거나 테스트용 기본값일 때
  if (!apiKey || apiKey.startsWith('tc_...')) {
    console.warn('[Typecast] No valid API key found. Simulating voice synthesis.');
    const cleanedLength = text.replace(/\s+/g, '').length;
    const estimatedDuration = Math.max(1.8, Math.round((cleanedLength / 4.2 + 0.6) * 10) / 10);

    const mockAudioHeader = Buffer.from([
      0xff, 0xfb, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);

    return {
      audioBuffer: mockAudioHeader,
      audioDuration: estimatedDuration,
      mimeType: 'audio/mpeg',
    };
  }

  const voiceId = getValidVoiceId(speaker);

  try {
    // Typecast v1 text-to-speech API 호출
    console.log(`[Typecast] Requesting TTS: voice_id=${voiceId} (${speaker}), text="${text.slice(0, 30)}..."`);
    const response = await fetch('https://api.typecast.ai/v1/text-to-speech', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        voice_id: voiceId,
        text: text,
        model: 'ssfm-v30',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[Typecast] API error (${response.status}: ${errorText}). Falling back to simulated audio.`);
      const cleanedLength = text.replace(/\s+/g, '').length;
      const fallbackDuration = Math.max(1.8, Math.round((cleanedLength / 4.2 + 0.6) * 10) / 10);
      return {
        audioBuffer: Buffer.from([]),
        audioDuration: fallbackDuration,
        mimeType: 'audio/wav',
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    // WAV 헤더 기반 초 단위 정밀 duration 파싱
    let finalDuration = extractWavDuration(audioBuffer);

    if (!finalDuration || finalDuration <= 0) {
      finalDuration = Math.max(2.0, Math.round((text.length / 4.2) * 10) / 10);
    }

    console.log(`[Typecast] TTS synthesized successfully. Duration: ${finalDuration}s, Size: ${audioBuffer.length} bytes`);

    return {
      audioBuffer,
      audioDuration: finalDuration,
      mimeType: 'audio/wav',
    };
  } catch (err: any) {
    console.warn('[Typecast] Synthesis exception (fallback):', err?.message);
    const cleanedLength = text.replace(/\s+/g, '').length;
    const fallbackDuration = Math.max(1.8, Math.round((cleanedLength / 4.2 + 0.6) * 10) / 10);

    return {
      audioBuffer: Buffer.from([]),
      audioDuration: fallbackDuration,
      mimeType: 'audio/wav',
    };
  }
}
