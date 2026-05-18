'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, CheckCircle2, FolderKanban, Users, Building2,
  LogOut, Sparkles, Bell, Search, FileText, PanelLeftClose,
  PanelLeftOpen, Calendar, BarChart, HardDrive, Plus, Wallet,
  Settings, ChevronDown, ClipboardList, StickyNote, ListChecks,
  BookOpen, Sun, Moon,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useTheme } from './ThemeProvider'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { QuickCreateMenu } from './QuickCreateMenu'
import { Breadcrumbs } from './Breadcrumbs'

type NavItem = { name: string; href: string; icon: React.ElementType }
type NavSection = { title: string; items: NavItem[] }

function getNavSections(role: string): NavSection[] {
  const work: NavItem[] = [{ name: 'Overview', href: '/', icon: LayoutDashboard }]
  const content: NavItem[] = []
  const ops: NavItem[] = []
  const productivity: NavItem[] = []

  if (role === 'admin' || role === 'manager') {
    work.push(
      { name: 'Clients', href: '/businesses', icon: Building2 },
      { name: 'Projects', href: '/projects', icon: FolderKanban }
    )
    content.push(
      { name: 'Global Drive', href: '/drive', icon: HardDrive },
      { name: 'Docs', href: '/docs', icon: FileText },
      { name: 'Calendar', href: '/calendar', icon: Calendar }
    )
    ops.push(
      { name: 'Capacity', href: '/capacity', icon: BarChart },
      { name: 'Finances', href: '/finances', icon: Wallet },
      { name: 'Automations', href: '/automations', icon: Sparkles },
      { name: 'Inbox', href: '/inbox', icon: Bell },
      { name: 'Team', href: '/team', icon: Users }
    )
    productivity.push(
      { name: 'Tasks', href: '/tasks', icon: ListChecks },
      { name: 'Lists', href: '/lists', icon: ClipboardList },
      { name: 'Notes', href: '/notes', icon: StickyNote },
      { name: 'UpNotes', href: '/upnotes', icon: BookOpen },
    )
  } else if (role === 'contractor') {
    work.push(
      { name: 'My Projects', href: '/projects', icon: FolderKanban }
    )
    content.push(
      { name: 'Calendar', href: '/calendar', icon: Calendar },
      { name: 'Docs', href: '/docs', icon: FileText }
    )
    ops.push({ name: 'Inbox', href: '/inbox', icon: Bell })
    productivity.push(
      { name: 'Tasks', href: '/tasks', icon: ListChecks },
      { name: 'Lists', href: '/lists', icon: ClipboardList },
      { name: 'Notes', href: '/notes', icon: StickyNote },
      { name: 'UpNotes', href: '/upnotes', icon: BookOpen },
    )
  } else if (role === 'client') {
    work.push({ name: 'Projects', href: '/projects', icon: FolderKanban })
    content.push(
      { name: 'Calendar', href: '/calendar', icon: Calendar },
      { name: 'Docs', href: '/docs', icon: FileText }
    )
    productivity.push(
      { name: 'Notes', href: '/notes', icon: StickyNote },
    )
  }

  const sections: NavSection[] = [
    { title: 'Work', items: work },
    { title: 'Content', items: content },
    { title: 'Productivity', items: productivity },
    { title: 'Operations', items: ops },
  ]
  return sections.filter(s => s.items.length > 0)
}

