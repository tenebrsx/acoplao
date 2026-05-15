import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch the current user's profile settings
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch global agency settings (only one row should exist)
  let agencySettings = null
  try {
    const { data } = await supabase
      .from('agency_settings')
      .select('*')
      .limit(1)
      .single()
    agencySettings = data
  } catch (e) {
    // Fails gracefully if migration isn't pushed yet
  }

  return (
    <div className="animate-in delay-100">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Global Preferences</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage your personal settings and global agency configurations.
        </p>
      </div>

      <SettingsClient 
        initialProfile={profile} 
        initialAgencySettings={agencySettings} 
        userRole={profile?.role || 'client'} 
      />
    </div>
  )
}
