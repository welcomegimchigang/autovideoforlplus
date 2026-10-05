import { NextResponse, type NextRequest } from 'next/server';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    const accessPassword = process.env.ACCESS_PASSWORD || 'plue2026!';

    if (!password || password !== accessPassword) {
      return NextResponse.json(
        { error: '비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true, message: '인증 성공' });

    // HttpOnly 쿠키 설정 (보안 강화)
    response.cookies.set('plue_session', accessPassword, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7일 유지
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: '로그아웃 성공' });
  response.cookies.delete('plue_session');
  return response;
}
