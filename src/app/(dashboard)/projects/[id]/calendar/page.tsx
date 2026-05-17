import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react'

export default async function ProjectCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // if (!user) redirect('/login')

  // Fetch project
  const { data: project } = await supabase
    .from('projects')
    .select('title')
    .eq('id', id)
    .single()

  if (!project) redirect('/projects')

  // Fetch all phases for all deliverables in this project
  const { data: phases } = await supabase
    .from('deliverable_phases')
    .select('*, deliverables!inner(id, title, project_id)')
    .eq('deliverables.project_id', id)
    .order('scheduled_date', { ascending: true })

  // Toggle phase completion
  async function togglePhase(formData: FormData) {
    'use server'
    const phaseId = formData.get('phaseId') as string
    const currentlyCompleted = formData.get('isCompleted') === 'true'
    if (!phaseId) return

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (currentlyCompleted) {
      await supabase.from('deliverable_phases').update({
        is_completed: false, completed_at: null, completed_by: null,
      }).eq('id', phaseId)
    } else {
      await supabase.from('deliverable_phases').update({
        is_completed: true, completed_at: new Date().toISOString(), completed_by: user?.id,
      }).eq('id', phaseId)
    }

    revalidatePath(`/projects/${id}/calendar`)
  }

  // Group phases by date
  const phasesByDate: Record<string, any[]> = {}
  if (phases) {
    for (const phase of phases) {
      const date = phase.scheduled_date
      if (!phasesByDate[date]) phasesByDate[date] = []
      phasesByDate[date].push(phase)
    }
  }

  const sortedDates = Object.keys(phasesByDate).sort()

  // Color palette for deliverables
  const deliverableColors: Record<string, string> = {}
  const colorPalette = [
    'var(--text-primary)',
    'rgba(0, 225, 255, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(168, 85, 247, 0.8)',
  ]
  let colorIndex = 0
  if (phases) {
    for (const phase of phases) {
      const dId = phase.deliverables?.id
      if (dId && !deliverableColors[dId]) {
        deliverableColors[dId] = colorPalette[colorIndex % colorPalette.length]
        colorIndex++
      }
    }
  }

  return (
    <div className="animate-in delay-100">
      <Link href={`/projects/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)', fontSize: '0.875rem', marginBottom: '24px', textDecoration: 'none' }}>
        <ArrowLeft size={16} /> Back to Project
      </Link>

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>{project.title} — Calendar</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Timeline of all deliverables and their phases.</p>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        {Object.entries(deliverableColors).map(([dId, color]) => {
          const phase = phases?.find((p: any) => p.deliverables?.id === dId)
          return (
            <div key={dId} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color }} />
              <span style={{ color: 'var(--text-secondary)' }}>{phase?.deliverables?.title}</span>
            </div>
          )
        })}
      </div>

      {sortedDates.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          No phases scheduled yet. Add deliverables from the project page.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sortedDates.map(date => {
            const dateObj = new Date(date + 'T12:00:00')
            const isToday = new Date().toISOString().split('T')[0] === date
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

            return (
              <div key={date} className="glass-panel" style={{ padding: '20px 24px', borderLeft: isToday ? '3px solid var(--accent-primary)' : '3px solid transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{dayName}</h3>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>{dateStr}</span>
                  {isToday && <span className="badge" style={{ background: 'var(--surface-border)', color: 'var(--text-primary)', fontSize: '0.75rem' }}>Today</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {phasesByDate[date].map((phase: any) => (
                    <div key={phase.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: phase.is_completed ? 'rgba(16, 185, 129, 0.05)' : 'var(--surface)', borderRadius: '8px', border: `1px solid ${phase.is_completed ? 'rgba(16, 185, 129, 0.2)' : 'var(--surface-border)'}` }}>
                      <form action={togglePhase} style={{ display: 'flex' }}>
                        <input type="hidden" name="phaseId" value={phase.id} />
                        <input type="hidden" name="isCompleted" value={String(phase.is_completed)} />
                        <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                          {phase.is_completed
                            ? <CheckCircle2 size={18} color="var(--success)" />
                            : <Circle size={18} color="var(--text-tertiary)" />
                          }
                        </button>
                      </form>

                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: deliverableColors[phase.deliverables?.id] || 'var(--text-tertiary)' }} />

                      <span style={{ fontWeight: 500, fontSize: '0.875rem', color: phase.is_completed ? 'var(--text-tertiary)' : 'var(--text-primary)', textDecoration: phase.is_completed ? 'line-through' : 'none' }}>
                        {phase.deliverables?.title}
                      </span>

                      <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>— {phase.phase_name}</span>

                      {phase.is_completed && phase.profiles?.email && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
                          by {phase.profiles.email}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
