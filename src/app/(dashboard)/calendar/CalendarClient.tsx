'use client'

import { useState, useMemo, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, Circle, FolderKanban, Plus, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, Building2, X, DollarSign,
  User as UserIcon, Tag, Filter, Clock, AlignLeft, Maximize2
} from 'lucide-react'
import {
  format, addMonths, subMonths, addWeeks, subWeeks,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  isSameMonth, isSameDay, addDays, parseISO, subDays as dateFnsSubDays
} from 'date-fns'
import {
  DndContext, closestCorners, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useToast } from '@/components/ToastProvider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import type {
  CalendarEvent, CalendarBusiness, CalendarTeamMember,
  CalendarPhase, CalendarTodo, CalendarInvoice,
  ViewMode, UnifiedEvent, CalendarDay, NewEventForm
} from '@/lib/types/calendar'

type Phase = CalendarPhase
type Todo = CalendarTodo
type Invoice = CalendarInvoice
type Business = CalendarBusiness
type TeamMember = CalendarTeamMember

const typeMeta: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  event: { label: 'Event', color: 'bg-cyan-400', icon: CalendarIcon },
  todo: { label: 'Task', color: 'bg-slate-400', icon: CheckCircle2 },
  phase: { label: 'Milestone', color: 'bg-primary', icon: FolderKanban },
  invoice: { label: 'Invoice', color: 'bg-emerald-400', icon: DollarSign }
}

