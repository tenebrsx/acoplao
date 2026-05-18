import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // Check if the user is active in public.profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('id', user?.id || '')
      .single()

    if (profile && profile.is_active === false) {
      // Clear cookies by setting them to expire immediately
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        supabaseResponse.cookies.delete(cookie.name)
      })

      // Only redirect if they aren't already on the access-revoked page
      if (!request.nextUrl.pathname.startsWith('/access-revoked')) {
        const url = request.nextUrl.clone()
        url.pathname = '/access-revoked'
        return NextResponse.redirect(url)
      }
      return supabaseResponse
    }
  }

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/landing') &&
    !request.nextUrl.pathname.startsWith('/portal') &&
    !request.nextUrl.pathname.startsWith('/review') &&
    !request.nextUrl.pathname.startsWith('/shared-docs') &&
    !request.nextUrl.pathname.startsWith('/api')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }


  return supabaseResponse
}
