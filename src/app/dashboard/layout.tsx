import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SidebarClient } from '@/components/SidebarClient'
import { CommandPaletteClient } from '@/components/CommandPaletteClient'
import { AuraCopilotClient } from '@/components/AuraCopilotClient'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let role = 'admin'
  let email = 'dev@aura.local'

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, role')
      .eq('id', user.id)
      .single()

    role = profile?.role || 'admin'
    email = profile?.email || user.email || 'dev@aura.local'
  }

  return (
    <div className="app-container">
      <SidebarClient role={role} email={email} />

      <main className="main-content" style={{ paddingTop: '56px' }}>
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
      
      <CommandPaletteClient />
      <AuraCopilotClient />
    </div>
  )
}
