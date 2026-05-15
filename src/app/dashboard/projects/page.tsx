import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Building2, Plus, ArrowRight, FolderKanban, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ business?: string }>
}) {
  const { business: businessFilter } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Resolve actual role from profile
  let role = 'admin'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    role = profile?.role || 'admin'
  }

  // Fetch businesses for the filter
  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, name')
    .order('name')

  let projects: any[] = []
  try {
    let query = supabase
      .from('projects')
      .select('*, businesses(name), deliverables(id, status_v2, deliverable_phases(id, is_completed))')
      .order('created_at', { ascending: false })
    
    if (businessFilter) {
      query = query.eq('business_id', businessFilter)
    }

    const { data } = await query
    projects = data || []
  } catch (e) {}

  return (
    <div className="animate-in delay-100">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Campaigns Hub</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage tasks, milestones, and active workflows across all campaigns.
          </p>
        </div>
        {role === 'admin' && (
          <Link href="/dashboard/businesses" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            <Plus size={16} /> New Campaign
          </Link>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '8px' }}>
        <Link
          href="/dashboard/projects"
          className={`badge ${!businessFilter ? 'active' : ''}`}
          style={{ 
            padding: '8px 16px', borderRadius: '20px', textDecoration: 'none', 
            background: !businessFilter ? 'var(--accent-primary)' : 'var(--surface)',
            color: !businessFilter ? 'var(--bg-primary)' : 'var(--text-secondary)',
            fontWeight: 600, border: '1px solid var(--surface-border)',
            transition: 'all 0.2s'
          }}
        >
          All Clients
        </Link>
        {businesses?.map((biz) => (
          <Link
            key={biz.id}
            href={`/dashboard/projects?business=${biz.id}`}
            className={`badge ${businessFilter === biz.id ? 'active' : ''}`}
            style={{ 
              padding: '8px 16px', borderRadius: '20px', textDecoration: 'none', 
              background: businessFilter === biz.id ? 'var(--accent-primary)' : 'var(--surface)',
              color: businessFilter === biz.id ? 'var(--bg-primary)' : 'var(--text-secondary)',
              fontWeight: 600, border: '1px solid var(--surface-border)',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {biz.name}
          </Link>
        ))}
      </div>

      <div>
        {projects.length === 0 ? (
          <div className="glass-panel" style={{ padding: '64px 32px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid var(--surface-border)' }}>
              <FolderKanban size={28} color="var(--text-primary)" />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>No Active Campaigns</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
              {businessFilter 
                ? "This client doesn't have any campaigns yet."
                : "Campaigns are organized under a client. Go to Clients to get started."
              }
            </p>
            {!businessFilter && role === 'admin' && (
              <Link href="/dashboard/businesses" className="btn btn-primary" style={{ textDecoration: 'none', marginTop: '24px' }}>
                <Building2 size={16} /> Go to Clients
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
            {projects.map((project: any) => {
              // Calculate progress
              const totalDeliverables = project.deliverables?.length || 0
              const approvedDeliverables = project.deliverables?.filter((d: any) => d.status_v2 === 'approved' || d.status_v2 === 'delivered').length || 0
              
              const totalPhases = project.deliverables?.reduce((acc: number, d: any) => acc + (d.deliverable_phases?.length || 0), 0) || 0
              const completedPhases = project.deliverables?.reduce((acc: number, d: any) => acc + (d.deliverable_phases?.filter((p: any) => p.is_completed).length || 0), 0) || 0
              
              const progress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0

              const statusColor = 
                project.status === 'active' ? 'var(--success)' : 
                project.status === 'paused' ? 'var(--warning)' : 
                project.status === 'completed' ? 'var(--accent-secondary)' : 'var(--text-tertiary)'

              return (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="glass-panel hover-card-biz"
                  style={{ 
                    padding: '24px', textDecoration: 'none', color: 'inherit', 
                    display: 'flex', flexDirection: 'column', gap: '20px',
                    position: 'relative', overflow: 'hidden'
                  }}
                >
                  {/* Top Row: Info & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--surface-border)' }}>
                        <FolderKanban size={20} color="var(--text-primary)" />
                      </div>
                      <div>
                        <h3 style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '4px' }}>{project.title}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                          <Building2 size={14} />
                          <span>{project.businesses?.name}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: statusColor, background: `${statusColor}15`, padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor }} />
                      {project.status}
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Content Assets</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{approvedDeliverables}/{totalDeliverables}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Done</span>
                      </div>
                    </div>
                    <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Timeline</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{progress}%</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Phase</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div style={{ height: '6px', background: 'var(--surface-border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent-primary)', borderRadius: '3px', transition: 'width 1s ease-in-out' }} />
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', color: 'var(--accent-secondary)', fontSize: '0.8125rem', fontWeight: 600, gap: '6px' }}>
                    View Campaign <ArrowRight size={14} />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
