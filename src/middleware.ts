import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - review (public review pages)
     * - api/review (public review API)
     * - docs/shared (public document sharing)
     */
    '/((?!_next/static|_next/image|favicon.ico|review|api/review|shared-docs|capacity|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
