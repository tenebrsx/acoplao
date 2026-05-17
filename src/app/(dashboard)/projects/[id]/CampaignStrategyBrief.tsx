'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Target, Users, Zap, Save, CheckCircle2, DollarSign, Calendar, MessageSquare, BarChart3, Radio, Palette } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const CHANNELS = ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'LinkedIn', 'Twitter/X', 'Email', 'Website', 'OOH', 'Podcast']
const KPIS = ['Impressions', 'Reach', 'Engagement Rate', 'CTR', 'Conversions', 'ROAS', 'CPM', 'CPC', 'Video Views', 'Follower Growth']

export function CampaignStrategyBrief({ projectId, initialData, isAdmin }: { projectId: string, initialData: any, isAdmin: boolean }) {
  const [data, setData] = useState(initialData || {})
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const supabase = createClient()

  const handleSave = async () => {
    setIsSaving(true)
    await supabase.from('projects').update({ strategy_data: data }).eq('id', projectId)
    setIsSaving(false)
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2000)
  }

  const updateField = (field: string, value: any) => {
    setData((prev: any) => ({ ...prev, [field]: value }))
  }

  const toggleChannel = (channel: string) => {
    const current = data.target_channels || []
    if (current.includes(channel)) {
      updateField('target_channels', current.filter((c: string) => c !== channel))
    } else {
      updateField('target_channels', [...current, channel])
    }
  }

  const toggleKpi = (kpi: string) => {
    const current = data.kpis || []
    if (current.includes(kpi)) {
      updateField('kpis', current.filter((k: string) => k !== kpi))
    } else {
      updateField('kpis', [...current, kpi])
    }
  }

  const isReadOnly = !isAdmin

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base flex items-center gap-2.5">
            <Target size={18} className="text-primary" /> Strategy Brief
          </CardTitle>
          <AnimatePresence>
            {showSaved && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-xs text-emerald-500 flex items-center gap-1">
                <CheckCircle2 size={12} /> Saved
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Row 1: Goal + Audience */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Primary Goal</label>
            <textarea 
              readOnly={isReadOnly}
              value={data.goal || ''}
              onChange={(e) => updateField('goal', e.target.value)}
              placeholder="e.g. 100k views on Instagram..."
              className="w-full min-h-[80px] rounded-md border border-input bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target Audience</label>
            <textarea 
              readOnly={isReadOnly}
              value={data.audience || ''}
              onChange={(e) => updateField('audience', e.target.value)}
              placeholder="e.g. Gen-Z Tech Enthusiasts..."
              className="w-full min-h-[80px] rounded-md border border-input bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>
        </div>

        {/* Row 2: Budget + Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign size={12} /> Allocated Budget
            </label>
            <Input 
              readOnly={isReadOnly}
              type="number"
              value={data.allocated_budget || ''}
              onChange={(e) => updateField('allocated_budget', Number(e.target.value))}
              placeholder="15000"
              className="bg-secondary/30"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={12} /> Campaign Start
            </label>
            <Input 
              readOnly={isReadOnly}
              type="date"
              value={data.start_date || ''}
              onChange={(e) => updateField('start_date', e.target.value)}
              className="bg-secondary/30"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={12} /> Campaign End
            </label>
            <Input 
              readOnly={isReadOnly}
              type="date"
              value={data.end_date || ''}
              onChange={(e) => updateField('end_date', e.target.value)}
              className="bg-secondary/30"
            />
          </div>
        </div>

        {/* Row 3: KPIs */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 size={12} /> Success Metrics (KPIs)
          </label>
          <div className="flex flex-wrap gap-2">
            {KPIS.map(kpi => {
              const isSelected = (data.kpis || []).includes(kpi)
              return (
                <button
                  key={kpi}
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => toggleKpi(kpi)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                  } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {kpi}
                </button>
              )
            })}
          </div>
        </div>

        {/* Row 4: Target Channels */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Radio size={12} /> Target Channels
          </label>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map(channel => {
              const isSelected = (data.target_channels || []).includes(channel)
              return (
                <button
                  key={channel}
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => toggleChannel(channel)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                  } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {channel}
                </button>
              )
            })}
          </div>
        </div>

        {/* Row 5: Messaging + Vibe */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={12} /> Key Messaging / CTA
            </label>
            <textarea 
              readOnly={isReadOnly}
              value={data.messaging || ''}
              onChange={(e) => updateField('messaging', e.target.value)}
              placeholder="e.g. Transform your workflow with Aura..."
              className="w-full min-h-[80px] rounded-md border border-input bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Palette size={12} /> Visual Vibe / Aesthetic
            </label>
            <textarea 
              readOnly={isReadOnly}
              value={data.vibe || ''}
              onChange={(e) => updateField('vibe', e.target.value)}
              placeholder="e.g. Minimalist, High-Energy, Lo-Fi..."
              className="w-full min-h-[80px] rounded-md border border-input bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>
        </div>

        {/* Row 6: Notes */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Additional Notes</label>
          <textarea 
            readOnly={isReadOnly}
            value={data.notes || ''}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Competitor references, special requirements, risk factors..."
            className="w-full min-h-[60px] rounded-md border border-input bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
        </div>

        {isAdmin && (
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            <Save size={14} className="mr-2" /> {isSaving ? 'Saving...' : 'Update Brief'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
