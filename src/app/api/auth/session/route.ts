import { NextResponse } from 'next/server'
import { createAuthSessionCookie } from '@/lib/firebase-admin'

// POST /api/auth/session — set session cookie after client-side Firebase sign-in
export async function POST(request: Request) {
  try {
    const { idToken } = await request.json()
    if (!idToken) return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })

    // Generate a secure, server-side session cookie valid for 14 days
    const expiresIn = 60 * 60 * 24 * 14 * 1000 // 14 days in milliseconds
    const sessionCookie = await createAuthSessionCookie(idToken, expiresIn)

    const response = NextResponse.json({ status: 'ok' })
    response.cookies.set('firebase-session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: expiresIn / 1000, // maxAge is in seconds
    })
    return response
  } catch (err) {
    console.error('[session] POST error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/auth/session — clear session cookie on sign-out
export async function DELETE() {
  const response = NextResponse.json({ status: 'ok' })
  response.cookies.delete('firebase-session')
  return response
}
