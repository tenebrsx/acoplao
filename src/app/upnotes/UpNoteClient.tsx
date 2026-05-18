'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, Pin, Trash2, ChevronRight, ChevronDown,
  ArrowLeft, FileText, Folder, Tag as TagIcon, Clock,
  X, MoreVertical, Archive, Settings, Layout,
  Bold, Type, Hash, Star, CornerUpLeft, Sun
} from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/components/ToastProvider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { TiptapEditor } from '@/components/TiptapEditor'

type Notebook = {
  id: string
  user_id: string
  parent_id: string | null
  name: string
  color: string
  icon: string
  sort_order: number
}

type Note = {
  id: string
  user_id: string
  notebook_id: string | null
  title: string
  content: any
  plain_text: string
  word_count: number
  is_pinned: boolean
  is_archived: boolean
  is_daily_note: boolean
  daily_note_date: string | null
  created_at: string
  updated_at: string
  upnote_note_tags?: { tag_id: string }[]
}

type Tag = {
  id: string
  user_id: string
  name: string
  color: string
  parent_id: string | null
}

function getNotebookTree(notebooks: Notebook[], parentId: string | null = null): Notebook[] {
  return notebooks
    .filter(n => n.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order)
}

function getNotebookNotes(notes: Note[], notebookId: string | null): Note[] {
  if (!notebookId) return notes.filter(n => !n.notebook_id)
  return notes.filter(n => n.notebook_id === notebookId)
}

