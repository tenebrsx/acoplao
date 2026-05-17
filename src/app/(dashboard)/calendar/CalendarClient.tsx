'use client'

import { useState, useMemo, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, Circle, FolderKanban, Plus, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, AlignLeft, Building2, X, DollarSign,
  User as UserIcon, Tag, Filter, List, Search, MapPin, Clock,
  PanelRightOpen, PanelRightClose
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
import { Card, CardContent } from '@/components/ui/card'
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

const EVENT_TYPE_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; color: string; badge: string }> = {
  all: { label: 'All', icon: CalendarIcon, color: 'text-muted-foreground', badge: 'bg-secondary' },
  event: { label: 'Events', icon: CalendarIcon, color: 'text-cyan-500', badge: 'bg-cyan-500/10 text-cyan-500' },
  todo: { label: 'Tasks', icon: CheckCircle2, color: 'text-white', badge: 'bg-slate-500/10 text-slate-500' },
  phase: { label: 'Milestones', icon: FolderKanban, color: 'text-primary', badge: 'bg-primary/10 text-primary' },
  invoice: { label: 'Invoices', icon: DollarSign, color: 'text-emerald-500', badge: 'bg-emerald-500/10 text-emerald-500' }
}

function hexToRgb(color: string): string {
  if (color.startsWith('var(')) {
    if (color === 'var(--accent-primary)' || color === 'var(--accent-hover)') return '255, 255, 255'
    if (color === 'var(--success)') return '50, 215, 75'
    if (color === 'var(--error)') return '255, 69, 58'
    if (color === 'var(--info)') return '10, 132, 255'
    if (color === 'var(--warning)') return '255, 214, 10'
    if (color === 'var(--accent-secondary)') return '10, 132, 255'
    return '0, 225, 255'
  }
  const hex = color.replace('#', '')
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16)
    const g = parseInt(hex[1] + hex[1], 16)
    const b = parseInt(hex[2] + hex[2], 16)
    return `${r}, ${g}, ${b}`
  }
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `${r}, ${g}, ${b}`
  }
  return '0, 225, 255'
}

function DraggableEvent({ event, onClick }: { event: UnifiedEvent; onClick: (e: React.MouseEvent) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: { event }
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 99 : 1,
  }

  const Icon = event.icon
  const rgb = hexToRgb(event.color)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1.5 h-[22px] px-2 rounded text-[11px] font-medium whitespace-nowrap overflow-hidden text-ellipsis cursor-grab transition-all mb-[2px] hover:scale-[1.02]`}
      {...listeners}
      {...attributes}
      onClick={onClick}
      title={event.title}
    >
      <Icon size={10} />
      <span className="truncate">{event.title}</span>
    </div>
  )
}

function DroppableDay({ day, onDateSelect, isSelected, isToday, children, onQuickAdd }: {
  day: CalendarDay
  onDateSelect: (d: Date) => void
  isSelected: boolean
  isToday: boolean
  children: React.ReactNode
  onQuickAdd: (d: Date) => void
}) {
  const { isOver, setNodeRef } = useDroppable({ id: day.dateStr, data: { dateStr: day.dateStr } })
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      ref={setNodeRef}
      onClick={() => onDateSelect(day.date)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`min-h-[120px] p-2 border-r border-b border-border transition-colors flex flex-col gap-[2px] relative cursor-pointer ${
        isOver ? 'bg-primary/5' : isSelected ? 'bg-primary/5' : isToday ? 'bg-secondary/50' : 'bg-card'
      } ${day.isCurrentMonth ? '' : 'opacity-30'}`}
      style={{ outline: isSelected ? '2px solid hsl(var(--primary))' : 'none', outlineOffset: '-2px', zIndex: isSelected ? 2 : 1 }}
    >
      <div className="flex justify-between items-center mb-1">
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
          isToday ? 'bg-primary text-primary-foreground' : isSelected ? 'text-primary border-2 border-primary' : 'text-foreground'
        }`}>
          {day.dayNum}
        </span>
        {isHovered && day.events.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-muted-foreground">
            <Plus size={14} onClick={e => { e.stopPropagation(); onQuickAdd(day.date); }} />
          </motion.div>
        )}
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}

