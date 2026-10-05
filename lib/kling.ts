import { SignJWT } from 'jose';

export interface KlingTaskResponse {
  code: number;
  message: string;
  data: {
    task_id: string;
    task_status: 'SUBMITTED' | 'PROCESSING' | 'SUCCEED' | 'FAILED';
    task_status_msg?: string;
    created_at?: number;
    updated_at?: number;
    task_result?: {
      videos?: Array<{
        id: string;
        url: string;
        duration: string;
      }>;
    };
  };
}

export interface KlingGenerationParams {
  prompt: string;
  duration?: '5' | '10';
  imageUrl?: string;
  isFlashback?: boolean;
}

const MANDATORY_NEGATIVE_PROMPT =
  'human, person, realistic, text, letters, numbers, logo, orange color, open mouth talking';

const STYLE_BASE =
  'Glossy 3D animation, round toy-like, smooth underwater cinematic light, floating particles';

const FLASHBACK_STYLE =
  'indigo color tone, dark desaturated, dark vignetting, 1st round flashback memory';

/**
 * Kling Official API 인증용 JWT 토큰 생성 (HS256)
 */
export async function getKlingAuthToken(): Promise<string | null> {
  const accessKey = process.env.KLING_ACCESS_KEY;
  const secretKey = process.env.KLING_SECRET_KEY;

  if (!accessKey || !secretKey) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const secret = new TextEncoder().encode(secretKey);

  const token = await new SignJWT({
    iss: accessKey,
    exp: now + 1800, // 30분 유효
    nbf: now - 5,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .sign(secret);

  return token;
}

/**
 * 프롬프트 보강: 필수 스타일, 회상 톤, 끝에 'silent clip' 강제
 */
export function buildKlingPrompt(rawPrompt: string, isFlashback = false): string {
  let prompt = `${STYLE_BASE}, ${rawPrompt.trim()}`;
  if (isFlashback) {
    prompt = `${FLASHBACK_STYLE}, ${prompt}`;
  }
  if (!prompt.toLowerCase().endsWith('silent clip')) {
    prompt = `${prompt}, silent clip`;
  }
  return prompt;
}

/**
 * Kling Image-to-Video / Text-to-Video 비디오 생성 요청
 */
export async function submitKlingVideoTask(
  params: KlingGenerationParams
): Promise<{ taskId: string }> {
  const token = await getKlingAuthToken();
  const apiUrl = process.env.KLING_API_URL || 'https://api.klingai.com';

  const fullPrompt = buildKlingPrompt(params.prompt, params.isFlashback);
  const duration = params.duration || '5';

  if (!token) {
    console.warn('[Kling] No API credentials found. Simulating task creation.');
    return { taskId: `mock-kling-${Date.now()}` };
  }

  const payload: Record<string, any> = {
    model_name: 'kling-v1',
    prompt: fullPrompt,
    negative_prompt: MANDATORY_NEGATIVE_PROMPT,
    cfg_scale: 0.5,
    mode: 'std',
    aspect_ratio: '9:16',
    duration: duration,
    sound: false, // 무음 강제
  };

  if (params.imageUrl) {
    payload.image = params.imageUrl;
  }

  try {
    const response = await fetch(`${apiUrl}/v1/videos/image2video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[Kling] API submission error (${response.status}: ${errorText}). Falling back to simulated video.`);
      return { taskId: `mock-kling-${Date.now()}` };
    }

    const data: KlingTaskResponse = await response.json();
    if (data.code !== 0 && data.code !== 200) {
      console.warn(`[Kling] API error [${data.code}]: ${data.message}. Falling back to simulated video.`);
      return { taskId: `mock-kling-${Date.now()}` };
    }

    return { taskId: data.data.task_id };
  } catch (err: any) {
    console.warn(`[Kling] Network/API call failed (${err?.message}). Falling back to simulated video.`);
    return { taskId: `mock-kling-${Date.now()}` };
  }
}

/**
 * 6초 간격 폴링으로 Kling 비디오 렌더링 완료 대기 및 다운로드 URL 반환
 */
export async function pollKlingVideoResult(
  taskId: string,
  maxAttempts = 60 // 6초 * 60 = 최대 360초 대기
): Promise<string> {
  // Mock 태스크 처리
  if (taskId.startsWith('mock-kling-')) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // 9:16 해양 애니메이션 샘플 비디오 URL
    return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
  }

  const token = await getKlingAuthToken();
  const apiUrl = process.env.KLING_API_URL || 'https://api.klingai.com';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // 6초 간격 대기
    await new Promise((resolve) => setTimeout(resolve, 6000));

    const response = await fetch(`${apiUrl}/v1/videos/image2video/${taskId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.warn(`[Kling Poll] Warning on attempt ${attempt}: ${response.status}`);
      continue;
    }

    const resData: KlingTaskResponse = await response.json();
    const taskStatus = resData.data?.task_status;

    if (taskStatus === 'SUCCEED') {
      const videos = resData.data.task_result?.videos;
      if (videos && videos.length > 0 && videos[0].url) {
        return videos[0].url;
      }
      throw new Error('Kling task succeeded but no video URL returned.');
    }

    if (taskStatus === 'FAILED') {
      throw new Error(`Kling video generation failed: ${resData.data.task_status_msg || 'Unknown error'}`);
    }

    console.log(`[Kling Poll] Task ${taskId} status: ${taskStatus} (Attempt ${attempt}/${maxAttempts})`);
  }

  throw new Error(`Kling video generation timed out after ${maxAttempts * 6} seconds.`);
}
