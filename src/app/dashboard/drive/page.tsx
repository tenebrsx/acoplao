import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DriveClient } from './DriveClient'
import { HardDrive } from 'lucide-react'

export default async function DrivePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch all drive files with relations
  const { data: files } = await supabase
    .from('drive_files')
    .select('*, projects(id, title), businesses(id, name), profiles(email)')
    .order('created_at', { ascending: false })

  // Fetch businesses and projects for the filter dropdowns
  const [businessesRes, projectsRes] = await Promise.all([
    supabase.from('businesses').select('id, name'),
    supabase.from('projects').select('id, title, business_id')
  ])

  return (
    <div className="animate-in delay-100">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <HardDrive size={32} color="var(--accent-primary)" /> Global Drive
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Enterprise Digital Asset Management. Centralized files, renders, and brand assets.</p>
        </div>
      </div>

      <DriveClient 
        initialFiles={files || []} 
        businesses={businessesRes.data || []}
        projects={projectsRes.data || []}
        userId={user.id}
      />
    </div>
  )
}
