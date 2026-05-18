'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Globe, Lock, Loader2, Copy, Check,
  Image as ImageIcon, ChevronRight, Plus, Trash2,
  CheckCircle2, Users, List, Link as LinkIcon, Star, FileText
} from 'lucide-react'
import { TiptapEditor } from '@/components/TiptapEditor'
import { DocumentTree } from '@/components/DocumentTree'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ToastProvider'
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal'
import { MobileBottomNav } from '@/components/MobileBottomNav'

const documentCache = new Map<string, any>()

export function DocEditorClient({ doc, ancestors = [], allDocuments = [], isPublicView = false }: { doc: any, ancestors?: any[], allDocuments?: any[], isPublicView?: boolean }) {
  const [currentDoc, setCurrentDoc] = useState(doc)
  const [title, setTitle] = useState(doc.title || 'Untitled Document')
  const [saving, setSaving] = useState(false)
  const [isPublic, setIsPublic] = useState(doc.is_public || false)
  const [isFavorite, setIsFavorite] = useState(doc.is_favorite || false)
  const [copied, setCopied] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768
    }
    return true
  })
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const view = searchParams.get('view')
  const { toast } = useToast()
  const titleRef = useRef<HTMLInputElement>(null)

  const [deletedDocs, setDeletedDocs] = useState<any[]>([])
  const [loadingTrash, setLoadingTrash] = useState(false)

  const fetchTrashDocs = useCallback(async () => {
    setLoadingTrash(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase
        .from('documents')
        .select('id, title, icon, tags')
        .order('title', { ascending: true })
      if (!error && data) {
        const trash = data.filter((d: any) => d.tags?.includes('deleted'))
        setDeletedDocs(trash)
      }
    }
    setLoadingTrash(false)
  }, [supabase])

  const restoreDoc = async (id: string) => {
    const target = deletedDocs.find(d => d.id === id)
    setDeletedDocs(prev => prev.filter(d => d.id !== id))
    const newTags = (target?.tags || []).filter((t: string) => t !== 'deleted')
    await supabase.from('documents').update({ tags: newTags }).eq('id', id)
    window.dispatchEvent(new CustomEvent('documents-updated'))
    toast('Document restored', 'success')
  }

  const permanentlyDeleteDoc = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this document? This cannot be undone.')) return
    setDeletedDocs(prev => prev.filter(d => d.id !== id))
    await supabase.from('documents').delete().eq('id', id)
    window.dispatchEvent(new CustomEvent('documents-updated'))
    toast('Document permanently deleted', 'success')
  }

  useEffect(() => {
    if (view === 'trash') {
      fetchTrashDocs()
    }
  }, [view, fetchTrashDocs])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Dynamic ancestors calculation based on preloaded allDocuments tree
  const dynamicAncestors = useMemo(() => {
    const list: any[] = []
    let curr = allDocuments.find(d => d.id === currentDoc.id)
    while (curr && curr.parent_id) {
      const parent = allDocuments.find(d => d.id === curr.parent_id)
      if (parent) {
        list.push(parent)
        curr = parent
      } else {
        break
      }
    }
    return list.reverse()
  }, [currentDoc.id, allDocuments])

  // Cache initial doc
  useEffect(() => {
    if (doc) {
      documentCache.set(doc.id, doc)
    }
  }, [doc])

  // Sync prop changes (e.g. from direct URL changes)
  useEffect(() => {
    setCurrentDoc(doc)
    setTitle(doc.title || 'Untitled Document')
    setIsPublic(doc.is_public || false)
    setIsFavorite(doc.tags?.includes('favorite') || false)
  }, [doc])

  // Preload all other documents in the background for 0ms transitions
  useEffect(() => {
    const prefetchDocs = async () => {
      const nonCached = allDocuments.filter(d => !documentCache.has(d.id))
      if (nonCached.length === 0) return

      const ids = nonCached.map(d => d.id)
      
      // Batch prefetch full content
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .in('id', ids)

      if (!error && data) {
        data.forEach(d => {
          documentCache.set(d.id, d)
        })
      }
    }

    if (allDocuments.length > 0) {
      prefetchDocs()
    }
  }, [allDocuments, supabase])

  // Intercept sidebar link navigation to load cached documents instantly
  useEffect(() => {
    const handleNavigation = async (e: Event) => {
      const { id } = (e as CustomEvent).detail
      if (!id) return

      // Update URL immediately without a full page reload/hydration flicker
      window.history.pushState(null, '', `/docs/${id}`)

      let targetDoc = documentCache.get(id)
      if (!targetDoc) {
        // Fallback dynamic query if not fully prefetched yet
        const { data } = await supabase
          .from('documents')
          .select('*')
          .eq('id', id)
          .single()
        if (data) {
          targetDoc = data
          documentCache.set(id, data)
        }
      }

      if (targetDoc) {
        setCurrentDoc(targetDoc)
        setTitle(targetDoc.title || 'Untitled Document')
        setIsPublic(targetDoc.is_public || false)
        setIsFavorite(targetDoc.tags?.includes('favorite') || false)
      }
    }

    window.addEventListener('navigate-to-doc', handleNavigation)
    return () => window.removeEventListener('navigate-to-doc', handleNavigation)
  }, [supabase])

  // Task integration
  const [realTasks, setRealTasks] = useState<any[]>([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  useEffect(() => {
    if (view === 'tasks') {
      const fetchTasks = async () => {
        setLoadingTasks(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
          if (!error && data) {
            setRealTasks(data)
          }
        }
        setLoadingTasks(false)
      }
      fetchTasks()
    }
  }, [view, supabase])

  const toggleRealTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done'
    setRealTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    await supabase.from('tasks').update({
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null
    }).eq('id', taskId)
    toast('Task status updated', 'success')
  }

  const createRealTask = async () => {
    if (!newTaskTitle.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data, error } = await supabase.from('tasks').insert({
      user_id: user.id,
      title: newTaskTitle.trim(),
      priority: 'medium',
      status: 'todo'
    }).select('*').single()

    if (!error && data) {
      setRealTasks(prev => [data, ...prev])
      setNewTaskTitle('')
      toast('Task created', 'success')
    } else {
      toast('Failed to create task', 'error')
    }
  }

  const deleteRealTask = async (taskId: string) => {
    setRealTasks(prev => prev.filter(t => t.id !== taskId))
    await supabase.from('tasks').delete().eq('id', taskId)
    toast('Task deleted', 'success')
  }

  const updateDoc = useCallback(async (updates: any) => {
    if (isPublicView) return
    await supabase.from('documents').update(updates).eq('id', currentDoc.id)
  }, [currentDoc.id, isPublicView, supabase])

  const saveTitle = async (newTitle: string) => {
    if (newTitle === currentDoc.title || isPublicView) return
    await updateDoc({ title: newTitle })
  }

  const handleContentUpdate = async (content: any, wordCount: number, _plainText: string) => {
    if (isPublicView) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('documents')
      .update({
        content,
        word_count: wordCount,
        last_edited_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentDoc.id)
    setSaving(false)
  }

  const togglePublic = async () => {
    if (isPublicView) return
    const newVal = !isPublic
    setIsPublic(newVal)
    await updateDoc({ is_public: newVal })
  }

  const toggleFavorite = async () => {
    if (isPublicView) return
    const newVal = !isFavorite
    setIsFavorite(newVal)
    await updateDoc({ is_favorite: newVal })
  }

  const copyShareLink = () => {
    const url = `${window.location.origin}/shared-docs/shared/${currentDoc.share_token}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }





  const createSubPage = async () => {
    const { data, error } = await supabase.from('documents').insert({
      title: 'Untitled Document',
      parent_id: currentDoc.id,
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
      created_by: currentDoc.created_by,
    }).select().single()
    if (!error && data) {
      router.push(`/docs/${data.id}`)
      toast('Sub-page created', 'success')
    } else toast('Failed to create sub-page', 'error')
  }

  const deleteDoc = async () => {
    const currentTags = currentDoc.tags || []
    const newTags = currentTags.includes('deleted') ? currentTags : [...currentTags, 'deleted']
    await supabase.from('documents').update({ tags: newTags }).eq('id', currentDoc.id)
    window.dispatchEvent(new CustomEvent('documents-updated'))
    router.push('/docs')
    toast('Document moved to Trash', 'success')
  }

  return (
    <div className="flex h-full w-full bg-[#1a1a18] absolute inset-0 z-50">
      {sidebarOpen && !isPublicView && (
        <aside className="w-[240px] shrink-0 border-r border-[rgba(55,53,47,0.09)] bg-[#232320] overflow-hidden flex flex-col transition-all duration-300 relative z-20">
          <DocumentTree
            documents={allDocuments}
            currentDocId={currentDoc.id}
          />
        </aside>
      )}

      <main className="flex-1 overflow-y-auto relative flex flex-col group/main custom-scrollbar">
        {/* Top Navbar */}
        <div className="sticky top-0 z-10 w-full bg-[#1a1a18]/80 backdrop-blur-md flex items-center h-11 border-b border-[rgba(255,255,255,0.02)] shrink-0">
          {!sidebarOpen && !isPublicView && (
            <Button variant="ghost" size="icon" className="absolute left-3 h-7 w-7 text-muted-foreground hover:text-foreground z-20" onClick={() => setSidebarOpen(true)}>
              <ChevronRight size={18} />
            </Button>
          )}

          <div className="w-full max-w-[780px] mx-auto px-12 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isPublicView && dynamicAncestors.length > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  {dynamicAncestors.length > 3 && (
                    <>
                      <Link href={`/docs/${dynamicAncestors[0].id}`} className="hover:bg-[rgba(247,246,243,0.06)] px-1.5 py-0.5 rounded transition-colors truncate max-w-[120px]">{dynamicAncestors[0].title || 'Untitled'}</Link>
                      <span className="text-[rgba(55,53,47,0.2)]">/</span>
                      <span className="px-1 text-muted-foreground/40">...</span>
                      <span className="text-[rgba(55,53,47,0.2)]">/</span>
                      <Link href={`/docs/${dynamicAncestors[dynamicAncestors.length - 1].id}`} className="hover:bg-[rgba(247,246,243,0.06)] px-1.5 py-0.5 rounded transition-colors truncate max-w-[120px]">{dynamicAncestors[dynamicAncestors.length - 1].title || 'Untitled'}</Link>
                      <span className="text-[rgba(55,53,47,0.2)]">/</span>
                    </>
                  )}
                  {dynamicAncestors.length <= 3 && dynamicAncestors.map((a: any) => (
                    <span key={a.id} className="flex items-center gap-1">
                      <Link href={`/docs/${a.id}`} className="hover:bg-[rgba(247,246,243,0.06)] px-1.5 py-0.5 rounded transition-colors truncate max-w-[120px]">{a.title || 'Untitled'}</Link>
                      <span className="text-[rgba(55,53,47,0.2)]">/</span>
                    </span>
                  ))}
                  <span className="text-foreground truncate max-w-[120px] px-1.5 py-0.5 font-medium">{title || 'Untitled'}</span>
                </div>
              )}
              {!isPublicView && dynamicAncestors.length === 0 && (
                <span className="text-sm font-medium text-foreground">{title || 'Untitled'}</span>
              )}
            </div>

            {!isPublicView && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground/50 mr-2 transition-opacity duration-300">
                  {saving ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/50 animate-pulse" />
                      Saving
                    </span>
                  ) : (
                    <span className="opacity-0 hover:opacity-100">Saved</span>
                  )}
                </span>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-[rgba(247,246,243,0.06)]" onClick={toggleFavorite}>
                  <Star size={16} className={isFavorite ? 'fill-yellow-500 text-yellow-500' : ''} />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-[rgba(247,246,243,0.06)]" onClick={togglePublic}>
                  {isPublic ? 'Shared' : 'Share'}
                </Button>
                {isPublic && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-[rgba(247,246,243,0.06)]" onClick={copyShareLink}>
                    {copied ? 'Copied' : 'Copy link'}
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-[rgba(247,246,243,0.06)]" onClick={createSubPage}>
                  <Plus size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-400 hover:bg-[rgba(247,246,243,0.06)]" onClick={deleteDoc}>
                  <Trash2 size={14} />
                </Button>
              </div>
            )}
          </div>
        </div>
        {/* Dynamic Views Manager */}
        {view === 'home' && (
          <div className="flex-1 p-16 max-w-[900px] w-full mx-auto fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-8">Good evening, Aura.</h1>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-[rgba(247,246,243,0.02)] border border-[rgba(55,53,47,0.09)] rounded-xl hover:bg-[rgba(247,246,243,0.04)] transition-colors cursor-pointer group">
                 <div className="text-2xl mb-3">📄</div>
                 <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Recently edited</h3>
                 <p className="text-sm text-muted-foreground mt-1">Jump back into your latest documents.</p>
              </div>
              <div className="p-6 bg-[rgba(247,246,243,0.02)] border border-[rgba(55,53,47,0.09)] rounded-xl hover:bg-[rgba(247,246,243,0.04)] transition-colors cursor-pointer group">
                 <div className="text-2xl mb-3">⭐️</div>
                 <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Favorites</h3>
                 <p className="text-sm text-muted-foreground mt-1">Quick access to your pinned pages.</p>
              </div>
            </div>
          </div>
        )}

        {view === 'inbox' && (
          <div className="flex-1 p-16 max-w-[700px] w-full mx-auto fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-8">Inbox</h1>
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-[rgba(247,246,243,0.05)] flex items-center justify-center mb-4">
                 <CheckCircle2 size={32} className="text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-medium text-foreground">You're all caught up.</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">When you are mentioned in a document or receive a reply, it will show up here.</p>
            </div>
          </div>
        )}

        {view === 'tasks' && (
          <div className="flex-1 p-16 max-w-[1000px] w-full mx-auto fade-in">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-foreground">My Tasks</h1>
              <span className="text-xs text-muted-foreground/60">Connected to Aura OS</span>
            </div>
            
            <div className="border border-[rgba(55,53,47,0.09)] rounded-xl overflow-hidden bg-[rgba(247,246,243,0.01)] backdrop-blur-md">
               <div className="grid grid-cols-[1fr_120px_120px_40px] bg-[rgba(247,246,243,0.02)] border-b border-[rgba(55,53,47,0.09)] px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <div>Task Name</div>
                  <div>Status</div>
                  <div>Due Date</div>
                  <div></div>
               </div>
               
               {loadingTasks ? (
                 <div className="p-8 text-center text-sm text-muted-foreground">
                   Loading tasks...
                 </div>
               ) : realTasks.length === 0 ? (
                 <div className="p-8 text-center text-sm text-muted-foreground">
                   No tasks found. Create one below!
                 </div>
               ) : (
                 realTasks.map(task => (
                   <div key={task.id} className="grid grid-cols-[1fr_120px_120px_40px] px-4 py-3 flex items-center justify-between hover:bg-[rgba(247,246,243,0.02)] transition-colors border-b border-[rgba(55,53,47,0.09)] group/task">
                      <div className="flex items-center gap-3">
                         <button 
                           onClick={() => toggleRealTask(task.id, task.status)}
                           className="w-4 h-4 rounded border border-[rgba(55,53,47,0.3)] flex items-center justify-center hover:border-primary transition-colors shrink-0"
                         >
                           {task.status === 'done' && (
                             <span className="w-2.5 h-2.5 bg-primary rounded-sm" />
                           )}
                         </button>
                         <span className={`text-sm text-foreground truncate ${task.status === 'done' ? 'line-through opacity-40' : ''}`}>
                           {task.title}
                         </span>
                      </div>
                      <div className="flex items-center">
                         <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                           task.status === 'done' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                           task.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                           'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                         }`}>
                           {task.status === 'done' ? 'Completed' : task.status === 'in_progress' ? 'In Progress' : 'To Do'}
                         </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                         {task.due_date ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No due date'}
                      </div>
                      <div className="flex items-center justify-end">
                         <button 
                           onClick={() => deleteRealTask(task.id)}
                           className="opacity-0 group-hover/task:opacity-100 p-1 text-muted-foreground hover:text-red-400 transition-opacity"
                         >
                           <Trash2 size={13} />
                         </button>
                      </div>
                   </div>
                 ))
               )}

               {/* Inline Task Creator Row */}
               <div className="grid grid-cols-[1fr_120px_120px_40px] px-4 py-2.5 items-center bg-[rgba(247,246,243,0.015)] border-t border-[rgba(55,53,47,0.05)]">
                  <div className="flex items-center gap-3">
                     <span className="text-muted-foreground/60 text-sm font-semibold pl-1">+</span>
                     <input 
                       type="text" 
                       placeholder="Press Enter to add task..."
                       value={newTaskTitle}
                       onChange={e => setNewTaskTitle(e.target.value)}
                       onKeyDown={e => {
                         if (e.key === 'Enter') createRealTask()
                       }}
                       className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/30 py-0.5"
                     />
                  </div>
                  <div className="text-xs text-muted-foreground/30 font-medium">To Do</div>
                  <div className="text-xs text-muted-foreground/30 font-medium">Today</div>
                  <div></div>
               </div>
            </div>
          </div>
        )}

        {view === 'trash' && (
          <div className="flex-1 p-16 max-w-[700px] w-full mx-auto fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-8">Trash</h1>
            {loadingTrash ? (
              <div className="text-center py-20 text-muted-foreground/60">Loading trash...</div>
            ) : deletedDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-400">
                   <Trash2 size={32} className="opacity-80" />
                </div>
                <h3 className="text-lg font-medium text-foreground">No deleted pages.</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">When you delete a page, it will stay here. You can restore it or permanently delete it.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {deletedDocs.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-[rgba(247,246,243,0.04)] bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.icon ? (
                        <span className="text-lg shrink-0">{item.icon}</span>
                      ) : (
                        <FileText size={16} className="opacity-40 shrink-0 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium text-foreground truncate">{item.title || 'Untitled'}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => restoreDoc(item.id)}
                        className="h-8 text-xs text-primary hover:text-primary hover:bg-primary/10"
                      >
                        Restore
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => permanentlyDeleteDoc(item.id)}
                        className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        Delete Permanently
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!view && (
          <div className="w-full max-w-[780px] mx-auto px-12 pb-24 pt-[120px]">



            <div className="mb-6 group/title">
              {isPublicView ? (
                <h1 className="text-[36px] font-bold tracking-tight text-foreground leading-[1.2] outline-none break-words whitespace-pre-wrap text-left">{title}</h1>
              ) : (
                <input
                  ref={titleRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={(e) => saveTitle(e.target.value)}
                  placeholder="Untitled"
                  className="text-[36px] font-bold tracking-tight bg-transparent border-none outline-none w-full placeholder:text-[rgba(247,246,243,0.15)] text-foreground leading-[1.2] text-left"
                />
              )}
            </div>


          <div className="max-w-none">
            <TiptapEditor
              content={currentDoc.content}
              onUpdate={handleContentUpdate}
              editable={!isPublicView}
            />
          </div>
        </div>
        )}
      </main>
      <KeyboardShortcutsModal />
      <MobileBottomNav />
    </div>
  )
}
