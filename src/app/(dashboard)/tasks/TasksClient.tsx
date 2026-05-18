'use client'

import { useState, useEffect, useRef } from 'react'
import {
  CheckCircle2, Circle, Plus, Trash2, Calendar, Flag,
  Search, GripVertical, Loader2, Coffee, ChevronLeft, ChevronRight
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ToastProvider'

type Task = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  tags: string[]
}

const priorityConfig: Record<string, { label: string; color: string; badge: string }> = {
  low: { label: 'Low', color: 'text-slate-500', badge: 'bg-slate-500/10 text-slate-500 dark:text-slate-400' },
  medium: { label: 'Medium', color: 'text-amber-500', badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  high: { label: 'High', color: 'text-orange-500', badge: 'bg-orange-500/15 text-orange-600 dark:text-orange-400' },
  urgent: { label: 'Urgent', color: 'text-red-500', badge: 'bg-red-500/15 text-red-600 dark:text-red-400' }
}

const formatRelativeDate = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date(new Date().setHours(0, 0, 0, 0))
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const targetDate = new Date(date.setHours(0, 0, 0, 0))
  
  if (targetDate.getTime() === today.getTime()) return 'Today'
  if (targetDate.getTime() === tomorrow.getTime()) return 'Tomorrow'
  if (targetDate.getTime() === yesterday.getTime()) return 'Yesterday'
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function GlassmorphicDatePicker({
  value,
  onChange
}: {
  value: string
  onChange: (val: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(() => {
    return value ? new Date(value) : new Date()
  })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (y: number, m: number) => {
    return new Date(y, m, 1).getDay()
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleSelectDay = (day: number) => {
    const selected = new Date(year, month, day)
    const offset = selected.getTimezoneOffset()
    const localDate = new Date(selected.getTime() - (offset * 60 * 1000))
    const formatted = localDate.toISOString().split('T')[0]
    onChange(formatted)
    setIsOpen(false)
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const blanks = Array(firstDay).fill(null)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const grid = [...blanks, ...days]

  const displayDate = value 
    ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'No due date'

  const isSelected = (day: number) => {
    if (!value) return false
    const d = new Date(value)
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
  }

  const isToday = (day: number) => {
    const today = new Date()
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl py-2 px-3.5 text-xs text-foreground hover:bg-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none justify-between h-9"
      >
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-muted-foreground" />
          <span className={value ? 'text-foreground font-medium' : 'text-muted-foreground/50'}>
            {displayDate}
          </span>
        </div>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
            }}
            className="text-[10px] text-muted-foreground hover:text-red-400 font-semibold"
          >
            Clear
          </button>
        )}
      </button>

      {isOpen && (
        <div className="absolute sm:left-[calc(100%+12px)] sm:top-0 left-0 mt-2 sm:mt-0 z-50 w-[260px] bg-[#171718]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-foreground">
              {monthNames[month]} {year}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground/60 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <span key={i} className="w-7 h-7 flex items-center justify-center">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {grid.map((day, idx) => {
              if (day === null) {
                return <div key={`blank-${idx}`} className="w-7 h-7" />
              }
              
              const selected = isSelected(day)
              const current = isToday(day)

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`w-7 h-7 text-xs rounded-lg flex items-center justify-center transition-all duration-150 ${
                    selected
                      ? 'bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 scale-105'
                      : current
                      ? 'border border-primary/40 text-primary font-medium hover:bg-white/5'
                      : 'text-foreground/80 hover:bg-white/5 hover:text-foreground'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function TasksClient({ initialTasks, userId }: { initialTasks: Task[]; userId: string }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
  const [newDescription, setNewDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [newDueDate, setNewDueDate] = useState('')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [editDueDate, setEditDueDate] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [showEditDescription, setShowEditDescription] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const taskCounts = {
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length
  }

  const createTask = async () => {
    console.log('createTask called', { newTitle, newPriority, newDueDate, userId })
    if (!newTitle.trim()) return
    
    if (!userId) {
      console.error('No userId provided to TasksClient')
      toast('Error: User session not found. Please log in again.', 'error')
      return
    }

    setIsCreating(true)
    
    try {
      console.log('Inserting task into Supabase...')
      const { data: task, error } = await supabase.from('tasks').insert({
        user_id: userId,
        title: newTitle.trim(),
        description: showDescription && newDescription.trim() ? newDescription.trim() : null,
        priority: newPriority,
        status: 'todo',
        due_date: newDueDate || null
      }).select('*').single()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Task created:', task)
      if (task) {
        setTasks(prev => [task, ...prev])
        setNewTitle('')
        setNewPriority('medium')
        setNewDueDate('')
        setNewDescription('')
        setShowDescription(false)
        setShowAdd(false)
        toast('Task created successfully', 'success')
      }
    } catch (error: any) {
      console.error('Catch error:', error)
      toast(error.message || 'Failed to create task', 'error')
    } finally {
      setIsCreating(false)
    }
  }

  const toggleTask = async (taskId: string, status: string) => {
    const newStatus = status === 'done' ? 'todo' : 'done'
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    await supabase.from('tasks').update({
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null
    }).eq('id', taskId)
  }

  const deleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    await supabase.from('tasks').delete().eq('id', taskId)
  }

  const moveToColumn = async (taskId: string, newStatus: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0))
  }

  const handleStartEdit = (task: Task) => {
    setEditingTask(task)
    setEditTitle(task.title)
    setEditPriority(task.priority as any)
    setEditDueDate(task.due_date || '')
    setEditDescription(task.description || '')
    setShowEditDescription(!!task.description)
  }

  const saveTaskChanges = async () => {
    if (!editingTask || !editTitle.trim()) return
    setIsUpdating(true)
    try {
      const { error } = await supabase.from('tasks').update({
        title: editTitle.trim(),
        priority: editPriority,
        due_date: editDueDate || null,
        description: showEditDescription && editDescription.trim() ? editDescription.trim() : null
      }).eq('id', editingTask.id)

      if (error) throw error

      setTasks(prev => prev.map(t => t.id === editingTask.id ? {
        ...t,
        title: editTitle.trim(),
        priority: editPriority,
        due_date: editDueDate || null,
        description: showEditDescription && editDescription.trim() ? editDescription.trim() : null
      } : t))

      setEditingTask(null)
      toast('Task updated successfully', 'success')
    } catch (error: any) {
      console.error('Update task error:', error)
      toast(error.message || 'Failed to update task', 'error')
    } finally {
      setIsUpdating(false)
    }
  }

  const getPillClass = (p: 'low' | 'medium' | 'high' | 'urgent', isSelected: boolean) => {
    if (!isSelected) {
      return 'bg-white/5 border border-white/5 text-muted-foreground/60 hover:bg-white/10 hover:text-foreground transition-all duration-150'
    }
    switch (p) {
      case 'low': return 'bg-slate-500/20 text-slate-300 border border-slate-500/40 shadow-sm shadow-slate-500/5'
      case 'medium': return 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/5'
      case 'high': return 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm shadow-orange-500/5'
      case 'urgent': return 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm shadow-red-500/5'
    }
  }

  const handleOpenChange = (open: boolean) => {
    setShowAdd(open)
    if (!open) {
      setNewTitle('')
      setNewPriority('medium')
      setNewDueDate('')
      setNewDescription('')
      setShowDescription(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Tasks</h1>
          <p className="text-muted-foreground text-sm">Organize your work with priorities and deadlines.</p>
        </div>
        <div className="flex gap-2 items-center">
          <Dialog open={showAdd} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                <Plus size={16} /> New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-[#161617] border border-white/[0.08] rounded-2xl shadow-2xl p-6">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-lg font-bold text-foreground">New Task</DialogTitle>
              </DialogHeader>
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  createTask()
                }} 
                className="flex flex-col gap-4"
              >
                {/* Row 1: Task Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60">Task Title</label>
                  <input 
                    placeholder="What needs to be done?" 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:bg-white/[0.08] transition-all outline-none"
                    autoFocus
                  />
                </div>

                {/* Row 2: 50/50 Priority & Due Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60">Priority</label>
                    <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                      {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewPriority(p)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-150 ${getPillClass(p, newPriority === p)}`}
                        >
                          {priorityConfig[p].label.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60">Due Date</label>
                    <GlassmorphicDatePicker value={newDueDate} onChange={setNewDueDate} />
                  </div>
                </div>

                {/* Row 3: Add Notes/Description */}
                <div className="flex flex-col gap-1.5">
                  {!showDescription ? (
                    <button
                      type="button"
                      onClick={() => setShowDescription(true)}
                      className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors flex items-center gap-1.5 self-start"
                    >
                      <Plus size={14} /> Add Description
                    </button>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60">Description</label>
                      <textarea
                        placeholder="Add extra context or details..."
                        value={newDescription}
                        onChange={e => setNewDescription(e.target.value)}
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* Row 4: Submit Button */}
                <div className="mt-2">
                  <Button 
                    type="submit"
                    className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      newTitle.trim()
                        ? 'bg-primary hover:bg-primary/95 text-primary-foreground shadow-lg shadow-primary/20 active:scale-[0.98]'
                        : 'bg-white/5 border border-white/5 text-muted-foreground/30 cursor-not-allowed'
                    }`}
                    disabled={!newTitle.trim() || isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 size={14} className="mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : 'Create Task'}
                  </Button>
                  <p className="text-[10px] text-muted-foreground/40 text-center mt-2.5">
                    Press <span className="font-sans font-medium text-muted-foreground/50">Enter ↵</span> to save • <span className="font-sans font-medium text-muted-foreground/50">Esc</span> to cancel
                  </p>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
        <div className="flex gap-1.5 p-1 bg-secondary rounded-lg overflow-x-auto custom-scrollbar">
          {(['all', 'todo', 'in_progress', 'done'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === status ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              {status === 'all' ? 'All Tasks' : status === 'todo' ? 'To Do' : status === 'in_progress' ? 'In Progress' : 'Done'}
              <span className="text-[10px] bg-secondary/50 px-1.5 rounded-full">{taskCounts[status]}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64 shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search tasks..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9" />
        </div>
      </div>

      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2">
            <div className="w-14 h-14 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
              {searchQuery || statusFilter !== 'all' ? (
                <Search size={24} className="text-muted-foreground" />
              ) : (
                <Coffee size={24} className="text-muted-foreground" />
              )}
            </div>
            <h3 className="text-lg font-semibold mb-1">
              {searchQuery ? 'No matching tasks' : statusFilter !== 'all' ? `No ${statusFilter.replace('_', ' ')} tasks` : 'All caught up!'}
            </h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery ? 'Try a different search term.' : statusFilter !== 'all' ? 'Check another tab.' : 'Time to relax, or create a new task to get started.'}
            </p>
          </Card>
        ) : (
          filteredTasks.map(task => (
            <Card 
              key={task.id} 
              className="group hover:shadow-sm transition-all border-border/50 cursor-pointer hover:bg-white/[0.01]"
              onClick={() => handleStartEdit(task)}
            >
              <CardContent className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleTask(task.id, task.status)
                    }} 
                    className="shrink-0 mt-0.5 sm:mt-0"
                  >
                    {task.status === 'done' ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : (
                      <Circle size={18} className="text-muted-foreground hover:text-primary transition-colors" />
                    )}
                  </button>
                  <div className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground/90'}`}>
                    {task.title}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 sm:gap-4 pl-8 sm:pl-0 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide uppercase ${priorityConfig[task.priority]?.badge}`}>
                      {priorityConfig[task.priority]?.label}
                    </span>
                    {task.due_date && (
                      <span className={`flex items-center gap-1.5 text-xs font-medium ${isOverdue(task.due_date) && task.status !== 'done' ? 'text-red-500' : 'text-muted-foreground'}`}>
                        <Calendar size={12} /> {formatRelativeDate(task.due_date)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    {task.status !== 'todo' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs px-2" 
                        onClick={(e) => {
                          e.stopPropagation()
                          moveToColumn(task.id, 'todo')
                        }}
                      >
                        To Do
                      </Button>
                    )}
                    {task.status !== 'in_progress' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs px-2" 
                        onClick={(e) => {
                          e.stopPropagation()
                          moveToColumn(task.id, 'in_progress')
                        }}
                      >
                        In Progress
                      </Button>
                    )}
                    {task.status !== 'done' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs px-2" 
                        onClick={(e) => {
                          e.stopPropagation()
                          moveToColumn(task.id, 'done')
                        }}
                      >
                        Done
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 ml-1" 
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteTask(task.id)
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="sm:max-w-md bg-[#161617] border border-white/[0.08] rounded-2xl shadow-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-foreground">Edit Task</DialogTitle>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              saveTaskChanges()
            }} 
            className="flex flex-col gap-4"
          >
            {/* Row 1: Task Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60">Task Title</label>
              <input 
                placeholder="What needs to be done?" 
                value={editTitle} 
                onChange={e => setEditTitle(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:bg-white/[0.08] transition-all outline-none"
                autoFocus
              />
            </div>

            {/* Row 2: 50/50 Priority & Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60">Priority</label>
                <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                  {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditPriority(p)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-150 ${getPillClass(p, editPriority === p)}`}
                    >
                      {priorityConfig[p].label.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60">Due Date</label>
                <GlassmorphicDatePicker value={editDueDate} onChange={setEditDueDate} />
              </div>
            </div>

            {/* Row 3: Add Notes/Description */}
            <div className="flex flex-col gap-1.5">
              {!showEditDescription ? (
                <button
                  type="button"
                  onClick={() => setShowEditDescription(true)}
                  className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors flex items-center gap-1.5 self-start"
                >
                  <Plus size={14} /> Add Description
                </button>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60">Description</label>
                  <textarea
                    placeholder="Add extra context or details..."
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none resize-none"
                  />
                </div>
              )}
            </div>

            {/* Row 4: Submit Button */}
            <div className="mt-2">
              <Button 
                type="submit"
                className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  editTitle.trim()
                    ? 'bg-primary hover:bg-primary/95 text-primary-foreground shadow-lg shadow-primary/20 active:scale-[0.98]'
                    : 'bg-white/5 border border-white/5 text-muted-foreground/30 cursor-not-allowed'
                }`}
                disabled={!editTitle.trim() || isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Saving Changes...
                  </>
                ) : 'Save Changes'}
              </Button>
              <p className="text-[10px] text-muted-foreground/40 text-center mt-2.5">
                Press <span className="font-sans font-medium text-muted-foreground/50">Enter ↵</span> to save • <span className="font-sans font-medium text-muted-foreground/50">Esc</span> to cancel
              </p>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
