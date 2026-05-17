import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { TeamClient } from './TeamClient'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // if (!user) redirect('/login')

  // Fetch the current user's profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id || '')
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  // Fetch all team members for the directory
  const { data: team } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <TeamClient 
      initialTeam={team || []} 
      userRole={profile?.role || 'client'} 
    />
  )
}
