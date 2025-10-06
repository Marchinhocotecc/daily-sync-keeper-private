import { useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '@/lib/supabaseClient'
import { fetchTasks, insertTask, patchTask, removeTask } from '@/services/tasksService'
import type { Task, TaskPriority } from '@/types/task'
import { useToast } from '@/hooks/use-toast'

const KEY = ['tasks']

async function getUserId(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) return null
    return data.user.id ?? null
  } catch {
    return null
  }
}

export function useTasks() {
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const uid = await getUserId()
      if (!uid) return []
      return fetchTasks(uid)
    },
    staleTime: 30_000,
  })

  const tasks: Task[] = useMemo(() => (Array.isArray(data) ? data : []), [data])

  const addMutation = useMutation({
    mutationFn: async (vars: { title: string; priority: TaskPriority }) => {
      const uid = await getUserId()
      if (!uid) throw new Error('NO_USER')
      const created = await insertTask(uid, vars.title.trim(), vars.priority)
      if (!created) throw new Error('CREATE_FAILED')
      return created
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: KEY })
      const prev = qc.getQueryData<Task[]>(KEY) || []
      const optimistic: Task = {
        id: 'optimistic-' + Date.now(),
        user_id: 'optimistic',
        title: vars.title,
        priority: vars.priority,
      }
      qc.setQueryData<Task[]>(KEY, [optimistic, ...prev])
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev)
      toast({ title: 'Errore', description: 'home.tasks.errorGeneric', variant: 'destructive' as any })
    },
    onSuccess: (task) => {
      qc.setQueryData<Task[]>(KEY, (old) =>
        [task, ...(old || []).filter((t) => !t.id.startsWith('optimistic-'))]
      )
      toast({ title: 'OK', description: 'home.tasks.added' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (vars: { id: string; priority: TaskPriority }) => {
      const uid = await getUserId()
      if (!uid) throw new Error('NO_USER')
      const updated = await patchTask(vars.id, uid, { priority: vars.priority })
      if (!updated) throw new Error('UPDATE_FAILED')
      return updated
    },
    onMutate: async ({ id, priority }) => {
      await qc.cancelQueries({ queryKey: KEY })
      const prev = qc.getQueryData<Task[]>(KEY) || []
      qc.setQueryData<Task[]>(KEY, prev.map(t => t.id === id ? { ...t, priority } : t))
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev)
      toast({ title: 'Errore', description: 'home.tasks.errorGeneric', variant: 'destructive' as any })
    },
    onSuccess: () => {
      toast({ title: 'OK', description: 'home.tasks.updated' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const uid = await getUserId()
      if (!uid) throw new Error('NO_USER')
      const ok = await removeTask(id, uid)
      if (!ok) throw new Error('DELETE_FAILED')
      return id
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEY })
      const prev = qc.getQueryData<Task[]>(KEY) || []
      qc.setQueryData<Task[]>(KEY, prev.filter(t => t.id !== id))
      return { prev }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev)
      toast({ title: 'Errore', description: 'home.tasks.errorGeneric', variant: 'destructive' as any })
    },
    onSuccess: () => {
      toast({ title: 'OK', description: 'home.tasks.deleted' })
    },
  })

  const addTask = useCallback((title: string, priority: TaskPriority) => addMutation.mutate({ title, priority }), [addMutation])
  const updateTask = useCallback((id: string, priority: TaskPriority) => updateMutation.mutate({ id, priority }), [updateMutation])
  const deleteTask = useCallback((id: string) => deleteMutation.mutate(id), [deleteMutation])

  return {
    tasks,
    isLoading,
    isError,
    addTask,
    updateTask,
    deleteTask,
    refetch,
    adding: addMutation.isLoading,
  }
}