function DraggableEvent({ event, onClick }: { event: UnifiedEvent; onClick: (e: React.MouseEvent) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: event.id, data: { event } })
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }
  const meta = typeMeta[event.type]

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`group flex items-center gap-2 px-2 py-1 rounded text-sm cursor-grab transition-colors hover:bg-secondary/60 ${
        event.isCompleted ? 'line-through text-muted-foreground opacity-50' : 'text-foreground'
      }`}
      title={event.title}
    >
      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.color}`} />
      <span className="truncate">{event.title}</span>
    </div>
  )
}

function DroppableDay({ day, onSelect, isSelected, isToday, children, onQuickAdd }: {
  day: CalendarDay; onSelect: (d: Date) => void; isSelected: boolean; isToday: boolean
  children: React.ReactNode; onQuickAdd: (d: Date) => void
}) {
  const { isOver, setNodeRef } = useDroppable({ id: day.dateStr, data: { dateStr: day.dateStr } })
  const [hovered, setHovered] = useState(false)

  return (
    <div
      ref={setNodeRef}
      onClick={() => onSelect(day.date)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`min-h-[180px] p-3 rounded-xl transition-all cursor-pointer ${
        isOver ? 'bg-primary/5 ring-1 ring-primary/30' :
        isSelected ? 'bg-secondary/60 ring-1 ring-primary/40' :
        isToday ? 'bg-emerald-500/5' :
        hovered ? 'bg-secondary/40' : ''
      } ${!day.isCurrentMonth ? 'opacity-40' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
          isToday ? 'bg-primary text-primary-foreground' :
          isSelected ? 'bg-secondary text-foreground' :
          'text-foreground'
        }`}>
          {day.dayNum}
        </span>
        {hovered && (
          <button
            onClick={e => { e.stopPropagation(); onQuickAdd(day.date) }}
            className="opacity-0 hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-1"
          >
            <Plus size={14} />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        {children}
      </div>
    </div>
  )
}

export function CalendarClient({
  initialPhases, initialTodos, initialEvents, initialInvoices,
  businesses, team, userId
}: {
  initialPhases: Phase[]; initialTodos: Todo[]; initialEvents: CalendarEvent[]
  initialInvoices: Invoice[]; businesses: Business[]; team: TeamMember[]; userId: string
}) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [phases, setPhases] = useState<Phase[]>(initialPhases)
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterBusiness, setFilterBusiness] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [showDayModal, setShowDayModal] = useState(false)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [newEvent, setNewEvent] = useState<NewEventForm>({
    title: '', description: '', all_day: true, start_time: '',
    color: '#00e1ff', business_id: '', assigned_to: userId
  })
  const [isSaving, setIsSaving] = useState(false)

  const { toast } = useToast()
  const supabase = createClient()
  const router = useRouter()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const unifiedEvents = useMemo<UnifiedEvent[]>(() => {
    let all: UnifiedEvent[] = []
    phases.forEach(p => {
      all.push({
        id: `phase-${p.id}`, type: 'phase', title: p.phase_name,
        subtitle: `${p.deliverables?.title || 'Campaign'} (${p.deliverables?.projects?.businesses?.name || 'Client'})`,
        dateStr: p.scheduled_date, isCompleted: p.is_completed,
        color: 'var(--accent-primary)', icon: FolderKanban,
        data: p as Record<string, unknown>
      })
    })
    todos.forEach(t => {
      if (t.due_date) all.push({
        id: `todo-${t.id}`, type: 'todo', title: t.title,
        subtitle: t.description || 'Task', dateStr: t.due_date,
        isCompleted: t.is_completed, color: '#fff', icon: CheckCircle2,
        data: t as Record<string, unknown>
      })
    })
    invoices.forEach(i => {
      if (i.due_date) all.push({
        id: `inv-${i.id}`, type: 'invoice', title: `Invoice Due: $${i.amount}`,
        subtitle: i.businesses?.name || 'Client', dateStr: i.due_date,
        isCompleted: i.status === 'paid', color: 'var(--success)', icon: DollarSign,
        data: i as Record<string, unknown>
      })
    })
    events.forEach(e => {
      const dateStr = e.start_time.split('T')[0]
      const bizName = businesses.find(b => b.id === e.business_id)?.name || 'General'
      all.push({
        id: `evt-${e.id}`, type: 'event', title: e.title, subtitle: bizName,
        dateStr, isCompleted: false, color: e.color || 'var(--accent-secondary)',
        icon: CalendarIcon, data: e as Record<string, unknown>
      })
    })

    if (filterType !== 'all') all = all.filter(e => e.type === filterType)
    if (filterBusiness !== 'all') {
      all = all.filter(e => {
        if (e.type === 'phase') return (e.data as Phase).deliverables?.projects?.businesses?.id === filterBusiness
        if (e.type === 'invoice') return (e.data as Invoice).businesses?.id === filterBusiness
        if (e.type === 'event') return (e.data as CalendarEvent).business_id === filterBusiness
        return false
      })
    }
    all.sort((a, b) => a.dateStr.localeCompare(b.dateStr))
    return all
  }, [phases, todos, events, invoices, businesses, filterType, filterBusiness])

  const gridDays = useMemo(() => {
    let gridStart: Date, gridEnd: Date
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
      result.push({ date: day, dateStr: dayStr, dayNum: format(day, 'd'), isCurrentMonth: isSameMonth(day, currentDate), events: unifiedEvents.filter(e => e.dateStr === dayStr) })
      day = addDays(day, 1)
    }
    return result
  }, [currentDate, unifiedEvents, viewMode])

  const weeks = useMemo(() => {
    const result: CalendarDay[][] = []
    let currentWeek: CalendarDay[] = []
    gridDays.forEach(day => { currentWeek.push(day); if (currentWeek.length === 7) { result.push(currentWeek); currentWeek = [] } })
    return result
  }, [gridDays])

  const toggleStatus = async (item: UnifiedEvent) => {
    if (item.type === 'phase') {
      const current = (item.data as Phase).is_completed
      setPhases(prev => prev.map(p => p.id === (item.data as Phase).id ? { ...p, is_completed: !current } : p))
      const { error } = await supabase.from('deliverable_phases').update({ is_completed: !current }).eq('id', (item.data as Phase).id)
      if (error) { setPhases(prev => prev.map(p => p.id === (item.data as Phase).id ? { ...p, is_completed: current } : p)); toast('Failed to update', 'error') }
      else toast('Updated', 'success')
    } else if (item.type === 'todo') {
      const current = (item.data as Todo).is_completed
      setTodos(prev => prev.map(t => t.id === (item.data as Todo).id ? { ...t, is_completed: !current } : t))
      const { error } = await supabase.from('todos').update({ is_completed: !current }).eq('id', (item.data as Todo).id)
      if (error) { setTodos(prev => prev.map(t => t.id === (item.data as Todo).id ? { ...t, is_completed: current } : t)); toast('Failed to update', 'error') }
      else toast('Updated', 'success')
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEvent.title || !newEvent.start_time) return
    setIsSaving(true)
    const payload = {
      title: newEvent.title, description: newEvent.description, all_day: newEvent.all_day,
      start_time: newEvent.all_day ? `${newEvent.start_time}T00:00:00Z` : newEvent.start_time,
      color: newEvent.color, business_id: newEvent.business_id || null,
      assigned_to: newEvent.assigned_to || null, created_by: userId
    }
    const { data, error } = await supabase.from('calendar_events').insert(payload).select().single()
    if (!error && data) {
      setEvents(prev => [...prev, data])
      setIsEventModalOpen(false)
      setNewEvent({ title: '', description: '', all_day: true, start_time: '', color: '#00e1ff', business_id: '', assigned_to: userId })
      toast('Event created', 'success')
    } else toast('Failed to create event', 'error')
    setIsSaving(false)
    router.refresh()
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const item = active.data.current?.event as UnifiedEvent | undefined
    if (!item) return
    const newDateStr = String(over.id)
    if (item.dateStr === newDateStr) return
    const oldData = { ...item.data }

    if (item.type === 'event') {
      const newStartTime = newDateStr + (item.data as CalendarEvent).start_time.substring(10)
      setEvents(prev => prev.map(e => e.id === (item.data as CalendarEvent).id ? { ...e, start_time: newStartTime } : e))
      await supabase.from('calendar_events').update({ start_time: newStartTime }).eq('id', (item.data as CalendarEvent).id)
    } else if (item.type === 'todo') {
      setTodos(prev => prev.map(t => t.id === (item.data as Todo).id ? { ...t, due_date: newDateStr } : t))
      await supabase.from('todos').update({ due_date: newDateStr }).eq('id', (item.data as Todo).id)
    } else if (item.type === 'invoice') {
      setInvoices(prev => prev.map(i => i.id === (item.data as Invoice).id ? { ...i, due_date: newDateStr } : i))
      await supabase.from('invoices').update({ due_date: newDateStr }).eq('id', (item.data as Invoice).id)
    } else if (item.type === 'phase') {
      setPhases(prev => prev.map(p => p.id === (item.data as Phase).id ? { ...p, scheduled_date: newDateStr } : p))
      await supabase.from('deliverable_phases').update({ scheduled_date: newDateStr }).eq('id', (item.data as Phase).id)
    }
    toast('Moved', 'success')
  }

  const navigate = useCallback((dir: 'prev' | 'next') => {
    if (viewMode === 'month') setCurrentDate(d => dir === 'prev' ? subMonths(d, 1) : addMonths(d, 1))
    else if (viewMode === 'week') setCurrentDate(d => dir === 'prev' ? subWeeks(d, 1) : addWeeks(d, 1))
    else setCurrentDate(d => dir === 'prev' ? dateFnsSubDays(d, 1) : addDays(d, 1))
  }, [viewMode])

  const selectDate = useCallback((date: Date) => {
    setSelectedDate(date)
    setShowDayModal(true)
  }, [])

  const quickAdd = useCallback((date: Date) => {
    setNewEvent(prev => ({ ...prev, start_time: format(date, 'yyyy-MM-dd') }))
    setIsEventModalOpen(true)
  }, [])

  const selectedStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''
  const selectedEvents = unifiedEvents.filter(e => e.dateStr === selectedStr)
  const counts = useMemo(() => ({
    all: unifiedEvents.length,
    event: unifiedEvents.filter(e => e.type === 'event').length,
    todo: unifiedEvents.filter(e => e.type === 'todo').length,
    phase: unifiedEvents.filter(e => e.type === 'phase').length,
    invoice: unifiedEvents.filter(e => e.type === 'invoice').length
  }), [unifiedEvents])

  return (
    <div className="space-y-6 pb-12">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">
            {viewMode === 'month' ? format(currentDate, 'MMMM yyyy') :
             viewMode === 'week' ? `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}` :
             'Agenda'}
          </h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('prev')}><ChevronLeft size={16} /></Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold" onClick={() => { setCurrentDate(new Date()) }}>Today</Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('next')}><ChevronRight size={16} /></Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-secondary rounded-lg p-1">
            {(['month', 'week', 'agenda'] as ViewMode[]).map(id => (
              <button key={id} onClick={() => setViewMode(id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {id === 'month' ? 'Month' : id === 'week' ? 'Week' : 'Agenda'}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={13} /> {showFilters ? 'Hide' : 'Filters'}
          </Button>
          <Link href="/calendars">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Maximize2 size={13} /> Full Calendar
            </Button>
          </Link>
          <Button size="sm" className="gap-1.5" onClick={() => quickAdd(selectedDate || new Date())}>
            <Plus size={14} /> Event
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-secondary/50 border border-dashed">
              <span className="text-xs font-semibold text-muted-foreground uppercase mr-1">Show:</span>
              {Object.entries(typeMeta).map(([key, meta]) => {
                const isAll = key === 'all'
                const isActive = filterType === key
                const count = isAll ? counts.all : counts[key as keyof typeof counts]
                return (
                  <button key={key} onClick={() => setFilterType(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive ? 'bg-background text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${meta.color}`} />
                    {meta.label}
                    <span className="text-muted-foreground/60">{count}</span>
                  </button>
                )
              })}
              <div className="w-px h-4 bg-border mx-1" />
              <span className="text-xs font-semibold text-muted-foreground uppercase">Client:</span>
              <select value={filterBusiness} onChange={e => setFilterBusiness(e.target.value)}
                className="h-8 px-2 text-xs bg-background border border-border rounded-md">
                <option value="all">All</option>
                {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {viewMode === 'agenda' ? (
        <AgendaView events={unifiedEvents} onSelect={selectDate} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="space-y-3">
            <div className="grid grid-cols-7 px-3">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {d.slice(0, 3)}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-3">
                  {week.map(day => (
                    <DroppableDay
                      key={day.dateStr}
                      day={day}
                      onSelect={selectDate}
                      isSelected={!!selectedDate && isSameDay(day.date, selectedDate)}
                      isToday={isSameDay(day.date, new Date())}
                      onQuickAdd={quickAdd}
                    >
                      {day.events.slice(0, 2).map(ev => (
                        <DraggableEvent key={ev.id} event={ev} onClick={() => selectDate(day.date)} />
                      ))}
                      {day.events.length > 2 && (
                        <button onClick={e => { e.stopPropagation(); selectDate(day.date) }}
                          className="text-xs text-muted-foreground hover:text-foreground font-medium px-2 py-1 rounded hover:bg-secondary/60 transition-colors w-fit">
                          +{day.events.length - 2} more
                        </button>
                      )}
                    </DroppableDay>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </DndContext>
      )}

      <AnimatePresence>
        {showDayModal && selectedDate && (
          <DayDetailModal
            date={selectedDate}
            events={selectedEvents}
            onClose={() => { setShowDayModal(false); setSelectedDate(null) }}
            onToggle={toggleStatus}
            onQuickAdd={() => quickAdd(selectedDate)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEventModalOpen && (
          <CreateEventModal
            newEvent={newEvent} setNewEvent={setNewEvent}
            businesses={businesses} team={team}
            isSaving={isSaving} onClose={() => setIsEventModalOpen(false)} onSubmit={handleCreateEvent}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function AgendaView({ events, onSelect }: { events: UnifiedEvent[]; onSelect: (d: Date) => void }) {
  const grouped = useMemo(() => {
    const map = new Map<string, UnifiedEvent[]>()
    events.filter(e => new Date(e.dateStr) >= new Date(new Date().setHours(0,0,0,0))).forEach(ev => {
      const list = map.get(ev.dateStr) || []
      list.push(ev)
      map.set(ev.dateStr, list)
    })
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(0, 30)
  }, [events])

  if (grouped.length === 0) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <CalendarIcon size={40} className="mx-auto mb-4 opacity-30" />
        <p className="text-lg font-semibold text-foreground">No upcoming events</p>
        <p className="text-sm mt-1">You're all caught up.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      {grouped.map(([dateStr, dayEvents]) => (
        <div key={dateStr}>
          <button onClick={() => onSelect(parseISO(dateStr))} className="flex items-center gap-3 mb-4 group">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <div>
              <div className="font-bold text-lg group-hover:text-primary transition-colors">{format(parseISO(dateStr), 'EEEE, MMMM d')}</div>
              <div className="text-xs text-muted-foreground">{dayEvents.length} event{dayEvents.length > 1 ? 's' : ''}</div>
            </div>
          </button>
          <div className="space-y-2 pl-4">
            {dayEvents.map(ev => {
              const meta = typeMeta[ev.type]
              return (
                <div key={ev.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors hover:border-muted-foreground/30 ${
                  ev.isCompleted ? 'opacity-40 bg-secondary/30' : 'bg-card'
                }`} style={{ borderLeftWidth: '3px', borderLeftColor: ev.isCompleted ? 'transparent' : 'hsl(var(--border))' }}>
                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${meta.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${ev.isCompleted ? 'line-through text-muted-foreground' : ''}`}>{ev.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{ev.subtitle}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function DayDetailModal({ date, events, onClose, onToggle, onQuickAdd }: {
  date: Date; events: UnifiedEvent[]; onClose: () => void
  onToggle: (ev: UnifiedEvent) => void; onQuickAdd: () => void
}) {
  const grouped: Record<string, UnifiedEvent[]> = {}
  events.forEach(ev => { grouped[ev.type] = grouped[ev.type] || []; grouped[ev.type].push(ev) })
  const order = ['event', 'phase', 'todo', 'invoice']
  const labels: Record<string, string> = { event: 'Events', phase: 'Milestones', todo: 'Tasks', invoice: 'Invoices' }
  const isToday = isSameDay(date, new Date())

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
      >
        <div className="p-6 border-b shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{isToday ? <span className="text-primary">Today</span> : format(date, 'EEEE, MMMM d')}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{format(date, 'MMMM yyyy')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="gap-1" onClick={onQuickAdd}><Plus size={14} /> Add</Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X size={16} /></Button>
            </div>
          </div>
          {events.length > 0 && (
            <Badge variant="secondary" className="mt-3 text-xs">{events.length} event{events.length > 1 ? 's' : ''}</Badge>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarIcon size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium text-foreground">Nothing scheduled</p>
              <p className="text-xs mt-1">Enjoy the free time.</p>
            </div>
          ) : (
            order.map(type => {
              const items = grouped[type]
              if (!items?.length) return null
              return (
                <div key={type}>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{labels[type]}</h4>
                  <div className="space-y-2">
                    {items.map(ev => {
                      const meta = typeMeta[ev.type]
                      const interactive = ev.type === 'phase' || ev.type === 'todo'
                      return (
                        <div key={ev.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${ev.isCompleted ? 'opacity-40 bg-secondary/30' : 'bg-card hover:bg-secondary/30'}`}>
                          {interactive ? (
                            <button onClick={() => onToggle(ev)} className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors">
                              {ev.isCompleted ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} />}
                            </button>
                          ) : (
                            <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${meta.color}`} />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium ${ev.isCompleted ? 'line-through text-muted-foreground' : ''}`}>{ev.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{ev.subtitle}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </motion.div>
    </div>
  )
}

function CreateEventModal({ newEvent, setNewEvent, businesses, team, isSaving, onClose, onSubmit }: {
  newEvent: NewEventForm; setNewEvent: React.Dispatch<React.SetStateAction<NewEventForm>>
  businesses: Business[]; team: TeamMember[]; isSaving: boolean
  onClose: () => void; onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">New Event</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X size={16} /></Button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input autoFocus placeholder="Event title" value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
              <Input type="date" value={newEvent.start_time} onChange={e => setNewEvent(p => ({ ...p, start_time: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Color</label>
              <div className="flex gap-2">
                {['#00e1ff', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#cbd5e1'].map(c => (
                  <button key={c} type="button" onClick={() => setNewEvent(p => ({ ...p, color: c }))}
                    className="w-7 h-7 rounded-full transition-all"
                    style={{ background: c, border: newEvent.color === c ? '2px solid hsl(var(--foreground))' : '2px solid transparent', transform: newEvent.color === c ? 'scale(1.1)' : 'scale(1)' }} />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Client</label>
              <select value={newEvent.business_id} onChange={e => setNewEvent(p => ({ ...p, business_id: e.target.value }))}
                className="w-full h-9 px-2 text-sm bg-background border border-input rounded-md">
                <option value="">General</option>
                {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Assign To</label>
              <select value={newEvent.assigned_to} onChange={e => setNewEvent(p => ({ ...p, assigned_to: e.target.value }))}
                className="w-full h-9 px-2 text-sm bg-background border border-input rounded-md">
                <option value="">Unassigned</option>
                {team.map(t => <option key={t.id} value={t.id}>{t.email.split('@')[0]}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
            <textarea value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))}
              placeholder="Notes or context..." rows={3}
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md resize-none outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={isSaving || !newEvent.title || !newEvent.start_time}>
              {isSaving ? 'Saving...' : 'Create'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