export function CalendarClient({
  initialPhases, initialTodos, initialEvents, initialInvoices,
  businesses, team, userId
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
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterBusiness, setFilterBusiness] = useState<string>('all')
  const [activeEventId, setActiveEventId] = useState<string | null>(null)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [newEvent, setNewEvent] = useState<NewEventForm>({
    title: '', description: '', all_day: true, start_time: '',
    color: '#00e1ff', business_id: '', assigned_to: userId
  })
  const [isSaving, setIsSaving] = useState(false)

  const { toast } = useToast()
  const supabase = createClient()
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const unifiedEvents = useMemo<UnifiedEvent[]>(() => {
    let all: UnifiedEvent[] = []
    phases.forEach(p => {
      all.push({
        id: `phase-${p.id}`, type: 'phase',
        title: p.phase_name,
        subtitle: `${p.deliverables?.title || 'Campaign'} (${p.deliverables?.projects?.businesses?.name || 'Client'})`,
        dateStr: p.scheduled_date,
        isCompleted: p.is_completed,
        color: 'var(--accent-primary)',
        icon: FolderKanban,
        data: p as Record<string, unknown>
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
          data: t as Record<string, unknown>
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
          data: i as Record<string, unknown>
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
        data: e as Record<string, unknown>
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
      if (currentWeek.length === 7) { result.push(currentWeek); currentWeek = [] }
    })
    return result
  }, [gridDays])

  const toggleStatus = async (item: UnifiedEvent) => {
    if (item.type === 'phase') {
      const current = (item.data as Phase).is_completed
      setPhases(prev => prev.map(p => p.id === (item.data as Phase).id ? { ...p, is_completed: !current } : p))
      const { error } = await supabase.from('deliverable_phases').update({ is_completed: !current }).eq('id', (item.data as Phase).id)
      if (error) {
        setPhases(prev => prev.map(p => p.id === (item.data as Phase).id ? { ...p, is_completed: current } : p))
        toast('Failed to update status', 'error')
      } else { toast('Status updated', 'success') }
    } else if (item.type === 'todo') {
      const current = (item.data as Todo).is_completed
      setTodos(prev => prev.map(t => t.id === (item.data as Todo).id ? { ...t, is_completed: !current } : t))
      const { error } = await supabase.from('todos').update({ is_completed: !current }).eq('id', (item.data as Todo).id)
      if (error) {
        setTodos(prev => prev.map(t => t.id === (item.data as Todo).id ? { ...t, is_completed: current } : t))
        toast('Failed to update status', 'error')
      } else { toast('Status updated', 'success') }
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEvent.title || !newEvent.start_time) return
    setIsSaving(true)
    const payload = {
      title: newEvent.title, description: newEvent.description,
      all_day: newEvent.all_day,
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
    } else { toast('Failed to create event', 'error') }
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
      const { error } = await supabase.from('calendar_events').update({ start_time: newStartTime }).eq('id', (item.data as CalendarEvent).id)
      if (error) { setEvents(prev => prev.map(e => e.id === (item.data as CalendarEvent).id ? { ...e, start_time: (oldData as CalendarEvent).start_time } : e)); toast('Failed to move event', 'error') }
      else { toast('Event moved', 'success') }
    } else if (item.type === 'todo') {
      setTodos(prev => prev.map(t => t.id === (item.data as Todo).id ? { ...t, due_date: newDateStr } : t))
      const { error } = await supabase.from('todos').update({ due_date: newDateStr }).eq('id', (item.data as Todo).id)
      if (error) { setTodos(prev => prev.map(t => t.id === (item.data as Todo).id ? { ...t, due_date: (oldData as Todo).due_date } : t)); toast('Failed to move event', 'error') }
      else { toast('Event moved', 'success') }
    } else if (item.type === 'invoice') {
      setInvoices(prev => prev.map(i => i.id === (item.data as Invoice).id ? { ...i, due_date: newDateStr } : i))
      const { error } = await supabase.from('invoices').update({ due_date: newDateStr }).eq('id', (item.data as Invoice).id)
      if (error) { setInvoices(prev => prev.map(i => i.id === (item.data as Invoice).id ? { ...i, due_date: (oldData as Invoice).due_date } : i)); toast('Failed to move event', 'error') }
      else { toast('Event moved', 'success') }
    } else if (item.type === 'phase') {
      setPhases(prev => prev.map(p => p.id === (item.data as Phase).id ? { ...p, scheduled_date: newDateStr } : p))
      const { error } = await supabase.from('deliverable_phases').update({ scheduled_date: newDateStr }).eq('id', (item.data as Phase).id)
      if (error) { setPhases(prev => prev.map(p => p.id === (item.data as Phase).id ? { ...p, scheduled_date: (oldData as Phase).scheduled_date } : p)); toast('Failed to move event', 'error') }
      else { toast('Event moved', 'success') }
    }
  }

  const navigatePrev = useCallback(() => {
    if (viewMode === 'month') setCurrentDate(d => subMonths(d, 1))
    else if (viewMode === 'week') setCurrentDate(d => subWeeks(d, 1))
    else setCurrentDate(d => dateFnsSubDays(d, 1))
  }, [viewMode])
  const navigateNext = useCallback(() => {
    if (viewMode === 'month') setCurrentDate(d => addMonths(d, 1))
    else if (viewMode === 'week') setCurrentDate(d => addWeeks(d, 1))
    else setCurrentDate(d => addDays(d, 1))
  }, [viewMode])

  const handleEventClick = useCallback((ev: UnifiedEvent) => {
    setActiveEventId(ev.id)
    const date = parseISO(ev.dateStr)
    setSelectedDate(date)
    if (!isSameMonth(date, currentDate)) setCurrentDate(date)
  }, [currentDate])

  const handleQuickAdd = useCallback((date: Date) => {
    setNewEvent(prev => ({ ...prev, start_time: format(date, 'yyyy-MM-dd') }))
    setIsEventModalOpen(true)
  }, [])

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date)
    setShowDrawer(true)
  }, [])

  const selectedStr = format(selectedDate, 'yyyy-MM-dd')
  const selectedEvents = unifiedEvents.filter(e => e.dateStr === selectedStr)
  const eventCounts = useMemo(() => ({
    all: unifiedEvents.length,
    event: unifiedEvents.filter(e => e.type === 'event').length,
    todo: unifiedEvents.filter(e => e.type === 'todo').length,
    phase: unifiedEvents.filter(e => e.type === 'phase').length,
    invoice: unifiedEvents.filter(e => e.type === 'invoice').length
  }), [unifiedEvents])

  const isTodaySelected = isSameDay(selectedDate, new Date())

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-120px)]">
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold tracking-tight min-w-[180px]">
            {viewMode === 'month' ? format(currentDate, 'MMMM yyyy') :
             viewMode === 'week' ? `Week of ${format(startOfWeek(currentDate), 'MMM d')}` :
             'Agenda'}
          </h2>
          <div className="flex items-center bg-secondary rounded-lg border border-border overflow-hidden">
            <button onClick={navigatePrev} className="p-2 hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()) }} className="px-3 py-2 text-xs font-semibold hover:bg-secondary/80 transition-colors border-x border-border">
              Today
            </button>
            <button onClick={navigateNext} className="p-2 hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-secondary rounded-lg p-1 border border-border">
            {(['month', 'week', 'agenda'] as ViewMode[]).map(id => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  viewMode === id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {id === 'month' ? 'Month' : id === 'week' ? 'Week' : 'Agenda'}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={14} /> Filters
          </Button>

          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowDrawer(!showDrawer)}>
            {showDrawer ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
            Day
          </Button>

          <Button size="sm" className="gap-1.5" onClick={() => handleQuickAdd(selectedDate)}>
            <Plus size={14} /> Event
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden shrink-0"
          >
            <Card className="border-dashed">
              <CardContent className="p-3 flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Type:</span>
                {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => {
                  const Icon = config.icon
                  const isActive = filterType === key
                  return (
                    <button
                      key={key}
                      onClick={() => setFilterType(key)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                      }`}
                    >
                      <Icon size={12} />
                      {config.label}
                      <span className={`ml-0.5 ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {eventCounts[key as keyof typeof eventCounts]}
                      </span>
                    </button>
                  )
                })}

                <div className="w-px h-5 bg-border mx-1" />

                <span className="text-xs font-semibold text-muted-foreground uppercase">Client:</span>
                <select
                  value={filterBusiness}
                  onChange={e => setFilterBusiness(e.target.value)}
                  className="h-7 px-2 text-xs bg-secondary border border-border rounded-md"
                >
                  <option value="all">All Clients</option>
                  {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col border rounded-xl overflow-hidden bg-card min-h-0">
          {viewMode === 'agenda' ? (
            <div className="flex-1 overflow-y-auto">
              <AgendaView unifiedEvents={unifiedEvents} onEventClick={handleEventClick} activeEventId={activeEventId} />
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-7 border-b shrink-0">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary/30">
                    {d}
                  </div>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto">
                {weeks.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7" style={{ minHeight: viewMode === 'week' ? '400px' : 'auto' }}>
                    {week.map(cell => (
                      <DroppableDay
                        key={cell.dateStr}
                        day={cell}
                        onDateSelect={handleDateSelect}
                        isSelected={isSameDay(cell.date, selectedDate)}
                        isToday={isSameDay(cell.date, new Date())}
                        onQuickAdd={handleQuickAdd}
                      >
                        {cell.events.slice(0, viewMode === 'week' ? 12 : 4).map(ev => (
                          <DraggableEvent key={ev.id} event={ev} onClick={() => handleEventClick(ev)} />
                        ))}
                        {cell.events.length > (viewMode === 'week' ? 12 : 4) && (
                          <button
                            onClick={e => { e.stopPropagation(); handleDateSelect(cell.date); }}
                            className="px-2 py-0.5 rounded-full bg-secondary text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors w-fit"
                          >
                            +{cell.events.length - (viewMode === 'week' ? 12 : 4)} more
                          </button>
                        )}
                      </DroppableDay>
                    ))}
                  </div>
                ))}
              </div>
            </DndContext>
          )}
        </div>

        <AnimatePresence>
          {showDrawer && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="shrink-0 overflow-hidden"
            >
              <SelectedDayDrawer
                selectedDate={selectedDate}
                selectedEvents={selectedEvents}
                activeEventId={activeEventId}
                onToggleStatus={toggleStatus}
                onQuickAdd={handleQuickAdd}
                isToday={isTodaySelected}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isEventModalOpen && (
          <EventModal
            newEvent={newEvent}
            setNewEvent={setNewEvent}
            businesses={businesses}
            team={team}
            isSaving={isSaving}
            onClose={() => setIsEventModalOpen(false)}
            onSubmit={handleCreateEvent}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function AgendaView({ unifiedEvents, onEventClick, activeEventId }: {
  unifiedEvents: UnifiedEvent[]
  onEventClick: (ev: UnifiedEvent) => void
  activeEventId: string | null
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, UnifiedEvent[]>()
    unifiedEvents.filter(e => new Date(e.dateStr) >= new Date()).forEach(ev => {
      const list = map.get(ev.dateStr) || []
      list.push(ev)
      map.set(ev.dateStr, list)
    })
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(0, 30)
  }, [unifiedEvents])

  if (grouped.length === 0) {
    return (
      <div className="p-16 text-center text-muted-foreground">
        <CalendarIcon size={40} className="mx-auto mb-4 opacity-40" />
        <p className="font-semibold text-foreground mb-1">No upcoming events</p>
        <p className="text-sm">You're all caught up!</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {grouped.map(([dateStr, events]) => (
        <div key={dateStr}>
          <div className="flex items-center gap-3 py-3 sticky top-0 bg-card z-10 border-b mb-2">
            <div className="w-1 h-5 bg-primary rounded-full" />
            <div>
              <div className="font-bold text-sm">{format(parseISO(dateStr), 'EEEE, MMMM d')}</div>
              <div className="text-xs text-muted-foreground">{events.length} event{events.length > 1 ? 's' : ''}</div>
            </div>
          </div>
          <div className="space-y-2 pl-4">
            {events.map(ev => (
              <DrawerEventCard key={ev.id} event={ev} isActive={activeEventId === ev.id} onClick={() => onEventClick(ev)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function SelectedDayDrawer({ selectedDate, selectedEvents, activeEventId, onToggleStatus, onQuickAdd, isToday }: {
  selectedDate: Date
  selectedEvents: UnifiedEvent[]
  activeEventId: string | null
  onToggleStatus: (ev: UnifiedEvent) => void
  onQuickAdd: (d: Date) => void
  isToday: boolean
}) {
  const grouped = useMemo(() => {
    const byType: Record<string, UnifiedEvent[]> = {}
    selectedEvents.forEach(ev => { byType[ev.type] = byType[ev.type] || []; byType[ev.type].push(ev) })
    return byType
  }, [selectedEvents])

  const typeOrder = ['event', 'phase', 'todo', 'invoice']
  const typeLabels: Record<string, string> = { event: 'Events', phase: 'Milestones', todo: 'Tasks', invoice: 'Invoices' }

  return (
    <div className="h-full border rounded-xl bg-card flex flex-col overflow-hidden">
      <div className="p-4 border-b shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold">{isToday ? <span className="text-primary">Today</span> : format(selectedDate, 'EEEE, MMM d')}</h3>
            <p className="text-xs text-muted-foreground">{format(selectedDate, 'MMMM yyyy')}</p>
          </div>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onQuickAdd(selectedDate)}>
            <Plus size={14} />
          </Button>
        </div>
        {selectedEvents.length > 0 && (
          <Badge variant="secondary" className="mt-2 text-xs">
            {selectedEvents.length} event{selectedEvents.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {selectedEvents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarIcon size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-foreground">Nothing scheduled</p>
            <p className="text-xs mt-1">Enjoy the clear slate.</p>
          </div>
        ) : (
          typeOrder.map(type => {
            const items = grouped[type]
            if (!items || items.length === 0) return null
            return (
              <div key={type}>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground my-2">
                  {typeLabels[type]} ({items.length})
                </h4>
                <div className="space-y-2">
                  {items.map(ev => (
                    <DrawerEventCard key={ev.id} event={ev} isActive={activeEventId === ev.id} onToggle={() => onToggleStatus(ev)} showToggle />
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function DrawerEventCard({ event, isActive, onClick, onToggle, showToggle }: {
  event: UnifiedEvent
  isActive: boolean
  onClick?: () => void
  onToggle?: () => void
  showToggle?: boolean
}) {
  const Icon = event.icon
  const rgb = hexToRgb(event.color)
  const interactive = event.type === 'phase' || event.type === 'todo'

  return (
    <motion.div
      layout
      animate={isActive ? { scale: [1, 1.02, 1], transition: { duration: 0.4 } } : {}}
      className={`p-3 rounded-lg border transition-all cursor-pointer ${
        event.isCompleted ? 'opacity-50 bg-secondary/50' : 'bg-card'
      } ${isActive ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-muted-foreground/50'}`}
      style={{ borderLeftWidth: '3px', borderLeftColor: event.isCompleted ? 'hsl(var(--border))' : event.color }}
      onClick={onClick}
    >
      <div className="flex items-start gap-2.5">
        {showToggle && interactive ? (
          <button onClick={e => { e.stopPropagation(); onToggle?.() }} className="shrink-0 mt-0.5 text-muted-foreground hover:text-primary transition-colors">
            {event.isCompleted ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} />}
          </button>
        ) : (
          <div className="shrink-0 mt-0.5" style={{ color: event.color }}><Icon size={16} /></div>
        )}
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${event.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
            {event.title}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            {event.type === 'phase' && <FolderKanban size={10} />}
            {event.type === 'invoice' && <DollarSign size={10} />}
            {event.subtitle}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function EventModal({ newEvent, setNewEvent, businesses, team, isSaving, onClose, onSubmit }: {
  newEvent: NewEventForm
  setNewEvent: React.Dispatch<React.SetStateAction<NewEventForm>>
  businesses: Business[]
  team: TeamMember[]
  isSaving: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl flex flex-col gap-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Create Event</h2>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}><X size={18} /></Button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <input
            autoFocus
            placeholder="Event Title"
            value={newEvent.title}
            onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))}
            className="w-full text-xl font-bold bg-transparent border-b border-border pb-2 text-foreground outline-none placeholder:text-muted-foreground"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                <Clock size={10} className="inline mr-1" /> Date
              </label>
              <input
                type="date"
                value={newEvent.start_time}
                onChange={e => setNewEvent(p => ({ ...p, start_time: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                <Tag size={10} className="inline mr-1" /> Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {['#00e1ff', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#fff'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewEvent(p => ({ ...p, color: c }))}
                    className="w-7 h-7 rounded-full transition-all"
                    style={{
                      background: c,
                      border: newEvent.color === c ? '2px solid hsl(var(--foreground))' : '2px solid transparent',
                      boxShadow: newEvent.color === c ? `0 0 8px ${c}` : 'none'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                <Building2 size={10} className="inline mr-1" /> Client
              </label>
              <select
                value={newEvent.business_id}
                onChange={e => setNewEvent(p => ({ ...p, business_id: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground outline-none"
              >
                <option value="">General / Internal</option>
                {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                <UserIcon size={10} className="inline mr-1" /> Assign To
              </label>
              <select
                value={newEvent.assigned_to}
                onChange={e => setNewEvent(p => ({ ...p, assigned_to: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground outline-none"
              >
                <option value="">Unassigned</option>
                {team.map(t => <option key={t.id} value={t.id}>{t.email.split('@')[0]} ({t.role})</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              <AlignLeft size={10} className="inline mr-1" /> Description
            </label>
            <textarea
              value={newEvent.description}
              onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))}
              placeholder="Add notes or context..."
              rows={3}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving || !newEvent.title || !newEvent.start_time}
            >
              {isSaving ? 'Saving...' : 'Add to Calendar'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
