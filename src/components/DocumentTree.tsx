'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Plus,
  FileText,
  MoreHorizontal,
  Trash2,
  GripVertical,
  Home,
  MessageSquare,
  Mic,
  Inbox,
  Search,
  BookOpen,
  CheckSquare,
  Puzzle,
  HelpCircle,
  Sparkles,
  Edit,
  Send,
  Calendar,
  Monitor,
  ArrowRight,
  X
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/components/ToastProvider'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { NestedDocModal } from './NestedDocModal'

type Doc = {
  id: string
  title: string
  parent_id: string | null
  icon: string | null
  is_public: boolean
  created_by: string
  tags?: string[] | null
  is_favorite?: boolean
  is_deleted?: boolean
  updated_at?: string | null
  created_at?: string | null
}

type DocumentTreeProps = {
  documents: Doc[]
  currentDocId: string
  onDocumentsChange?: (docs: Doc[]) => void
}

function getDocTree(docs: Doc[], parentId: string | null = null): Doc[] {
  return docs
    .filter((d) => d.parent_id === parentId)
    .sort((a, b) => a.title.localeCompare(b.title))
}

function hasChildren(docs: Doc[], parentId: string): boolean {
  return docs.some((d) => d.parent_id === parentId)
}

function renderDocIcon(icon: string | null) {
  if (icon && icon !== 'page') {
    return <span className="text-sm shrink-0 leading-none">{icon}</span>
  }
  return <FileText size={13} className="opacity-40 shrink-0 text-muted-foreground" />
}

