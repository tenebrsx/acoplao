'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Play, Filter, Send, Power, PowerOff, Plus, Trash2, ArrowDown, Activity, ChevronRight, CheckCircle2, XCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export function AutomationBuilderClient({ initialAutomations, recentLogs }: { initialAutomations: any[], recentLogs: any[] }) {
  const [automations, setAutomations] = useState<any[]>(initialAutomations)
  const [logs, setLogs] = useState<any[]>(recentLogs)
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel('realtime_automations')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'automation_logs' },
        (payload) => {
          // Unshift to add to top of logs
          setLogs((current) => [payload.new, ...current])
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'automations' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAutomations((current) => !current.find(a => a.id === payload.new.id) ? [payload.new, ...current] : current)
          } else if (payload.eventType === 'UPDATE') {
            setAutomations((current) => current.map(a => a.id === payload.new.id ? { ...a, ...payload.new } : a))
          } else if (payload.eventType === 'DELETE') {
            setAutomations((current) => current.filter(a => a.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Builder State
  const [ruleName, setRuleName] = useState('')
  const [triggerEntity, setTriggerEntity] = useState('deliverable')
  const [triggerEvent, setTriggerEvent] = useState('status_changed')
  const [conditionField, setConditionField] = useState('status_v2')
  const [conditionValue, setConditionValue] = useState('review_ready')
  const [actionType, setActionType] = useState('send_email')
  const [actionTarget, setActionTarget] = useState('client_email')

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('automations').update({ is_active: !currentStatus }).eq('id', id)
    if (!error) {
      setAutomations(prev => prev.map(a => a.id === id ? { ...a, is_active: !currentStatus } : a))
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this rule?")) return
    const { error } = await supabase.from('automations').delete().eq('id', id)
    if (!error) {
      setAutomations(prev => prev.filter(a => a.id !== id))
    }
  }

  const handleSaveAutomation = async () => {
    if (!ruleName) return alert("Please name your automation.")
    setIsSaving(true)

    const payload = {
      name: ruleName,
      entity_type: triggerEntity,
      trigger_event: triggerEvent,
      trigger_condition: { field: conditionField, value: conditionValue },
      action_type: actionType,
      action_payload: { target: actionTarget },
      is_active: true
    }

    const { data, error } = await supabase.from('automations').insert(payload).select().single()
    
    if (!error && data) {
      setAutomations([data, ...automations])
      setIsBuilderOpen(false)
      // Reset form
      setRuleName('')
    } else {
      alert("Failed to save automation")
    }
    setIsSaving(false)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'flex-start' }}>
      
      {/* Left Column: Active Rules & Builder */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={20} color="var(--accent-primary)" /> Active Rules
          </h2>
          {!isBuilderOpen && (
            <button onClick={() => setIsBuilderOpen(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} /> Create Automation
            </button>
          )}
        </div>

        {/* The Visual Builder */}
        <AnimatePresence>
          {isBuilderOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              className="glass-panel" 
              style={{ padding: '32px', marginBottom: '32px', border: '1px solid var(--accent-primary)', overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <input 
                  value={ruleName}
                  onChange={e => setRuleName(e.target.value)}
                  placeholder="Name this automation (e.g., Client Review Ping)"
                  style={{ fontSize: '1.5rem', fontWeight: 700, background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%' }}
                  autoFocus
                />
              </div>

              {/* Node Sequence */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                
                {/* 1. Trigger Node */}
                <div style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '12px', padding: '24px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-12px', left: '24px', background: 'var(--surface-border)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Play size={12} /> TRIGGER
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 500 }}>When a</span>
                    <select value={triggerEntity} onChange={e => setTriggerEntity(e.target.value)} style={{ padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'var(--accent-primary)', fontWeight: 600, outline: 'none' }}>
                      <option value="deliverable">Deliverable</option>
                      <option value="lead">Lead</option>
                      <option value="project">Project</option>
                    </select>
                    <span style={{ fontSize: '1rem', fontWeight: 500 }}>experiences</span>
                    <select value={triggerEvent} onChange={e => setTriggerEvent(e.target.value)} style={{ padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'var(--accent-primary)', fontWeight: 600, outline: 'none' }}>
                      <option value="status_changed">Status Changed</option>
                      <option value="created">Being Created</option>
                    </select>
                  </div>
                </div>

                <ArrowDown size={20} color="var(--surface-border)" />

                {/* 2. Condition Node */}
                <div style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '12px', padding: '24px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-12px', left: '24px', background: 'var(--surface-border)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Filter size={12} /> CONDITION
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 500 }}>Only if</span>
                    <select value={conditionField} onChange={e => setConditionField(e.target.value)} style={{ padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'var(--accent-primary)', fontWeight: 600, outline: 'none' }}>
                      <option value="status_v2">Status</option>
                      <option value="budget">Budget</option>
                    </select>
                    <span style={{ fontSize: '1rem', fontWeight: 500 }}>equals</span>
                    <input value={conditionValue} onChange={e => setConditionValue(e.target.value)} placeholder="e.g. review_ready" style={{ padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'var(--accent-primary)', fontWeight: 600, outline: 'none', width: '160px' }} />
                  </div>
                </div>

                <ArrowDown size={20} color="var(--surface-border)" />

                {/* 3. Action Node */}
                <div style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--accent-primary)', borderRadius: '12px', padding: '24px', position: 'relative', boxShadow: '0 0 20px rgba(0, 225, 255, 0.1)' }}>
                  <div style={{ position: 'absolute', top: '-12px', left: '24px', background: 'var(--accent-primary)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, color: '#000', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Send size={12} /> ACTION
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 500 }}>Then instantly</span>
                    <select value={actionType} onChange={e => setActionType(e.target.value)} style={{ padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'var(--accent-primary)', fontWeight: 600, outline: 'none' }}>
                      <option value="send_email">Send Email To</option>
                      <option value="webhook">Send Slack Message</option>
                    </select>
                    <select value={actionTarget} onChange={e => setActionTarget(e.target.value)} style={{ padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 600, outline: 'none' }}>
                      <option value="client_email">The Client</option>
                      <option value="project_manager">Project Manager</option>
                      <option value="general_channel">#general channel</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Builder Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--surface-border)' }}>
                <button onClick={() => setIsBuilderOpen(false)} style={{ padding: '10px 16px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                <button onClick={handleSaveAutomation} disabled={isSaving} className="btn btn-primary" style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={16} fill="currentColor" /> {isSaving ? 'Saving...' : 'Turn On Automation'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List of Existing Rules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {automations.length === 0 && !isBuilderOpen ? (
            <div style={{ padding: '48px', textAlign: 'center', border: '1px dashed var(--surface-border)', borderRadius: '12px', color: 'var(--text-tertiary)' }}>
              No automations built yet. Click "Create Automation" to put your agency on autopilot.
            </div>
          ) : (
            automations.map(auto => (
              <div key={auto.id} className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: auto.is_active ? '4px solid var(--success)' : '4px solid var(--surface-border)' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {auto.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{auto.entity_type}</span>
                    <ChevronRight size={12} color="var(--text-tertiary)" />
                    <span style={{ textTransform: 'capitalize' }}>{auto.trigger_condition?.value}</span>
                    <ChevronRight size={12} color="var(--text-tertiary)" />
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{auto.action_type}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button 
                    onClick={() => handleToggleActive(auto.id, auto.is_active)}
                    style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', padding: '8px 16px', borderRadius: '8px', color: auto.is_active ? 'var(--success)' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {auto.is_active ? <><Power size={14} /> ON</> : <><PowerOff size={14} /> OFF</>}
                  </button>
                  <button onClick={() => handleDelete(auto.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '8px', opacity: 0.5 }} onMouseOver={e => e.currentTarget.style.opacity = '1'} onMouseOut={e => e.currentTarget.style.opacity = '0.5'}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Execution Logs */}
      <div className="glass-panel" style={{ position: 'sticky', top: '24px', padding: '24px', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="var(--text-secondary)" /> Execution Logs
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem', padding: '24px 0' }}>
              No automations have fired recently.
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} style={{ display: 'flex', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--surface-border)' }}>
                <div style={{ marginTop: '2px' }}>
                  {log.status === 'success' ? <CheckCircle2 size={16} color="var(--success)" /> : <XCircle size={16} color="var(--error)" />}
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>{log.automations?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {new Date(log.executed_at).toLocaleString()}
                  </div>
                  {log.error_message && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: '4px', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                      {log.error_message}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}
