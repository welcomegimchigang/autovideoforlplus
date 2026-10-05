import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'video';

  if (type === 'audio') {
    // 1초 무음 MP3 프레임 바이너리
    const mp3Buffer = Buffer.from([
      0xff, 0xfb, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    return new NextResponse(mp3Buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': mp3Buffer.length.toString(),
      },
    });
  }

  // 기본 세로형 숏폼 샘플 영상으로 302 리다이렉트
  return NextResponse.redirect(
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    302
  );
}
