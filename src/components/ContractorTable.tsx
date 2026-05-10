'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Shield, ShieldAlert, Power, Loader2, Activity, Zap } from 'lucide-react'

type Profile = {
  id: string
  email: string
  role: 'admin' | 'manager' | 'contractor' | 'client'
  is_active: boolean
  invite_status?: string
  created_at: string
}

export function ContractorTable() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  
  // Local state for instant realtime updates on top of React Query
  const [realtimeProfiles, setRealtimeProfiles] = useState<Profile[]>([])

  // 1. Fetch Contractors (All profiles)
  const { data: initialContractors, isLoading } = useQuery({
    queryKey: ['contractors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Profile[]
    }
  })

  // Sync initial fetch to local state
  useEffect(() => {
    if (initialContractors) {
      setRealtimeProfiles(initialContractors)
    }
  }, [initialContractors])

  // 2. Realtime Subscription
  useEffect(() => {
    const channel = supabase.channel('realtime_profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRealtimeProfiles(current => [payload.new as Profile, ...current])
          } else if (payload.eventType === 'UPDATE') {
            setRealtimeProfiles(current => current.map(p => p.id === payload.new.id ? payload.new as Profile : p))
          } else if (payload.eventType === 'DELETE') {
            setRealtimeProfiles(current => current.filter(p => p.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  // 3. Mutation to Toggle/Approve/Reject Status
  const toggleMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string, action: 'approve' | 'reject' | 'revoke' }) => {
      const is_active = action === 'approve'
      const invite_status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'revoked'

      const { error } = await supabase.from('profiles').update({ is_active, invite_status }).eq('id', userId)
      if (error) throw error
      return true
    },
    onError: (err) => {
      alert(`Error updating user: ${err.message}`)
    }
  })

  // 4. Mutation to Change Role
  const roleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string, newRole: string }) => {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
      if (error) throw error
      return true
    },
    onError: (err) => {
      alert(`Error updating role: ${err.message}`)
    }
  })

  if (isLoading) {
    return (
      <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} color="var(--text-tertiary)" />
      </div>
    )
  }

  const activeMembers = realtimeProfiles.filter(c => c.is_active && c.invite_status !== 'pending') || []
  const pendingMembers = realtimeProfiles.filter(c => c.invite_status === 'pending') || []
  const revokedMembers = realtimeProfiles.filter(c => !c.is_active && c.invite_status !== 'pending') || []

  // Helper to generate a stable pseudo-random capacity load for visualization
  const getCapacityLoad = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash) % 100;
  }

  return (
    <div>
      {/* Invite Section */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--accent-primary)', boxShadow: '0 8px 32px rgba(0,225,255,0.05)' }}>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} color="var(--accent-primary)" /> Expand the Agency
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Share this magic link. New users instantly join as Contractors and appear below in real-time.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-primary)', padding: '6px 6px 6px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--surface-border)' }}>
          <code style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>https://aura.agency/join</code>
          <button 
            onClick={() => {
              navigator.clipboard.writeText('https://aura.agency/join')
              alert('Copied to clipboard!')
            }}
            className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)', padding: '6px 16px', fontSize: '0.8125rem' }}
          >
            Copy Link
          </button>
        </div>
      </div>

      {/* Pending Invites */}
      {pendingMembers.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} color="var(--warning)" /> Pending Invites ({pendingMembers.length})
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {pendingMembers.map((member) => (
              <div key={member.id} className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--warning)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.email}</div>
                  <div className="badge" style={{ background: 'rgba(234, 179, 8, 0.1)', color: 'var(--warning)', textTransform: 'capitalize' }}>Pending</div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => toggleMutation.mutate({ userId: member.id, action: 'approve' })}
                    disabled={toggleMutation.isPending}
                    className="btn btn-sm"
                    style={{ background: 'var(--success)', color: 'var(--bg-primary)', border: 'none' }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => toggleMutation.mutate({ userId: member.id, action: 'reject' })}
                    disabled={toggleMutation.isPending}
                    className="btn btn-sm"
                    style={{ background: 'transparent', border: '1px solid var(--error)', color: 'var(--error)' }}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Members */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} color="var(--success)" /> Active Members ({activeMembers.length})
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {activeMembers.map((member) => {
            const load = getCapacityLoad(member.id)
            const loadColor = load > 80 ? 'var(--error)' : load > 50 ? 'var(--warning)' : 'var(--success)'

            return (
              <div key={member.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'border-color 0.2s ease, transform 0.2s ease', position: 'relative', overflow: 'hidden' }}>
                
                {/* Visual Load Indicator Background */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--surface-border)' }}>
                  <div style={{ height: '100%', width: `${load}%`, background: loadColor, transition: 'width 1s ease-in-out' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '12px', 
                    background: 'var(--surface-hover)', border: '1px solid var(--surface-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)',
                    position: 'relative'
                  }}>
                    {member.email.charAt(0).toUpperCase()}
                    {/* Online Dot */}
                    <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--success)', border: '2px solid var(--surface)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>{member.email}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Activity size={12} color={loadColor} /> 
                      {load}% Capacity
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--surface-border)' }}>
                  <select 
                    value={member.role} 
                    onChange={(e) => roleMutation.mutate({ userId: member.id, newRole: e.target.value })}
                    disabled={roleMutation.isPending && roleMutation.variables?.userId === member.id}
                    style={{ 
                      background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)', 
                      fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', outline: 'none',
                      padding: '4px 8px', borderRadius: '6px'
                    }}
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="contractor">Contractor</option>
                    <option value="client">Client</option>
                  </select>

                  <button
                    onClick={() => toggleMutation.mutate({ userId: member.id, action: 'revoke' })}
                    disabled={toggleMutation.isPending}
                    style={{ fontSize: '0.8125rem', color: 'var(--error)', background: 'rgba(255, 69, 58, 0.1)', border: '1px solid rgba(255, 69, 58, 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', transition: 'all 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 69, 58, 0.2)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 69, 58, 0.1)'}
                  >
                    {toggleMutation.isPending && toggleMutation.variables?.userId === member.id ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
                    Revoke
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Revoked Members */}
      {revokedMembers.length > 0 && (
        <div style={{ opacity: 0.8 }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={16} color="var(--error)" /> Revoked Access ({revokedMembers.length})
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {revokedMembers.map((member) => (
              <div key={member.id} className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderStyle: 'dashed' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, textDecoration: 'line-through', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.email}</div>
                  <div className="badge" style={{ background: 'transparent', border: '1px solid var(--surface-border)', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{member.role}</div>
                </div>
                
                <button
                  onClick={() => toggleMutation.mutate({ userId: member.id, action: 'approve' })}
                  disabled={toggleMutation.isPending}
                  className="btn btn-sm"
                  style={{ background: 'var(--surface-hover)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)' }}
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

