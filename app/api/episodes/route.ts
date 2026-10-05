import { NextRequest, NextResponse } from 'next/server';
import { getEpisodes, getCutsByEpisode } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const episodeId = searchParams.get('episodeId');

    if (episodeId) {
      const cuts = await getCutsByEpisode(episodeId);
      return NextResponse.json({ cuts });
    }

    const episodes = await getEpisodes();
    return NextResponse.json({ episodes });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || '조회 실패' },
      { status: 500 }
    );
  }
}
