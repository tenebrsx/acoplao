'use client'

import { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import { Building2, FolderKanban, FileText, Search, Settings, Home, LayoutDashboard } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export function CommandPaletteClient() {
  const [open, setOpen] = useState(false)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [docs, setDocs] = useState<any[]>([])
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Fetch quick data when palette opens
  useEffect(() => {
    if (open && businesses.length === 0) {
      const fetchData = async () => {
        try {
          const [bizRes, projRes, docRes, workRes] = await Promise.all([
            supabase.from('businesses').select('id, name').limit(5),
            supabase.from('projects').select('id, title').limit(5),
            supabase.from('documents').select('id, title').limit(5).order('updated_at', { ascending: false }),
            supabase.from('workspace_pages').select('id, title, icon, page_type').limit(5)
          ])
          if (bizRes.data) setBusinesses(bizRes.data)
          if (projRes.data) setProjects(projRes.data)
          if (docRes.data) setDocs(docRes.data)
          if (workRes.data) setWorkspaces(workRes.data)
        } catch (e) {
          // Graceful fallback if migrations aren't run
        }
      }
      fetchData()
    }
  }, [open, businesses.length, supabase])

  // Custom global event listener to open from the topbar button
  useEffect(() => {
    const handleOpenCommandPalette = () => setOpen(true)
    window.addEventListener('open-command-palette', handleOpenCommandPalette)
    return () => window.removeEventListener('open-command-palette', handleOpenCommandPalette)
  }, [])

  if (!open) return null

  return (
    <div className="cmdk-overlay" onClick={() => setOpen(false)}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '560px' }}>
        <Command 
          label="Global Command Menu"
          className="cmdk-dialog"
          loop
        >
          <div className="cmdk-input-wrapper">
            <Search size={18} className="cmdk-search-icon" />
            <Command.Input placeholder="What do you need? (e.g., 'Projects', 'Nike')" />
          </div>

          <Command.List>
            <Command.Empty>No results found.</Command.Empty>

            <Command.Group heading="Navigation">
              <Command.Item onSelect={() => { router.push('/'); setOpen(false) }}>
                <Home size={14} /> Home Dashboard
              </Command.Item>
              <Command.Item onSelect={() => { router.push('/businesses'); setOpen(false) }}>
                <Building2 size={16} />
                <span>Clients</span>
              </Command.Item>
              <Command.Item onSelect={() => { router.push('/projects'); setOpen(false) }}>
                <FolderKanban size={16} />
                <span>Campaigns</span>
              </Command.Item>
              <Command.Item onSelect={() => { router.push('/docs'); setOpen(false) }}>
                <FileText size={16} />
                <span>Docs</span>
              </Command.Item>
              <Command.Item onSelect={() => { router.push('/settings'); setOpen(false) }}>
                <Settings size={16} />
                <span>Preferences</span>
              </Command.Item>
            </Command.Group>

            {businesses.length > 0 && (
              <Command.Group heading="Clients">
                {businesses.map((biz) => (
                  <Command.Item 
                    key={biz.id} 
                    onSelect={() => { router.push(`/businesses/${biz.id}`); setOpen(false) }}
                  >
                    <Building2 size={16} />
                    <span>{biz.name}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {projects.length > 0 && (
              <Command.Group heading="Campaigns">
                {projects.map((proj) => (
                  <Command.Item 
                    key={proj.id} 
                    onSelect={() => { router.push(`/projects/${proj.id}`); setOpen(false) }}
                  >
                    <FolderKanban size={16} />
                    <span>{proj.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {workspaces.length > 0 && (
              <Command.Group heading="Workspaces">
                {workspaces.map((work) => (
                  <Command.Item 
                    key={work.id} 
                    onSelect={() => { router.push(`/workspace/${work.id}`); setOpen(false) }}
                  >
                    <LayoutDashboard size={16} />
                    <span>{work.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {docs.length > 0 && (
              <Command.Group heading="Documents">
                {docs.map((doc) => (
                  <Command.Item 
                    key={doc.id} 
                    onSelect={() => { router.push(`/docs/${doc.id}`); setOpen(false) }}
                  >
                    <FileText size={16} />
                    <span>{doc.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
