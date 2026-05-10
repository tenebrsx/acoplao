'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Building2,
  LogOut,
  Sparkles,
  Bell,
  Search,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Calendar,
  BarChart,
  HardDrive,
  Plus,
  Wallet,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

type NavItem = {
  name: string
  href: string
  icon: React.ElementType
}

function getNavItems(role: string): NavItem[] {
  const items: NavItem[] = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  ]

  if (role === 'admin') {
    items.push({ name: 'CRM & Leads', href: '/dashboard/leads', icon: Users })
    items.push({ name: 'Businesses', href: '/dashboard/businesses', icon: Building2 })
    items.push({ name: 'Deliverables', href: '/dashboard/projects', icon: FolderKanban })
    items.push({ name: 'Global Drive', href: '/dashboard/drive', icon: HardDrive })
    items.push({ name: 'Capacity', href: '/dashboard/capacity', icon: BarChart })
    items.push({ name: 'Finances', href: '/dashboard/finances', icon: Wallet })
    items.push({ name: 'Calendar', href: '/dashboard/calendar', icon: Calendar })
    items.push({ name: 'Docs', href: '/dashboard/docs', icon: FileText })
    items.push({ name: 'Automations', href: '/dashboard/automations', icon: Sparkles })
    items.push({ name: 'Inbox', href: '/dashboard/inbox', icon: Bell })
    items.push({ name: 'Team', href: '/dashboard/settings', icon: Users })
  } else if (role === 'manager') {
    items.push({ name: 'Deliverables', href: '/dashboard/projects', icon: FolderKanban })
    items.push({ name: 'Calendar', href: '/dashboard/calendar', icon: Calendar })
    items.push({ name: 'Docs', href: '/dashboard/docs', icon: FileText })
  } else if (role === 'contractor') {
    items.push({ name: 'My Deliverables', href: '/dashboard/projects', icon: FolderKanban })
    items.push({ name: 'Calendar', href: '/dashboard/calendar', icon: Calendar })
    items.push({ name: 'Docs', href: '/dashboard/docs', icon: FileText })
  } else if (role === 'client') {
    items.push({ name: 'Deliverables', href: '/dashboard/projects', icon: FolderKanban })
    items.push({ name: 'Calendar', href: '/dashboard/calendar', icon: Calendar })
    items.push({ name: 'Docs', href: '/dashboard/docs', icon: FileText })
  }

  return items
}