function SortableTreeItem({
  doc,
  docs,
  level,
  currentDocId,
  expanded,
  onToggle,
  onDelete,
  onAddChild,
}: {
  doc: Doc
  docs: Doc[]
  level: number
  currentDocId: string
  expanded: Set<string>
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onAddChild: (parentId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: doc.id, data: { doc } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const children = getDocTree(docs, doc.id)
  const isExpanded = expanded.has(doc.id)
  const isActive = doc.id === currentDocId
  const docIcon = renderDocIcon(doc.icon)

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`group flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[13px] transition-colors ${
          isActive
            ? 'bg-[rgba(247,246,243,0.06)] text-foreground font-medium'
            : 'text-muted-foreground hover:bg-[rgba(247,246,243,0.04)] hover:text-foreground'
        }`}
        style={{ paddingLeft: `${8 + level * 12}px` }}
      >
        <button
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded-sm hover:bg-white/[0.08] cursor-grab active:cursor-grabbing transition-opacity text-muted-foreground"
        >
          <GripVertical size={12} />
        </button>

        {hasChildren(docs, doc.id) ? (
          <button
            onClick={() => onToggle(doc.id)}
            className="p-0.5 rounded-sm hover:bg-white/[0.08] transition-colors text-muted-foreground"
          >
            {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        ) : (
          <span className="w-[16px] shrink-0" />
        )}

        <Link
          href={`/docs/${doc.id}`}
          onClick={(e) => {
            if (typeof window !== 'undefined' && window.dispatchEvent) {
              const isInEditor = window.location.pathname.startsWith('/docs/') && window.location.pathname.substring(6).length > 0
              if (isInEditor) {
                e.preventDefault()
                window.dispatchEvent(new CustomEvent('navigate-to-doc', { detail: { id: doc.id } }))
              }
            }
          }}
          className="flex-1 flex items-center gap-2 min-w-0 py-0.5"
        >
          {docIcon}
          <span className="truncate">{doc.title || 'Untitled'}</span>
        </Link>

        <button
          onClick={() => onAddChild(doc.id)}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded-sm hover:bg-white/[0.08] transition-opacity text-muted-foreground"
          title="Add a page inside"
        >
          <Plus size={13} />
        </button>

        <button
          onClick={() => onDelete(doc.id)}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded-sm hover:bg-white/[0.08] transition-opacity text-muted-foreground hover:text-destructive"
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && children.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {children.map((child) => (
              <SortableTreeItem
                key={child.id}
                doc={child}
                docs={docs}
                level={level + 1}
                currentDocId={currentDocId}
                expanded={expanded}
                onToggle={onToggle}
                onDelete={onDelete}
                onAddChild={onAddChild}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function DocumentTree({
  documents,
  currentDocId,
  onDocumentsChange,
}: DocumentTreeProps) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [isCreating, setIsCreating] = useState<string | false>(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [docs, setDocs] = useState<Doc[]>(() => {
    return documents.map(doc => ({
      ...doc,
      is_deleted: doc.tags?.includes('deleted') || false,
      is_favorite: doc.tags?.includes('favorite') || false,
    }))
  })
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [quickCreateDocId, setQuickCreateDocId] = useState<string | null>(null)

  const fetchDocs = useCallback(async () => {
    const { data } = await supabase
      .from('documents')
      .select('id, title, parent_id, icon, is_public, created_by, tags, updated_at, created_at')
      .order('title', { ascending: true })
    if (data) {
      const mapped = data.map((doc: any) => ({
        ...doc,
        is_deleted: doc.tags?.includes('deleted') || false,
        is_favorite: doc.tags?.includes('favorite') || false,
      }))
      setDocs(mapped)
    }
  }, [supabase])

  useEffect(() => {
    window.addEventListener('documents-updated', fetchDocs)
    return () => window.removeEventListener('documents-updated', fetchDocs)
  }, [fetchDocs])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return []
    return docs.filter(doc => 
      !doc.is_deleted && doc.title?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [docs, searchQuery])

  const [calendarOpen, setCalendarOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [allEvents, setAllEvents] = useState<any[]>([])
  const [allTasks, setAllTasks] = useState<any[]>([])
  const [loadingCalendar, setLoadingCalendar] = useState(false)
  const [quickTaskTitle, setQuickTaskTitle] = useState('')
  const [isSubmittingTask, setIsSubmittingTask] = useState(false)

  // Calendar data
  const today = new Date()
  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth])
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth])
  const calendarDays = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd])

  const fetchCalendarData = useCallback(async () => {
    setLoadingCalendar(true)
    try {
      const { data: eventsData } = await supabase
        .from('calendar_events')
        .select('id, title, start_time, description, color')
        .order('start_time', { ascending: true })

      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true })

      if (eventsData) setAllEvents(eventsData)
      if (tasksData) setAllTasks(tasksData)
    } catch (err) {
      console.error('Error fetching calendar data:', err)
    } finally {
      setLoadingCalendar(false)
    }
  }, [supabase])

  useEffect(() => {
    if (calendarOpen) {
      fetchCalendarData()
    }
  }, [calendarOpen, fetchCalendarData])
  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    // Optimistic update
    setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: !currentCompleted, status: !currentCompleted ? 'done' : 'todo' } : t))
    
    const { error } = await supabase
      .from('tasks')
      .update({ 
        is_completed: !currentCompleted,
        status: !currentCompleted ? 'done' : 'todo'
      })
      .eq('id', taskId)

    if (error) {
      toast('Failed to update task', 'error')
      fetchCalendarData()
    } else {
      toast('Task updated', 'success')
    }
  }

  const handleAssignTaskDate = async (taskId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    // Optimistic update
    setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, due_date: dateStr } : t))

    const { error } = await supabase
      .from('tasks')
      .update({ due_date: dateStr })
      .eq('id', taskId)

    if (error) {
      toast('Failed to schedule task', 'error')
      fetchCalendarData()
    } else {
      toast('Task scheduled for today', 'success')
    }
  }

  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickTaskTitle.trim()) return
    
    setIsSubmittingTask(true)
    const dateStr = format(selectedDate, 'yyyy-MM-dd')

    // Get user email from session/profiles to set owner
    const { data: { user } } = await supabase.auth.getUser()
    const userEmail = user?.email || ''

    const newTaskPayload = {
      title: quickTaskTitle.trim(),
      due_date: dateStr,
      is_completed: false,
      status: 'todo',
      user_email: userEmail
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert(newTaskPayload)
      .select()
      .single()

    if (error) {
      toast('Failed to create task', 'error')
    } else {
      toast('Task created successfully', 'success')
      setQuickTaskTitle('')
      fetchCalendarData()
    }
    setIsSubmittingTask(false)
  }
  const activeDocs = useMemo(() => docs.filter(d => !d.is_deleted), [docs])
  const rootDocs = useMemo(() => getDocTree(activeDocs), [activeDocs])
  const workspaceDocs = useMemo(() => rootDocs.filter(d => d.is_public), [rootDocs])
  const privateDocs = useMemo(() => rootDocs.filter(d => !d.is_public), [rootDocs])
  const favoriteDocs = useMemo(() => activeDocs.filter(d => d.is_favorite), [activeDocs])
  const recentDocs = useMemo(() => {
    return [...activeDocs]
      .sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at || 0).getTime()
        const dateB = new Date(b.updated_at || b.created_at || 0).getTime()
        return dateB - dateA
      })
      .slice(0, 5)
  }, [activeDocs])

  const [categoriesExpanded, setCategoriesExpanded] = useState({
    workspace: true,
    private: true,
    favorites: true,
    recents: true
  })

  const toggleCategory = (category: 'workspace' | 'private' | 'favorites' | 'recents') => {
    setCategoriesExpanded(prev => ({ ...prev, [category]: !prev[category] }))
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeDoc = docs.find((d) => d.id === active.id)
    const overDoc = docs.find((d) => d.id === over.id)
    if (!activeDoc || !overDoc) return

    const newParentId = overDoc.id

    if (activeDoc.parent_id === newParentId) {
      return
    }

    setDocs((prev) =>
      prev.map((d) =>
        d.id === active.id ? { ...d, parent_id: newParentId } : d
      )
    )

    const { error } = await supabase
      .from('documents')
      .update({ parent_id: newParentId })
      .eq('id', active.id)

    if (error) {
      toast('Failed to move document', 'error')
      setDocs(docs)
    } else {
      toast('Document moved', 'success')
      onDocumentsChange?.(
        docs.map((d) =>
          d.id === active.id ? { ...d, parent_id: newParentId } : d
        )
      )
    }
  }

  const createDoc = async (parentId?: string | null) => {
    if (!newDocTitle.trim()) return
    const { data, error } = await supabase
      .from('documents')
      .insert({
        title: newDocTitle.trim(),
        parent_id: parentId || null,
        is_public: parentId ? undefined : (isCreating === 'workspace'),
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
      })
      .select()
      .single()

    if (!error && data) {
      const newDoc: Doc = {
        id: data.id,
        title: data.title,
        parent_id: data.parent_id,
        icon: data.icon,
        is_public: data.is_public,
        created_by: data.created_by,
      }
      setDocs((prev) => [newDoc, ...prev])
      setNewDocTitle('')
      setIsCreating(false)
      router.push(`/docs/${data.id}`)
      toast('Document created', 'success')
    } else {
      toast('Failed to create document', 'error')
    }
  }

  const handleAddChild = async (parentId: string) => {
    const parentDoc = docs.find(d => d.id === parentId)
    const isPublic = parentDoc ? parentDoc.is_public : false

    const { data, error } = await supabase
      .from('documents')
      .insert({
        title: '',
        parent_id: parentId,
        is_public: isPublic,
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
      })
      .select()
      .single()

    if (!error && data) {
      setExpanded(prev => {
        const next = new Set(prev)
        next.add(parentId)
        return next
      })
      const newDoc: Doc = {
        id: data.id,
        title: data.title,
        parent_id: data.parent_id,
        icon: data.icon,
        is_public: data.is_public,
        created_by: data.created_by,
      }
      setDocs((prev) => [newDoc, ...prev])
      setQuickCreateDocId(data.id)
    } else {
      toast('Failed to create page', 'error')
    }
  }

  const deleteDoc = async (id: string) => {
    const target = docs.find(d => d.id === id)
    const currentTags = target?.tags || []
    const newTags = currentTags.includes('deleted') ? currentTags : [...currentTags, 'deleted']

    setDocs((prev) => prev.map((d) => d.id === id ? { ...d, is_deleted: true, tags: newTags } : d))
    await supabase.from('documents').update({ tags: newTags }).eq('id', id)
    window.dispatchEvent(new CustomEvent('documents-updated'))
    if (id === currentDocId) router.push('/docs')
    toast('Document moved to Trash', 'success')
  }

  const allDocIds = useMemo(() => docs.map((d) => d.id), [docs])

  return (
    <div className="flex flex-col h-full bg-transparent text-[#9b9b9b] text-[13px]">
      {/* Workspace Header */}
      <div className="px-3 py-1.5 mt-1 hover:bg-[rgba(247,246,243,0.04)] cursor-pointer flex items-center justify-between transition-colors mb-1 group/workspace">
        <div className="flex items-center gap-2 text-foreground">
          <div className="w-4.5 h-4.5 rounded bg-primary/20 flex items-center justify-center text-primary font-medium text-[10px]">
            A
          </div>
          <span className="font-semibold text-[13px]">Aura Workspace</span>
        </div>
        <ChevronDown size={12} className="text-muted-foreground opacity-0 group-hover/workspace:opacity-100 transition-opacity" />
      </div>

      {/* Core Navigation */}
      <div className="px-3 mb-2 space-y-0.5">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('?view=home')} className="flex items-center gap-2 px-2 py-1 hover:bg-[rgba(247,246,243,0.04)] rounded-md transition-colors text-foreground font-medium flex-1 text-left text-[13px]">
            <Home size={14} className="opacity-80" />
            <span>Home</span>
          </button>
          <div className="flex items-center gap-0.5 text-muted-foreground pr-1">
             <button className="p-1 hover:bg-[rgba(247,246,243,0.04)] rounded-md transition-colors"><MessageSquare size={14} /></button>
             <button className="p-1 hover:bg-[rgba(247,246,243,0.04)] rounded-md transition-colors"><Mic size={14} /></button>
             <button onClick={() => router.push('?view=inbox')} className="p-1 hover:bg-[rgba(247,246,243,0.04)] rounded-md transition-colors"><Inbox size={14} /></button>
             <button onClick={() => setSearchOpen(true)} className="p-1 hover:bg-[rgba(247,246,243,0.04)] rounded-md transition-colors"><Search size={14} /></button>
          </div>
        </div>
        <button onClick={() => router.push('?view=home')} className="w-full flex items-center gap-2 px-2 py-0.5 hover:bg-[rgba(247,246,243,0.04)] rounded-md transition-colors text-left text-[13px]">
          <span className="text-sm leading-none opacity-80">🏠</span>
          <span>General</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        <div className="py-1 px-2 mb-4">
          
          {/* Recents Section */}
          {recentDocs.length > 0 && (
            <div className="px-3 mb-4 group/section">
              <div 
                onClick={() => toggleCategory('recents')}
                className="flex items-center gap-1 py-1 px-1 cursor-pointer hover:bg-[rgba(247,246,243,0.04)] rounded transition-colors"
              >
                <ChevronRight size={14} className={`text-muted-foreground/60 transition-transform ${categoriesExpanded.recents ? 'rotate-90' : ''}`} />
                <span className="text-[11px] font-semibold text-muted-foreground/60 group-hover/section:text-muted-foreground transition-colors">
                  Recents
                </span>
              </div>
              
              <AnimatePresence>
                {categoriesExpanded.recents && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-0.5 mt-0.5"
                  >
                    {recentDocs.map(doc => (
                      <Link
                        key={`recent-${doc.id}`}
                        href={`/docs/${doc.id}`}
                        onClick={(e) => {
                          if (typeof window !== 'undefined' && window.dispatchEvent) {
                            const isInEditor = window.location.pathname.startsWith('/docs/') && window.location.pathname.substring(6).length > 0
                            if (isInEditor) {
                              e.preventDefault()
                              window.dispatchEvent(new CustomEvent('navigate-to-doc', { detail: { id: doc.id } }))
                            }
                          }
                        }}
                        className={`flex items-center gap-1.5 pl-6 py-0.5 rounded-sm text-[13px] transition-colors ${
                          doc.id === currentDocId
                            ? 'bg-[rgba(247,246,243,0.06)] text-foreground font-medium'
                            : 'text-muted-foreground hover:bg-[rgba(247,246,243,0.04)] hover:text-foreground'
                        }`}
                      >
                        {renderDocIcon(doc.icon)}
                        <span className="truncate">{doc.title || 'Untitled'}</span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Favorites Section */}
          {favoriteDocs.length > 0 && (
            <div className="px-3 mb-4 group/section">
              <div 
                onClick={() => toggleCategory('favorites')}
                className="flex items-center gap-1 py-1 px-1 cursor-pointer hover:bg-[rgba(247,246,243,0.04)] rounded transition-colors"
              >
                <ChevronRight size={14} className={`text-muted-foreground/60 transition-transform ${categoriesExpanded.favorites ? 'rotate-90' : ''}`} />
                <span className="text-[11px] font-semibold text-muted-foreground/60 group-hover/section:text-muted-foreground transition-colors">
                  Favorites
                </span>
              </div>
              
              <AnimatePresence>
                {categoriesExpanded.favorites && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-0.5 mt-0.5"
                  >
                    {favoriteDocs.map(doc => (
                      <Link
                        key={`favorite-${doc.id}`}
                        href={`/docs/${doc.id}`}
                        onClick={(e) => {
                          if (typeof window !== 'undefined' && window.dispatchEvent) {
                            const isInEditor = window.location.pathname.startsWith('/docs/') && window.location.pathname.substring(6).length > 0
                            if (isInEditor) {
                              e.preventDefault()
                              window.dispatchEvent(new CustomEvent('navigate-to-doc', { detail: { id: doc.id } }))
                            }
                          }
                        }}
                        className={`flex items-center gap-1.5 pl-6 py-0.5 rounded-sm text-[13px] transition-colors ${
                          doc.id === currentDocId
                            ? 'bg-[rgba(247,246,243,0.06)] text-foreground font-medium'
                            : 'text-muted-foreground hover:bg-[rgba(247,246,243,0.04)] hover:text-foreground'
                        }`}
                      >
                        {renderDocIcon(doc.icon)}
                        <span className="truncate">{doc.title || 'Untitled'}</span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          
          {/* Workspace Section */}
          <div className="px-3 mb-4 group/section">
            <div 
              onClick={() => toggleCategory('workspace')}
              className="flex items-center justify-between py-1 px-1 cursor-pointer hover:bg-[rgba(247,246,243,0.04)] rounded transition-colors"
            >
              <div className="flex items-center gap-1">
                <ChevronRight size={14} className={`text-muted-foreground/60 transition-transform ${categoriesExpanded.workspace ? 'rotate-90' : ''}`} />
                <span className="text-[11px] font-semibold text-muted-foreground/60 group-hover/section:text-muted-foreground transition-colors">
                  Workspace
                </span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsCreating('workspace') }}
                className="opacity-0 group-hover/section:opacity-100 p-0.5 text-muted-foreground hover:bg-[rgba(247,246,243,0.08)] rounded transition-all"
              >
                <Plus size={14} />
              </button>
            </div>
            
            <AnimatePresence>
              {categoriesExpanded.workspace && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <SortableContext items={workspaceDocs.map(d => d.id)} strategy={verticalListSortingStrategy}>
                    {workspaceDocs.map((doc) => (
                      <SortableTreeItem
                        key={doc.id} doc={doc} docs={docs} level={0} currentDocId={currentDocId}
                        expanded={expanded} onToggle={toggleExpand} onDelete={deleteDoc} onAddChild={handleAddChild}
                      />
                    ))}
                    {workspaceDocs.length === 0 && !isCreating && (
                      <div className="px-2 py-1 text-xs text-muted-foreground/40 ml-4">No workspace pages</div>
                    )}
                  </SortableContext>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Private Section */}
          <div className="px-3 mb-4 group/section">
            <div 
              onClick={() => toggleCategory('private')}
              className="flex items-center justify-between py-1 px-1 cursor-pointer hover:bg-[rgba(247,246,243,0.04)] rounded transition-colors"
            >
              <div className="flex items-center gap-1">
                <ChevronRight size={14} className={`text-muted-foreground/60 transition-transform ${categoriesExpanded.private ? 'rotate-90' : ''}`} />
                <span className="text-[11px] font-semibold text-muted-foreground/60 group-hover/section:text-muted-foreground transition-colors">
                  Private
                </span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsCreating('private') }}
                className="opacity-0 group-hover/section:opacity-100 p-0.5 text-muted-foreground hover:bg-[rgba(247,246,243,0.08)] rounded transition-all"
              >
                <Plus size={14} />
              </button>
            </div>
            
            <AnimatePresence>
              {categoriesExpanded.private && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <SortableContext items={privateDocs.map(d => d.id)} strategy={verticalListSortingStrategy}>
                    {privateDocs.map((doc) => (
                      <SortableTreeItem
                        key={doc.id} doc={doc} docs={docs} level={0} currentDocId={currentDocId}
                        expanded={expanded} onToggle={toggleExpand} onDelete={deleteDoc} onAddChild={handleAddChild}
                      />
                    ))}
                    {privateDocs.length === 0 && !isCreating && (
                      <div className="px-2 py-1 text-xs text-muted-foreground/40 ml-4">No private pages</div>
                    )}
                  </SortableContext>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DndContext>
          {isCreating ? (
            <div className="flex gap-1.5 px-2 mt-1">
              <input
                autoFocus
                placeholder="Untitled"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createDoc()
                  if (e.key === 'Escape') {
                    setIsCreating(false)
                    setNewDocTitle('')
                  }
                }}
                className="flex-1 h-7 px-2 text-sm bg-transparent border border-[rgba(55,53,47,0.15)] rounded outline-none text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
          ) : (
            <button
              className="w-full flex items-center gap-2 px-2 py-1 text-muted-foreground hover:bg-[rgba(247,246,243,0.04)] rounded-sm transition-colors mt-0.5"
              onClick={() => setIsCreating('private')}
            >
              <Plus size={14} className="opacity-70" /> <span>Add a page</span>
            </button>
          )}
        </div>
      </div>

      {/* Pinned Utilities Section */}
      <div className="px-3 py-2.5 border-t border-[rgba(55,53,47,0.06)] bg-[#202020]/45 space-y-2">
        <div className="grid grid-cols-2 gap-1">
           <button onClick={() => router.push('?view=inbox')} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[rgba(247,246,243,0.04)] rounded-md transition-colors text-left text-[13px] font-medium text-muted-foreground hover:text-foreground">
             <Send size={14} className="opacity-70" /> <span>Inbox</span>
           </button>
           <button onClick={() => setCalendarOpen(true)} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[rgba(247,246,243,0.04)] rounded-md transition-colors text-left text-[13px] font-medium text-muted-foreground hover:text-foreground">
             <Calendar size={14} className="opacity-70" /> <span>Calendar</span>
           </button>
           <button onClick={() => router.push('?view=tasks')} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[rgba(247,246,243,0.04)] rounded-md transition-colors text-left text-[13px] font-medium text-muted-foreground hover:text-foreground">
             <CheckSquare size={14} className="opacity-70" /> <span>My Tasks</span>
           </button>
           <button onClick={() => router.push('?view=trash')} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[rgba(247,246,243,0.04)] rounded-md transition-colors text-left text-[13px] font-medium text-red-400 hover:text-red-300">
             <Trash2 size={14} className="opacity-70" /> <span>Trash</span>
           </button>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="p-3 pt-2 mt-auto flex items-center gap-2 border-t border-[rgba(55,53,47,0.09)]">
         <button onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))} className="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 bg-[rgba(247,246,243,0.06)] hover:bg-[rgba(247,246,243,0.1)] rounded-md transition-colors text-foreground font-medium">
            <Sparkles size={14} className="opacity-80" />
            <span>New chat</span>
            <kbd className="ml-1 opacity-50 text-xs font-sans tracking-widest">⌘K</kbd>
         </button>
         <button onClick={() => setIsCreating('private')} className="p-1.5 bg-[rgba(247,246,243,0.06)] hover:bg-[rgba(247,246,243,0.1)] rounded-md transition-colors text-foreground">
            <Edit size={16} className="opacity-80" />
         </button>
      </div>

      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="bg-[#191919] border-[rgba(55,53,47,0.15)] sm:max-w-3xl p-0 overflow-hidden shadow-2xl flex flex-col md:flex-row h-[520px] max-h-[90vh]">
          {/* Left Month View */}
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <DialogHeader className="flex flex-row items-center justify-between space-y-0">
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Calendar size={18} className="text-primary" />
                  <span>{format(currentMonth, 'MMMM yyyy')}</span>
                </DialogTitle>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setCurrentMonth(prev => subMonths(prev, 1))} 
                    className="p-1 hover:bg-white/10 rounded transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={() => setCurrentMonth(new Date())} 
                    className="px-2 py-0.5 text-xs bg-white/5 hover:bg-white/10 rounded transition-colors text-muted-foreground hover:text-foreground"
                  >
                    Today
                  </button>
                  <button 
                    onClick={() => setCurrentMonth(prev => addMonths(prev, 1))} 
                    className="p-1 hover:bg-white/10 rounded transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-7 gap-1 mt-6">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-muted-foreground/60 mb-2">{d}</div>
                ))}
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {calendarDays.map(day => {
                  const dayStr = format(day, 'yyyy-MM-dd')
                  const dayEvents = allEvents.filter(e => e.start_time?.split('T')[0] === dayStr)
                  const dayTasks = allTasks.filter(t => t.due_date === dayStr)
                  const isSel = isSameDay(day, selectedDate)
                  const isTod = isSameDay(day, today)

                  return (
                    <div 
                      key={day.toISOString()} 
                      onClick={() => setSelectedDate(day)}
                      className={`h-10 flex flex-col items-center justify-center rounded-lg relative cursor-pointer select-none transition-all ${
                        isSel 
                          ? 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20' 
                          : isTod
                            ? 'border border-primary/40 text-primary font-semibold hover:bg-white/5'
                            : 'text-foreground hover:bg-white/5'
                      }`}
                    >
                      <span className="text-sm z-10">{format(day, 'd')}</span>
                      {/* Dots indicators */}
                      <div className="flex gap-0.5 absolute bottom-1.5 justify-center w-full">
                        {dayEvents.length > 0 && <span className={`w-1 h-1 rounded-full ${isSel ? 'bg-primary-foreground' : 'bg-emerald-400'}`} />}
                        {dayTasks.length > 0 && <span className={`w-1 h-1 rounded-full ${isSel ? 'bg-primary-foreground' : 'bg-cyan-400'}`} />}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-between items-center mt-6">
              <span className="text-xs text-muted-foreground/60">
                {allEvents.length} events, {allTasks.filter(t => !t.is_completed).length} pending tasks
              </span>
              <Link href="/calendar" className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1.5 transition-colors">
                View full calendar <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Right Day Detail Sidebar */}
          <div className="w-full md:w-80 bg-[#1e1e1e] border-t md:border-t-0 md:border-l border-white/5 flex flex-col h-[520px]">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#222222]">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {format(selectedDate, 'EEEE, MMM d')}
                </h3>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold">Selected Day</p>
              </div>
              <button 
                onClick={() => setCalendarOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {/* Events Section */}
              <div>
                <div className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Events Today</span>
                </div>
                {(() => {
                  const todayEvents = allEvents.filter(e => e.start_time?.split('T')[0] === format(selectedDate, 'yyyy-MM-dd'))
                  if (todayEvents.length === 0) {
                    return <div className="text-xs text-muted-foreground/40 italic py-1 pl-2.5">No events scheduled.</div>
                  }
                  return (
                    <div className="space-y-1.5">
                      {todayEvents.map(event => (
                        <div key={event.id} className="text-xs bg-white/5 border border-white/5 rounded p-2 flex flex-col gap-0.5">
                          <span className="font-semibold text-foreground">{event.title}</span>
                          {event.description && <span className="text-[10px] text-muted-foreground">{event.description}</span>}
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>

              {/* Tasks Section */}
              <div>
                <div className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>Tasks Today</span>
                </div>
                {(() => {
                  const todayTasks = allTasks.filter(t => t.due_date === format(selectedDate, 'yyyy-MM-dd'))
                  if (todayTasks.length === 0) {
                    return <div className="text-xs text-muted-foreground/40 italic py-1 pl-2.5">No tasks scheduled.</div>
                  }
                  return (
                    <div className="space-y-1.5">
                      {todayTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/5 rounded text-xs">
                          <button 
                            onClick={() => handleToggleTask(task.id, task.is_completed)}
                            className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                          >
                            {task.is_completed ? <CheckSquare size={14} className="text-emerald-500" /> : <span className="w-3.5 h-3.5 rounded border border-muted-foreground/50 block hover:border-foreground" />}
                          </button>
                          <span className={`truncate ${task.is_completed ? 'line-through text-muted-foreground/60' : 'text-foreground font-medium'}`}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>

              {/* Unscheduled Tasks Section */}
              <div>
                <div className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Unscheduled Tasks</span>
                </div>
                {(() => {
                  const unscheduled = allTasks.filter(t => !t.due_date && !t.is_completed)
                  if (unscheduled.length === 0) {
                    return <div className="text-xs text-muted-foreground/40 italic py-1 pl-2.5">No unscheduled tasks.</div>
                  }
                  return (
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar">
                      {unscheduled.map(task => (
                        <div key={task.id} className="flex items-center justify-between gap-2 p-1.5 bg-white/5 border border-white/5 rounded text-xs group">
                          <span className="truncate text-foreground/80 font-medium">
                            {task.title}
                          </span>
                          <button 
                            onClick={() => handleAssignTaskDate(task.id, selectedDate)}
                            title="Schedule for selected date"
                            className="p-1 hover:bg-white/10 rounded text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Sidebar Quick Action Form */}
            <form onSubmit={handleQuickAddTask} className="p-3 border-t border-white/5 shrink-0 bg-[#222222] flex gap-1.5">
              <input 
                type="text"
                value={quickTaskTitle}
                onChange={e => setQuickTaskTitle(e.target.value)}
                placeholder="Quick add task..."
                disabled={isSubmittingTask}
                className="flex-1 bg-white/5 border border-white/5 rounded px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40"
              />
              <button 
                type="submit"
                disabled={isSubmittingTask || !quickTaskTitle.trim()}
                className="px-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded text-xs transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {isSubmittingTask ? '...' : <Plus size={14} />}
              </button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="bg-[#191919] border-[rgba(55,53,47,0.15)] sm:max-w-xl p-0 overflow-hidden shadow-2xl">
          <div className="flex items-center border-b border-[rgba(55,53,47,0.09)] px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground mr-3" />
            <input
              autoFocus
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm border-none outline-none text-foreground placeholder:text-muted-foreground/50"
            />
            <kbd className="opacity-40 text-xs font-sans tracking-widest bg-white/[0.04] px-1.5 py-0.5 rounded">ESC</kbd>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
            {searchQuery.trim() === '' ? (
              <div className="text-center py-8 text-xs text-muted-foreground/40">
                Type to start searching your Notion pages...
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground/40">
                No matching documents found.
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const path: string[] = []
                let curr: Doc | undefined = doc
                while (curr && curr.parent_id) {
                  const pid: string = curr.parent_id
                  curr = docs.find((d) => d.id === pid)
                  if (curr) path.unshift(curr.title || 'Untitled')
                }
                const pathString = path.join(' / ')

                return (
                  <button
                    key={doc.id}
                    onClick={(e) => {
                      if (typeof window !== 'undefined' && window.dispatchEvent) {
                        const isInEditor = window.location.pathname.startsWith('/docs/') && window.location.pathname.substring(6).length > 0
                        if (isInEditor) {
                          e.preventDefault()
                          window.dispatchEvent(new CustomEvent('navigate-to-doc', { detail: { id: doc.id } }))
                        } else {
                          router.push(`/docs/${doc.id}`)
                        }
                      } else {
                        router.push(`/docs/${doc.id}`)
                      }
                      setSearchOpen(false)
                      setSearchQuery('')
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[rgba(247,246,243,0.04)] rounded-md transition-colors flex flex-col gap-0.5"
                  >
                    <div className="flex items-center gap-2">
                      {renderDocIcon(doc.icon)}
                      <span className="font-medium text-foreground text-sm truncate">{doc.title || 'Untitled'}</span>
                    </div>
                    {pathString && (
                      <span className="text-[10px] text-muted-foreground/50 pl-6 truncate">
                        {pathString}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {quickCreateDocId && (
        <NestedDocModal 
          docId={quickCreateDocId} 
          onClose={() => setQuickCreateDocId(null)} 
        />
      )}
    </div>
  )
}
