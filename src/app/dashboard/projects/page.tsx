import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Building2, Plus, ArrowRight } from 'lucide-react'
import { DeliverablesClient } from './[id]/DeliverablesClient'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // DEV OVERRIDE
  const role = 'admin'

  let projects: any[] = []
  try {
    const { data } = await supabase
      .from('projects')
      .select('*, businesses(name), deliverables(*, deliverable_phases(*), review_links(id, token, is_active))')
      .order('created_at', { ascending: false })
    projects = data || []
  } catch (e) {}

  return (
    <div className="animate-in delay-100">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Deliverables Master Board</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage the creative matrix across all active projects.
          </p>
        </div>
        {role === 'admin' && (
          <Link href="/dashboard/businesses" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            <Plus size={16} /> New Project
          </Link>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {projects.length === 0 ? (
          <div className="glass-panel" style={{ padding: '64px 24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>No Active Projects</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Projects are created under a business. Go to Businesses to get started.
            </p>
            {role === 'admin' && (
              <Link href="/dashboard/businesses" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                <Building2 size={16} /> Go to Businesses
              </Link>
            )}
          </div>
        ) : (
          projects.map((project: any) => (
            <div key={project.id}>
              {/* Project Header Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{project.title}</h3>
                  <span className="badge" style={{ background: 'var(--bg-primary)', color: 'var(--text-tertiary)' }}>
                    {project.businesses?.name || 'No Business'}
                  </span>
                </div>
                <Link href={`/dashboard/projects/${project.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--accent-secondary)', textDecoration: 'none' }}>
                  Open Workspace <ArrowRight size={14} />
                </Link>
              </div>

              {/* The Matrix */}
              <DeliverablesClient projectId={project.id} initialDeliverables={project.deliverables || []} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
