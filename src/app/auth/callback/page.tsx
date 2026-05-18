'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isSignInWithEmailLink, signInWithEmailLink, getIdToken } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { motion } from 'framer-motion'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function completeSignIn() {
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        setStatus('error')
        setErrorMsg('Invalid sign-in link. Please request a new one.')
        return
      }

      let email = window.localStorage.getItem('emailForSignIn')
      if (!email) {
        // Fallback: ask user to re-enter email (tab/device mismatch)
        email = window.prompt('Please enter your email to complete sign-in:')
      }

      if (!email) {
        setStatus('error')
        setErrorMsg('Email is required to complete sign-in.')
        return
      }

      try {
        const result = await signInWithEmailLink(auth, email, window.location.href)
        window.localStorage.removeItem('emailForSignIn')

        // Get the Firebase ID token and set it as a secure session cookie
        const idToken = await getIdToken(result.user)
        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        })

        if (!res.ok) throw new Error('Failed to create session')

        router.replace('/')
      } catch (err: any) {
        console.error('[auth/callback]', err)
        setStatus('error')
        setErrorMsg(err.message || 'Sign-in failed. Please try again.')
      }
    }

    completeSignIn()
  }, [router])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0c0c0e', fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          textAlign: 'center', padding: '48px 40px', maxWidth: '400px', width: '100%',
          background: '#141416', border: '1px solid #27272a', borderRadius: '16px',
        }}
      >
        {status === 'loading' ? (
          <>
            <div style={{
              width: '36px', height: '36px', border: '2px solid #27272a',
              borderTopColor: '#22c55e', borderRadius: '50%', margin: '0 auto 24px',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ color: '#a1a1aa', fontSize: '0.9375rem' }}>Completing sign-in…</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⚠️</div>
            <h1 style={{ color: '#fafafa', fontWeight: 700, marginBottom: '8px' }}>Sign-in failed</h1>
            <p style={{ color: '#71717a', fontSize: '0.875rem', marginBottom: '24px' }}>{errorMsg}</p>
            <button
              onClick={() => router.replace('/login')}
              style={{
                padding: '12px 24px', background: '#22c55e', color: '#000',
                border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer',
                fontSize: '0.9375rem',
              }}
            >
              Back to Login
            </button>
          </>
        )}
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
