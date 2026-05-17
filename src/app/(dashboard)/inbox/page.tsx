import { createClient } from '@/utils/supabase/server'
import { InboxClient } from './InboxClient'
import { Bell } from 'lucide-react'

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch recent notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="animate-in delay-100">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Bell size={32} color="var(--accent-primary)" /> Global Inbox
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Every client comment, automation trigger, and team mention in one place.</p>
        </div>
      </div>

      <InboxClient initialNotifications={notifications || []} userId={user?.id || ''} />
    </div>
  )
}
