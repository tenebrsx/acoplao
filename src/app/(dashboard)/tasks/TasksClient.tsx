'use client'

import { useState } from 'react'
import {
  CheckCircle2, Circle, Plus, Trash2, Calendar, Flag,
  LayoutGrid, List, Search, GripVertical
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

type Task = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  tags: string[]
}

const columns = [
  { id: 'todo', label: 'To Do', color: 'bg-slate-500', border: 'border-slate-200', bg: 'bg-slate-50/50' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500', border: 'border-blue-200', bg: 'bg-blue-50/50' },
  { id: 'done', label: 'Done', color: 'bg-emerald-500', border: 'border-emerald-200', bg: 'bg-emerald-50/50' }
]

const priorityConfig: Record<string, { label: string; color: string; badge: string }> = {
  low: { label: 'Low', color: 'text-slate-500', badge: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Medium', color: 'text-amber-500', badge: 'bg-amber-100 text-amber-600' },
  high: { label: 'High', color: 'text-orange-500', badge: 'bg-orange-100 text-orange-600' },
  urgent: { label: 'Urgent', color: 'text-red-500', badge: 'bg-red-100 text-red-600' }
}

export function TasksClient({ initialTasks, userId }: { initialTasks: Task[]; userId: string }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [newDueDate, setNewDueDate] = useState('')
  const supabase = createClient()

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  )

  const createTask = async () => {
    if (!newTitle.trim()) return
    const { data: task } = await supabase.from('tasks').insert({
      user_id: userId,
      title: newTitle.trim(),
      priority: newPriority,
      status: 'todo',
      due_date: newDueDate || null
    }).select('*').single()

    if (task) {
      setTasks(prev => [task, ...prev])
      setNewTitle('')
      setNewPriority('medium')
      setNewDueDate('')
      setShowAdd(false)
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Tasks</h1>
          <p className="text-muted-foreground text-sm">Organize your work with priorities and deadlines.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'board' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <LayoutGrid size={14} /> Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <List size={14} /> List
            </button>
          </div>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus size={14} className="mr-1.5" /> New Task</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input placeholder="What needs to be done?" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
                    <div className="flex gap-1">
                      {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => setNewPriority(p)}
                          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            newPriority === p ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                          }`}
                        >
                          {priorityConfig[p].label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Due Date</label>
                    <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="h-[30px] text-sm py-1" />
                  </div>
                </div>
                <Button onClick={createTask} className="w-full" disabled={!newTitle.trim()}>Create Task</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search tasks..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
      </div>

      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id || (col.id === 'todo' && !columns.find(c => c.id === t.status)))
            return (
              <div key={col.id} className={`rounded-xl border ${col.border} ${col.bg} p-3`}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.color}`} />
                    <span className="text-sm font-semibold">{col.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs h-5">{colTasks.length}</Badge>
                </div>
                <div className="space-y-2">
                  {colTasks.map(task => (
                    <Card key={task.id} className="group bg-background hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2.5">
                          <button onClick={() => toggleTask(task.id, task.status)} className="shrink-0 mt-0.5">
                            {task.status === 'done' ? (
                              <CheckCircle2 size={16} className="text-emerald-500" />
                            ) : (
                              <Circle size={16} className="text-muted-foreground hover:text-primary transition-colors" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                              {task.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priorityConfig[task.priority]?.badge}`}>
                                {priorityConfig[task.priority]?.label}
                              </span>
                              {task.due_date && (
                                <span className={`flex items-center gap-1 text-[10px] ${isOverdue(task.due_date) ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                                  <Calendar size={10} />
                                  {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                          </div>
                          <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity shrink-0 p-1">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="text-center py-6 text-xs text-muted-foreground border-2 border-dashed border-border/50 rounded-lg">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={24} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{searchQuery ? 'No matching tasks' : 'No tasks yet'}</h3>
              <p className="text-muted-foreground text-sm">{searchQuery ? 'Try a different search.' : 'Create your first task to get started.'}</p>
            </Card>
          ) : (
            filteredTasks.map(task => (
              <Card key={task.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <button onClick={() => toggleTask(task.id, task.status)} className="shrink-0">
                    {task.status === 'done' ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : (
                      <Circle size={18} className="text-muted-foreground hover:text-primary transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priorityConfig[task.priority]?.badge}`}>
                        {priorityConfig[task.priority]?.label}
                      </span>
                      {task.due_date && (
                        <span className={`flex items-center gap-1 text-[10px] ${isOverdue(task.due_date) ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                          <Calendar size={10} /> {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {task.status !== 'todo' && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => moveToColumn(task.id, 'todo')}>To Do</Button>
                    )}
                    {task.status !== 'in_progress' && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => moveToColumn(task.id, 'in_progress')}>In Progress</Button>
                    )}
                    {task.status !== 'done' && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => moveToColumn(task.id, 'done')}>Done</Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500" onClick={() => deleteTask(task.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
