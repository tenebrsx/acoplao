import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ExpenseLoggerClient } from './ExpenseLoggerClient'

export default async function NewExpensePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch businesses and projects to link the expense
  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, name, projects(id, title)')
    .order('name', { ascending: true })

  return (
    <div className="h-full">
      <ExpenseLoggerClient businesses={businesses || []} />
    </div>
  )
}
