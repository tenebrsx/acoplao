'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Filter, Search, Calendar as CalendarIcon, User } from 'lucide-react'
import { addDays, subDays, format, differenceInDays, isSameDay } from 'date-fns'
import { createClient } from '@/utils/supabase/client'

export function CapacityGanttClient({ team, activeDeliverables }: { team: any[], activeDeliverables: any[] }) {
  // Setup 14-day window
  const [baseDate, setBaseDate] = useState(new Date())
  
  const generateDays = () => {
    const days = []
    const start = subDays(baseDate, 3)
    for (let i = 0; i < 14; i++) {
      days.push(addDays(start, i))
    }
    return days
  }
  
  const days = generateDays()

  // Realtime phases state
  const [phases, setPhases] = useState<any[]>(() => {
    const all: any[] = []
    activeDeliverables.forEach(del => {
      (del.deliverable_phases || []).forEach((phase: any) => {
        const startDate = phase.start_date ? new Date(phase.start_date) : subDays(new Date(), Math.floor(Math.random() * 5))
        const dueDate = phase.due_date ? new Date(phase.due_date) : addDays(startDate, Math.floor(Math.random() * 5) + 2)
        if (phase.assigned_to) {
          all.push({ ...phase, startDate, dueDate, deliverableName: del.title, projectName: del.projects?.title })
        }
      })
    })
    return all
  })

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('realtime_capacity')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'deliverable_phases' },
        (payload) => {
          setPhases(current => current.map(p => {
            if (p.id === payload.new.id) {
              const startDate = payload.new.start_date ? new Date(payload.new.start_date) : p.startDate
              const dueDate = payload.new.due_date ? new Date(payload.new.due_date) : p.dueDate
              return { ...p, ...payload.new, startDate, dueDate }
            }
            return p
          }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const getPositionStyles = (startDate: Date, dueDate: Date) => {
    const firstDay = days[0]
    const lastDay = days[days.length - 1]
    
    // If entirely outside view
    if (dueDate < firstDay || startDate > lastDay) return { display: 'none' }

    // Constrain to view bounds
    const visualStart = startDate < firstDay ? firstDay : startDate
    const visualEnd = dueDate > lastDay ? lastDay : dueDate

    const totalDaysView = 14
    
    const startOffsetDays = differenceInDays(visualStart, firstDay)
    const durationDays = differenceInDays(visualEnd, visualStart) + 1

    const leftPercent = (startOffsetDays / totalDaysView) * 100
    const widthPercent = (durationDays / totalDaysView) * 100

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
      display: 'block'
    }
  }

  // Group by team member
  const getPhasesForUser = (userId: string) => {
    return phases.filter(p => p.assigned_to === userId)
  }

  return (
    <div className="glass-panel" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--surface-border)', overflow: 'hidden' }}>
      
      {/* Header Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--surface-border)', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
            <button onClick={() => setBaseDate(subDays(baseDate, 7))} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <ChevronLeft size={16} />
            </button>
            <div style={{ padding: '0 16px', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarIcon size={14} color="var(--accent-primary)" />
              {format(days[0], 'MMM d')} - {format(days[days.length - 1], 'MMM d, yyyy')}
            </div>
            <button onClick={() => setBaseDate(addDays(baseDate, 7))} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <ChevronRight size={16} />
            </button>
          </div>
          <button onClick={() => setBaseDate(new Date())} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--surface-border)', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)' }}>
            Today
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input placeholder="Filter users..." style={{ padding: '8px 12px 8px 32px', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '8px', fontSize: '0.8125rem', color: 'white', outline: 'none' }} />
          </div>
          <button style={{ padding: '8px', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* Gantt Area */}
      <div style={{ display: 'flex', overflowX: 'auto' }}>
        
        {/* Left Y-Axis: Team Members */}
        <div style={{ width: '260px', flexShrink: 0, borderRight: '1px solid var(--surface-border)', background: 'var(--surface)' }}>
          <div style={{ height: '40px', borderBottom: '1px solid var(--surface-border)' }} /> {/* Header Spacer */}
          {team.map(member => {
            const userPhases = getPhasesForUser(member.id)
            const rowHeight = Math.max(60, userPhases.length * 40 + 20)
            
            return (
              <div key={member.id} style={{ height: `${rowHeight}px`, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid var(--surface-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 600 }}>
                    {member.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{member.email.split('@')[0]}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{member.role}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right X-Axis: Timeline Grid */}
        <div style={{ flex: 1, minWidth: '800px', position: 'relative' }}>
          {/* Day Headers */}
          <div style={{ display: 'flex', height: '40px', borderBottom: '1px solid var(--surface-border)', background: 'var(--bg-secondary)' }}>
            {days.map((day, i) => {
              const isToday = isSameDay(day, new Date())
              return (
                <div key={i} style={{ flex: 1, borderRight: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: isToday ? 'rgba(0, 225, 255, 0.05)' : 'transparent' }}>
                  <div style={{ fontSize: '0.625rem', color: isToday ? 'var(--accent-primary)' : 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>{format(day, 'EEE')}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: isToday ? 700 : 500, color: isToday ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>{format(day, 'd')}</div>
                </div>
              )
            })}
          </div>

          {/* Grid Rows */}
          {team.map(member => {
            const userPhases = getPhasesForUser(member.id)
            const rowHeight = Math.max(60, userPhases.length * 40 + 20)

            return (
              <div key={member.id} style={{ height: `${rowHeight}px`, position: 'relative', borderBottom: '1px solid var(--surface-border)' }}>
                {/* Vertical Grid Lines */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }}>
                  {days.map((day, i) => (
                    <div key={i} style={{ flex: 1, borderRight: '1px solid var(--surface-border)', background: isSameDay(day, new Date()) ? 'rgba(0, 225, 255, 0.02)' : 'transparent' }} />
                  ))}
                </div>

                {/* Phase Bars */}
                {userPhases.map((phase, idx) => {
                  const position = getPositionStyles(phase.startDate, phase.dueDate)
                  if (position.display === 'none') return null

                  const isDone = phase.is_completed === true
                  
                  return (
                    <div key={phase.id} style={{ 
                      position: 'absolute', 
                      top: `${10 + (idx * 40)}px`, 
                      height: '32px', 
                      ...position,
                      padding: '0 4px'
                    }}>
                      <div style={{ 
                        height: '100%', 
                        background: isDone ? 'rgba(34, 197, 94, 0.2)' : 'var(--accent-primary)',
                        border: isDone ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(0, 225, 255, 0.5)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 8px',
                        color: isDone ? 'var(--success)' : '#000',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        cursor: 'pointer',
                        boxShadow: isDone ? 'none' : '0 4px 12px rgba(0, 225, 255, 0.2)'
                      }} title={`${phase.projectName} - ${phase.deliverableName} (${phase.phase_name})`}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span style={{ opacity: 0.7, marginRight: '6px' }}>{phase.deliverableName}</span>
                          {phase.phase_name}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
