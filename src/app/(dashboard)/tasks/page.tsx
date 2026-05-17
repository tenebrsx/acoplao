import { createClient } from '@/utils/supabase/server'
import { TasksClient } from './TasksClient'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user?.id || '')
    .order('created_at', { ascending: false })

  return (
    <div className="animate-in delay-100">
      <TasksClient initialTasks={tasks || []} userId={user?.id || ''} />
    </div>
  )
}
