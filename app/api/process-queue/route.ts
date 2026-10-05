import { NextRequest, NextResponse } from 'next/server';
import { getNextPendingCut, updateCut, getCutsByEpisode, getCharacterAssets } from '@/lib/db';
import { generateTypecastAudio } from '@/lib/typecast';
import { submitKlingVideoTask, pollKlingVideoResult } from '@/lib/kling';
import { uploadAudioToStorage, uploadVideoToStorage } from '@/lib/supabase';

export const maxDuration = 300; // Edge/Serverless 최대 타임아웃 지원

export async function POST(request: NextRequest) {
  let activeCutId: string | null = null;

  try {
    const body = await request.json().catch(() => ({}));
    const { episodeId } = body;

    // 1. PENDING인 컷 중 cut_order 최우선 1개 쿼리
    const targetCut = await getNextPendingCut(episodeId);

    if (!targetCut) {
      return NextResponse.json({
        has_pending: false,
        message: '더 이상 대기 중인(PENDING) 컷이 없습니다. 모든 처리가 완료되었습니다.',
      });
    }

    activeCutId = targetCut.id;

    // 2. 상태를 즉시 PROCESSING으로 변경하여 동시성 제어
    await updateCut(activeCutId, { status: 'PROCESSING' });
    console.log(`[Queue Worker] Processing cut #${targetCut.cut_order} (${targetCut.cut_id})...`);

    // 3. Typecast Voice Sub-Agent: 음성 생성 및 오디오 재생시간(duration, 초) 추출
    console.log(`[Queue Worker] Generating TTS for: "${targetCut.script_text}" (${targetCut.speaker})`);
    const { audioBuffer, audioDuration, mimeType } = await generateTypecastAudio(
      targetCut.script_text,
      targetCut.speaker
    );

    // Supabase Storage 및 로컬에 업로드 (media-assets/audios/)
    const ext = mimeType.includes('wav') ? 'wav' : 'mp3';
    const audioFileName = `${targetCut.episode_id}_${targetCut.cut_id}_audio_${Date.now()}.${ext}`;
    const audioUrl = await uploadAudioToStorage(audioBuffer, audioFileName, mimeType);

    // 4. Kling Visual Sub-Agent: 9:16 비디오 생성
    // 대사 길이가 6.6초 초과이면 10초, 아니면 5초
    const videoDurationMode: '5' | '10' = audioDuration > 6.6 ? '10' : '5';
    console.log(
      `[Queue Worker] Audio duration: ${audioDuration}s. Kling target video duration: ${videoDurationMode}s`
    );

    // Kling Visual Sub-Agent: 9:16 비디오 생성
    // 이미지 결정: 컷 개별 image_url 우선, 없으면 캐릭터 대표 에셋 사용
    const characterAssets = getCharacterAssets();
    let referenceImageUrl: string | undefined = targetCut.image_url || undefined;
    if (!referenceImageUrl) {
      if (targetCut.is_flashback && characterAssets.flashback) {
        referenceImageUrl = characterAssets.flashback;
      } else if (targetCut.speaker === 'plue' && characterAssets.plue) {
        referenceImageUrl = characterAssets.plue;
      } else if (targetCut.speaker === 'beom' && characterAssets.beom) {
        referenceImageUrl = characterAssets.beom;
      }
    }

    if (referenceImageUrl) {
      console.log(`[Queue Worker] Using reference image for Kling I2V: ${referenceImageUrl}`);
    }

    // Kling Task 제출 (무음, silent clip 및 캐릭터 레퍼런스 이미지 강제)
    const { taskId } = await submitKlingVideoTask({
      prompt: targetCut.visual_prompt,
      duration: videoDurationMode,
      imageUrl: referenceImageUrl,
      isFlashback: targetCut.is_flashback,
    });

    console.log(`[Queue Worker] Kling task submitted (${taskId}). Polling with 6-second interval...`);

    // 6초 간격 폴링으로 완료 대기
    const rawVideoUrl = await pollKlingVideoResult(taskId);

    // 생성된 비디오를 Supabase Storage(media-assets/videos/)에 영구 보관 업로드
    let finalVideoUrl = rawVideoUrl;
    try {
      const vidRes = await fetch(rawVideoUrl);
      if (vidRes.ok) {
        const vidBuffer = Buffer.from(await vidRes.arrayBuffer());
        const vidFileName = `${targetCut.episode_id}_${targetCut.cut_id}_video_${Date.now()}.mp4`;
        finalVideoUrl = await uploadVideoToStorage(vidBuffer, vidFileName, 'video/mp4');
      }
    } catch (e: any) {
      console.warn('[Queue Worker] Video re-upload to storage warning:', e.message);
    }

    // 5. DB 상태를 READY로 업데이트
    const updatedCut = await updateCut(activeCutId, {
      status: 'READY',
      audio_url: audioUrl,
      audio_duration: audioDuration,
      video_url: finalVideoUrl,
      duration_target: audioDuration > 0 ? audioDuration : (videoDurationMode === '10' ? 10 : 5),
      error_message: null,
    });

    // 남은 대기 컷 확인
    const remainingCuts = (await getCutsByEpisode(targetCut.episode_id)).filter(
      (c) => c.status === 'PENDING'
    );

    console.log(
      `[Queue Worker] Finished cut #${targetCut.cut_order}. Remaining pending cuts: ${remainingCuts.length}`
    );

    return NextResponse.json({
      success: true,
      has_pending: remainingCuts.length > 0,
      remaining_count: remainingCuts.length,
      processed_cut: updatedCut,
    });
  } catch (error: any) {
    console.error(`[Queue Worker Error]:`, error);

    if (activeCutId) {
      await updateCut(activeCutId, {
        status: 'FAILED',
        error_message: error?.message || '처리 중 알 수 없는 오류 발생',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || '워커 큐 처리 실패',
        cut_id: activeCutId,
      },
      { status: 500 }
    );
  }
}
