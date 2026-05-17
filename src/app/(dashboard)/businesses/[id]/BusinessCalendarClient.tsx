'use client'

import { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, subMonths, addMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, AlignLeft, X } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export function BusinessCalendarClient({ businessId, scheduleItems }: { businessId: string, scheduleItems: any[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', start_time: format(new Date(), 'yyyy-MM-dd')
  })

  const router = useRouter()
  const supabase = createClient()

  const gridDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const gridStart = startOfWeek(monthStart)
    const gridEnd = endOfWeek(endOfMonth(monthStart))

    const result = []
    let day = gridStart

    while (day <= gridEnd) {
      const dayStr = format(day, 'yyyy-MM-dd')
      result.push({
        date: day,
        dateStr: dayStr,
        dayNum: format(day, 'd'),
        isCurrentMonth: isSameMonth(day, currentDate),
        events: scheduleItems.filter(e => format(e.date, 'yyyy-MM-dd') === dayStr)
      })
      day = addDays(day, 1)
    }
    return result
  }, [currentDate, scheduleItems])

  type GridDay = { date: Date; dateStr: string; dayNum: string; isCurrentMonth: boolean; events: any[] }
  const weeks: GridDay[][] = []
  let currentWeek: GridDay[] = []
  gridDays.forEach(day => {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  })

  const selectedEvents = scheduleItems.filter(e => isSameDay(e.date, selectedDate))

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEvent.title || !newEvent.start_time) return
    setIsSaving(true)

    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('calendar_events').insert({
      title: newEvent.title,
      description: newEvent.description,
      all_day: true,
      start_time: `${newEvent.start_time}T00:00:00Z`,
      business_id: businessId,
      created_by: user?.id,
      assigned_to: user?.id,
      color: 'var(--accent-secondary)'
    })

    setIsSaving(false)
    setIsEventModalOpen(false)
    setNewEvent({ title: '', description: '', start_time: format(selectedDate, 'yyyy-MM-dd') })
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Calendar Header & Grid */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{format(currentDate, 'MMMM yyyy')}</h3>
            <div style={{ display: 'flex', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '8px' }}>
              <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} style={{ padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><ChevronLeft size={14} /></button>
              <button onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()) }} style={{ padding: '4px 12px', background: 'none', borderLeft: '1px solid var(--surface-border)', borderRight: '1px solid var(--surface-border)', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.75rem' }}>Today</button>
              <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} style={{ padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><ChevronRight size={14} /></button>
            </div>
          </div>
          <button onClick={() => { setNewEvent(prev => ({...prev, start_time: format(selectedDate, 'yyyy-MM-dd')})); setIsEventModalOpen(true) }} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={14} /> Event
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: '1px solid var(--surface-border)', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-primary)' }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} style={{ padding: '8px 0', textAlign: 'center', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-tertiary)', borderBottom: '1px solid var(--surface-border)' }}>
              {d}
            </div>
          ))}
          
          {weeks.map((week, wi) => (
            week.map(cell => {
              const isSelected = isSameDay(cell.date, selectedDate)
              const isToday = isSameDay(cell.date, new Date())

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDate(cell.date)}
                  style={{
                    minHeight: '60px', padding: '4px',
                    background: isSelected ? 'rgba(0,225,255,0.1)' : 'transparent',
                    borderRight: '1px solid var(--surface-border)',
                    borderBottom: wi < weeks.length - 1 ? '1px solid var(--surface-border)' : 'none',
                    opacity: cell.isCurrentMonth ? 1 : 0.3,
                    cursor: 'pointer', transition: 'background 0.2s',
                    display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center'
                  }}
                >
                  <span style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: isToday ? 'var(--accent-secondary)' : 'transparent',
                    color: isToday ? '#000' : isSelected ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                    fontWeight: isToday || isSelected ? 700 : 500, fontSize: '0.75rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '4px'
                  }}>
                    {cell.dayNum}
                  </span>
                  
                  {/* Event Dots */}
                  <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {cell.events.slice(0, 3).map(ev => (
                      <div key={ev.id} style={{ width: '4px', height: '4px', borderRadius: '50%', background: ev.color }} />
                    ))}
                    {cell.events.length > 3 && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-tertiary)' }} />}
                  </div>
                </div>
              )
            })
          ))}
        </div>
      </div>

      {/* Selected Day Events List */}
      <div style={{ background: 'var(--surface-hover)', borderRadius: '12px', padding: '16px' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CalendarIcon size={14} color="var(--accent-secondary)" /> {isSameDay(selectedDate, new Date()) ? 'Today' : format(selectedDate, 'MMM d, yyyy')}
        </h4>
        
        {selectedEvents.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8125rem', padding: '16px 0' }}>
            No events on this day.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selectedEvents.map(item => {
              const Icon = item.icon
              return (
                <div key={item.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '8px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                   <div style={{ color: item.color, marginTop: '2px' }}><Icon size={14} /></div>
                   <div style={{ flex: 1, minWidth: 0 }}>
                     <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                     <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>{item.subtitle}</div>
                   </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Event Creation Modal */}
      <AnimatePresence>
        {isEventModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEventModalOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="glass-panel" style={{ position: 'relative', width: '100%', maxWidth: '500px', padding: '32px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Create Business Event</h2>
                <button onClick={() => setIsEventModalOpen(false)} style={{ background: 'var(--surface)', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
              </div>

              <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <input autoFocus placeholder="Event Title" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} style={{ width: '100%', fontSize: '1.25rem', fontWeight: 600, background: 'transparent', border: 'none', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-primary)', outline: 'none', paddingBottom: '8px' }} />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}><Clock size={14} /> Date</label>
                  <input type="date" value={newEvent.start_time} onChange={e => setNewEvent({...newEvent, start_time: e.target.value})} className="input" style={{ width: '100%', colorScheme: 'dark' }} />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}><AlignLeft size={14} /> Description</label>
                  <textarea value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="input" style={{ width: '100%', minHeight: '80px', resize: 'vertical' }} placeholder="Add notes..." />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                  <button type="button" onClick={() => setIsEventModalOpen(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" disabled={isSaving || !newEvent.title || !newEvent.start_time} className="btn btn-primary">
                    {isSaving ? 'Saving...' : 'Add Event'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}