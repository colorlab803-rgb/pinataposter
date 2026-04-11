import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const disableChat = process.env.DISABLE_CHAT === 'true';

  if (disableChat && request.nextUrl.pathname.startsWith('/chat')) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/chat/:path*',
};
