import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export default function AccessRevoked() {
  return (
    <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="ambient-glow" style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(0,0,0,0) 70%)' }}></div>
      
      <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '480px', padding: '48px', textAlign: 'center' }}>
        <div style={{ 
          width: '80px', height: '80px', borderRadius: '50%', 
          background: 'rgba(239, 68, 68, 0.1)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', color: 'var(--error)'
        }}>
          <ShieldAlert size={40} />
        </div>
        
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '16px' }}>Access Revoked</h1>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: '32px', lineHeight: 1.6 }}>
          Your access to this workspace has been suspended by an administrator. If you believe this is a mistake, please contact the agency owner.
        </p>

        <Link href="/login" className="btn btn-secondary glass-panel" style={{ width: '100%', border: '1px solid var(--glass-border)' }}>
          Return to Login
        </Link>
      </div>
    </div>
  )
}
