'use client'

import { useState } from 'react'
import { Plus, Trash2, Pin, PinOff, Search, Archive, Palette, StickyNote } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

type Note = {
  id: string
  title: string | null
  content: string | null
  color: string
  is_pinned: boolean
  is_archived: boolean
  created_at: string
}

const colorMap: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  yellow: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', dot: 'bg-amber-400' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', dot: 'bg-blue-400' },
  green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', dot: 'bg-emerald-400' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-900', dot: 'bg-pink-400' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', dot: 'bg-purple-400' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', dot: 'bg-orange-400' }
}

export function NotesClient({ initialNotes, userId }: { initialNotes: Note[]; userId: string }) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [searchQuery, setSearchQuery] = useState('')
  const [colorFilter, setColorFilter] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newColor, setNewColor] = useState('yellow')
  const supabase = createClient()

  const createNote = async () => {
    const { data: note } = await supabase.from('notes').insert({
      user_id: userId,
      title: newTitle || null,
      content: newContent || null,
      color: newColor
    }).select('*').single()

    if (note) {
      setNotes(prev => [note, ...prev])
      setNewTitle('')
      setNewContent('')
      setShowAdd(false)
    }
  }

  const deleteNote = async (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId))
    await supabase.from('notes').delete().eq('id', noteId)
  }

  const togglePin = async (noteId: string, pinned: boolean) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, is_pinned: !pinned } : n).sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned)))
    await supabase.from('notes').update({ is_pinned: !pinned }).eq('id', noteId)
  }

  const archiveNote = async (noteId: string, archived: boolean) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, is_archived: !archived } : n))
    await supabase.from('notes').update({ is_archived: !archived }).eq('id', noteId)
  }

  let filteredNotes = notes.filter(n => {
    const matchesSearch = (n.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                         (n.content?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
    const matchesColor = !colorFilter || n.color === colorFilter
    const matchesArchive = showArchived ? n.is_archived : !n.is_archived
    return matchesSearch && matchesColor && matchesArchive
  })

  filteredNotes = filteredNotes.sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned))

  const pinnedCount = filteredNotes.filter(n => n.is_pinned).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Notes</h1>
          <p className="text-muted-foreground text-sm">Capture ideas, meeting notes, and quick thoughts.</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button><Plus size={16} className="mr-2" /> New Note</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>New Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input placeholder="Title (optional)" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              <textarea
                placeholder="What's on your mind?"
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                rows={5}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {Object.keys(colorMap).map(c => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        newColor === c ? 'border-foreground scale-110' : 'border-transparent'
                      } ${colorMap[c].dot}`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
                  <Button size="sm" onClick={createNote} disabled={!newTitle.trim() && !newContent.trim()}>Create</Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search notes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setColorFilter(null)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${!colorFilter ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
          >
            All
          </button>
          {Object.keys(colorMap).map(c => (
            <button
              key={c}
              onClick={() => setColorFilter(colorFilter === c ? null : c)}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                colorFilter === c ? 'border-foreground scale-110' : 'border-transparent opacity-60 hover:opacity-100'
              } ${colorMap[c].dot}`}
            />
          ))}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`ml-2 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${showArchived ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
          >
            <Archive size={10} className="inline mr-1" /> Archived
          </button>
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <Card className="p-16 text-center border-dashed">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <StickyNote size={28} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">{searchQuery ? 'No matching notes' : showArchived ? 'No archived notes' : 'No notes yet'}</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            {searchQuery ? 'Try adjusting your search.' : 'Create your first note to capture ideas and thoughts.'}
          </p>
        </Card>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {filteredNotes.map(note => {
            const colors = colorMap[note.color] || colorMap.yellow
            return (
              <div
                key={note.id}
                className={`break-inside-avoid p-4 rounded-xl border transition-all hover:shadow-md ${colors.bg} ${colors.border}`}
              >
                <div className="flex items-start justify-between mb-2">
                  {note.is_pinned ? (
                    <Badge variant="outline" className="text-[10px] h-5">
                      <Pin size={8} className="mr-1" /> Pinned
                    </Badge>
                  ) : <div />}
                  <div className="flex gap-1">
                    <button onClick={() => togglePin(note.id, note.is_pinned)} className="p-1 rounded hover:bg-black/5 text-foreground/60 hover:text-foreground transition-colors">
                      {note.is_pinned ? <PinOff size={13} /> : <Pin size={13} />}
                    </button>
                    <button onClick={() => archiveNote(note.id, note.is_archived)} className="p-1 rounded hover:bg-black/5 text-foreground/60 hover:text-foreground transition-colors">
                      <Archive size={13} />
                    </button>
                    <button onClick={() => deleteNote(note.id)} className="p-1 rounded hover:bg-black/5 text-foreground/60 hover:text-red-600 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {note.title && <h3 className={`font-semibold text-sm mb-1.5 ${colors.text}`}>{note.title}</h3>}
                {note.content && (
                  <p className={`text-sm whitespace-pre-wrap leading-relaxed ${colors.text} opacity-85`}>
                    {note.content}
                  </p>
                )}
                <div className="mt-3 pt-2 border-t border-black/5">
                  <span className="text-[10px] text-foreground/40">
                    {new Date(note.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
