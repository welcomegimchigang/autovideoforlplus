import { NextRequest, NextResponse } from 'next/server';
import { parseScriptWithClaude } from '@/lib/claude';
import { saveEpisodeAndCuts } from '@/lib/db';
import { Cut, Episode } from '@/lib/types';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { script, episodeId = 'EP.00', title = '회귀한 아기 고래의 숏폼 에피소드' } = body;

    if (!script || typeof script !== 'string' || script.trim().length === 0) {
      return NextResponse.json(
        { error: '대본 텍스트(script)를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 1. Claude 3.5 Sonnet 대본 분석 및 컷 분해
    console.log(`[Head Agent] Parsing script for episode: ${episodeId}...`);
    const parsedData = await parseScriptWithClaude(script, episodeId);

    const episodeRecord: Episode = {
      id: episodeId,
      title: parsedData.title || title,
      created_at: new Date().toISOString(),
    };

    // 2. 컷 목록 생성 (status = 'PENDING')
    const cutRecords: Cut[] = parsedData.cuts.map((c, index) => ({
      id: crypto.randomUUID(),
      episode_id: episodeId,
      cut_id: c.cut_id || `${episodeId.replace('EP.', '')}-${String(index + 1).padStart(2, '0')}`,
      cut_order: c.cut_order ?? index + 1,
      type: c.type || 'video',
      duration_target: c.duration_target || 5.0,
      is_flashback: !!c.is_flashback,
      speaker: c.speaker || 'plue',
      script_text: c.script_text,
      visual_prompt: c.visual_prompt,
      status: 'PENDING',
      audio_url: null,
      audio_duration: null,
      video_url: null,
      overlay_type: c.overlay_type || null,
      overlay_payload: c.overlay_payload || null,
      error_message: null,
      updated_at: new Date().toISOString(),
    }));

    // 3. Supabase DB 및 인메모리 스토어에 저장
    await saveEpisodeAndCuts(episodeRecord, cutRecords);

    console.log(`[Head Agent] Successfully parsed ${cutRecords.length} cuts for ${episodeId}.`);

    return NextResponse.json({
      success: true,
      episode: episodeRecord,
      cuts: cutRecords,
      total_cuts: cutRecords.length,
    });
  } catch (error: any) {
    console.error('[Head Agent Parse Error]:', error);
    return NextResponse.json(
      { error: error?.message || '대본 파싱 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