export function UpNoteClient({
  initialNotebooks, initialNotes, initialTags, userId
}: {
  initialNotebooks: Notebook[]
  initialNotes: Note[]
  initialTags: Tag[]
  userId: string
}) {
  const [notebooks, setNotebooks] = useState<Notebook[]>(initialNotebooks)
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [tags, setTags] = useState<Tag[]>(initialTags)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [isCreatingNotebook, setIsCreatingNotebook] = useState(false)
  const [newNotebookName, setNewNotebookName] = useState('')
  const [expandedNotebooks, setExpandedNotebooks] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const saveDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const { toast } = useToast()
  const supabase = createClient()
  const router = useRouter()

  const selectedNote = useMemo(() =>
    notes.find(n => n.id === selectedNoteId) || null,
  [notes, selectedNoteId])

  const filteredNotes = useMemo(() => {
    let list = notes
    if (selectedNotebookId) {
      list = getNotebookNotes(list, selectedNotebookId)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(n =>
        n.title.toLowerCase().includes(q) ||
        (n.plain_text || '').toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }, [notes, selectedNotebookId, searchQuery])

  const rootNotebooks = useMemo(() => getNotebookTree(notebooks), [notebooks])

  const createNote = useCallback(async (notebookId?: string | null, isDaily = false) => {
    const title = isDaily ? format(new Date(), 'yyyy-MM-dd') : 'Untitled Note'
    const payload: any = {
      user_id: userId,
      title,
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
      plain_text: '',
      notebook_id: notebookId || selectedNotebookId || null,
      is_daily_note: isDaily,
      daily_note_date: isDaily ? format(new Date(), 'yyyy-MM-dd') : null,
    }
    const { data, error } = await supabase.from('upnote_notes').insert(payload).select().single()
    if (!error && data) {
      setNotes(prev => [data, ...prev])
      setSelectedNoteId(data.id)
      toast(isDaily ? 'Daily note created' : 'New note created', 'success')
    } else {
      toast('Failed to create note', 'error')
    }
  }, [userId, selectedNotebookId, supabase, toast])

  const updateNote = useCallback(async (noteId: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, ...updates } : n))
    const { error } = await supabase.from('upnote_notes').update(updates).eq('id', noteId)
    if (error) toast('Failed to save', 'error')
    else setLastSaved(new Date())
  }, [supabase, toast])

  const saveNoteContent = useCallback((noteId: string, content: any, plainText: string, wordCount: number) => {
    setIsSaving(true)
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current)
    saveDebounceRef.current = setTimeout(async () => {
      await updateNote(noteId, { content, plain_text: plainText, word_count: wordCount })
      setIsSaving(false)
    }, 600)
  }, [updateNote])

  const deleteNote = useCallback(async (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    await supabase.from('upnote_trash').insert({
      user_id: userId, note_id: note.id, title: note.title,
      content: note.content, notebook_id: note.notebook_id,
    })
    await supabase.from('upnote_notes').delete().eq('id', noteId)
    setNotes(prev => prev.filter(n => n.id !== noteId))
    if (selectedNoteId === noteId) setSelectedNoteId(null)
    toast('Note moved to trash', 'success')
  }, [notes, selectedNoteId, userId, supabase, toast])

  const togglePin = useCallback(async (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    await updateNote(noteId, { is_pinned: !note.is_pinned })
  }, [notes, updateNote])

  const createNotebook = useCallback(async () => {
    if (!newNotebookName.trim()) return
    const { data, error } = await supabase.from('upnote_notebooks').insert({
      user_id: userId, name: newNotebookName.trim(),
      parent_id: selectedNotebookId,
    }).select().single()
    if (!error && data) {
      setNotebooks(prev => [...prev, data])
      setNewNotebookName('')
      setIsCreatingNotebook(false)
      if (selectedNotebookId) setExpandedNotebooks(prev => new Set(prev).add(selectedNotebookId))
      toast('Notebook created', 'success')
    } else toast('Failed to create notebook', 'error')
  }, [newNotebookName, selectedNotebookId, userId, supabase, toast])

  const toggleExpand = useCallback((id: string) => {
    setExpandedNotebooks(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'k') { e.preventDefault(); searchRef.current?.focus() }
        if (e.key === 'n') { e.preventDefault(); createNote() }
        if (e.key === 'd') { e.preventDefault(); createNote(null, true) }
        if (e.key === '/') { e.preventDefault(); setRightPanelOpen(p => !p) }
        if (e.key === 'b') { e.preventDefault(); setSidebarOpen(p => !p) }
      }
      if (e.key === 'Escape') {
        if (rightPanelOpen) setRightPanelOpen(false)
        else if (selectedNoteId) setSelectedNoteId(null)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [createNote, rightPanelOpen, selectedNoteId])

  return (
    <div className="flex h-full">
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="shrink-0 border-r bg-card/30 flex flex-col overflow-hidden"
          >
            <div className="p-3 border-b space-y-2">
              <div className="flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft size={12} />
                  Dashboard
                </Link>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSidebarOpen(false)}>
                  <Layout size={12} />
                </Button>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" className="flex-1 h-7 text-xs gap-1" onClick={() => createNote()}>
                  <Plus size={12} /> Note
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 px-2" onClick={() => createNote(null, true)}>
                  <Sun size={12} />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              <div className="px-3 pb-1 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Notebooks</span>
                <button onClick={() => setIsCreatingNotebook(true)} className="text-muted-foreground hover:text-foreground p-0.5 rounded hover:bg-secondary transition-colors">
                  <Plus size={12} />
                </button>
              </div>

              {isCreatingNotebook && (
                <div className="px-3 py-1.5 flex gap-1.5">
                  <Input
                    autoFocus
                    placeholder="Notebook name"
                    value={newNotebookName}
                    onChange={e => setNewNotebookName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') createNotebook(); if (e.key === 'Escape') setIsCreatingNotebook(false) }}
                    className="h-7 text-xs"
                  />
                  <Button size="sm" className="h-7 px-2 text-xs" onClick={createNotebook}>Add</Button>
                </div>
              )}

              <div className="px-1">
                <button
                  onClick={() => { setSelectedNotebookId(null); setSelectedNoteId(null) }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    selectedNotebookId === null && !selectedNoteId ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  <FileText size={14} />
                  All Notes
                  <span className="ml-auto text-muted-foreground/60">{notes.filter(n => !n.is_archived).length}</span>
                </button>

                {rootNotebooks.map(nb => (
                  <NotebookTreeItem
                    key={nb.id}
                    notebook={nb}
                    notebooks={notebooks}
                    notes={notes}
                    selectedNotebookId={selectedNotebookId}
                    selectedNoteId={selectedNoteId}
                    expanded={expandedNotebooks}
                    onToggleExpand={toggleExpand}
                    onSelectNotebook={setSelectedNotebookId}
                    onSelectNote={setSelectedNoteId}
                    level={0}
                  />
                ))}
              </div>

              {tags.length > 0 && (
                <div className="mt-4 px-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tags</span>
                  <div className="mt-1 space-y-0.5">
                    {tags.filter(t => !t.parent_id).map(tag => (
                      <button
                        key={tag.id}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                      >
                        <div className="w-2 h-2 rounded-full" style={{ background: tag.color }} />
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col min-w-0 bg-background">
        {!selectedNote ? (
          <NoteListView
            notes={filteredNotes}
            onSelectNote={setSelectedNoteId}
            onDeleteNote={deleteNote}
            onTogglePin={togglePin}
            onCreateNote={() => createNote(selectedNotebookId)}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(p => !p)}
            title={selectedNotebookId ? notebooks.find(n => n.id === selectedNotebookId)?.name || 'Notebook' : searchQuery ? `Search: "${searchQuery}"` : 'All Notes'}
          />
        ) : (
          <NoteEditor
            note={selectedNote}
            notebooks={notebooks}
            tags={tags}
            onUpdateTitle={(title) => updateNote(selectedNote.id, { title })}
            onUpdateContent={(content, wordCount, plainText) => saveNoteContent(selectedNote.id, content, plainText, wordCount)}
            onClose={() => setSelectedNoteId(null)}
            onDelete={() => deleteNote(selectedNote.id)}
            onTogglePin={() => togglePin(selectedNote.id)}
            isSaving={isSaving}
            lastSaved={lastSaved}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(p => !p)}
            rightPanelOpen={rightPanelOpen}
            onToggleRightPanel={() => setRightPanelOpen(p => !p)}
          />
        )}
      </main>

      <AnimatePresence>
        {rightPanelOpen && selectedNote && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="shrink-0 border-l bg-card/30 overflow-hidden flex flex-col"
          >
            <div className="p-3 border-b flex items-center justify-between">
              <span className="text-xs font-semibold">Info</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setRightPanelOpen(false)}>
                <X size={12} />
              </Button>
            </div>
            <div className="p-4 space-y-4 text-xs">
              <div>
                <div className="text-muted-foreground mb-1">Created</div>
                <div>{format(new Date(selectedNote.created_at), 'MMM d, yyyy h:mm a')}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Updated</div>
                <div>{format(new Date(selectedNote.updated_at), 'MMM d, yyyy h:mm a')}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Words</div>
                <div>{selectedNote.word_count}</div>
              </div>
              {selectedNote.notebook_id && (
                <div>
                  <div className="text-muted-foreground mb-1">Notebook</div>
                  <div>{notebooks.find(n => n.id === selectedNote.notebook_id)?.name || 'Unknown'}</div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NotebookTreeItem({
  notebook, notebooks, notes, selectedNotebookId, selectedNoteId,
  expanded, onToggleExpand, onSelectNotebook, onSelectNote, level
}: {
  notebook: Notebook
  notebooks: Notebook[]
  notes: Note[]
  selectedNotebookId: string | null
  selectedNoteId: string | null
  expanded: Set<string>
  onToggleExpand: (id: string) => void
  onSelectNotebook: (id: string | null) => void
  onSelectNote: (id: string | null) => void
  level: number
}) {
  const children = getNotebookTree(notebooks, notebook.id)
  const isExpanded = expanded.has(notebook.id)
  const noteCount = getNotebookNotes(notes, notebook.id).length
  const isActive = selectedNotebookId === notebook.id && !selectedNoteId

  return (
    <div>
      <button
        onClick={() => { onSelectNotebook(notebook.id); onSelectNote(null) }}
        className={`w-full flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
          isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
        }`}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        {children.length > 0 ? (
          <button
            onClick={e => { e.stopPropagation(); onToggleExpand(notebook.id) }}
            className="p-0.5 rounded hover:bg-secondary transition-colors"
          >
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <Folder size={14} style={{ color: notebook.color }} />
        <span className="truncate">{notebook.name}</span>
        <span className="ml-auto text-muted-foreground/60">{noteCount}</span>
      </button>

      <AnimatePresence>
        {isExpanded && children.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {children.map(child => (
              <NotebookTreeItem
                key={child.id}
                notebook={child}
                notebooks={notebooks}
                notes={notes}
                selectedNotebookId={selectedNotebookId}
                selectedNoteId={selectedNoteId}
                expanded={expanded}
                onToggleExpand={onToggleExpand}
                onSelectNotebook={onSelectNotebook}
                onSelectNote={onSelectNote}
                level={level + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NoteListView({
  notes, onSelectNote, onDeleteNote, onTogglePin, onCreateNote,
  sidebarOpen, onToggleSidebar, title
}: {
  notes: Note[]
  onSelectNote: (id: string) => void
  onDeleteNote: (id: string) => void
  onTogglePin: (id: string) => void
  onCreateNote: () => void
  sidebarOpen: boolean
  onToggleSidebar: () => void
  title: string
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="h-12 border-b flex items-center px-4 gap-3 shrink-0">
        {!sidebarOpen && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleSidebar}>
            <Layout size={14} />
          </Button>
        )}
        <h2 className="font-semibold text-sm">{title}</h2>
        <div className="flex-1" />
        <Button size="sm" className="h-7 text-xs gap-1" onClick={onCreateNote}>
          <Plus size={12} /> New Note
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <FileText size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-medium text-foreground">No notes yet</p>
            <p className="text-xs mt-1">Press ⌘N to start writing.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notes.map(note => (
              <button
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className="w-full text-left p-3 rounded-xl border border-transparent hover:border-border hover:bg-card transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {note.is_pinned && <Pin size={10} className="text-primary shrink-0" />}
                      <span className="text-sm font-medium truncate">{note.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{note.plain_text || 'No content'}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground/60">
                      <span>{format(new Date(note.updated_at), 'MMM d')}</span>
                      {note.word_count > 0 && <span>{note.word_count} words</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); onTogglePin(note.id) }}>
                      <Pin size={12} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={e => { e.stopPropagation(); onDeleteNote(note.id) }}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function NoteEditor({
  note, notebooks, tags, onUpdateTitle, onUpdateContent, onClose,
  onDelete, onTogglePin, isSaving, lastSaved, sidebarOpen, onToggleSidebar,
  rightPanelOpen, onToggleRightPanel
}: {
  note: Note
  notebooks: Notebook[]
  tags: Tag[]
  onUpdateTitle: (title: string) => void
  onUpdateContent: (content: any, wordCount: number, plainText: string) => void
  onClose: () => void
  onDelete: () => void
  onTogglePin: () => void
  isSaving: boolean
  lastSaved: Date | null
  sidebarOpen: boolean
  onToggleSidebar: () => void
  rightPanelOpen: boolean
  onToggleRightPanel: () => void
}) {
  const [title, setTitle] = useState(note.title)
  const titleDebounce = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setTitle(note.title)
  }, [note.id, note.title])

  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (titleDebounce.current) clearTimeout(titleDebounce.current)
    titleDebounce.current = setTimeout(() => {
      onUpdateTitle(val)
    }, 400)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="h-12 border-b flex items-center px-4 gap-2 shrink-0">
        {!sidebarOpen && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleSidebar}>
            <Layout size={14} />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <ArrowLeft size={14} />
        </Button>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          {isSaving ? (
            <span className="text-[10px] text-muted-foreground">Saving...</span>
          ) : lastSaved ? (
            <span className="text-[10px] text-muted-foreground">Saved {format(lastSaved, 'h:mm a')}</span>
          ) : null}
          <Button variant="ghost" size="icon" className={`h-7 w-7 ${note.is_pinned ? 'text-primary' : ''}`} onClick={onTogglePin}>
            <Pin size={14} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleRightPanel}>
            <Settings size={14} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-8">
          <input
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="Note title"
            className="w-full text-3xl font-bold bg-transparent outline-none placeholder:text-muted-foreground/40 mb-4"
          />

          <TiptapEditor
            content={note.content}
            onUpdate={onUpdateContent}
            editable={true}
          />
        </div>
      </div>

      <div className="h-8 border-t flex items-center px-4 text-[10px] text-muted-foreground gap-3 shrink-0">
        <span>{note.word_count} words</span>
        {note.notebook_id && (
          <span className="flex items-center gap-1">
            <Folder size={10} />
            {notebooks.find(n => n.id === note.notebook_id)?.name}
          </span>
        )}
        <span className="ml-auto">⌘N new · ⌘/ info · Esc back</span>
      </div>
    </div>
  )
}
