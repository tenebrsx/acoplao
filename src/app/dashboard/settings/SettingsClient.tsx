'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Building2, Users, Shield, Palette, Globe, Bell, Save, AlertCircle, Palette as ColorIcon, LogOut } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { ContractorTable } from '@/components/ContractorTable'

type SettingsTab = 'personal' | 'agency' | 'security'

export function SettingsClient({ 
  initialProfile, 
  initialAgencySettings, 
  userRole 
}: { 
  initialProfile: any
  initialAgencySettings: any
  userRole: string
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('personal')
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  // --- Personal Preferences State ---
  const [theme, setTheme] = useState(initialProfile?.theme || 'dark')
  const [language, setLanguage] = useState(initialProfile?.language || 'en')
  const [timezone, setTimezone] = useState(initialProfile?.timezone || 'UTC')
  const [emailNotifications, setEmailNotifications] = useState(initialProfile?.email_notifications ?? true)

  // --- Agency Settings State (Admin Only) ---
  const [agencyName, setAgencyName] = useState(initialAgencySettings?.agency_name || '')
  const [accentColor, setAccentColor] = useState(initialAgencySettings?.accent_color || '#00e1ff')
  const [defaultCurrency, setDefaultCurrency] = useState(initialAgencySettings?.default_currency || 'USD')
  const [invoiceTerms, setInvoiceTerms] = useState(initialAgencySettings?.invoice_terms || '')
  const [welcomeMessage, setWelcomeMessage] = useState(initialAgencySettings?.portal_welcome_message || '')

  const handleSavePersonal = async () => {
    setIsSaving(true)
    await supabase.from('profiles').update({
      theme, language, timezone, email_notifications: emailNotifications
    }).eq('id', initialProfile.id)
    setIsSaving(false)
    router.refresh()
    // Ideally here we would also trigger a toast and context update
  }

  const handleSaveAgency = async () => {
    setIsSaving(true)
    if (initialAgencySettings?.id) {
      await supabase.from('agency_settings').update({
        agency_name: agencyName,
        accent_color: accentColor,
        default_currency: defaultCurrency,
        invoice_terms: invoiceTerms,
        portal_welcome_message: welcomeMessage
      }).eq('id', initialAgencySettings.id)
    } else {
      await supabase.from('agency_settings').insert({
        agency_name: agencyName,
        accent_color: accentColor,
        default_currency: defaultCurrency,
        invoice_terms: invoiceTerms,
        portal_welcome_message: welcomeMessage
      })
    }
    setIsSaving(false)
    router.refresh()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
      
      {/* Settings Navigation Sidebar */}
      <div style={{ width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button 
          onClick={() => setActiveTab('personal')}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px',
            background: activeTab === 'personal' ? 'var(--surface-hover)' : 'transparent',
            color: activeTab === 'personal' ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 500, transition: 'all 0.2s'
          }}
        >
          <User size={18} color={activeTab === 'personal' ? 'var(--accent-primary)' : 'currentColor'} />
          Personal Preferences
        </button>

        {userRole === 'admin' && (
          <>
            <button 
              onClick={() => setActiveTab('agency')}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px',
                background: activeTab === 'agency' ? 'var(--surface-hover)' : 'transparent',
                color: activeTab === 'agency' ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 500, transition: 'all 0.2s'
              }}
            >
              <Building2 size={18} color={activeTab === 'agency' ? 'var(--accent-primary)' : 'currentColor'} />
              Agency Config
            </button>
          </>
        )}

        <button 
          onClick={() => setActiveTab('security')}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px',
            background: activeTab === 'security' ? 'var(--surface-hover)' : 'transparent',
            color: activeTab === 'security' ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 500, transition: 'all 0.2s'
          }}
        >
          <Shield size={18} color={activeTab === 'security' ? 'var(--accent-primary)' : 'currentColor'} />
          Security & Access
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          
          {/* PERSONAL TAB */}
          {activeTab === 'personal' && (
            <motion.div key="personal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-panel" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--surface-border)' }}>Personal Preferences</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                {/* Appearance */}
                <div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Palette size={16} /> Appearance
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {['dark', 'light', 'system'].map(t => (
                      <button 
                        key={t}
                        onClick={() => setTheme(t)}
                        style={{ 
                          padding: '16px', borderRadius: '12px', border: theme === t ? '1px solid var(--accent-primary)' : '1px solid var(--surface-border)',
                          background: theme === t ? 'rgba(0,225,255,0.05)' : 'var(--surface)', color: 'var(--text-primary)', cursor: 'pointer',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textTransform: 'capitalize'
                        }}
                      >
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: t === 'dark' ? '#111' : t === 'light' ? '#eee' : 'linear-gradient(45deg, #111 50%, #eee 50%)', border: '1px solid var(--surface-border)' }} />
                        <span style={{ fontWeight: 500 }}>{t} Mode</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Localization */}
                <div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={16} /> Localization
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', fontWeight: 500 }}>Language</label>
                      <select value={language} onChange={e => setLanguage(e.target.value)} className="input" style={{ width: '100%', appearance: 'none' }}>
                        <option value="en">English (US)</option>
                        <option value="es">Español (ES)</option>
                        <option value="fr">Français (FR)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', fontWeight: 500 }}>Timezone</label>
                      <select value={timezone} onChange={e => setTimezone(e.target.value)} className="input" style={{ width: '100%', appearance: 'none' }}>
                        <option value="UTC">Coordinated Universal Time (UTC)</option>
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="Europe/London">British Summer Time (BST)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bell size={16} /> Notifications
                  </h3>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--surface-border)', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: '4px' }}>Email Notifications</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Receive alerts for assignments and mentions.</div>
                    </div>
                    <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: emailNotifications ? 'var(--accent-primary)' : 'var(--surface-border)', position: 'relative', transition: 'background 0.3s' }} onClick={() => setEmailNotifications(!emailNotifications)}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: emailNotifications ? '22px' : '2px', transition: 'left 0.3s' }} />
                    </div>
                  </label>
                </div>

              </div>

              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleSavePersonal} disabled={isSaving} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Save size={16} /> {isSaving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </motion.div>
          )}

          {/* AGENCY TAB */}
          {activeTab === 'agency' && userRole === 'admin' && (
            <motion.div key="agency" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-panel" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Global Agency Configuration</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--surface-border)', fontSize: '0.875rem' }}>These settings apply to the entire workspace and affect all team members and clients.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', fontWeight: 500 }}>Agency Legal Name</label>
                  <input value={agencyName} onChange={e => setAgencyName(e.target.value)} className="input" style={{ width: '100%' }} placeholder="e.g. Aura Digital LLC" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ColorIcon size={14} color="var(--text-secondary)" /> Global Accent Color
                    </label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} />
                      <input value={accentColor} onChange={e => setAccentColor(e.target.value)} className="input" style={{ flex: 1, fontFamily: 'monospace' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', fontWeight: 500 }}>Default Currency</label>
                    <select value={defaultCurrency} onChange={e => setDefaultCurrency(e.target.value)} className="input" style={{ width: '100%', appearance: 'none' }}>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', fontWeight: 500 }}>Default Invoice Terms</label>
                  <textarea 
                    value={invoiceTerms} 
                    onChange={e => setInvoiceTerms(e.target.value)} 
                    className="input" 
                    style={{ width: '100%', minHeight: '80px', resize: 'vertical' }} 
                    placeholder="e.g. Payment due within 15 days. 5% late fee applies thereafter."
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', fontWeight: 500 }}>Client Portal Welcome Message</label>
                  <textarea 
                    value={welcomeMessage} 
                    onChange={e => setWelcomeMessage(e.target.value)} 
                    className="input" 
                    style={{ width: '100%', minHeight: '80px', resize: 'vertical' }} 
                    placeholder="e.g. Welcome to your dedicated workspace."
                  />
                </div>
              </div>

              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleSaveAgency} disabled={isSaving} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Save size={16} /> {isSaving ? 'Saving...' : 'Save Global Config'}
                </button>
              </div>
            </motion.div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <motion.div key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-panel" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--surface-border)' }}>Security & Access</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>Password Authentication</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Change your account password securely.</p>
                  </div>
                  <button className="btn btn-secondary">Update Password</button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>Two-Factor Authentication (2FA)</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Add an extra layer of security to your account.</p>
                  </div>
                  <button className="btn btn-secondary">Enable 2FA</button>
                </div>

                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--surface-border)' }}>
                  <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s' }}>
                    <LogOut size={16} /> Sign Out of Agency OS
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  )
}
