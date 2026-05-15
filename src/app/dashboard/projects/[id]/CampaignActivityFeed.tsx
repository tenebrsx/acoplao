'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Activity, Clock, User, CheckCircle2, MessageSquare, Plus, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function CampaignActivityFeed({ projectId }: { projectId: string }) {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchActivity() {
      const { data } = await supabase
        .from('campaign_activity')
        .select('*, profiles(email)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(15)
      setActivities(data || [])
      setLoading(false)
    }
    fetchActivity()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`campaign-activity-${projectId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'campaign_activity', filter: `project_id=eq.${projectId}` }, 
        (payload) => {
          setActivities((prev) => [payload.new, ...prev].slice(0, 15))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, supabase])

  const getIcon = (action: string) => {
    switch (action) {
      case 'asset_created': return <Plus size={14} color="var(--info)" />
      case 'status_change': return <RefreshCw size={14} color="var(--warning)" />
      case 'phase_completed': return <CheckCircle2 size={14} color="var(--success)" />
      case 'broadcast_sent': return <MessageSquare size={14} color="var(--accent-primary)" />
      default: return <Activity size={14} color="var(--text-tertiary)" />
    }
  }

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Activity size={18} color="var(--accent-secondary)" /> Campaign Pulse
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>Loading feed...</div>
        ) : activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)', fontSize: '0.8125rem', border: '1px dashed var(--surface-border)', borderRadius: '12px' }}>
            No recent activity. Everything is quiet.
          </div>
        ) : (
          activities.map((act) => (
            <div key={act.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                {getIcon(act.action)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 600 }}>{act.profiles?.email?.split('@')[0] || 'System'}</span>
                  {' '}
                  {act.action === 'asset_created' ? 'created' : 
                   act.action === 'status_change' ? 'updated' : 
                   act.action === 'phase_completed' ? 'completed' : 
                   'posted an update for'}
                  {' '}
                  <span style={{ color: 'var(--text-secondary)' }}>{act.target_name}</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={10} />
                  {formatDistanceToNow(new Date(act.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
