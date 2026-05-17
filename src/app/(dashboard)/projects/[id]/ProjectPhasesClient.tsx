'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Trash2, GripVertical, Calendar, Clock } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Phase = {
  id: string
  phase_name: string
  description: string | null
  scheduled_date: string | null
  is_completed: boolean
  sort_order: number
}

export function ProjectPhasesClient({
  projectId,
  initialPhases,
  isAdmin
}: {
  projectId: string
  initialPhases: Phase[]
  isAdmin: boolean
}) {
  const [phases, setPhases] = useState<Phase[]>(initialPhases)
  const supabase = createClient()
  const router = useRouter()

  const togglePhase = async (phaseId: string, currentlyCompleted: boolean) => {
    setPhases(prev => prev.map(p =>
      p.id === phaseId ? { ...p, is_completed: !currentlyCompleted } : p
    ))

    const { data: { user } } = await supabase.auth.getUser()
    if (currentlyCompleted) {
      await supabase.from('project_phases').update({
        is_completed: false,
        completed_at: null,
        completed_by: null
      }).eq('id', phaseId)
    } else {
      await supabase.from('project_phases').update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        completed_by: user?.id
      }).eq('id', phaseId)

      await supabase.from('campaign_activity').insert({
        project_id: projectId,
        user_id: user?.id,
        action: 'phase_completed',
        target_name: phases.find(p => p.id === phaseId)?.phase_name
      })
    }
    router.refresh()
  }

  const deletePhase = async (phaseId: string) => {
    if (!confirm('Delete this phase?')) return
    setPhases(prev => prev.filter(p => p.id !== phaseId))
    await supabase.from('project_phases').delete().eq('id', phaseId)
    router.refresh()
  }

  const totalPhases = phases.length
  const completedPhases = phases.filter(p => p.is_completed).length
  const progress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Clock size={16} className="text-emerald-500" />
            </div>
            <CardTitle className="text-base">Project Pipeline</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {completedPhases}/{totalPhases}
          </Badge>
        </div>
        <div className="mt-3">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{progress}% complete</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {phases.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No phases yet. Select a template when creating the project to auto-populate phases.
          </div>
        ) : (
          phases.sort((a, b) => a.sort_order - b.sort_order).map((phase, idx) => {
            const isAtRisk = !phase.is_completed && phase.scheduled_date && new Date(phase.scheduled_date) < today
            const isNext = !phase.is_completed && phases.slice(0, idx).every(p => p.is_completed)

            return (
              <div
                key={phase.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  phase.is_completed
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : isAtRisk
                    ? 'bg-red-500/5 border-red-500/20'
                    : isNext
                    ? 'bg-primary/5 border-primary/30'
                    : 'bg-card border-border'
                }`}
              >
                <button
                  onClick={() => togglePhase(phase.id, phase.is_completed)}
                  className="shrink-0"
                >
                  {phase.is_completed ? (
                    <CheckCircle2 size={20} className="text-emerald-500" />
                  ) : (
                    <Circle size={20} className={isAtRisk ? 'text-red-500' : isNext ? 'text-primary' : 'text-muted-foreground'} />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${phase.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                      {phase.phase_name}
                    </span>
                    {isAtRisk && (
                      <Badge variant="destructive" className="text-[10px] h-5">Overdue</Badge>
                    )}
                    {isNext && !phase.is_completed && (
                      <Badge variant="default" className="text-[10px] h-5">Next</Badge>
                    )}
                  </div>
                  {phase.scheduled_date && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Calendar size={10} />
                      {new Date(phase.scheduled_date).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <button
                    onClick={() => deletePhase(phase.id)}
                    className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