export function SidebarClient({ role, email }: { role: string; email: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const navSections = getNavSections(role)
  const [isOpen, setIsOpen] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [sections, setSections] = useState<any[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [expandedSections, setExpandedSections] = useState<string[]>(['Work', 'Content', 'Operations'])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'section' | 'page'>('section')
  const [dialogSectionId, setDialogSectionId] = useState<string>('')
  const [dialogInput, setDialogInput] = useState('')
  const [dialogPageType, setDialogPageType] = useState('canvas')
  const { resolvedTheme, setTheme } = useTheme()
  const supabase = createClient()

  const fetchFavorites = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('user_favorites').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      if (data) {
        const resolved = await Promise.all(data.map(async (fav) => {
          let name = 'Loading...', href = '#', icon = FileText
          if (fav.entity_type === 'project') {
            const { data: p } = await supabase.from('projects').select('title').eq('id', fav.entity_id).single()
            name = p?.title || 'Unknown Project'; href = `/projects/${fav.entity_id}`; icon = FolderKanban
          } else if (fav.entity_type === 'business') {
            const { data: b } = await supabase.from('businesses').select('name').eq('id', fav.entity_id).single()
            name = b?.name || 'Unknown Client'; href = `/businesses/${fav.entity_id}`; icon = Building2
          } else if (fav.entity_type === 'document') {
            const { data: d } = await supabase.from('documents').select('title').eq('id', fav.entity_id).single()
            name = d?.title || 'Unknown Doc'; href = `/docs/${fav.entity_id}`; icon = FileText
          }
          return { ...fav, name, href, icon }
        }))
        setFavorites(resolved)
      }
    } catch (e) {}
  }, [supabase])

  useEffect(() => {
    setIsMounted(true)
    fetchFavorites()
    window.addEventListener('favorites-updated', fetchFavorites)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') setIsOpen(prev => !prev)
    }
    window.addEventListener('keydown', handleKeyDown)
    const fetchWorkspaces = async () => {
      try {
        const { data, error } = await supabase.from('workspace_sections').select('id, title, workspace_pages(id, title, icon)').order('sort_order', { ascending: true })
        if (!error && data) setSections(data)
      } catch (e) {}
    }
    fetchWorkspaces()
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('favorites-updated', fetchFavorites)
    }
  }, [fetchFavorites, supabase])

  useEffect(() => {
    if (pathname.startsWith('/docs')) {
      setIsOpen(false)
    }
  }, [pathname])

  const toggleSection = (title: string) => {
    setExpandedSections(prev => prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title])
  }

  const openCreateDialog = (type: 'section' | 'page', sectionId?: string) => {
    setDialogType(type)
    setDialogSectionId(sectionId || '')
    setDialogInput('')
    setDialogPageType('canvas')
    setDialogOpen(true)
  }

  const handleCreate = async () => {
    if (!dialogInput.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (dialogType === 'section') {
      const { data } = await supabase.from('workspace_sections').insert({ title: dialogInput, created_by: user?.id }).select('id, title, workspace_pages(id, title, icon)').single()
      if (data) setSections(prev => [...prev, data])
    } else {
      const { data } = await supabase.from('workspace_pages').insert({
        section_id: dialogSectionId, title: dialogInput, page_type: dialogPageType,
        icon: dialogPageType === 'doc' ? '📄' : dialogPageType === 'kanban' ? '📋' : dialogPageType === 'table' ? '📊' : '🎨',
        created_by: user?.id
      }).select('id, title, icon, page_type').single()
      if (data) {
        setSections(prev => prev.map(s => s.id === dialogSectionId ? { ...s, workspace_pages: [...(s.workspace_pages || []), data] } : s))
        router.push(`/workspace/${data.id}`)
      }
    }
    setDialogOpen(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const sidebarWidth = isOpen ? 260 : 72

  if (!isMounted) return null

  return (
    <TooltipProvider delayDuration={0}>
      <>
        <motion.aside
          initial={{ width: 260 }}
          animate={{ width: sidebarWidth }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="flex flex-col border-r border-border bg-background shrink-0 overflow-hidden whitespace-nowrap"
          style={{ padding: isOpen ? '20px 12px' : '20px 0' }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8 px-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shrink-0">
              <Sparkles size={14} className="text-primary-foreground" />
            </div>
            {isOpen && <span className="font-bold text-lg tracking-tight">Aura.</span>}
          </div>

          {/* Quick Action */}
          <div className="px-2 mb-6">
            <QuickCreateMenu isOpen={isOpen} />
          </div>

          {/* Nav */}
          <nav className="flex-1 flex flex-col gap-1 overflow-y-auto pb-5 min-h-0">
            {navSections.map(section => (
              <div key={section.title} className="mb-2">
                {isOpen && (
                  <button
                    type="button"
                    onClick={() => toggleSection(section.title)}
                    className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                  >
                    {section.title}
                    <ChevronDown size={14} className={`transition-transform ${expandedSections.includes(section.title) ? '' : '-rotate-90'}`} />
                  </button>
                )}
                <AnimatePresence>
                  {expandedSections.includes(section.title) && (
                    <motion.div
                      initial={isOpen ? { height: 0, opacity: 0 } : false}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {section.items.map(item => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                        const Icon = item.icon
                        return (
                          <Tooltip key={item.name}>
                            <TooltipTrigger asChild>
                              <Link
                                href={item.href}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                  isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                } ${isOpen ? '' : 'justify-center'}`}
                              >
                                <Icon size={18} className="shrink-0" />
                                {isOpen && <span>{item.name}</span>}
                              </Link>
                            </TooltipTrigger>
                            {!isOpen && (
                              <TooltipContent side="right">{item.name}</TooltipContent>
                            )}
                          </Tooltip>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* Favorites */}
            {favorites.length > 0 && isOpen && (
              <div className="mt-4">
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Favorites</div>
                {favorites.map(fav => {
                  const Icon = fav.icon
                  const isActive = pathname === fav.href
                  return (
                    <Link
                      key={fav.id}
                      href={fav.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive ? 'text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      <Icon size={14} className="text-primary shrink-0" />
                      <span className="truncate">{fav.name}</span>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Workspaces */}
            {sections.length > 0 && (
              <div className="mt-4">
                {isOpen && <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Workspaces</div>}
                <div className="flex flex-col gap-0.5">
                  {sections.map(section => (
                    <div key={section.id}>
                      <div className="flex items-center justify-between px-2 py-2">
                        {isOpen && <span className="text-sm font-semibold text-muted-foreground">{section.title}</span>}
                        {isOpen && role === 'admin' && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openCreateDialog('page', section.id)}>
                            <Plus size={14} />
                          </Button>
                        )}
                      </div>
                      {section.workspace_pages?.map((page: any) => (
                        <Link
                          key={page.id}
                          href={`/workspace/${page.id}`}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            pathname === `/workspace/${page.id}` ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                          } ${isOpen ? '' : 'justify-center'}`}
                        >
                          <span className="text-sm shrink-0">{page.icon || '📄'}</span>
                          {isOpen && <span className="truncate">{page.title}</span>}
                        </Link>
                      ))}
                    </div>
                  ))}
                  {isOpen && role === 'admin' && (
                    <Button variant="ghost" className="justify-start gap-2 text-muted-foreground hover:text-foreground mt-1" onClick={() => openCreateDialog('section')}>
                      <Plus size={14} /> New Section
                    </Button>
                  )}
                </div>
              </div>
            )}
          </nav>

          {/* User info */}
          <div className="border-t border-border pt-4 mt-auto">
            <div className={`flex items-center gap-2.5 px-2 mb-2 ${isOpen ? '' : 'justify-center'}`}>
              <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center text-sm font-medium uppercase shrink-0 border border-border">
                {email.charAt(0)}
              </div>
              {isOpen && (
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground capitalize">{role}</div>
                  <div className="text-sm text-muted-foreground truncate">{email}</div>
                </div>
              )}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors mb-1 w-full text-left ${isOpen ? '' : 'justify-center'}`}
                >
                  {resolvedTheme === 'dark' ? <Sun size={18} className="shrink-0" /> : <Moon size={18} className="shrink-0" />}
                  {isOpen && <span>{resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
                </button>
              </TooltipTrigger>
              {!isOpen && <TooltipContent side="right">{resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</TooltipContent>}
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/settings" className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors mb-1 ${isOpen ? '' : 'justify-center'}`}>
                  <Settings size={18} className="shrink-0" />
                  {isOpen && <span>Preferences</span>}
                </Link>
              </TooltipTrigger>
              {!isOpen && <TooltipContent side="right">Preferences</TooltipContent>}
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full text-left ${isOpen ? '' : 'justify-center'}`}
                >
                  <LogOut size={18} className="shrink-0" />
                  {isOpen && <span>Sign Out</span>}
                </button>
              </TooltipTrigger>
              {!isOpen && <TooltipContent side="right">Sign Out</TooltipContent>}
            </Tooltip>
          </div>
        </motion.aside>

        {/* Floating Topbar */}
        <motion.div
          initial={{ left: 260 }}
          animate={{ left: sidebarWidth }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 z-10 h-14 border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-between px-6"
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} title="Toggle Sidebar (Cmd + \)">
              {isOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </Button>
            <div
              className="relative min-w-[320px] cursor-pointer flex items-center gap-4"
              onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            >
              <div className="flex-1 flex items-center justify-between bg-transparent border border-transparent rounded-md px-3 py-2 transition-colors hover:border-border">
                <Breadcrumbs />
                <div className="flex items-center gap-2 ml-4">
                  <Search size={14} className="text-muted-foreground" />
                  <kbd className="bg-secondary px-1.5 py-0.5 rounded text-xs font-semibold text-muted-foreground">⌘K</kbd>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/settings"><Settings size={18} /></Link>
            </Button>
            <Button variant="ghost" size="icon">
              <Bell size={18} />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <div className="text-sm font-semibold capitalize">{role}</div>
              </div>
              <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center text-xs font-medium uppercase border border-border">
                {email.charAt(0)}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Create Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogType === 'section' ? 'New Workspace Section' : 'New Workspace Page'}</DialogTitle>
              <DialogDescription>
                {dialogType === 'section' ? 'Create a new section to organize your workspace pages.' : 'Add a new page to this workspace section.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{dialogType === 'section' ? 'Section Name' : 'Page Name'}</label>
                <Input value={dialogInput} onChange={e => setDialogInput(e.target.value)} placeholder={dialogType === 'section' ? 'e.g. Marketing, Sales' : 'Page name...'} />
              </div>
              {dialogType === 'page' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Page Type</label>
                  <select value={dialogPageType} onChange={e => setDialogPageType(e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                    <option value="canvas">Canvas</option>
                    <option value="doc">Document</option>
                    <option value="kanban">Kanban</option>
                    <option value="table">Table</option>
                  </select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    </TooltipProvider>
  )
}
