export type Todo = {
  id: string
  title: string
  description?: string
  is_completed: boolean
  due_date?: string
  assigned_to?: string
  created_by?: string
  created_at?: string
}

export type Phase = {
  id: string
  phase_name: string
  scheduled_date?: string
  is_completed: boolean
  deliverable_id?: string
  deliverables?: {
    id?: string
    title?: string
    project_id?: string
    projects?: {
      id?: string
      title?: string
      businesses?: {
        id?: string
        name?: string
      }
    }
  } | {
    id?: string
    title?: string
    projects?: any[]
  }[]
}

export type WorkItem = {
  id: string
  type: 'todo' | 'phase'
  title: string
  is_completed: boolean
  date?: string | null
  context?: string | null
  project?: string | null
  client?: string | null
  created_at?: string | null
  description?: string | null
  assigned_to?: string | null
}

export type TaskViewMode = 'list' | 'board'
export type TaskFilterType = 'all' | 'todo' | 'phase'
export type TaskSortBy = 'date' | 'name' | 'status'
