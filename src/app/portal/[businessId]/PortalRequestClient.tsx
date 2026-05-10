'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Send, Loader2, Sparkles } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export function PortalRequestClient({ business }: { business: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    projectType: 'Design Revision',
    budget: 'T&M',
    message: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    const supabase = createClient()
    const { error } = await supabase.from('leads').insert({
      company_name: business.name,
      contact_name: business.contact_name || 'Portal Client',
      email: business.contact_email || 'portal@client.com',
      project_type: formData.projectType,
      budget: formData.budget,
      message: formData.message,
      status: 'new',
      converted_business_id: business.id
    })

    if (error) {
      console.error(error)
      alert('Failed to submit request')
      setSaving(false)
      return
    }

    setSaving(false)
    setSuccess(true)
    
    setTimeout(() => {
      setIsOpen(false)
      setSuccess(false)
      setFormData({ projectType: 'Design Revision', budget: 'T&M', message: '' })
    }, 2500)
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="btn btn-primary" 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '24px' }}
      >
        <Sparkles size={16} /> New Request
      </button>

      <AnimatePresence>
        {isOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ position: 'relative', width: '100%', maxWidth: '500px', background: 'var(--bg-main)', border: '1px solid var(--surface-border)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}
            >
              <div style={{ padding: '24px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '4px' }}>Submit a Request</h2>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Need a revision or a completely new campaign?</p>
                </div>
                <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {success ? (
                <div style={{ padding: '48px 32px', textAlign: 'center', background: 'var(--bg-primary)' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(0, 255, 136, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Sparkles size={32} color="var(--success)" />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Request Sent!</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>The agency has been notified and will be in touch shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Request Type</label>
                    <div style={{ position: 'relative' }}>
                      <select 
                        value={formData.projectType}
                        onChange={(e) => setFormData({...formData, projectType: e.target.value})}
                        style={{ width: '100%', padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.875rem', appearance: 'none', cursor: 'pointer' }}
                      >
                        <option>Design Revision</option>
                        <option>New Campaign</option>
                        <option>Website Update</option>
                        <option>Consulting / Strategy</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Estimated Budget (Optional)</label>
                    <input 
                      type="text" 
                      value={formData.budget}
                      onChange={(e) => setFormData({...formData, budget: e.target.value})}
                      placeholder="e.g. $5k or T&M"
                      style={{ width: '100%', padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Details</label>
                    <textarea 
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder="What exactly do you need? Please provide as much detail as possible."
                      style={{ width: '100%', minHeight: '120px', padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.875rem', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', paddingTop: '20px', borderTop: '1px solid var(--surface-border)' }}>
                    <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary" style={{ background: 'transparent' }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={saving || !formData.message} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Submit Request
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
