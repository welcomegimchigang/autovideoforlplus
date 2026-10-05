import { NextRequest, NextResponse } from 'next/server';
import { getCutsByEpisode, updateCut, getCharacterAssets } from '@/lib/db';
import { generateTypecastAudio } from '@/lib/typecast';
import { submitKlingVideoTask, pollKlingVideoResult } from '@/lib/kling';
import { uploadAudioToStorage, uploadVideoToStorage } from '@/lib/supabase';
import { Cut } from '@/lib/types';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cutId, episodeId, mode = 'all' } = body; // mode: 'all' | 'video' | 'audio'

    if (!cutId) {
      return NextResponse.json(
        { error: '재생성할 cutId가 필요합니다.' },
        { status: 400 }
      );
    }

    // 대상 컷 조회
    let targetCut: Cut | undefined;
    if (episodeId) {
      const cuts = await getCutsByEpisode(episodeId);
      targetCut = cuts.find((c) => c.id === cutId || c.cut_id === cutId);
    }

    if (!targetCut) {
      return NextResponse.json(
        { error: `ID ${cutId}에 해당하는 컷을 찾을 수 없습니다.` },
        { status: 404 }
      );
    }

    // 상태를 PROCESSING으로 변경
    await updateCut(targetCut.id, { status: 'PROCESSING', error_message: null });

    const updates: Partial<Cut> = {};

    // 1. Audio 재생성 (mode === 'all' or 'audio')
    if (mode === 'all' || mode === 'audio') {
      console.log(`[Reroll] Re-synthesizing audio for cut ${targetCut.cut_id}...`);
      const { audioBuffer, audioDuration, mimeType } = await generateTypecastAudio(
        targetCut.script_text,
        targetCut.speaker
      );

      const ext = mimeType.includes('wav') ? 'wav' : 'mp3';
      const audioFileName = `${targetCut.episode_id}_${targetCut.cut_id}_reroll_${Date.now()}.${ext}`;
      const audioUrl = await uploadAudioToStorage(audioBuffer, audioFileName, mimeType);

      updates.audio_url = audioUrl;
      updates.audio_duration = audioDuration;
      updates.duration_target = audioDuration > 0 ? audioDuration : targetCut.duration_target;
    }

    // 2. Video 재생성 (mode === 'all' or 'video')
    if (mode === 'all' || mode === 'video') {
      const audioDuration = updates.audio_duration ?? targetCut.audio_duration ?? 5.0;
      const videoDurationMode: '5' | '10' = audioDuration > 6.6 ? '10' : '5';

      const characterAssets = getCharacterAssets();
      let referenceImageUrl: string | undefined = targetCut.image_url || undefined;
      if (!referenceImageUrl) {
        const speaker = targetCut.speaker?.toLowerCase();
        if (speaker === 'plue' && characterAssets.plue) {
          referenceImageUrl = characterAssets.plue;
        } else if (speaker === 'beom' && characterAssets.beom) {
          referenceImageUrl = characterAssets.beom;
        } else if (characterAssets.custom && characterAssets.custom.length > 0) {
          const matched = characterAssets.custom.find(
            (c) =>
              c.id.toLowerCase() === speaker ||
              c.name.toLowerCase() === speaker ||
              (c.name && targetCut.script_text?.includes(c.name)) ||
              (c.name && targetCut.visual_prompt?.includes(c.name)) ||
              (c.id && targetCut.visual_prompt?.toLowerCase().includes(c.id.toLowerCase()))
          );
          if (matched && matched.url) {
            referenceImageUrl = matched.url;
          }
        }

        if (!referenceImageUrl && characterAssets.plue) {
          referenceImageUrl = characterAssets.plue;
        }
      }

      console.log(`[Reroll] Re-generating Kling video for cut ${targetCut.cut_id} (image: ${referenceImageUrl || 'none'})...`);
      const { taskId } = await submitKlingVideoTask({
        prompt: targetCut.visual_prompt,
        duration: videoDurationMode,
        imageUrl: referenceImageUrl,
        isFlashback: targetCut.is_flashback,
      });

      const rawVideoUrl = await pollKlingVideoResult(taskId);

      let finalVideoUrl = rawVideoUrl;
      try {
        const vidRes = await fetch(rawVideoUrl);
        if (vidRes.ok) {
          const vidBuffer = Buffer.from(await vidRes.arrayBuffer());
          const vidFileName = `${targetCut.episode_id}_${targetCut.cut_id}_reroll_${Date.now()}.mp4`;
          finalVideoUrl = await uploadVideoToStorage(vidBuffer, vidFileName, 'video/mp4');
        }
      } catch (e: any) {
        console.warn('[Reroll] Video upload fallback:', e.message);
      }

      updates.video_url = finalVideoUrl;
    }

    updates.status = 'READY';
    const updatedCut = await updateCut(targetCut.id, updates);

    return NextResponse.json({
      success: true,
      mode,
      cut: updatedCut,
    });
  } catch (error: any) {
    console.error('[Reroll Cut Error]:', error);
    return NextResponse.json(
      { error: error?.message || '컷 재생성 실패' },
      { status: 500 }
    );
  }
}
