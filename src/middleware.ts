import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/login',
  '/auth',        // Firebase email link callback
  '/landing',
  '/portal',
  '/review',
  '/shared-docs',
  '/api',
  '/access-revoked',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths through
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  if (isPublic) return NextResponse.next()

  // Check for our Firebase session cookie
  const sessionToken = request.cookies.get('firebase-session')?.value

  if (!sessionToken) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Token exists — let through. Deep verification happens in server components via firebase-admin.
  // (Edge Runtime can't run firebase-admin, so we do a lightweight cookie presence check here.)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
