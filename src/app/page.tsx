'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles, Activity, Layers } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="app-container" style={{ display: 'block', overflow: 'auto' }}>
      <div className="ambient-glow"></div>
      
      <nav className="topbar" style={{ background: 'transparent', border: 'none', padding: '24px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '32px', height: '32px', borderRadius: '8px', 
            background: 'var(--accent-primary)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center' 
          }}>
            <Sparkles size={16} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>Aura.</span>
        </div>
        <div>
          <Link href="/dashboard" className="btn btn-secondary glass-panel" style={{ border: '1px solid var(--glass-border)' }}>
            Client Login
          </Link>
        </div>
      </nav>

      <main className="page-wrapper" style={{ minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', paddingTop: '80px', paddingBottom: '120px' }}>
        
        <div className="badge glass-panel animate-in" style={{ padding: '8px 16px', borderRadius: '24px', marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'inline-block' }}></span>
          Next-Gen Agency OS v2.0
        </div>

        <h1 className="animate-in delay-100" style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', maxWidth: '800px', marginBottom: '24px' }}>
          Elevate your <span className="text-gradient">creative workflows</span> to the next level.
        </h1>

        <p className="animate-in delay-200" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', marginBottom: '40px', lineHeight: 1.6 }}>
          The premium operating system for marketing agencies. Manage clients, track campaigns, and deliver excellence with unprecedented speed.
        </p>

        <div className="animate-in delay-300" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/dashboard" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.05rem' }}>
            Enter Workspace <ArrowRight size={20} />
          </Link>
          <button className="btn btn-secondary glass-panel" style={{ padding: '16px 32px', fontSize: '1.05rem', border: '1px solid var(--glass-border)' }}>
            View Demo
          </button>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-3 animate-in delay-300" style={{ marginTop: '80px', width: '100%', maxWidth: '1000px', textAlign: 'left', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '32px', transition: 'transform 0.3s ease', cursor: 'default' }} 
               onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
               onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: 'var(--text-primary)' }}>
              <Layers size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px' }}>Client Portal</h3>
            <p style={{ color: 'var(--text-secondary)' }}>A dedicated space for your clients to review deliverables and track campaign progress.</p>
          </div>

          <div className="glass-panel" style={{ padding: '32px', transition: 'transform 0.3s ease', cursor: 'default' }}
               onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
               onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0,225,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: 'var(--accent-secondary)' }}>
              <Activity size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px' }}>Real-time Analytics</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Live data ingestion from major ad networks directly into your client's dashboard.</p>
          </div>

          <div className="glass-panel" style={{ padding: '32px', transition: 'transform 0.3s ease', cursor: 'default' }}
               onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
               onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: 'var(--success)' }}>
              <Sparkles size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px' }}>AI Workflows</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Automated campaign brief generation and creative asset optimization using advanced AI.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
