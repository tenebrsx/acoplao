'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle2, Circle, FolderKanban, Plus, FileText, 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, AlignLeft, Users, Building2, X, DollarSign,
  User as UserIcon, Tag, Filter, List
} from 'lucide-react'
import Link from 'next/link'
import {
  format, addMonths, subMonths, addWeeks, subWeeks,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  isSameMonth, isSameDay, addDays, parseISO
} from 'date-fns'
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

// --- Types ---
type Business = { id: string, name: string }
type TeamMember = { id: string, email: string, role: string }

type Phase = {
  id: string
  phase_name: string
  scheduled_date: string
  is_completed: boolean
  deliverables: {
    id: string
    title: string
    projects: { id: string, title: string, businesses: Business }
  }
}

type Todo = {
  id: string
  title: string
  description: string | null
  due_date: string | null
  is_completed: boolean
  assigned_to: string | null
}

type Invoice = {
  id: string
  amount: number
  status: string
  due_date: string
  description: string
  businesses: Business
}

type CalendarEvent = {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string | null
  all_day: boolean
  color: string
  business_id: string | null
  project_id: string | null
  assigned_to: string | null
}

type UnifiedEvent = {
  id: string
  type: 'phase' | 'todo' | 'invoice' | 'event'
  title: string
  subtitle: string
  dateStr: string
  isCompleted: boolean
  color: string
  icon: any
  data: any
}

type CalendarDay = {
  date: Date
  dateStr: string
  dayNum: string
  isCurrentMonth: boolean
  events: UnifiedEvent[]
}

// --- Drag & Drop Components ---
function DraggableEvent({ event }: { event: UnifiedEvent }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: { event }
  })
  
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 99 : 1,
    cursor: 'grab'
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px',
        background: event.isCompleted ? 'transparent' : `rgba(${hexToRgb(event.color)}, 0.1)`,
        color: event.isCompleted ? 'var(--text-tertiary)' : event.color,
        textDecoration: event.isCompleted ? 'line-through' : 'none',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        borderLeft: `2px solid ${event.isCompleted ? 'var(--text-tertiary)' : event.color}`,
        marginBottom: '2px'
      }}
      {...listeners}
      {...attributes}
      title={event.title}
    >
      {event.title}
    </div>
  )
}

