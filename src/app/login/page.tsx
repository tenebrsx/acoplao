'use client'

import { useState, useEffect } from 'react'
import { sendSignInLinkToEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { motion, AnimatePresence } from 'framer-motion'

export default function LoginPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setIsMounted(true) }, [])

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Build the redirect URL client-side so it's always evaluated in the browser
    const callbackUrl = `${window.location.origin}/auth/callback`
    const actionCodeSettings = {
      url: callbackUrl,
      handleCodeInApp: true,
    }

    try {
      console.log('[login] Sending sign-in link to:', email, '→ callback:', callbackUrl)
      await sendSignInLinkToEmail(auth, email, actionCodeSettings)
      window.localStorage.setItem('emailForSignIn', email)
      console.log('[login] Email sent successfully')
      setSent(true)
    } catch (err: any) {
      console.error('[login] sendSignInLinkToEmail error:', err)
      setError(err.message || 'Failed to send link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isMounted) return null

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', background: '#0c0c0e',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
        style={{
          position: 'relative', zIndex: 1, width: '100%', maxWidth: '400px',
          background: '#141416', border: '1px solid #27272a', borderRadius: '16px',
          padding: '40px', boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
        }}
      >
        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div key="email-step" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
              <div style={{ marginBottom: '32px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px', background: '#22c55e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#fafafa', marginBottom: '6px', letterSpacing: '-0.02em' }}>
                  Sign in to Aura
                </h1>
                <p style={{ fontSize: '0.875rem', color: '#71717a', lineHeight: 1.5 }}>
                  Enter your email and we'll send a secure sign-in link.
                </p>
              </div>

              <form onSubmit={handleSendLink}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#a1a1aa', marginBottom: '6px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    style={{
                      display: 'block', width: '100%', padding: '12px 14px',
                      background: '#0c0c0e', border: '1px solid #27272a', borderRadius: '10px',
                      fontSize: '0.9375rem', color: '#fafafa', outline: 'none',
                      transition: 'border-color 0.15s', boxSizing: 'border-box',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3f3f46'}
                    onBlur={(e) => e.target.style.borderColor = '#27272a'}
                  />
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
                    fontSize: '0.8125rem', color: '#ef4444', marginBottom: '16px',
                    padding: '10px 14px', background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px',
                  }}>
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    width: '100%', padding: '12px 20px',
                    background: loading || !email ? '#1c1c1f' : '#22c55e',
                    color: loading || !email ? '#52525b' : '#000',
                    border: 'none', borderRadius: '10px', fontSize: '0.9375rem', fontWeight: 600,
                    cursor: loading || !email ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s', boxSizing: 'border-box',
                  }}
                  onMouseEnter={(e) => { if (!loading && email) e.currentTarget.style.background = '#16a34a' }}
                  onMouseLeave={(e) => { if (!loading && email) e.currentTarget.style.background = '#22c55e' }}
                >
                  {loading ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.8s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                  ) : 'Send Sign-in Link'}
                </button>
              </form>
            </motion.div>

          ) : (
            <motion.div key="sent-step" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px', background: '#0a84ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </div>
                <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#fafafa', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                  Check your inbox
                </h1>
                <p style={{ fontSize: '0.875rem', color: '#71717a', lineHeight: 1.6, marginBottom: '32px' }}>
                  We sent a sign-in link to<br />
                  <span style={{ color: '#a1a1aa', fontWeight: 600 }}>{email}</span><br /><br />
                  Click the link in the email to access your workspace.
                </p>
                <button
                  onClick={() => { setSent(false); setEmail(''); setError(null) }}
                  style={{
                    fontSize: '0.8125rem', color: '#52525b', background: 'none', border: 'none',
                    cursor: 'pointer', transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#a1a1aa'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#52525b'}
                >
                  ← Use a different email
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
