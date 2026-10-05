import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 예외 경로 (정적 에셋, 로그인 페이지, 인증 API 등)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/mock-media') ||
    pathname === '/login' ||
    pathname === '/favicon.ico' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. 세션 쿠키 검증
  const sessionCookie = request.cookies.get('plue_session')?.value;
  const accessPassword = process.env.ACCESS_PASSWORD || 'plue2026!';

  // 쿠키가 없거나 비밀번호와 일치하지 않을 때
  if (!sessionCookie || sessionCookie !== accessPassword) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: '인증이 필요합니다. 올바른 세션 쿠키(plue_session)를 제공해주세요.' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 모든 요청 경로에 적용하되 아래 파일들은 제외:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (파비콘)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
