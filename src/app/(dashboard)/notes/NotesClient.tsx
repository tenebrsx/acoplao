'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Pin, Trash2, FileText, ArrowUpRight,
  Clock, X, MoreHorizontal
} from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/components/ToastProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { TiptapEditor } from '@/components/TiptapEditor'

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
  created_at: string
  updated_at: string
}

export function NotesClient({ initialNotes, userId }: { initialNotes: Note[]; userId: string }) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const saveDebounceRef = useRef<NodeJS.Timeout | null>(null)

  const { toast } = useToast()
  const supabase = createClient()

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes
    const q = searchQuery.toLowerCase()
    return notes.filter(n =>
      n.title.toLowerCase().includes(q) ||
      (n.plain_text || '').toLowerCase().includes(q)
    )
  }, [notes, searchQuery])

  const selectedNote = useMemo(() =>
    notes.find(n => n.id === selectedNoteId) || null,
  [notes, selectedNoteId])

  // Hydration safe localStorage sort ordering
  useEffect(() => {
    const savedOrder = localStorage.getItem(`notes_sort_order_${userId}`)
    if (savedOrder) {
      try {
        const orderedIds = JSON.parse(savedOrder) as string[]
        const orderedNotes: Note[] = []
        const remainingNotes = [...initialNotes]
        
        orderedIds.forEach(id => {
          const idx = remainingNotes.findIndex(n => n.id === id)
          if (idx !== -1) {
            orderedNotes.push(remainingNotes.splice(idx, 1)[0])
          }
        })
        
        setNotes([...orderedNotes, ...remainingNotes])
      } catch (e) {
        console.error('Error parsing notes sort order:', e)
      }
    }
  }, [initialNotes, userId])

  // Sync custom drag-sort changes back to localStorage
  useEffect(() => {
    if (notes.length > 0) {
      const ids = notes.map(n => n.id)
      localStorage.setItem(`notes_sort_order_${userId}`, JSON.stringify(ids))
    }
  }, [notes, userId])

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggingId || draggingId === targetId) return

    const activeIndex = notes.findIndex(n => n.id === draggingId)
    const overIndex = notes.findIndex(n => n.id === targetId)
    
    if (activeIndex !== -1 && overIndex !== -1) {
      const updatedNotes = [...notes]
      const [removed] = updatedNotes.splice(activeIndex, 1)
      updatedNotes.splice(overIndex, 0, removed)
      setNotes(updatedNotes)
    }
  }

  const handleDragEnd = () => {
    setDraggingId(null)
  }

  const pinnedNotes = useMemo(() => filteredNotes.filter(n => n.is_pinned), [filteredNotes])
  const recentNotes = useMemo(() => filteredNotes.filter(n => !n.is_pinned), [filteredNotes])

  const createNote = useCallback(async () => {
    if (!newNoteTitle.trim()) return
    const { data, error } = await supabase.from('upnote_notes').insert({
      user_id: userId,
      title: newNoteTitle.trim(),
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
      plain_text: '',
    }).select().single()
    if (!error && data) {
      setNotes(prev => [data, ...prev])
      setSelectedNoteId(data.id)
      setIsCreating(false)
      setNewNoteTitle('')
      toast('Note created', 'success')
    } else toast('Failed to create note', 'error')
  }, [newNoteTitle, userId, supabase, toast])

  const updateNote = useCallback(async (noteId: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, ...updates } : n))
    const { error } = await supabase.from('upnote_notes').update(updates).eq('id', noteId)
    if (error) toast('Failed to save', 'error')
  }, [supabase, toast])

  const saveContent = useCallback((noteId: string, content: any, wordCount: number, plainText: string) => {
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current)
    saveDebounceRef.current = setTimeout(() => {
      updateNote(noteId, { content, plain_text: plainText, word_count: wordCount })
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
          <p className="text-sm text-muted-foreground mt-1">Quick notes and thoughts. For full knowledge management, use <Link href="/upnotes" className="text-primary hover:underline">UpNotes</Link>.</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setIsCreating(true)}>
          <Plus size={14} /> New Note
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {isCreating && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 max-w-md">
          <Input
            autoFocus
            placeholder="Note title"
            value={newNoteTitle}
            onChange={e => setNewNoteTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') createNote(); if (e.key === 'Escape') { setIsCreating(false); setNewNoteTitle('') } }}
            className="h-9 text-sm"
          />
          <Button size="sm" onClick={createNote}>Create</Button>
          <Button size="sm" variant="ghost" onClick={() => { setIsCreating(false); setNewNoteTitle('') }}>Cancel</Button>
        </motion.div>
      )}

      <div className="space-y-8">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground bg-secondary/20 rounded-3xl border border-dashed border-white/10">
            <FileText size={48} className="mb-5 opacity-20" />
            <p className="text-xl font-bold text-foreground">No notes yet</p>
            <p className="text-sm mt-1.5 opacity-70">Capture your first quick thought to get started.</p>
          </div>
        ) : (
          <>
            {pinnedNotes.length > 0 && (
              <div>
                <h2 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-4 pl-1">Pinned Notes</h2>
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                  {pinnedNotes.map(note => (
                    <button
                      key={note.id}
                      onClick={() => setSelectedNoteId(note.id)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, note.id)}
                      onDragOver={(e) => handleDragOver(e, note.id)}
                      onDragEnd={handleDragEnd}
                      className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 group break-inside-avoid shadow-sm flex flex-col cursor-grab active:cursor-grabbing ${
                        draggingId === note.id
                          ? 'opacity-20 border-dashed border-primary scale-95'
                          : 'border-white/5 bg-card hover:bg-white/[0.02] hover:border-primary/20 hover:scale-[1.02]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2 w-full">
                        <h3 className="font-semibold text-sm text-foreground/90 line-clamp-1">{note.title || 'Untitled Note'}</h3>
                        <Pin size={12} className="text-primary shrink-0 mt-0.5" />
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-4 mb-5 leading-relaxed">
                        {note.plain_text || <span className="italic opacity-30">No content...</span>}
                      </p>
                      <div className="flex items-center justify-between w-full mt-auto pt-3 border-t border-white/[0.04]">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 font-medium">
                          <Clock size={10} />
                          {format(new Date(note.updated_at), 'MMM d, yyyy')}
                        </div>
                        {note.word_count > 0 && (
                          <span className="text-[9px] uppercase tracking-wider bg-secondary/50 px-2 py-0.5 rounded-full text-muted-foreground/70 font-bold">
                            {note.word_count} words
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {recentNotes.length > 0 && (
              <div>
                {pinnedNotes.length > 0 && <h2 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-4 pl-1 mt-6">Recent Notes</h2>}
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                  {recentNotes.map(note => (
                    <button
                      key={note.id}
                      onClick={() => setSelectedNoteId(note.id)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, note.id)}
                      onDragOver={(e) => handleDragOver(e, note.id)}
                      onDragEnd={handleDragEnd}
                      className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 group break-inside-avoid shadow-sm flex flex-col cursor-grab active:cursor-grabbing ${
                        draggingId === note.id
                          ? 'opacity-20 border-dashed border-primary scale-95'
                          : 'border-white/5 bg-card hover:bg-white/[0.02] hover:border-primary/20 hover:scale-[1.02]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2 w-full">
                        <h3 className="font-semibold text-sm text-foreground/90 line-clamp-1">{note.title || 'Untitled Note'}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-4 mb-5 leading-relaxed">
                        {note.plain_text || <span className="italic opacity-30">No content...</span>}
                      </p>
                      <div className="flex items-center justify-between w-full mt-auto pt-3 border-t border-white/[0.04]">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 font-medium">
                          <Clock size={10} />
                          {format(new Date(note.updated_at), 'MMM d, yyyy')}
                        </div>
                        {note.word_count > 0 && (
                          <span className="text-[9px] uppercase tracking-wider bg-secondary/50 px-2 py-0.5 rounded-full text-muted-foreground/70 font-bold">
                            {note.word_count} words
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Distraction-Free Editing Modal */}
      <Dialog open={!!selectedNote} onOpenChange={(open) => !open && setSelectedNoteId(null)}>
        <DialogContent className="sm:max-w-3xl h-[85vh] p-0 gap-0 bg-[#121213]/95 backdrop-blur-2xl border border-white/[0.08] rounded-3xl shadow-2xl flex flex-col overflow-hidden [&>button]:hidden">
          {selectedNote && (
            <div className="flex flex-col h-full w-full relative overflow-y-auto custom-scrollbar">
              {/* Sticky Header Actions */}
              <div className="sticky top-0 z-10 flex items-center justify-end px-6 py-4 gap-2 bg-gradient-to-b from-[#121213] via-[#121213]/90 to-transparent pb-8">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 transition-colors ${selectedNote.is_pinned ? 'text-primary hover:text-primary' : 'text-muted-foreground hover:text-foreground'}`} 
                  onClick={() => togglePin(selectedNote.id)}
                  title={selectedNote.is_pinned ? "Unpin Note" : "Pin Note"}
                >
                  <Pin size={15} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-full bg-white/5 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors" 
                  onClick={() => deleteNote(selectedNote.id)}
                  title="Delete Note"
                >
                  <Trash2 size={15} />
                </Button>
                <div className="w-px h-5 bg-white/10 mx-1"></div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors" 
                  onClick={() => setSelectedNoteId(null)}
                >
                  <X size={15} />
                </Button>
              </div>

              {/* Editor Content Area */}
              <div className="flex-1 px-8 md:px-12 pb-8 pt-0 mt-[-10px]">
                <input
                  value={selectedNote.title}
                  onChange={e => updateNote(selectedNote.id, { title: e.target.value })}
                  className="w-full font-bold bg-transparent outline-none text-4xl mb-6 text-foreground placeholder:text-muted-foreground/30 leading-tight"
                  placeholder="Untitled Note"
                />
                <div className="prose prose-invert prose-p:text-muted-foreground/90 max-w-none prose-headings:text-foreground/90 prose-a:text-primary prose-strong:text-foreground">
                  <TiptapEditor
                    content={selectedNote.content}
                    onUpdate={(content, wordCount, plainText) => saveContent(selectedNote.id, content, wordCount, plainText)}
                    editable={true}
                  />
                </div>
              </div>

              {/* Footer Metadata */}
              <div className="mt-auto sticky bottom-0 px-8 py-4 border-t border-white/[0.04] bg-[#121213]/95 backdrop-blur-xl text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/40 flex items-center justify-between z-10">
                <div className="flex gap-4">
                  <span>{selectedNote.word_count} words</span>
                  <span>Edited {format(new Date(selectedNote.updated_at), 'MMM d, h:mm a')}</span>
                </div>
                <Link href="/upnotes" className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                  Open in UpNotes <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
