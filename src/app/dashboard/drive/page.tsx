import { createClient } from '@/utils/supabase/server'
import { DriveClient } from './DriveClient'
import { FolderUp, HardDrive } from 'lucide-react'

export default async function DrivePage() {
  const supabase = await createClient()

  // Fetch recent digital assets
  const { data: assets } = await supabase
    .from('digital_assets')
    .select('*, projects(title), businesses(name), profiles(email)')
    .order('created_at', { ascending: false })

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

      <DriveClient initialAssets={assets || []} />
    </div>
  )
}
