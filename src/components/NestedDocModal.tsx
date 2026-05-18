'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog'
import { createClient } from '@/utils/supabase/client'
import { TiptapEditor } from '@/components/TiptapEditor'
import { Maximize2, MoreHorizontal, Link as LinkIcon, Star, Share } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ToastProvider'

interface NestedDocModalProps {
  docId: string
  onClose: () => void
}

export function NestedDocModal({ docId, onClose }: NestedDocModalProps) {
  const [doc, setDoc] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [parentTitle, setParentTitle] = useState('Workspace')
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  const fetchDoc = useCallback(async () => {
    setLoading(true)
    const { data: currentDoc, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', docId)
      .single()

    if (!error && currentDoc) {
      setDoc(currentDoc)
      setTitle(currentDoc.title || '')
      setIsFavorite(currentDoc.tags?.includes('favorite') || false)

      if (currentDoc.parent_id) {
        const { data: parent } = await supabase
          .from('documents')
          .select('title')
          .eq('id', currentDoc.parent_id)
          .single()
        if (parent) setParentTitle(parent.title || 'Untitled')
      }
    }
    setLoading(false)
  }, [docId, supabase])

  useEffect(() => {
    fetchDoc()
  }, [fetchDoc])

  const handleExpand = () => {
    onClose()
    router.push(`/docs/${docId}`)
  }

  const updateDoc = async (updates: any) => {
    await supabase.from('documents').update(updates).eq('id', docId)
    window.dispatchEvent(new CustomEvent('documents-updated'))
  }

  const saveTitle = async (newTitle: string) => {
    if (newTitle === doc?.title) return
    await updateDoc({ title: newTitle })
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    // We could dispatch an event here for real-time sidebar syncing, but onBlur is safer for DB.
  }

  const handleContentUpdate = async (content: any, wordCount: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('documents')
      .update({
        content,
        word_count: wordCount,
        last_edited_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', docId)
  }

  const toggleFavorite = async () => {
    const currentTags = doc?.tags || []
    const newTags = isFavorite 
      ? currentTags.filter((t: string) => t !== 'favorite')
      : [...currentTags, 'favorite']
    
    setIsFavorite(!isFavorite)
    await updateDoc({ tags: newTags })
    toast(isFavorite ? 'Removed from favorites' : 'Added to favorites', 'success')
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogOverlay className="bg-black/60 backdrop-blur-sm z-[100]" />
      <DialogContent className="max-w-[900px] w-[90vw] h-[85vh] p-0 bg-[#191919] border-[rgba(255,255,255,0.05)] shadow-2xl flex flex-col z-[101] overflow-hidden gap-0 rounded-xl">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[rgba(255,255,255,0.05)] bg-[#191919] shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={handleExpand} title="Open in full page">
              <Maximize2 size={14} />
            </Button>
            <div className="flex items-center text-sm text-muted-foreground">
              <span className="opacity-60">Add to</span>
              <span className="mx-1.5 opacity-40">📄</span>
              <span className="font-medium hover:underline cursor-pointer truncate max-w-[150px]">{parentTitle}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2.5 text-muted-foreground hover:text-foreground">
              Share
            </Button>
            <Button variant="ghost" size="icon" className={`h-7 w-7 ${isFavorite ? 'text-yellow-400 hover:text-yellow-300' : 'text-muted-foreground hover:text-foreground'}`} onClick={toggleFavorite}>
              <Star size={14} className={isFavorite ? 'fill-current' : ''} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <MoreHorizontal size={14} />
            </Button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Loading...
            </div>
          ) : (
            <div className="w-full max-w-[720px] mx-auto px-8 py-10">
              
              {/* Title Input */}
              <div className="mb-6">
                <input
                  autoFocus
                  value={title}
                  onChange={handleTitleChange}
                  onBlur={(e) => saveTitle(e.target.value)}
                  placeholder="New page"
                  className="text-[32px] font-bold tracking-tight bg-transparent border-none outline-none w-full placeholder:text-[rgba(247,246,243,0.15)] text-foreground leading-[1.2]"
                />
              </div>

              {/* Tiptap Editor */}
              <div className="max-w-none">
                <TiptapEditor
                  content={doc?.content || { type: 'doc', content: [{ type: 'paragraph' }] }}
                  onUpdate={handleContentUpdate}
                  editable={true}
                />
              </div>

            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
