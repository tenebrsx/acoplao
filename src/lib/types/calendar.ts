export type CalendarEvent = {
  id: string
  title: string
  description?: string
  start_time: string
  all_day?: boolean
  color?: string
  business_id?: string
  assigned_to?: string
  created_by?: string
}

export type CalendarBusiness = {
  id: string
  name: string
}

export type CalendarTeamMember = {
  id: string
  email: string
  role: string
}

export type CalendarPhase = {
  id: string
  phase_name: string
  scheduled_date: string
  is_completed: boolean
  deliverables?: {
    title?: string
    projects?: {
      title?: string
      businesses?: {
        id?: string
        name?: string
      }
    }
  }
}

export type CalendarTodo = {
  id: string
  title: string
  description?: string
  due_date?: string
  is_completed: boolean
}

export type CalendarInvoice = {
  id: string
  amount: number
  due_date?: string
  status: string
  businesses?: {
    id?: string
    name?: string
  }
}

export type ViewMode = 'month' | 'week' | 'agenda'

export type UnifiedEvent = {
  id: string
  type: 'event' | 'phase' | 'todo' | 'invoice'
  title: string
  subtitle: string
  dateStr: string
  isCompleted: boolean
  color: string
  icon: React.ElementType
  data: Record<string, unknown>
}

export type CalendarDay = {
  date: Date
  dateStr: string
  dayNum: string
  isCurrentMonth: boolean
  events: UnifiedEvent[]
}

export type NewEventForm = {
  title: string
  description: string
  all_day: boolean
  start_time: string
  color: string
  business_id: string
  assigned_to: string
}