export function SidebarClient({ role, email }: { role: string; email: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const navItems = getNavItems(role)
  const [isOpen, setIsOpen] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [sections, setSections] = useState<any[]>([])

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setIsMounted(true)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        setIsOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    // Fetch workspaces gracefully
    const fetchWorkspaces = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('workspace_sections')
          .select('id, title, workspace_pages(id, title, icon)')
          .order('sort_order', { ascending: true })
        
        if (!error && data) {
          setSections(data)
        }
      } catch (e) {
        // Migration might not be applied yet, ignore gracefully
      }
    }
    fetchWorkspaces()

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleCreateSection = async () => {
    const title = window.prompt("Section Name (e.g. Marketing, Sales):")
    if (!title) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('workspace_sections')
      .insert({ title, created_by: user?.id })
      .select('id, title, workspace_pages(id, title, icon)')
      .single()
    if (data) {
      setSections(prev => [...prev, data])
    }
  }

  const handleCreatePage = async (sectionId: string) => {
    const title = window.prompt("Page Name:")
    if (!title) return
    const type = window.prompt("Page Type (doc, kanban, table, canvas):", "canvas")
    if (!type || !['doc', 'kanban', 'table', 'canvas'].includes(type)) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('workspace_pages')
      .insert({ section_id: sectionId, title, page_type: type, icon: type === 'doc' ? '📄' : type === 'kanban' ? '📋' : type === 'table' ? '📊' : '🎨', created_by: user?.id })
      .select('id, title, icon, page_type')
      .single()
    
    if (data) {
      setSections(prev => prev.map(s => {
        if (s.id === sectionId) {
          return { ...s, workspace_pages: [...(s.workspace_pages || []), data] }
        }
        return s
      }))
      router.push(`/dashboard/workspace/${data.id}`)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const sidebarWidth = isOpen ? 240 : 0
  const sidebarPadding = isOpen ? '20px 16px' : '20px 0px'

  if (!isMounted) return null // Or return a skeletal static version

  return (
    <>
      {/* Sidebar */}
      <motion.aside 
        initial={{ width: 240, opacity: 1 }}
        animate={{ width: sidebarWidth, opacity: isOpen ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          borderRight: isOpen ? '1px solid var(--surface-border)' : 'none',
          background: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          padding: sidebarPadding,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', padding: '0 8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '6px',
            background: 'var(--text-primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Sparkles size={14} color="var(--bg-primary)" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>Aura.</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', paddingBottom: '20px' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`nav-item${isActive ? ' active' : ''}`}
                style={{ overflow: 'hidden' }}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                <span style={{ display: isOpen ? 'inline' : 'none' }}>{item.name}</span>
              </Link>
            )
          })}

          {/* Dynamic Workspaces */}
          {sections.length > 0 && (
            <div style={{ marginTop: '24px', paddingLeft: isOpen ? '8px' : '0' }}>
              {isOpen && (
                <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '8px' }}>
                  Workspaces
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {sections.map(section => (
                  <div key={section.id} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '8px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: isOpen ? 'inline' : 'none' }}>{section.title}</span>
                      {isOpen && (
                        <button 
                          onClick={() => handleCreatePage(section.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '2px' }}
                          title="Add Page"
                        >
                          <Plus size={14} />
                        </button>
                      )}
                    </div>
                    {section.workspace_pages?.map((page: any) => (
                      <Link
                        key={page.id}
                        href={`/dashboard/workspace/${page.id}`}
                        className={`nav-item ${pathname === `/dashboard/workspace/${page.id}` ? 'active' : ''}`}
                        style={{ paddingLeft: isOpen ? '24px' : '8px', fontSize: '0.8125rem' }}
                      >
                        <span style={{ fontSize: '14px', flexShrink: 0 }}>{page.icon || '📄'}</span>
                        <span style={{ display: isOpen ? 'inline' : 'none', overflow: 'hidden', textOverflow: 'ellipsis' }}>{page.title}</span>
                      </Link>
                    ))}
                  </div>
                ))}
                
                {/* Create Section Button */}
                {isOpen && role === 'admin' && (
                  <button 
                    onClick={handleCreateSection}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '8px', 
                      padding: '8px', marginTop: '8px', background: 'none', border: 'none', 
                      color: 'var(--text-tertiary)', fontSize: '0.8125rem', cursor: 'pointer',
                      borderRadius: '6px'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--surface-hover)' }}
                    onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'none' }}
                  >
                    <Plus size={14} /> New Section
                  </button>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* User info + sign out */}
        <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '20px', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', marginBottom: '8px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '6px',
              background: 'var(--surface-border)', color: 'var(--text-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 500, fontSize: '0.875rem', flexShrink: 0, textTransform: 'uppercase',
            }}>
              {email.charAt(0)}
            </div>
            <div style={{ minWidth: 0, display: isOpen ? 'block' : 'none' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{role}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="nav-item"
            style={{ width: '100%', color: 'var(--error)', cursor: 'pointer', textAlign: 'left', overflow: 'hidden' }}
          >
            <LogOut size={18} style={{ flexShrink: 0 }} />
            <span style={{ display: isOpen ? 'inline' : 'none' }}>Sign Out</span>
          </button>
        </div>
      </motion.aside>

      {/* Floating Topbar */}
      <motion.div 
        initial={{ left: 240 }}
        animate={{ left: sidebarWidth }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'fixed', top: 0, right: 0, zIndex: 10,
          height: '56px', borderBottom: '1px solid var(--surface-border)',
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '6px', borderRadius: '6px' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'none'}
            title="Toggle Sidebar (Cmd + \)"
          >
            {isOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          
          <div 
            style={{ position: 'relative', width: '280px', cursor: 'pointer' }}
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
          >
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <div
              style={{
                width: '100%', background: 'transparent',
                border: '1px solid transparent',
                borderRadius: 'var(--radius-md)',
                padding: '8px 16px 8px 36px',
                fontSize: '0.875rem', color: 'var(--text-tertiary)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'border-color 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--surface-border)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
            >
              <span>Search workspaces...</span>
              <kbd style={{ background: 'var(--surface-border)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>⌘K</kbd>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <Bell size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'capitalize' }}>{role}</div>
            </div>
            <div style={{
              width: '28px', height: '28px', borderRadius: '6px',
              background: 'var(--surface-border)', color: 'var(--text-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase',
            }}>
              {email.charAt(0)}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
