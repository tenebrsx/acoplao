'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  X, StickyNote, ListChecks, ClipboardList, Plus, Pin, PinOff,
  Trash2, CheckCircle2, Circle, CheckSquare, Square, Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion, AnimatePresence } from 'framer-motion'

type Note = { id: string; title: string | null; content: string | null; color: string; is_pinned: boolean }
type Task = { id: string; title: string; status: string; priority: string }
type ListItem = { id: string; list_id: string; content: string; is_checked: boolean }
type List = { id: string; title: string; color: string }

const noteColors: Record<string, string> = {
  yellow: 'bg-amber-100 border-amber-200 text-amber-900',
  blue: 'bg-blue-100 border-blue-200 text-blue-900',
  green: 'bg-emerald-100 border-emerald-200 text-emerald-900',
  pink: 'bg-pink-100 border-pink-200 text-pink-900',
  purple: 'bg-purple-100 border-purple-200 text-purple-900',
  orange: 'bg-orange-100 border-orange-200 text-orange-900'
}

export function ProductivityPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('notes')
  const [notes, setNotes] = useState<Note[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [listItems, setListItems] = useState<Record<string, ListItem[]>>({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: notesData }, { data: tasksData }, { data: listsData }] = await Promise.all([
      supabase.from('notes').select('*').eq('user_id', user.id).eq('is_archived', false).order('is_pinned', { ascending: false }).limit(20),
      supabase.from('tasks').select('*').eq('user_id', user.id).neq('status', 'done').order('created_at', { ascending: false }).limit(20),
      supabase.from('lists').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
    ])

    setNotes(notesData || [])
    setTasks(tasksData || [])
    setLists(listsData || [])

    if (listsData && listsData.length > 0) {
      const { data: itemsData } = await supabase
        .from('list_items')
        .select('*')
        .in('list_id', listsData.map(l => l.id))
        .order('created_at', { ascending: true })

      const grouped: Record<string, ListItem[]> = {}
      itemsData?.forEach(item => {
        if (!grouped[item.list_id]) grouped[item.list_id] = []
        grouped[item.list_id].push(item)
      })
      setListItems(grouped)
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    if (isOpen) loadData()
  }, [isOpen, loadData])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const createNote = async (title: string, content: string, color: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: note } = await supabase.from('notes').insert({
      user_id: user?.id, title: title || null, content: content || null, color
    }).select('*').single()
    if (note) setNotes(prev => [note, ...prev])
  }

  const deleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id))
    await supabase.from('notes').delete().eq('id', id)
  }

  const togglePin = async (id: string, pinned: boolean) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, is_pinned: !pinned } : n).sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned)))
    await supabase.from('notes').update({ is_pinned: !pinned }).eq('id', id)
  }

  const createTask = async (title: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: task } = await supabase.from('tasks').insert({
      user_id: user?.id, title, status: 'todo', priority: 'medium'
    }).select('*').single()
    if (task) setTasks(prev => [task, ...prev])
  }

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    const newStatus = task?.status === 'done' ? 'todo' : 'done'
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id)
    if (newStatus === 'done') setTasks(prev => prev.filter(t => t.id !== id))
  }

  const addListItem = async (listId: string, content: string) => {
    if (!content.trim()) return
    const { data: item } = await supabase.from('list_items').insert({
      list_id: listId, content: content.trim()
    }).select('*').single()
    if (item) {
      setListItems(prev => ({ ...prev, [listId]: [...(prev[listId] || []), item] }))
    }
  }

  const toggleListItem = async (listId: string, itemId: string, checked: boolean) => {
    setListItems(prev => ({
      ...prev,
      [listId]: prev[listId]?.map(i => i.id === itemId ? { ...i, is_checked: !checked } : i) || []
    }))
    await supabase.from('list_items').update({ is_checked: !checked }).eq('id', itemId)
  }

  const filteredNotes = notes.filter(n =>
    (n.title?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
    (n.content?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
  )

  const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
        title="Productivity Panel (Cmd+Shift+P)"
      >
        <ListChecks size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-background border-l border-border z-50 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h2 className="font-bold text-lg">Productivity</h2>
                  <p className="text-xs text-muted-foreground">Cmd+Shift+P to toggle</p>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsOpen(false)}>
                  <X size={16} />
                </Button>
              </div>

              <div className="p-3 border-b">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="w-full rounded-none border-b bg-transparent p-0 h-10">
                  <TabsTrigger value="notes" className="flex-1 rounded-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs">
                    <StickyNote size={14} className="mr-1.5" /> Notes
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="flex-1 rounded-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs">
                    <ListChecks size={14} className="mr-1.5" /> Tasks
                  </TabsTrigger>
                  <TabsTrigger value="lists" className="flex-1 rounded-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs">
                    <ClipboardList size={14} className="mr-1.5" /> Lists
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto p-4">
                  <TabsContent value="notes" className="mt-0 space-y-3">
                    <QuickNoteCreator onCreate={createNote} />
                    {filteredNotes.map(note => (
                      <div key={note.id} className={`p-3 rounded-lg border ${noteColors[note.color] || noteColors.yellow}`}>
                        <div className="flex items-start justify-between mb-1">
                          {note.is_pinned && <Pin size={12} />}
                          <div className="flex gap-1 ml-auto">
                            <button onClick={() => togglePin(note.id, note.is_pinned)} className="p-1 hover:bg-black/5 rounded">
                              {note.is_pinned ? <PinOff size={12} /> : <Pin size={12} />}
                            </button>
                            <button onClick={() => deleteNote(note.id)} className="p-1 hover:bg-black/5 rounded text-red-600">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        {note.title && <div className="font-semibold text-sm">{note.title}</div>}
                        {note.content && <div className="text-sm opacity-90 line-clamp-4">{note.content}</div>}
                      </div>
                    ))}
                    {filteredNotes.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">{searchQuery ? 'No notes found.' : 'No notes yet.'}</p>
                    )}
                  </TabsContent>

                  <TabsContent value="tasks" className="mt-0 space-y-2">
                    <QuickTaskCreator onCreate={createTask} />
                    {filteredTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-2.5 p-2.5 rounded-lg border bg-card group">
                        <button onClick={() => toggleTask(task.id)} className="shrink-0">
                          {task.status === 'done' ? (
                            <CheckCircle2 size={16} className="text-emerald-500" />
                          ) : (
                            <Circle size={16} className="text-muted-foreground" />
                          )}
                        </button>
                        <span className={`text-sm flex-1 ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </span>
                        {task.priority === 'urgent' && <Badge variant="destructive" className="text-[10px] h-4">Urgent</Badge>}
                      </div>
                    ))}
                    {filteredTasks.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">{searchQuery ? 'No tasks found.' : 'All caught up!'}</p>
                    )}
                  </TabsContent>

                  <TabsContent value="lists" className="mt-0 space-y-4">
                    {lists.map(list => {
                      const items = listItems[list.id] || []
                      const checked = items.filter(i => i.is_checked).length
                      return (
                        <div key={list.id} className="border rounded-lg p-3 bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-sm">{list.title}</div>
                            <span className="text-xs text-muted-foreground">{checked}/{items.length}</span>
                          </div>
                          <div className="space-y-1.5 mb-2">
                            {items.slice(0, 5).map(item => (
                              <div key={item.id} className="flex items-center gap-2">
                                <button onClick={() => toggleListItem(list.id, item.id, item.is_checked)}>
                                  {item.is_checked ? <CheckSquare size={14} className="text-emerald-500" /> : <Square size={14} className="text-muted-foreground" />}
                                </button>
                                <span className={`text-xs ${item.is_checked ? 'line-through text-muted-foreground' : ''}`}>{item.content}</span>
                              </div>
                            ))}
                          </div>
                          <form onSubmit={(e) => { e.preventDefault(); const input = e.currentTarget.elements.namedItem('item') as HTMLInputElement; addListItem(list.id, input.value); input.value = '' }} className="flex gap-1">
                            <Input name="item" placeholder="Add item..." className="h-7 text-xs" />
                            <Button type="submit" size="sm" className="h-7 px-2"><Plus size={12} /></Button>
                          </form>
                        </div>
                      )
                    })}
                    {lists.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">No lists yet. Visit the full Lists page to create one.</p>
                    )}
                  </TabsContent>
                </div>
              </Tabs>

              <div className="p-3 border-t bg-card">
                <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                  <a href={`/${activeTab}`}>Open Full {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Page</a>
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function QuickNoteCreator({ onCreate }: { onCreate: (title: string, content: string, color: string) => void }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [color, setColor] = useState('yellow')
  const [expanded, setExpanded] = useState(false)

  const handleSubmit = () => {
    if (!title.trim() && !content.trim()) return
    onCreate(title, content, color)
    setTitle('')
    setContent('')
    setExpanded(false)
  }

  return (
    <div className="border rounded-lg p-3 bg-card">
      {!expanded ? (
        <button onClick={() => setExpanded(true)} className="w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors">
          Take a quick note...
        </button>
      ) : (
        <div className="space-y-2">
          <Input placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} className="h-8 text-sm" />
          <textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {Object.keys(noteColors).map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-5 h-5 rounded-full border transition-all ${
                    color === c ? 'border-foreground scale-110' : 'border-transparent'
                  } ${noteColors[c].split(' ')[0]}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setExpanded(false)}>Cancel</Button>
              <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>Add Note</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function QuickTaskCreator({ onCreate }: { onCreate: (title: string) => void }) {
  const [title, setTitle] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onCreate(title)
    setTitle('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder="Add a quick task..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="h-9 text-sm"
      />
      <Button type="submit" size="sm" className="h-9 px-3"><Plus size={14} /></Button>
    </form>
  )
}
