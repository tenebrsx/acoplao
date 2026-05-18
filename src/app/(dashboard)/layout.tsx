import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SidebarClient } from '@/components/SidebarClient'
import { CommandPaletteClient } from '@/components/CommandPaletteClient'
import { AuraCopilotClient } from '@/components/AuraCopilotClient'
import { ProductivityPanel } from '@/components/ProductivityPanel'
import { verifySessionCookie } from '@/lib/firebase-admin'
import { createAdminClient } from '@/utils/supabase/admin'

const VIP_EMAILS = ['angelscott2004@gmail.com', 'tenebrsx@gmail.com']

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('firebase-session')?.value

  if (!sessionToken) {
    redirect('/login')
  }

  // Verify Firebase ID token server-side
  const decoded = await verifySessionCookie(sessionToken)
  if (!decoded) {
    redirect('/login')
  }

  const firebaseEmail = decoded.email ?? ''
  let role = 'viewer'
  let email = firebaseEmail

  // VIP emails always get admin
  if (VIP_EMAILS.includes(firebaseEmail.toLowerCase())) {
    role = 'admin'
  }

  // Look up profile in Supabase by email (Supabase DB, not Supabase Auth)
  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, role, is_active')
    .eq('email', firebaseEmail)
    .single()

  if (profile) {
    // Respect revocation
    if (profile.is_active === false) {
      redirect('/access-revoked')
    }
    // Only use DB role if not a VIP
    if (!VIP_EMAILS.includes(firebaseEmail.toLowerCase())) {
      role = profile.role || 'viewer'
    }
    // Ensure VIP profile is always admin in DB
    if (VIP_EMAILS.includes(firebaseEmail.toLowerCase()) && profile.role !== 'admin') {
      await supabase.from('profiles').update({ role: 'admin' }).eq('email', firebaseEmail)
    }
  } else {
    // Auto-create a profile for new Firebase users
    await supabase.from('profiles').upsert({
      email: firebaseEmail,
      role: VIP_EMAILS.includes(firebaseEmail.toLowerCase()) ? 'admin' : 'viewer',
      is_active: true,
    }, { onConflict: 'email', ignoreDuplicates: true })

  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SidebarClient role={role} email={email} />
      <main className="flex-1 overflow-y-auto pt-14 relative">
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
