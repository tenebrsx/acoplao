'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Loader2, Sparkles, Building2, Image as ImageIcon, Code, Briefcase, Hash, CreditCard } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export function ExpenseLoggerClient({ businesses }: { businesses: any[] }) {
  const router = useRouter()
  const [businessId, setBusinessId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<'software' | 'contractor' | 'ad_spend' | 'other'>('software')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  const selectedBusiness = businesses.find(b => b.id === businessId)
  const availableProjects = selectedBusiness?.projects || []

  const handleLogExpense = async () => {
    if (!amount || isNaN(Number(amount))) return alert('Please enter a valid amount.')
    
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('expenses')
      .insert({
        business_id: businessId || null,
        project_id: projectId || null,
        category: category,
        amount: Number(amount),
        expense_date: expenseDate,
        description: description,
        created_by: user?.id
      })

    if (error) {
      console.error(error)
      alert('Failed to log expense')
      setSaving(false)
      return
    }

    router.push('/dashboard/finances')
  }

  const getCategoryIcon = (cat: string) => {
    switch(cat) {
      case 'software': return <Code size={20} />
      case 'contractor': return <Briefcase size={20} />
      case 'ad_spend': return <Sparkles size={20} />
      default: return <Hash size={20} />
    }
  }

  return (
    <div className="animate-in delay-100" style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '64px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <Link href="/dashboard/finances" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)', fontSize: '0.875rem', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Cancel
        </Link>
        <button 
          onClick={handleLogExpense}
          disabled={saving || !amount}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Log Expense
        </button>
      </div>

      {/* Main Expense Panel */}
      <div className="glass-panel" style={{ padding: '48px', background: 'var(--surface)', position: 'relative', overflow: 'hidden' }}>
        
        {/* Large Amount Input */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '48px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Expense Amount</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '3rem', fontWeight: 300, color: 'var(--text-tertiary)' }}>$</span>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              style={{
                width: '200px', padding: '0',
                background: 'transparent', border: 'none',
                color: 'var(--text-primary)', outline: 'none',
                fontSize: '4rem', fontWeight: 600, letterSpacing: '-0.04em',
                textAlign: 'left'
              }}
            />
          </div>
        </div>

        {/* Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Category */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Category</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {['software', 'contractor', 'ad_spend', 'other'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat as any)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                    padding: '16px 8px', borderRadius: '12px', border: '1px solid',
                    background: category === cat ? 'var(--text-primary)' : 'var(--bg-primary)',
                    color: category === cat ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    borderColor: category === cat ? 'var(--text-primary)' : 'var(--surface-border)',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {getCategoryIcon(cat)}
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'capitalize' }}>{cat.replace('_', ' ')}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Description</label>
              <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Vercel Hosting"
                style={{
                  width: '100%', padding: '12px 16px',
                  background: 'var(--bg-primary)', border: '1px solid var(--surface-border)',
                  borderRadius: '8px', color: 'var(--text-primary)', outline: 'none',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            {/* Date */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Date</label>
              <input 
                type="date" 
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px',
                  background: 'var(--bg-primary)', border: '1px solid var(--surface-border)',
                  borderRadius: '8px', color: 'var(--text-primary)', outline: 'none',
                  fontSize: '0.875rem', colorScheme: 'dark'
                }}
              />
            </div>
          </div>

          {/* Links (Business & Project) */}
          <div style={{ padding: '24px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Link to Client (Optional)</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <select 
                  value={businessId}
                  onChange={(e) => { setBusinessId(e.target.value); setProjectId(''); }}
                  style={{ width: '100%', padding: '12px 16px 12px 36px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.875rem', appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="">No Business (General Agency Expense)</option>
                  {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              {businessId && availableProjects.length > 0 && (
                <div style={{ position: 'relative' }}>
                  <CreditCard size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                  <select 
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px 12px 36px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.875rem', appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="">No Specific Project</option>
                    {availableProjects.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Receipt Upload Placeholder */}
          <div>
             <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Receipt</label>
             <div style={{ 
               width: '100%', padding: '32px', border: '1px dashed var(--surface-border)', 
               borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', 
               justifyContent: 'center', gap: '12px', cursor: 'pointer', background: 'var(--bg-primary)'
             }}>
               <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <ImageIcon size={18} color="var(--text-secondary)" />
               </div>
               <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Click or drag receipt to attach</div>
             </div>
          </div>

        </div>
      </div>
    </div>
  )
}