function DroppableDay({ day, onDateSelect, isSelected, isToday, children }: { day: CalendarDay, onDateSelect: (d: Date) => void, isSelected: boolean, isToday: boolean, children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: day.dateStr,
    data: { dateStr: day.dateStr }
  })

  return (
    <div
      ref={setNodeRef}
      onClick={() => onDateSelect(day.date)}
      style={{
        minHeight: '120px', padding: '8px',
        background: isOver ? 'rgba(0,225,255,0.1)' : isSelected ? 'rgba(0,225,255,0.05)' : isToday ? 'rgba(255,255,255,0.02)' : 'var(--surface)',
        borderRight: '1px solid var(--surface-border)',
        opacity: day.isCurrentMonth ? 1 : 0.4,
        cursor: 'pointer', transition: 'background 0.2s',
        display: 'flex', flexDirection: 'column', gap: '4px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
        <span style={{
          width: '24px', height: '24px', borderRadius: '50%',
          background: isToday ? 'var(--accent-secondary)' : 'transparent',
          color: isToday ? '#000' : isSelected ? 'var(--accent-secondary)' : 'var(--text-secondary)',
          fontWeight: isToday || isSelected ? 700 : 500, fontSize: '0.875rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {day.dayNum}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

export function CalendarClient({
  initialPhases,
  initialTodos,
  initialEvents,
  initialInvoices,
  businesses,
  team,
  userId
}: {
  initialPhases: Phase[]
  initialTodos: Todo[]
  initialEvents: CalendarEvent[]
  initialInvoices: Invoice[]
  businesses: Business[]
  team: TeamMember[]
  userId: string
}) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [phases, setPhases] = useState<Phase[]>(initialPhases)
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  // View Modes & Filters
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterBusiness, setFilterBusiness] = useState<string>('all')

  // Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', all_day: true, start_time: '', 
    color: '#00e1ff', business_id: '', assigned_to: userId
  })
  const [isSaving, setIsSaving] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // ── Unified Event Mapping ──────────────────────────────
  const unifiedEvents = useMemo<UnifiedEvent[]>(() => {
    let all: UnifiedEvent[] = []

    phases.forEach(p => {
      all.push({
        id: `phase-${p.id}`, type: 'phase',
        title: p.phase_name,
        subtitle: `${p.deliverables?.title} (${p.deliverables?.projects?.businesses?.name})`,
        dateStr: p.scheduled_date,
        isCompleted: p.is_completed,
        color: 'var(--accent-primary)',
        icon: FolderKanban,
        data: p
      })
    })

    todos.forEach(t => {
      if (t.due_date) {
        all.push({
          id: `todo-${t.id}`, type: 'todo',
          title: t.title,
          subtitle: t.description || 'Task',
          dateStr: t.due_date,
          isCompleted: t.is_completed,
          color: '#fff',
          icon: CheckCircle2,
          data: t
        })
      }
    })

    invoices.forEach(i => {
      if (i.due_date) {
        all.push({
          id: `inv-${i.id}`, type: 'invoice',
          title: `Invoice Due: $${i.amount}`,
          subtitle: i.businesses?.name || 'Client',
          dateStr: i.due_date,
          isCompleted: i.status === 'paid',
          color: 'var(--success)',
          icon: DollarSign,
          data: i
        })
      }
    })

    events.forEach(e => {
      const dateStr = e.start_time.split('T')[0]
      const bizName = businesses.find(b => b.id === e.business_id)?.name || 'General'
      all.push({
        id: `evt-${e.id}`, type: 'event',
        title: e.title,
        subtitle: bizName,
        dateStr: dateStr,
        isCompleted: false,
        color: e.color || 'var(--accent-secondary)',
        icon: CalendarIcon,
        data: e
      })
    })

    // Apply Filters
    if (filterType !== 'all') {
      all = all.filter(e => e.type === filterType)
    }
    
    if (filterBusiness !== 'all') {
      all = all.filter(e => {
        if (e.type === 'phase') return e.data.deliverables?.projects?.businesses?.id === filterBusiness
        if (e.type === 'invoice') return e.data.businesses?.id === filterBusiness
        if (e.type === 'event') return e.data.business_id === filterBusiness
        return false // Todos don't have direct business link in this view currently
      })
    }

    // Sort by date
    all.sort((a, b) => a.dateStr.localeCompare(b.dateStr))

    return all
  }, [phases, todos, events, invoices, businesses, filterType, filterBusiness])

  // ── Grid Computation ──────────────────────────────
  const gridDays = useMemo(() => {
    let gridStart, gridEnd;

    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate)
      gridStart = startOfWeek(monthStart)
      gridEnd = endOfWeek(endOfMonth(monthStart))
    } else {
      gridStart = startOfWeek(currentDate)
      gridEnd = endOfWeek(currentDate)
    }

    const result: CalendarDay[] = []
    let day = gridStart

    while (day <= gridEnd) {
      const dayStr = format(day, 'yyyy-MM-dd')
      result.push({
        date: day,
        dateStr: dayStr,
        dayNum: format(day, 'd'),
        isCurrentMonth: isSameMonth(day, currentDate),
        events: unifiedEvents.filter(e => e.dateStr === dayStr)
      })
      day = addDays(day, 1)
    }
    return result
  }, [currentDate, unifiedEvents, viewMode])

  const weeks = useMemo(() => {
    const result: CalendarDay[][] = []
    let currentWeek: CalendarDay[] = []
    gridDays.forEach(day => {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        result.push(currentWeek)
        currentWeek = []
      }
    })
    return result
  }, [gridDays])

  // ── Actions ────────────────────────────────────────────────────
  const toggleStatus = async (item: UnifiedEvent) => {
    if (item.type === 'phase') {
      const current = item.data.is_completed
      setPhases(prev => prev.map(p => p.id === item.data.id ? { ...p, is_completed: !current } : p))
      await supabase.from('deliverable_phases').update({ is_completed: !current }).eq('id', item.data.id)
    } else if (item.type === 'todo') {
      const current = item.data.is_completed
      setTodos(prev => prev.map(t => t.id === item.data.id ? { ...t, is_completed: !current } : t))
      await supabase.from('todos').update({ is_completed: !current }).eq('id', item.data.id)
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEvent.title || !newEvent.start_time) return
    setIsSaving(true)

    const payload = {
      title: newEvent.title,
      description: newEvent.description,
      all_day: newEvent.all_day,
      start_time: newEvent.all_day ? `${newEvent.start_time}T00:00:00Z` : newEvent.start_time,
      color: newEvent.color,
      business_id: newEvent.business_id || null,
      assigned_to: newEvent.assigned_to || null,
      created_by: userId
    }

    const { data, error } = await supabase.from('calendar_events').insert(payload).select().single()
    if (!error && data) {
      setEvents(prev => [...prev, data])
      setIsEventModalOpen(false)
      setNewEvent({ title: '', description: '', all_day: true, start_time: '', color: '#00e1ff', business_id: '', assigned_to: userId })
    }
    setIsSaving(false)
    router.refresh()
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event
    if (!over) return

    const item = active.data.current?.event as UnifiedEvent
    const newDateStr = over.id as string

    if (item.dateStr === newDateStr) return // No change

    // Optimistic UI & DB update based on type
    if (item.type === 'event') {
      setEvents(prev => prev.map(e => e.id === item.data.id ? { ...e, start_time: newDateStr + e.start_time.substring(10) } : e))
      await supabase.from('calendar_events').update({ start_time: newDateStr + item.data.start_time.substring(10) }).eq('id', item.data.id)
    } else if (item.type === 'todo') {
      setTodos(prev => prev.map(t => t.id === item.data.id ? { ...t, due_date: newDateStr } : t))
      await supabase.from('todos').update({ due_date: newDateStr }).eq('id', item.data.id)
    } else if (item.type === 'invoice') {
      setInvoices(prev => prev.map(i => i.id === item.data.id ? { ...i, due_date: newDateStr } : i))
      await supabase.from('invoices').update({ due_date: newDateStr }).eq('id', item.data.id)
    } else if (item.type === 'phase') {
      setPhases(prev => prev.map(p => p.id === item.data.id ? { ...p, scheduled_date: newDateStr } : p))
      await supabase.from('deliverable_phases').update({ scheduled_date: newDateStr }).eq('id', item.data.id)
    }
  }

  // Navigation
  const navigatePrev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1))
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1))
    else setCurrentDate(subDays(currentDate, 1))
  }
  const navigateNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1))
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1))
    else setCurrentDate(addDays(currentDate, 1))
  }
  const subDays = (date: Date, days: number) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000)

  // ── Selected-day data ──────────────────────────────────────────
  const selectedStr = format(selectedDate, 'yyyy-MM-dd')
  const selectedEvents = unifiedEvents.filter(e => e.dateStr === selectedStr)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 320px', gap: '24px', alignItems: 'start', height: 'calc(100vh - 120px)' }}>
      
      {/* ── Left Sidebar: Filters ── */}
      <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '24px', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <button onClick={() => { setNewEvent(prev => ({...prev, start_time: format(selectedDate, 'yyyy-MM-dd')})); setIsEventModalOpen(true) }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', marginBottom: '24px' }}>
          <Plus size={16} /> New Event
        </button>

        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CalendarIcon size={14} /> Views
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
          {[
            { id: 'month', label: 'Month', icon: CalendarIcon },
            { id: 'week', label: 'Week', icon: AlignLeft },
            { id: 'agenda', label: 'Agenda', icon: List }
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setViewMode(view.id as any)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: viewMode === view.id ? 'var(--surface-hover)' : 'transparent',
                color: viewMode === view.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: viewMode === view.id ? 600 : 500, transition: 'all 0.2s', textAlign: 'left'
              }}
            >
              <view.icon size={16} /> {view.label}
            </button>
          ))}
        </div>

        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={14} /> Filters
        </h3>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Event Type</label>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input" style={{ width: '100%', padding: '8px', fontSize: '0.875rem' }}>
            <option value="all">All Events</option>
            <option value="event">Calendar Events</option>
            <option value="todo">Tasks & Todos</option>
            <option value="phase">Campaign Milestones</option>
            <option value="invoice">Invoices Due</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Brand / Client</label>
          <select value={filterBusiness} onChange={e => setFilterBusiness(e.target.value)} className="input" style={{ width: '100%', padding: '8px', fontSize: '0.875rem' }}>
            <option value="all">All Clients</option>
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {/* ── Main Calendar Area ── */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid var(--surface-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
              {viewMode === 'month' ? format(currentDate, 'MMMM yyyy') : 
               viewMode === 'week' ? `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}` : 
               'Agenda'}
            </h2>
            <div style={{ display: 'flex', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '8px' }}>
              <button onClick={navigatePrev} style={{ padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><ChevronLeft size={16} /></button>
              <button onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()) }} style={{ padding: '8px 16px', background: 'none', borderLeft: '1px solid var(--surface-border)', borderRight: '1px solid var(--surface-border)', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Today</button>
              <button onClick={navigateNext} style={{ padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>

        {/* View specific rendering */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {viewMode === 'agenda' ? (
             <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
               {unifiedEvents.filter(e => new Date(e.dateStr) >= new Date()).slice(0, 50).map(ev => {
                  const Icon = ev.icon
                  return (
                    <div key={ev.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--surface-border)' }}>
                      <div style={{ width: '100px', flexShrink: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{format(parseISO(ev.dateStr), 'MMM d')}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{format(parseISO(ev.dateStr), 'EEEE')}</div>
                      </div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ color: ev.color }}><Icon size={16} /></div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', textDecoration: ev.isCompleted ? 'line-through' : 'none' }}>{ev.title}</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{ev.subtitle}</div>
                        </div>
                      </div>
                    </div>
                  )
               })}
             </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
              {/* Day-of-week header */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--surface-border)' }}>
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                  <div key={d} style={{ padding: '12px 0', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', background: 'var(--bg-primary)', letterSpacing: '0.05em' }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Weeks Grid */}
              {weeks.map((week, wi) => (
                <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--surface-border)', minHeight: viewMode === 'week' ? '400px' : '120px' }}>
                  {week.map(cell => (
                    <DroppableDay 
                      key={cell.dateStr} 
                      day={cell} 
                      onDateSelect={setSelectedDate} 
                      isSelected={isSameDay(cell.date, selectedDate)} 
                      isToday={isSameDay(cell.date, new Date())}
                    >
                      {cell.events.slice(0, viewMode === 'week' ? 10 : 4).map(ev => (
                        <DraggableEvent key={ev.id} event={ev} />
                      ))}
                      {cell.events.length > (viewMode === 'week' ? 10 : 4) && (
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', padding: '2px 6px', fontWeight: 500 }}>
                          +{cell.events.length - (viewMode === 'week' ? 10 : 4)} more
                        </div>
                      )}
                    </DroppableDay>
                  ))}
                </div>
              ))}
            </DndContext>
          )}
        </div>
      </div>

      {/* ── Active Day Drawer / Panel ── */}
      <div className="glass-panel" style={{ position: 'sticky', top: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--surface-border)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isSameDay(selectedDate, new Date()) && <span style={{ color: 'var(--accent-secondary)' }}>Today</span>}
            {!isSameDay(selectedDate, new Date()) && format(selectedDate, 'MMMM d')}
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {format(selectedDate, 'EEEE')} • {selectedEvents.length} items
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {selectedEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
              <CalendarIcon size={32} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              Nothing scheduled for this day. Enjoy the clear slate.
            </div>
          ) : (
            selectedEvents.map(ev => {
              const Icon = ev.icon
              const interactive = ev.type === 'phase' || ev.type === 'todo'
              
              return (
                <div key={ev.id} style={{
                  padding: '16px', borderRadius: '12px', background: ev.isCompleted ? 'var(--bg-primary)' : 'var(--surface)',
                  border: `1px solid ${ev.isCompleted ? 'var(--surface-border)' : `rgba(${hexToRgb(ev.color)}, 0.3)`}`,
                  borderLeft: `4px solid ${ev.isCompleted ? 'var(--surface-border)' : ev.color}`,
                  display: 'flex', gap: '12px', alignItems: 'flex-start', transition: 'all 0.2s',
                  opacity: ev.isCompleted ? 0.6 : 1
                }}>
                  {interactive ? (
                    <button onClick={() => toggleStatus(ev)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '2px', color: ev.isCompleted ? 'var(--success)' : 'var(--text-tertiary)' }}>
                      {ev.isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </button>
                  ) : (
                    <div style={{ marginTop: '2px', color: ev.color }}><Icon size={18} /></div>
                  )}
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', textDecoration: ev.isCompleted ? 'line-through' : 'none', marginBottom: '4px' }}>
                      {ev.title}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {ev.type === 'phase' && <FolderKanban size={12} />}
                      {ev.type === 'invoice' && <DollarSign size={12} />}
                      {ev.subtitle}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Event Creation Modal ── */}
      <AnimatePresence>
        {isEventModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEventModalOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="glass-panel" style={{ position: 'relative', width: '100%', maxWidth: '600px', padding: '32px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Create Event</h2>
                <button onClick={() => setIsEventModalOpen(false)} style={{ background: 'var(--surface)', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
              </div>

              <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <input autoFocus placeholder="Event Title" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} style={{ width: '100%', fontSize: '1.5rem', fontWeight: 600, background: 'transparent', border: 'none', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-primary)', outline: 'none', paddingBottom: '8px' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}><Clock size={14} style={{display: 'inline', verticalAlign: 'middle', marginRight: '4px'}}/> Date</label>
                    <input type="date" value={newEvent.start_time} onChange={e => setNewEvent({...newEvent, start_time: e.target.value})} className="input" style={{ width: '100%', colorScheme: 'dark' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}><Tag size={14} style={{display: 'inline', verticalAlign: 'middle', marginRight: '4px'}}/> Color</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['#00e1ff', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#fff'].map(c => (
                        <div key={c} onClick={() => setNewEvent({...newEvent, color: c})} style={{ width: '28px', height: '28px', borderRadius: '50%', background: c, cursor: 'pointer', border: newEvent.color === c ? '2px solid white' : '2px solid transparent', boxShadow: newEvent.color === c ? `0 0 12px ${c}` : 'none' }} />
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}><Building2 size={14} style={{display: 'inline', verticalAlign: 'middle', marginRight: '4px'}}/> Link to Client</label>
                    <select value={newEvent.business_id} onChange={e => setNewEvent({...newEvent, business_id: e.target.value})} className="input" style={{ width: '100%', appearance: 'none' }}>
                      <option value="">General / Agency Internal</option>
                      {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}><UserIcon size={14} style={{display: 'inline', verticalAlign: 'middle', marginRight: '4px'}}/> Assign To</label>
                    <select value={newEvent.assigned_to} onChange={e => setNewEvent({...newEvent, assigned_to: e.target.value})} className="input" style={{ width: '100%', appearance: 'none' }}>
                      <option value="">Unassigned</option>
                      {team.map(t => <option key={t.id} value={t.id}>{t.email.split('@')[0]} ({t.role})</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}><AlignLeft size={14} style={{display: 'inline', verticalAlign: 'middle', marginRight: '4px'}}/> Description</label>
                  <textarea value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="input" style={{ width: '100%', minHeight: '80px', resize: 'vertical' }} placeholder="Add notes, context, or links..." />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', paddingTop: '24px', borderTop: '1px solid var(--surface-border)' }}>
                  <button type="button" onClick={() => setIsEventModalOpen(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" disabled={isSaving || !newEvent.title || !newEvent.start_time} className="btn btn-primary" style={{ background: newEvent.color, color: ['#fff', '#00e1ff'].includes(newEvent.color) ? '#000' : '#fff' }}>
                    {isSaving ? 'Saving...' : 'Add to Calendar'}
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

// Helper to convert hex to rgb for rgba transparency
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 225, 255';
}
