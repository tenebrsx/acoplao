import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SidebarClient } from '@/components/SidebarClient'
import { CommandPaletteClient } from '@/components/CommandPaletteClient'
import { AuraCopilotClient } from '@/components/AuraCopilotClient'
import { ProductivityPanel } from '@/components/ProductivityPanel'

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
      .eq('id', user?.id || '')
      .single()

    role = profile?.role || 'admin'
    email = profile?.email || user.email || 'dev@aura.local'
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SidebarClient role={role} email={email} />
      <main className="flex-1 overflow-y-auto pt-14">
        <div className="p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <CommandPaletteClient />
      <AuraCopilotClient />
      <ProductivityPanel />
    </div>
  )
}
