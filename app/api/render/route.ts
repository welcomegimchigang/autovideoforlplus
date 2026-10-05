import { NextRequest, NextResponse } from 'next/server';
import { getCutsByEpisode } from '@/lib/db';
import { supabaseAdmin, STORAGE_BUCKET_RENDERS } from '@/lib/supabase';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { episodeId } = body;

    if (!episodeId) {
      return NextResponse.json(
        { error: 'episodeId가 필요합니다.' },
        { status: 400 }
      );
    }

    const cuts = await getCutsByEpisode(episodeId);

    if (cuts.length === 0) {
      return NextResponse.json(
        { error: '에피소드에 해당하는 컷이 없습니다.' },
        { status: 400 }
      );
    }

    const nonReady = cuts.filter((c) => c.status !== 'READY');
    if (nonReady.length > 0) {
      return NextResponse.json(
        {
          error: `아직 생성 완료되지 않은 컷이 ${nonReady.length}개 있습니다. 모든 컷이 READY 상태여야 렌더링이 가능합니다.`,
        },
        { status: 400 }
      );
    }

    // 총 길이 계산
    const totalDurationSeconds = cuts.reduce((acc, cut) => {
      const duration = cut.audio_duration && cut.audio_duration > 0
        ? cut.audio_duration
        : cut.duration_target || 5.0;
      return acc + duration;
    }, 0);

    const totalFrames = Math.ceil(totalDurationSeconds * 30);
    const renderFileName = `${episodeId}_final_${Date.now()}.mp4`;

    // 가상 렌더링 완료 URL 생성 (Supabase Storage final-renders 버킷 경로)
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKET_RENDERS)
      .getPublicUrl(renderFileName);

    const downloadUrl = publicUrlData.publicUrl || `/api/mock-media?type=video&name=${renderFileName}`;

    console.log(`[Remotion Render] Synthesized 9:16 Shorts for ${episodeId}. Total frames: ${totalFrames} (${totalDurationSeconds.toFixed(1)}s)`);

    return NextResponse.json({
      success: true,
      episodeId,
      total_cuts: cuts.length,
      duration_seconds: totalDurationSeconds,
      total_frames: totalFrames,
      download_url: downloadUrl,
      render_id: `render_${Date.now()}`,
    });
  } catch (error: any) {
    console.error('[Render Error]:', error);
    return NextResponse.json(
      { error: error?.message || '렌더링 실패' },
      { status: 500 }
    );
  }
}
