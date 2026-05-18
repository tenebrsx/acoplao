'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, Circle, FolderKanban, Plus, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, X, DollarSign, ArrowLeft,
  Filter, Clock
} from 'lucide-react'
import {
  format, addMonths, subMonths, addWeeks, subWeeks,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  isSameMonth, isSameDay, addDays, parseISO, subDays as dateFnsSubDays,
  getDay, getDaysInMonth
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
  UnifiedEvent, CalendarDay, NewEventForm
} from '@/lib/types/calendar'

type Phase = CalendarPhase
type Todo = CalendarTodo
type Invoice = CalendarInvoice
type Business = CalendarBusiness
type TeamMember = CalendarTeamMember
type FullViewMode = 'month' | 'week' | 'day' | 'agenda'

const typeMeta: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  event: { label: 'Event', color: 'bg-cyan-400', icon: CalendarIcon },
  todo: { label: 'Task', color: 'bg-slate-400', icon: CheckCircle2 },
  phase: { label: 'Milestone', color: 'bg-primary', icon: FolderKanban },
  invoice: { label: 'Invoice', color: 'bg-emerald-400', icon: DollarSign }
}

const HOUR_START = 6
const HOUR_END = 23
const SLOT_HEIGHT = 52
const WEEK_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function DraggableEventItem({ event, onClick, compact = false }: { event: UnifiedEvent; onClick: (e: React.MouseEvent) => void; compact?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: event.id, data: { event } })
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }
  const meta = typeMeta[event.type]

  if (compact) {
    return (
      <div
        ref={setNodeRef} style={style} {...listeners} {...attributes}
        onClick={onClick}
        className={`group flex items-center gap-1.5 px-2 py-1 rounded-md text-xs cursor-grab transition-colors hover:bg-secondary/60 ${
          event.isCompleted ? 'line-through text-muted-foreground opacity-50' : 'text-foreground'
        }`}
        title={event.title}
      >
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.color}`} />
        <span className="truncate">{event.title}</span>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef} style={style} {...listeners} {...attributes}
      onClick={onClick}
      className={`group flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-grab transition-colors hover:bg-secondary/60 ${
        event.isCompleted ? 'line-through text-muted-foreground opacity-50' : 'text-foreground'
      }`}
      title={event.title}
    >
      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.color}`} />
      <span className="truncate">{event.title}</span>
    </div>
  )
}

