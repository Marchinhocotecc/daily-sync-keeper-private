import supabase from '@/lib/supabaseClient'
import type { Task, TaskPriority } from '@/types/task'

const TABLE = 'tasks'

export async function fetchTasks(userId: string): Promise<Task[]> {
  if (!userId) return []
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('[tasksService] fetchTasks error', error.message)
    return []
  }
  return Array.isArray(data) ? (data as Task[]) : []
}

export async function insertTask(userId: string, title: string, priority: TaskPriority): Promise<Task | null> {
  if (!userId) return null
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ user_id: userId, title, priority })
    .select()
    .single()
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('[tasksService] insertTask error', error.message)
    return null
  }
  return data as Task
}

export async function patchTask(id: string, userId: string, patch: Partial<Pick<Task, 'title' | 'priority'>>): Promise<Task | null> {
  if (!id || !userId) return null
  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .maybeSingle()
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('[tasksService] patchTask error', error.message)
    return null
  }
  return data as Task
}

export async function removeTask(id: string, userId: string): Promise<boolean> {
  if (!id || !userId) return false
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('[tasksService] removeTask error', error.message)
    return false
  }
  return true
}
