'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Mail, ArrowRight, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setStep('code')
    }
    setLoading(false)
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error, data } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Success! Redirection is handled by the middleware/layout typically, 
      // but let's push to dashboard to be safe.
      router.push('/')
    }
  }

  return (
    <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="ambient-glow"></div>
      
      <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '440px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '8px' }}>
            {step === 'email' ? 'Sign in to Aura' : 'Verify Identity'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {step === 'email' 
              ? 'Enter your email to receive a secure login code.' 
              : `We've sent a 6-digit code to ${email}`}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  style={{ paddingLeft: '44px', width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--surface-border)', padding: '12px 14px 12px 44px', borderRadius: 'var(--radius-md)' }}
                  placeholder="name@agency.com"
                  required
                />
              </div>
            </div>

            {error && (
              <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', color: 'var(--error)', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '14px' }}
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <>Send Code <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="otp">Verification Code</label>
              <div style={{ position: 'relative' }}>
                <ShieldCheck size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                  className="input"
                  style={{ 
                    paddingLeft: '44px', width: '100%', background: 'var(--bg-tertiary)', 
                    border: '1px solid var(--surface-border)', padding: '12px 14px 12px 44px', 
                    borderRadius: 'var(--radius-md)', letterSpacing: '0.5em', fontWeight: 700,
                    textAlign: 'center'
                  }}
                  placeholder="000000"
                  required
                />
              </div>
            </div>

            {error && (
              <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', color: 'var(--error)', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '14px' }}
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <>Verify & Enter <ArrowRight size={18} /></>
              )}
            </button>
            
            <button 
              type="button" 
              onClick={() => setStep('email')}
              style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Didn't get the code? Try again.
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
