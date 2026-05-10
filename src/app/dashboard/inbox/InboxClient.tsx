'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Users, Sparkles, FolderKanban, CheckCircle2, Circle } from 'lucide-react'
import Link from 'next/link'

export function InboxClient({ initialNotifications, userId }: { initialNotifications: any[], userId: string }) {
  const [notifications, setNotifications] = useState<any[]>(initialNotifications)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    const channel = supabase.channel(`realtime_inbox_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(current => [payload.new, ...current])
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(current => current.map(n => n.id === payload.new.id ? payload.new : n))
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, userId])

  const markAsRead = async (id: string) => {
    setNotifications(current => current.map(n => n.id === id ? { ...n, is_read: true } : n))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }

  const markAllAsRead = async () => {
    setNotifications(current => current.map(n => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'comment': return <MessageSquare size={16} color="var(--info)" />
      case 'lead': return <Users size={16} color="var(--success)" />
      case 'automation': return <Sparkles size={16} color="var(--warning)" />
      default: return <FolderKanban size={16} color="var(--text-secondary)" />
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
      
      {/* Left Column: Notification Feed */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem' }}>All</button>
            <button style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontWeight: 500, fontSize: '0.875rem' }}>Unread ({unreadCount})</button>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8125rem', cursor: 'pointer' }}>
              Mark all as read
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence>
            {notifications.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                You're all caught up. The agency is quiet.
              </div>
            ) : (
              notifications.map((notif) => (
                <motion.div 
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ 
                    padding: '20px 24px', 
                    display: 'flex', alignItems: 'flex-start', gap: '16px',
                    borderBottom: '1px solid var(--surface-border)',
                    background: notif.is_read ? 'transparent' : 'rgba(0, 225, 255, 0.03)',
                    transition: 'background 0.2s',
                    position: 'relative'
                  }}
                >
                  {!notif.is_read && (
                    <div style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
                  )}
                  
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {getIcon(notif.entity_type)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: notif.is_read ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                        {notif.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                      {notif.message}
                    </div>
                    
                    {notif.action_url && (
                      <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
                        <Link href={notif.action_url} className="btn btn-secondary btn-sm" onClick={() => markAsRead(notif.id)} style={{ textDecoration: 'none' }}>
                          View Details
                        </Link>
                        {!notif.is_read && (
                          <button onClick={() => markAsRead(notif.id)} className="btn btn-sm" style={{ background: 'transparent', border: '1px solid var(--surface-border)' }}>
                            <CheckCircle2 size={14} /> Mark Read
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Column: Triage Metrics */}
      <div className="glass-panel" style={{ height: 'fit-content', padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '24px' }}>Triage Velocity</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Avg. Response Time</span>
            <span style={{ fontWeight: 600 }}>1h 24m</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Unread Leads</span>
            <span style={{ fontWeight: 600, color: 'var(--success)' }}>{notifications.filter(n => n.entity_type === 'lead' && !n.is_read).length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Client Comments</span>
            <span style={{ fontWeight: 600, color: 'var(--info)' }}>{notifications.filter(n => n.entity_type === 'comment' && !n.is_read).length}</span>
          </div>
        </div>

        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--surface-border)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            <strong>Pro Tip:</strong> Enable desktop notifications in settings to get pinged instantly when a client drops a time-stamped comment on a video review.
          </div>
        </div>
      </div>

    </div>
  )
}
