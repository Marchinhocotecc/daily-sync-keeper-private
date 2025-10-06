export type TaskPriority = 'high' | 'medium' | 'low'

export interface Task {
  id: string
  user_id: string
  title: string
  priority: TaskPriority
  created_at?: string
  updated_at?: string
}
