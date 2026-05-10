import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeft, UserPlus, UserMinus, Calendar } from 'lucide-react'

import ProjectEditorClient from './ProjectEditorClient'
import { DeliverablesClient } from './DeliverablesClient'
import { ProjectDocument } from './ProjectDocument'
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

  // Render the branded Client Portal if the user is a client
  if (isClient) {
    return <ClientPortalView project={project} deliverables={deliverables || []} />
  }

  // Otherwise, render the internal Agency UI
  return (
    <div className="animate-in delay-100">
      <Link href="/dashboard/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)', fontSize: '0.875rem', marginBottom: '24px', textDecoration: 'none' }}>
        <ArrowLeft size={16} /> Back to Projects
      </Link>

      {/* Project header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <ProjectEditorClient project={project} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
            <span className="badge" style={{ background: 'var(--surface-border)', color: 'var(--text-primary)', textTransform: 'capitalize' }}>{project.status}</span>
            {project.businesses?.name && (
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Business: {project.businesses.name}</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }}>
        {/* Left: Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Workspace Canvas */}
          <div>
            <ProjectDocument projectId={id} />
          </div>

          {/* Deliverables Matrix */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Deliverables</h2>
            <DeliverablesClient projectId={id} initialDeliverables={deliverables || []} />
          </div>
        </div>

        {/* Right sidebar: Members */}
        <div>
          <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '24px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px' }}>Team Members</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {(!members || members.length === 0) ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No members yet.</p>
              ) : (
                members.map((m: any) => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{m.profiles?.email}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{m.profiles?.role}</div>
                    </div>
                    {isAdmin && (
                      <form action={removeMember}>
                        <input type="hidden" name="memberId" value={m.id} />
                        <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '4px' }}>
                          <UserMinus size={16} />
                        </button>
                      </form>
                    )}
                  </div>
                ))
              )}
            </div>

            {isAdmin && (
              <>
                <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserPlus size={14} /> Add Member
                  </h4>
                  <form action={addMember} style={{ display: 'flex', gap: '8px' }}>
                    <select name="userId" required
                      style={{ flex: 1, padding: '8px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      <option value="">Select user...</option>
                      {allProfiles
                        .filter(p => !memberUserIds.includes(p.id))
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.email} ({p.role})</option>
                        ))}
                    </select>
                    <button type="submit" className="btn btn-primary btn-sm">Add</button>
                  </form>
                </div>
              </>
            )}

            {/* Calendar link */}
            <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '16px', marginTop: '16px' }}>
              <Link
                href={`/dashboard/projects/${id}/calendar`}
                className="btn btn-secondary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none' }}
              >
                <Calendar size={16} /> View Calendar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
