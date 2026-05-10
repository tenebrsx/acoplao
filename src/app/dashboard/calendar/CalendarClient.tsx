'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, FolderKanban, Plus, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import {
  format, addMonths, subMonths,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  isSameMonth, isSameDay, addDays,
} from 'date-fns'

type Phase = {
  id: string
  phase_name: string
  scheduled_date: string
  is_completed: boolean
  deliverables: {
    id: string
    title: string
    projects: {
      id: string
      title: string
      businesses: { name: string }
    }
  }
}

type Todo = {
  id: string
  title: string
  description: string | null
  due_date: string | null
  is_completed: boolean
}

type CalendarDay = {
  date: Date
  dateStr: string
  dayNum: string
  isCurrentMonth: boolean
  phases: Phase[]
  todos: Todo[]
}

export function CalendarClient({
  initialPhases,
  initialTodos,
}: {
  initialPhases: Phase[]
  initialTodos: Todo[]
}) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [phases, setPhases] = useState<Phase[]>(initialPhases)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  const supabase = createClient()
  const router = useRouter()

  // ── Compute the grid as pure data ──────────────────────────────
  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const gridStart = startOfWeek(monthStart)
    const gridEnd = endOfWeek(monthEnd)

    const result: CalendarDay[][] = []
    let day = gridStart
    let week: CalendarDay[] = []

    while (day <= gridEnd) {
      const dayStr = format(day, 'yyyy-MM-dd')
      week.push({
        date: day,
        dateStr: dayStr,
        dayNum: format(day, 'd'),
        isCurrentMonth: isSameMonth(day, monthStart),
        phases: phases.filter(p => p.scheduled_date === dayStr),
        todos: todos.filter(t => t.due_date === dayStr),
      })

      if (week.length === 7) {
        result.push(week)
        week = []
      }
      day = addDays(day, 1)
    }
    return result
  }, [currentMonth, phases, todos])

  // ── Actions ────────────────────────────────────────────────────
  const togglePhase = async (phaseId: string, current: boolean) => {
    setPhases(prev => prev.map(p => (p.id === phaseId ? { ...p, is_completed: !current } : p)))
    await supabase.from('deliverable_phases').update({ is_completed: !current }).eq('id', phaseId)
  }

  const toggleTodo = async (todoId: string, current: boolean) => {
    setTodos(prev => prev.map(t => (t.id === todoId ? { ...t, is_completed: !current } : t)))
    await supabase.from('todos').update({ is_completed: !current }).eq('id', todoId)
  }

  const addTodo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const titleInput = form.elements.namedItem('title') as HTMLInputElement
    const title = titleInput.value.trim()
    if (!title) return

    titleInput.value = ''
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const { data: { user } } = await supabase.auth.getUser()

    const tempId = `temp-${Date.now()}`
    setTodos(prev => [...prev, { id: tempId, title, description: null, due_date: dateStr, is_completed: false }])

    const { data } = await supabase
      .from('todos')
      .insert({ title, due_date: dateStr, is_completed: false, created_by: user?.id, assigned_to: user?.id })
      .select('id')
      .single()

    if (data) {
      setTodos(prev => prev.map(t => (t.id === tempId ? { ...t, id: data.id } : t)))
      router.refresh()
    }
  }

  const updateTodoMeta = async (todoId: string, text: string) => {
    setTodos(prev => prev.map(t => (t.id === todoId ? { ...t, description: text } : t)))
    await supabase.from('todos').update({ description: text }).eq('id', todoId)
  }

  // ── Selected-day data ──────────────────────────────────────────
  const selectedStr = format(selectedDate, 'yyyy-MM-dd')
  const selectedPhases = phases.filter(p => p.scheduled_date === selectedStr)
  const selectedTodos = todos.filter(t => t.due_date === selectedStr)
  const hasItems = selectedPhases.length > 0 || selectedTodos.length > 0

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px', alignItems: 'start' }}>
      {/* ── Month Grid ── */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{format(currentMonth, 'MMMM yyyy')}</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="btn btn-secondary" style={{ padding: '8px' }}>
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()) }} className="btn btn-secondary">
              Today
            </button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="btn btn-secondary" style={{ padding: '8px' }}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Day-of-week header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: '1px solid var(--surface-border)' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-tertiary)', background: 'var(--bg-primary)' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: '1px solid var(--surface-border)' }}>
            {week.map(cell => {
              const isSelected = isSameDay(cell.date, selectedDate)
              const isToday = isSameDay(cell.date, new Date())
              const total = cell.phases.length + cell.todos.length

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDate(cell.date)}
                  style={{
                    minHeight: '90px',
                    padding: '10px',
                    background: isSelected ? 'rgba(0,225,255,0.06)' : 'var(--surface)',
                    borderRight: '1px solid var(--surface-border)',
                    opacity: cell.isCurrentMonth ? 1 : 0.35,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Day number */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span
                      style={{
                        width: isToday ? '26px' : 'auto',
                        height: isToday ? '26px' : 'auto',
                        borderRadius: '50%',
                        background: isToday ? 'var(--accent-secondary)' : 'transparent',
                        color: isToday ? '#000' : isSelected ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                        fontWeight: isToday || isSelected ? 700 : 500,
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {cell.dayNum}
                    </span>
                    {total > 0 && (
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', background: 'var(--bg-primary)', padding: '1px 5px', borderRadius: '4px' }}>
                        {total}
                      </span>
                    )}
                  </div>

                  {/* Event previews */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden', flex: 1 }}>
                    {cell.phases.slice(0, 2).map(p => (
                      <div key={p.id} style={{ fontSize: '0.6875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: p.is_completed ? 'var(--text-tertiary)' : 'var(--text-primary)', textDecoration: p.is_completed ? 'line-through' : 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: p.is_completed ? 'var(--text-tertiary)' : 'var(--accent-secondary)', flexShrink: 0 }} />
                        {p.phase_name}
                      </div>
                    ))}
                    {cell.todos.slice(0, Math.max(0, 2 - cell.phases.length)).map(t => (
                      <div key={t.id} style={{ fontSize: '0.6875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: t.is_completed ? 'var(--text-tertiary)' : 'var(--text-secondary)', textDecoration: t.is_completed ? 'line-through' : 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: t.is_completed ? 'var(--text-tertiary)' : 'var(--text-primary)', flexShrink: 0 }} />
                        {t.title}
                      </div>
                    ))}
                    {total > 2 && (
                      <span style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', marginTop: 'auto' }}>+{total - 2} more</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* ── Day Agenda Panel ── */}
      <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
            {isSameDay(selectedDate, new Date()) ? 'Today, ' : ''}{format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>{format(selectedDate, 'EEEE')}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!hasItems && (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
              Nothing scheduled.
            </div>
          )}

          {selectedPhases.map(phase => (
            <div key={phase.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: phase.is_completed ? 'transparent' : 'var(--surface)', border: `1px solid ${phase.is_completed ? 'transparent' : 'var(--surface-border)'}`, opacity: phase.is_completed ? 0.55 : 1, transition: 'opacity 0.2s' }}>
              <button onClick={() => togglePhase(phase.id, phase.is_completed)} style={{ color: phase.is_completed ? 'var(--success)' : 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', marginTop: '1px' }}>
                {phase.is_completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: '0.875rem', textDecoration: phase.is_completed ? 'line-through' : 'none' }}>
                  {phase.deliverables?.title} — {phase.phase_name}
                </div>
                <Link href={`/dashboard/projects/${phase.deliverables?.projects?.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px', textDecoration: 'none' }}>
                  <FolderKanban size={11} /> {phase.deliverables?.projects?.businesses?.name}
                </Link>
              </div>
            </div>
          ))}

          {selectedTodos.map(todo => (
            <div key={todo.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: todo.is_completed ? 'transparent' : 'var(--bg-primary)', border: `1px solid ${todo.is_completed ? 'transparent' : 'var(--surface-border)'}`, opacity: todo.is_completed ? 0.55 : 1, transition: 'opacity 0.2s' }}>
              <button onClick={() => toggleTodo(todo.id, todo.is_completed)} style={{ color: todo.is_completed ? 'var(--success)' : 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', marginTop: '1px' }}>
                {todo.is_completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              </button>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontWeight: 500, fontSize: '0.875rem', textDecoration: todo.is_completed ? 'line-through' : 'none' }}>
                  {todo.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)' }}>
                  <FileText size={11} />
                  <input
                    defaultValue={todo.description || ''}
                    placeholder="Add notes…"
                    onBlur={e => updateTodoMeta(todo.id, e.target.value)}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '2px 0' }}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Quick Add */}
          <form onSubmit={addTodo} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', padding: '8px 12px', border: '1px dashed var(--surface-border)', borderRadius: '8px' }}>
            <Plus size={14} color="var(--text-tertiary)" />
            <input
              name="title"
              placeholder="Assign new task to this day…"
              autoComplete="off"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.875rem', color: 'var(--text-primary)' }}
            />
          </form>
        </div>
      </div>
    </div>
  )
}
