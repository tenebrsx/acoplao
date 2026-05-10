import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { FileText, FolderKanban, CheckCircle2, Clock, Plus, ArrowRight, Building2 } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function DashboardOverview() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Action Items (Pending Phases)
  let actionItems: any[] = []
  let recentProjects: any[] = []
  let recentDocs: any[] = []

  try {
    // 1. Fetch pending phases
    const { data: phases } = await supabase
      .from('deliverable_phases')
      .select('id, phase_name, scheduled_date, deliverables(id, title, projects(id, title))')
      .eq('is_completed', false)
      .order('scheduled_date', { ascending: true })
      .limit(5)
    actionItems = phases || []

    // 2. Fetch recent projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id, title, status, businesses(name)')
      .order('created_at', { ascending: false })
      .limit(5)
    recentProjects = projects || []

    // 3. Fetch recent docs
    const { data: docs } = await supabase
      .from('documents')
      .select('id, title, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5)
    recentDocs = docs || []
  } catch (e) {
    // Graceful fail in dev
  }

  return (
    <div className="animate-in delay-100">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          Inbox
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Your unified workspace for immediate action.
        </p>
      </div>

      {/* Action Items */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> Needs Attention
        </h2>
        
        {actionItems.length === 0 ? (
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <p>You're all caught up! No pending tasks right now.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {actionItems.map((item) => (
              <Link 
                key={item.id} 
                href={`/dashboard/projects/${item.deliverables?.projects?.id}`} 
                className="glass-panel hover-border-light"
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  padding: '16px 20px', textDecoration: 'none', color: 'inherit',
                  transition: 'background 0.2s ease, border-color 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--warning)' }} />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.9375rem' }}>
                      {item.deliverables?.title || 'Unnamed Deliverable'} — {item.phase_name}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      Project: {item.deliverables?.projects?.title}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                  <Clock size={14} />
                  {new Date(item.scheduled_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* Recent Projects */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderKanban size={16} /> Active Projects
            </h2>
            <Link href="/dashboard/projects" style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', textDecoration: 'none' }}>
              View all
            </Link>
          </div>
          
          {recentProjects.length === 0 ? (
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
              <Link href="/dashboard/projects" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                <Plus size={14} /> New Project
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentProjects.map((p) => (
                <Link 
                  key={p.id} 
                  href={`/dashboard/projects/${p.id}`} 
                  className="glass-panel hover-border-light"
                  style={{ 
                    padding: '16px', textDecoration: 'none', color: 'inherit',
                    transition: 'border-color 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.9375rem', marginBottom: '4px' }}>{p.title}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{p.businesses?.name || 'No business'}</div>
                    </div>
                    <span className="badge" style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}>{p.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Docs */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} /> Recent Documents
            </h2>
            <Link href="/dashboard/docs" style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', textDecoration: 'none' }}>
              View all
            </Link>
          </div>

          {recentDocs.length === 0 ? (
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
              <Link href="/dashboard/docs" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                <Plus size={14} /> New Document
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentDocs.map((doc) => (
                <Link 
                  key={doc.id} 
                  href={`/dashboard/docs/${doc.id}`} 
                  className="glass-panel hover-border-light"
                  style={{ 
                    padding: '16px', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '12px',
                    transition: 'border-color 0.2s ease'
                  }}
                >
                  <FileText size={16} color="var(--text-tertiary)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.9375rem' }}>{doc.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      Edited {new Date(doc.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