function DroppableDayCell({ day, onSelect, isSelected, isToday, children, onQuickAdd }: {
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
      className={`relative flex flex-col rounded-xl border border-border/40 transition-all cursor-pointer overflow-hidden ${
        isOver ? 'bg-primary/5 ring-1 ring-primary/30' :
        isSelected ? 'bg-secondary/60 ring-1 ring-primary/40' :
        isToday ? 'bg-emerald-500/5 border-emerald-500/20' :
        hovered ? 'bg-secondary/30' : 'bg-card/30'
      } ${!day.isCurrentMonth ? 'opacity-30' : ''}`}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
          isToday ? 'bg-primary text-primary-foreground' :
          isSelected ? 'bg-secondary text-foreground' :
          'text-foreground'
        }`}>
          {day.dayNum}
        </span>
        {hovered && (
          <button
            onClick={e => { e.stopPropagation(); onQuickAdd(day.date) }}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary transition-colors"
          >
            <Plus size={14} />
          </button>
        )}
      </div>
      <div className="flex-1 flex flex-col gap-0.5 px-2 pb-2 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  )
}

export function CalendarsClient({
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
  const [viewMode, setViewMode] = useState<FullViewMode>('month')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterBusiness, setFilterBusiness] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
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
        subtitle: `${p.deliverables?.title || 'Project'} (${p.deliverables?.projects?.businesses?.name || 'Client'})`,
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
      result.push({
        date: day, dateStr: dayStr, dayNum: format(day, 'd'),
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
    else if (viewMode === 'day') setCurrentDate(d => dir === 'prev' ? dateFnsSubDays(d, 1) : addDays(d, 1))
    else setCurrentDate(d => dir === 'prev' ? dateFnsSubDays(d, 1) : addDays(d, 1))
  }, [viewMode])

  const selectDate = useCallback((date: Date) => {
    setSelectedDate(date)
    setCurrentDate(date)
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

  const viewTitle = useMemo(() => {
    if (viewMode === 'month') return format(currentDate, 'MMMM yyyy')
    if (viewMode === 'week') return `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`
    if (viewMode === 'day') return format(currentDate, 'EEEE, MMMM d, yyyy')
    return 'Agenda'
  }, [viewMode, currentDate])

  return (
    <>
      <header className="h-14 shrink-0 border-b flex items-center px-4 gap-3 bg-background/80 backdrop-blur z-20">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
        <div className="w-px h-4 bg-border mx-1" />
        <h1 className="font-semibold text-sm">Calendars</h1>

        <div className="flex items-center gap-1 ml-4">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate('prev')}><ChevronLeft size={14} /></Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold" onClick={() => setCurrentDate(new Date())}>Today</Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate('next')}><ChevronRight size={14} /></Button>
        </div>

        <div className="font-semibold text-sm ml-2">{viewTitle}</div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <div className="flex bg-secondary rounded-lg p-0.5">
            {(['month','week','day','agenda'] as FullViewMode[]).map(id => (
              <button key={id} onClick={() => setViewMode(id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={12} /> {showFilters ? 'Hide' : 'Filter'}
          </Button>
          <Button size="sm" className="gap-1.5 h-7 text-xs" onClick={() => quickAdd(selectedDate || new Date())}>
            <Plus size={12} /> Event
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 shrink-0 border-r overflow-y-auto p-4 space-y-6 bg-card/20">
          <MiniCalendar currentDate={currentDate} selectedDate={selectedDate} onSelect={selectDate} onChangeMonth={setCurrentDate} />

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Show</div>
                  <div className="space-y-1">
                    {Object.entries(typeMeta).map(([key, meta]) => {
                      const isActive = filterType === key
                      const count = counts[key as keyof typeof counts]
                      return (
                        <button key={key} onClick={() => setFilterType(isActive ? 'all' : key)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                          }`}>
                          <div className={`w-2 h-2 rounded-full ${meta.color}`} />
                          {meta.label}
                          <span className="ml-auto text-muted-foreground/60">{count}</span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground pt-2">Client</div>
                  <select value={filterBusiness} onChange={e => setFilterBusiness(e.target.value)}
                    className="w-full h-8 px-2 text-xs bg-background border border-border rounded-md">
                    <option value="all">All Clients</option>
                    {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showFilters && (
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Legend</div>
              <div className="space-y-1.5">
                {Object.entries(typeMeta).map(([key, meta]) => (
                  <div key={key} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className={`w-2 h-2 rounded-full ${meta.color}`} />
                    {meta.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        <main className="flex-1 overflow-hidden flex flex-col bg-background">
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            {viewMode === 'month' && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-7 mb-2">
                  {WEEK_DAYS.map(d => (
                    <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {weeks.map((week, wi) => (
                    <div key={wi} className="grid grid-cols-7 gap-2" style={{ minHeight: '140px' }}>
                      {week.map(day => (
                        <DroppableDayCell
                          key={day.dateStr}
                          day={day}
                          onSelect={selectDate}
                          isSelected={!!selectedDate && isSameDay(day.date, selectedDate)}
                          isToday={isSameDay(day.date, new Date())}
                          onQuickAdd={quickAdd}
                        >
                          {day.events.slice(0, 4).map(ev => (
                            <DraggableEventItem key={ev.id} event={ev} onClick={() => selectDate(day.date)} compact />
                          ))}
                          {day.events.length > 4 && (
                            <button onClick={e => { e.stopPropagation(); selectDate(day.date) }}
                              className="text-xs text-muted-foreground hover:text-foreground font-medium px-2 py-0.5 rounded hover:bg-secondary/60 transition-colors w-fit">
                              +{day.events.length - 4} more
                            </button>
                          )}
                        </DroppableDayCell>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'week' && (
              <WeekView
                currentDate={currentDate}
                unifiedEvents={unifiedEvents}
                onSelectDate={selectDate}
                onQuickAdd={quickAdd}
                selectedDate={selectedDate}
              />
            )}

            {viewMode === 'day' && (
              <DayView
                currentDate={currentDate}
                unifiedEvents={unifiedEvents}
                onSelectDate={selectDate}
                onQuickAdd={quickAdd}
              />
            )}

            {viewMode === 'agenda' && (
              <div className="flex-1 overflow-y-auto p-6">
                <AgendaView events={unifiedEvents} onSelect={selectDate} />
              </div>
            )}
          </DndContext>
        </main>

        <AnimatePresence>
          {selectedDate && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
              className="shrink-0 border-l bg-card overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{isSameDay(selectedDate, new Date()) ? <span className="text-primary">Today</span> : format(selectedDate, 'EEEE, MMM d')}</h3>
                    <p className="text-xs text-muted-foreground">{format(selectedDate, 'MMMM yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => quickAdd(selectedDate)}><Plus size={12} /> Add</Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedDate(null)}><X size={14} /></Button>
                  </div>
                </div>
                {selectedEvents.length > 0 && (
                  <Badge variant="secondary" className="mt-2 text-xs">{selectedEvents.length} event{selectedEvents.length > 1 ? 's' : ''}</Badge>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedEvents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarIcon size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium text-foreground">Nothing scheduled</p>
                    <p className="text-xs mt-0.5">Enjoy the free time.</p>
                  </div>
                ) : (
                  <DayPanelContent events={selectedEvents} onToggle={toggleStatus} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isEventModalOpen && (
          <CreateEventModal
            newEvent={newEvent} setNewEvent={setNewEvent}
            businesses={businesses} team={team}
            isSaving={isSaving} onClose={() => setIsEventModalOpen(false)} onSubmit={handleCreateEvent}
          />
        )}
      </AnimatePresence>
    </>
  )
}

function MiniCalendar({ currentDate, selectedDate, onSelect, onChangeMonth }: {
  currentDate: Date; selectedDate: Date | null; onSelect: (d: Date) => void; onChangeMonth: (d: Date) => void
}) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate))
    const end = endOfWeek(endOfMonth(currentDate))
    const result: Date[] = []
    let d = start
    while (d <= end) { result.push(d); d = addDays(d, 1) }
    return result
  }, [currentDate])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button onClick={() => onChangeMonth(subMonths(currentDate, 1))} className="p-1 hover:bg-secondary rounded-md transition-colors"><ChevronLeft size={14} /></button>
        <span className="text-sm font-semibold">{format(currentDate, 'MMMM yyyy')}</span>
        <button onClick={() => onChangeMonth(addMonths(currentDate, 1))} className="p-1 hover:bg-secondary rounded-md transition-colors"><ChevronRight size={14} /></button>
      </div>
      <div className="grid grid-cols-7 text-center">
        {WEEK_DAYS.map(d => <div key={d} className="text-[10px] font-semibold text-muted-foreground py-1">{d}</div>)}
        {days.map(d => {
          const isToday = isSameDay(d, new Date())
          const isSelected = !!selectedDate && isSameDay(d, selectedDate)
          const inMonth = isSameMonth(d, currentDate)
          return (
            <button key={d.toISOString()} onClick={() => onSelect(d)}
              className={`aspect-square flex items-center justify-center text-xs rounded-md transition-colors ${
                isSelected ? 'bg-primary text-primary-foreground' :
                isToday ? 'bg-emerald-500/20 text-emerald-400 font-semibold' :
                inMonth ? 'text-foreground hover:bg-secondary' : 'text-muted-foreground/40 hover:bg-secondary/50'
              }`}>
              {format(d, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function WeekView({ currentDate, unifiedEvents, onSelectDate, onQuickAdd, selectedDate }: {
  currentDate: Date; unifiedEvents: UnifiedEvent[]; onSelectDate: (d: Date) => void; onQuickAdd: (d: Date) => void; selectedDate: Date | null
}) {
  const weekStart = startOfWeek(currentDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i)

  return (
    <div className="flex-1 overflow-auto flex flex-col">
      <div className="grid grid-cols-8 shrink-0 border-b">
        <div className="p-2 text-xs text-muted-foreground font-medium border-r" />
        {weekDays.map(d => (
          <button key={d.toISOString()} onClick={() => onSelectDate(d)}
            className={`p-2 text-center text-xs border-r last:border-r-0 transition-colors ${
              isSameDay(d, new Date()) ? 'bg-emerald-500/5' : ''
            } ${selectedDate && isSameDay(d, selectedDate) ? 'bg-secondary' : 'hover:bg-secondary/30'}`}>
            <div className="text-muted-foreground uppercase font-medium">{format(d, 'EEE')}</div>
            <div className={`text-lg font-semibold mt-0.5 ${isSameDay(d, new Date()) ? 'text-primary' : ''}`}>{format(d, 'd')}</div>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto relative">
        <div className="grid grid-cols-8" style={{ minHeight: `${hours.length * SLOT_HEIGHT}px` }}>
          <div className="border-r">
            {hours.map(h => (
              <div key={h} className="text-[10px] text-muted-foreground text-right pr-2 pt-1" style={{ height: SLOT_HEIGHT }}>
                {h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`}
              </div>
            ))}
          </div>

          {weekDays.map(d => {
            const dayStr = format(d, 'yyyy-MM-dd')
            const dayEvents = unifiedEvents.filter(e => e.dateStr === dayStr)
            const timedEvents = dayEvents.filter(e => e.type === 'event' && (e.data as CalendarEvent).start_time.includes('T'))
            const allDayEvents = dayEvents.filter(e => !timedEvents.includes(e))

            return (
              <div key={d.toISOString()} className="border-r last:border-r-0 relative" style={{ minHeight: `${hours.length * SLOT_HEIGHT}px` }}>
                {allDayEvents.length > 0 && (
                  <div className="p-1 space-y-0.5 border-b bg-secondary/20">
                    {allDayEvents.map(ev => (
                      <div key={ev.id} className="text-[10px] px-1.5 py-0.5 rounded bg-card border truncate">{ev.title}</div>
                    ))}
                  </div>
                )}

                {hours.map(h => (
                  <div key={h} className="border-b border-border/20 relative" style={{ height: SLOT_HEIGHT }}
                    onClick={() => onQuickAdd(d)} />
                ))}

                {timedEvents.map(ev => {
                  const evt = ev.data as CalendarEvent
                  const start = new Date(evt.start_time)
                  const hour = start.getHours() + start.getMinutes() / 60
                  const top = (hour - HOUR_START) * SLOT_HEIGHT
                  const height = SLOT_HEIGHT
                  return (
                    <div key={ev.id} className="absolute left-0 right-0 px-1 z-10" style={{ top, height: Math.max(height, 20) }}>
                      <div className="h-full rounded-md px-2 py-1 text-xs border overflow-hidden cursor-pointer hover:brightness-110 transition-all"
                        style={{ background: evt.color || '#22c55e', color: '#000', borderColor: 'rgba(0,0,0,0.1)' }}
                        onClick={() => onSelectDate(d)}>
                        <div className="font-semibold truncate">{evt.title}</div>
                        <div className="text-[10px] opacity-70 truncate">{format(start, 'h:mm a')}</div>
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

function DayView({ currentDate, unifiedEvents, onSelectDate, onQuickAdd }: {
  currentDate: Date; unifiedEvents: UnifiedEvent[]; onSelectDate: (d: Date) => void; onQuickAdd: (d: Date) => void
}) {
  const dayStr = format(currentDate, 'yyyy-MM-dd')
  const dayEvents = unifiedEvents.filter(e => e.dateStr === dayStr)
  const timedEvents = dayEvents.filter(e => e.type === 'event' && (e.data as CalendarEvent).start_time.includes('T'))
  const allDayEvents = dayEvents.filter(e => !timedEvents.includes(e))
  const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i)

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold">{isSameDay(currentDate, new Date()) ? <span className="text-primary">Today</span> : format(currentDate, 'EEEE, MMMM d')}</h2>
          <Badge variant="secondary">{dayEvents.length} events</Badge>
        </div>

        {allDayEvents.length > 0 && (
          <div className="space-y-1.5 mb-4">
            {allDayEvents.map(ev => (
              <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                <div className={`w-2 h-2 rounded-full shrink-0 ${typeMeta[ev.type].color}`} />
                <div className="font-medium text-sm">{ev.title}</div>
                <div className="text-xs text-muted-foreground ml-auto">{typeMeta[ev.type].label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="relative" style={{ minHeight: `${hours.length * SLOT_HEIGHT}px` }}>
          {hours.map(h => (
            <div key={h} className="flex border-b border-border/20" style={{ height: SLOT_HEIGHT }}>
              <div className="w-16 shrink-0 text-[10px] text-muted-foreground text-right pr-3 pt-1">
                {h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`}
              </div>
              <div className="flex-1 relative" onClick={() => onQuickAdd(currentDate)} />
            </div>
          ))}

          {timedEvents.map(ev => {
            const evt = ev.data as CalendarEvent
            const start = new Date(evt.start_time)
            const hour = start.getHours() + start.getMinutes() / 60
            const top = (hour - HOUR_START) * SLOT_HEIGHT
            const height = SLOT_HEIGHT
            return (
              <div key={ev.id} className="absolute left-16 right-0 px-2 z-10" style={{ top, height: Math.max(height, 24) }}>
                <div className="h-full rounded-lg px-3 py-2 text-sm border overflow-hidden cursor-pointer hover:brightness-110 transition-all"
                  style={{ background: evt.color || '#22c55e', color: '#000', borderColor: 'rgba(0,0,0,0.1)' }}
                  onClick={() => onSelectDate(currentDate)}>
                  <div className="font-semibold">{evt.title}</div>
                  <div className="text-xs opacity-70">{format(start, 'h:mm a')}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
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
        <p className="text-sm mt-1">You are all caught up.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
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

function DayPanelContent({ events, onToggle }: { events: UnifiedEvent[]; onToggle: (ev: UnifiedEvent) => void }) {
  const grouped: Record<string, UnifiedEvent[]> = {}
  events.forEach(ev => { grouped[ev.type] = grouped[ev.type] || []; grouped[ev.type].push(ev) })
  const order = ['event', 'phase', 'todo', 'invoice']
  const labels: Record<string, string> = { event: 'Events', phase: 'Milestones', todo: 'Tasks', invoice: 'Invoices' }

  return (
    <>
      {order.map(type => {
        const items = grouped[type]
        if (!items?.length) return null
        return (
          <div key={type}>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{labels[type]}</h4>
            <div className="space-y-1.5">
              {items.map(ev => {
                const meta = typeMeta[ev.type]
                const interactive = ev.type === 'phase' || ev.type === 'todo'
                return (
                  <div key={ev.id} className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-colors ${ev.isCompleted ? 'opacity-40 bg-secondary/30' : 'bg-card hover:bg-secondary/30'}`}>
                    {interactive ? (
                      <button onClick={() => onToggle(ev)} className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors">
                        {ev.isCompleted ? <CheckCircle2 size={15} className="text-emerald-500" /> : <Circle size={15} />}
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
      })}
    </>
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
