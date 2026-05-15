import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeft, UserPlus, UserMinus, Calendar, DollarSign, Activity, Globe, Layout, Target, Zap, Clock, MessageSquare, AlertCircle, Save, Plus } from 'lucide-react'

import ProjectEditorClient from './ProjectEditorClient'
import { DeliverablesClient } from './DeliverablesClient'
import { CampaignStrategyBrief } from './CampaignStrategyBrief'
import { MediaPoolClient } from './MediaPoolClient'
import { CampaignActivityFeed } from './CampaignActivityFeed'
import { ClientPortalView } from './ClientPortalView'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let role = 'admin'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role) role = profile.role
  }

  const isAdmin = role === 'admin'
  const isManager = role === 'manager'
  const isClient = role === 'client'

  // Fetch project with business info
  const { data: project } = await supabase
    .from('projects')
    .select('*, businesses(name, contact_email)')
    .eq('id', id)
    .single()

  if (!project) redirect('/dashboard/projects')

  // Fetch members
  const { data: members } = await supabase
    .from('project_members')
    .select('id, user_id, profiles(email, role)')
    .eq('project_id', id)

  // Fetch deliverables with their phases and review links
  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('*, deliverable_phases(*, profiles:completed_by(email)), review_links(id, token, is_active)')
    .eq('project_id', id)
    .order('created_at', { ascending: true })

  // Fetch Project Costs (Admin/Manager only)
  let projectExpenses = 0
  let projectContractorCosts = 0
  if (isAdmin || isManager) {
    const { data: expenses } = await supabase.from('expenses').select('amount').eq('project_id', id)
    projectExpenses = (expenses || []).reduce((sum, exp) => sum + Number(exp.amount), 0)

    const { data: timesheets } = await supabase.from('contractor_timesheets').select('hours_logged, hourly_rate').eq('project_id', id)
    projectContractorCosts = (timesheets || []).reduce((sum, ts) => sum + (Number(ts.hours_logged) * Number(ts.hourly_rate)), 0)
  }
  const totalProjectCosts = projectExpenses + projectContractorCosts

  // Stats Calculation
  const totalAssets = deliverables?.length || 0
  const completedAssets = deliverables?.filter((d: any) => d.status_v2 === 'approved' || d.status_v2 === 'delivered').length || 0
  const progress = totalAssets > 0 ? Math.round((completedAssets / totalAssets) * 100) : 0

  // Fetch all active profiles for member dropdown (admin only)
  let allProfiles: any[] = []
  if (isAdmin) {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('is_active', true)
      .order('email')
    allProfiles = data || []
  }

  const memberUserIds = members?.map((m: any) => m.user_id) || []

  // -------- SERVER ACTIONS --------

  async function addMember(formData: FormData) {
    'use server'
    const userId = formData.get('userId') as string
    if (!userId) return
    const supabase = await createClient()
    await supabase.from('project_members').insert({ project_id: id, user_id: userId })
    revalidatePath(`/dashboard/projects/${id}`)
  }

  async function removeMember(formData: FormData) {
    'use server'
    const memberId = formData.get('memberId') as string
    if (!memberId) return
    const supabase = await createClient()
    await supabase.from('project_members').delete().eq('id', memberId)
    revalidatePath(`/dashboard/projects/${id}`)
  }

  async function updateCampaignStatus(formData: FormData) {
    'use server'
    const bottleneck = formData.get('bottleneck') as any
    const broadcast = formData.get('broadcast') as string
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('projects').update({
      bottleneck_status: bottleneck,
      client_broadcast_message: broadcast
    }).eq('id', id)

    // Log broadcast activity if changed
    if (broadcast !== project.client_broadcast_message) {
      await supabase.from('campaign_activity').insert({
        project_id: id,
        user_id: user?.id,
        action: 'broadcast_sent',
        target_name: 'Client Portal'
      })
    }

    revalidatePath(`/dashboard/projects/${id}`)
  }

  // Render the branded Client Portal if the user is a client
  if (isClient) {
    return <ClientPortalView project={project} deliverables={deliverables || []} />
  }

  const bottleneckColors: Record<string, string> = {
    on_track: 'var(--success)',
    waiting_client: 'var(--warning)',
    waiting_team: 'var(--info)',
    blocked: 'var(--error)'
  }

  // Otherwise, render the internal Agency UI
  return (
    <div className="animate-in delay-100">
      {/* Dynamic Header with Vibe Overlay */}
      <div style={{ position: 'relative', height: '220px', borderRadius: '16px', marginBottom: '32px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0, 225, 255, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)', zIndex: 0 }} />
        <div style={{ position: 'absolute', inset: 0, padding: '32px', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Link href="/dashboard/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '12px', textDecoration: 'none', background: 'rgba(0,0,0,0.3)', padding: '4px 12px', borderRadius: '10px' }}>
              <ArrowLeft size={14} /> Back to Campaigns
            </Link>
            <ProjectEditorClient project={project} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: bottleneckColors[project.bottleneck_status || 'on_track'], background: 'rgba(0,0,0,0.3)', padding: '4px 12px', borderRadius: '20px', border: `1px solid ${bottleneckColors[project.bottleneck_status || 'on_track']}40` }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: bottleneckColors[project.bottleneck_status || 'on_track'] }} />
                {(project.bottleneck_status || 'on_track').replace('_', ' ').toUpperCase()}
              </div>
              {project.businesses?.name && (
                <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 600 }}>{project.businesses.name}</span>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link href={`/portal/${project.id}`} target="_blank" className="btn btn-secondary" style={{ textDecoration: 'none', background: 'rgba(0,0,0,0.4)', borderColor: 'var(--surface-border)' }}>
                <Globe size={16} /> View Portal
              </Link>
              {(isAdmin || isManager) && (
                <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', border: '1px solid var(--surface-border)', textAlign: 'right' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campaign Spend</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    ${totalProjectCosts.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
            {isAdmin && (
              <form action={updateCampaignStatus} style={{ display: 'flex', gap: '8px' }}>
                <select name="bottleneck" defaultValue={project.bottleneck_status} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)', fontSize: '0.75rem', borderRadius: '8px', padding: '4px 8px' }}>
                  <option value="on_track">On Track</option>
                  <option value="waiting_client">Waiting on Client</option>
                  <option value="waiting_team">Waiting on Team</option>
                  <option value="blocked">Blocked</option>
                </select>
                <input name="broadcast" placeholder="Client Broadcast..." defaultValue={project.client_broadcast_message || ''} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)', fontSize: '0.75rem', borderRadius: '8px', padding: '4px 12px', width: '200px' }} />
                <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '4px 8px' }}><Save size={14} /></button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Pulse Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(0,225,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={20} color="var(--accent-primary)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Velocity</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{progress}% Done</div>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layout size={20} color="#a855f7" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Content Assets</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{completedAssets}/{totalAssets} Pieces</div>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(251, 191, 36, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} color="var(--warning)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Next Milestone</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>In 3 Days</div>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={20} color="var(--success)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Live Pulse</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>Active</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Control Tower Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 320px', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column: Strategy & Media */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <CampaignStrategyBrief projectId={id} initialData={project.strategy_data} isAdmin={isAdmin} />
          <MediaPoolClient projectId={id} isAdmin={isAdmin} />
        </div>

        {/* Center Column: The Action Pipeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(0, 225, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layout size={16} color="var(--accent-primary)" />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Content Pipeline</h3>
              </div>
            </div>
            <DeliverablesClient projectId={id} initialDeliverables={deliverables || []} />
          </div>
        </div>

        {/* Right Column: Team & Activity Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <CampaignActivityFeed projectId={id} />

          {/* Team Panel */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={18} color="var(--accent-secondary)" /> Assigned Team
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {(!members || members.length === 0) ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No members yet.</p>
              ) : (
                members.map((m: any) => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--surface-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--surface-border)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                        {m.profiles?.email.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>{m.profiles?.email.split('@')[0]}</div>
                    </div>
                    {isAdmin && (
                      <form action={removeMember}>
                        <input type="hidden" name="memberId" value={m.id} />
                        <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '4px', opacity: 0.5 }}>
                          <UserMinus size={14} />
                        </button>
                      </form>
                    )}
                  </div>
                ))
              )}
            </div>

            {isAdmin && (
              <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '20px' }}>
                <form action={addMember} style={{ display: 'flex', gap: '8px' }}>
                  <select name="userId" required
                    style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
                    <option value="">Add member...</option>
                    {allProfiles
                      .filter(p => !memberUserIds.includes(p.id))
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.email} ({p.role})</option>
                      ))}
                  </select>
                  <button type="submit" className="btn btn-primary btn-sm"><Plus size={14} /></button>
                </form>
              </div>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Shortcuts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link
                href={`/dashboard/projects/${id}/calendar`}
                className="btn btn-secondary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', fontSize: '0.8125rem' }}
              >
                <Calendar size={14} /> Campaign Calendar
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
