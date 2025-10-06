import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '@/lib/supabaseClient'
import { useToast } from '@/hooks/use-toast'
import type { Expense } from '@/lib/supabase'
import { currentYm, getMonthlyBudget as getBudgetRow, upsertMonthlyBudget as upsertBudgetRow } from '@/services/budgetService'

export type AddExpenseInput = Omit<Expense, 'id' | 'user_id'>
export type UpdateExpenseInput = Partial<Omit<Expense, 'id' | 'user_id'>> & { id: string }

// removed legacy local SettingsRow type and settings helpers
// type SettingsRow = { id?: string; user_id?: string; monthly_budget: number }

const EXPENSES_KEY = (uid?: string | null) => ['expenses', uid]
const BUDGET_KEY = (uid?: string | null) => ['monthlyBudget', uid]

// Lightweight user id fetch (avoids tight coupling)
async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data?.user?.id || null
}

async function fetchExpenses(): Promise<Expense[]> {
  const uid = await getUserId()
  let q = supabase.from('expenses').select('*').order('date', { ascending: true })
  if (uid) q = q.eq('user_id', uid)
  const { data, error } = await q
  if (error) throw error
  return (data || []).sort((a, b) => {
    const ad = new Date(a.date).getTime()
    const bd = new Date(b.date).getTime()
    if (ad !== bd) return ad - bd
    return (a.description || '').localeCompare(b.description || '')
  })
}

async function fetchMonthlyBudget(): Promise<number> {
  const { year, month } = currentYm()
  const row = await getBudgetRow(year, month)
  return Number(row?.amount ?? 0)
}

// removed: upsertMonthlyBudget via settings
// async function upsertMonthlyBudget(value: number) { ... }

export function useExpenses() {
  const { toast } = useToast()
  const qc = useQueryClient()

  const {
    data: expenses = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: EXPENSES_KEY(undefined),
    queryFn: fetchExpenses,
  })

  const {
    data: monthlyBudget = 0,
    isLoading: isBudgetLoading,
  } = useQuery({
    queryKey: BUDGET_KEY(undefined),
    queryFn: fetchMonthlyBudget,
  })

  const addMutation = useMutation({
    mutationFn: async (input: AddExpenseInput) => {
      const uid = await getUserId()
      const { data, error } = await supabase
        .from('expenses')
        .insert([{ ...input, user_id: uid }])
        .select()
        .single()
      if (error) throw error
      return data as Expense
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EXPENSES_KEY(undefined) })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...patch }: UpdateExpenseInput) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Expense
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EXPENSES_KEY(undefined) })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EXPENSES_KEY(undefined) })
    },
  })

  const budgetMutation = useMutation({
    mutationFn: async (value: number) => {
      const { year, month } = currentYm()
      await upsertBudgetRow(Number(value || 0), year, month)
      return value
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BUDGET_KEY(undefined) })
    },
  })

  const todayISO = new Date().toISOString().split('T')[0]

  const { recent, scheduled } = useMemo(() => {
    const r = expenses.filter(e => e.date <= todayISO)
    const s = expenses.filter(e => e.date > todayISO)
    return { recent: r, scheduled: s }
  }, [expenses, todayISO])

  const currentMonthKey = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }, [])

  const totalCurrentMonth = useMemo(
    () =>
      expenses
        .filter(e => {
          const d = new Date(e.date)
            ; (d as any)._ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          return (d as any)._ym === currentMonthKey
        })
        .reduce((s, e) => s + Number(e.amount || 0), 0),
    [expenses, currentMonthKey]
  )

  const remainingBudget = useMemo(
    () => Number(monthlyBudget || 0) - totalCurrentMonth,
    [monthlyBudget, totalCurrentMonth]
  )

  function buildRangeArray(last: number, unit: 'day' | 'week' | 'month') {
    const out: { label: string; key: string; amount: number }[] = []
    const now = new Date()
    for (let i = last - 1; i >= 0; i--) {
      const d = new Date(now)
      if (unit === 'day') d.setDate(now.getDate() - i)
      if (unit === 'week') d.setDate(now.getDate() - i * 7)
      if (unit === 'month') d.setMonth(now.getMonth() - i)
      let key: string
      let label: string
      if (unit === 'day') {
        key = d.toISOString().split('T')[0]
        label = d.toLocaleDateString('it-IT', { weekday: 'short' })
      } else if (unit === 'week') {
        const start = new Date(d)
        const offset = (start.getDay() + 6) % 7
        start.setDate(start.getDate() - offset)
        key = start.toISOString().split('T')[0]
        label = start.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        label = d.toLocaleDateString('it-IT', { month: 'short' })
      }
      out.push({ label, key, amount: 0 })
    }
    return out
  }

  const dailyTrend = useMemo(() => {
    const buckets = buildRangeArray(7, 'day')
    expenses.forEach(e => {
      const b = buckets.find(b => b.key === e.date)
      if (b) b.amount += Number(e.amount || 0)
    })
    return buckets
  }, [expenses])

  const weeklyTrend = useMemo(() => {
    const buckets = buildRangeArray(8, 'week')
    expenses.forEach(e => {
      const d = new Date(e.date)
      const s = new Date(d)
      const offset = (s.getDay() + 6) % 7
      s.setDate(s.getDate() - offset)
      const key = s.toISOString().split('T')[0]
      const b = buckets.find(b => b.key === key)
      if (b) b.amount += Number(e.amount || 0)
    })
    return buckets
  }, [expenses])

  const monthlyTrend = useMemo(() => {
    const buckets = buildRangeArray(12, 'month')
    expenses.forEach(e => {
      const d = new Date(e.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const b = buckets.find(b => b.key === key)
      if (b) b.amount += Number(e.amount || 0)
    })
    return buckets
  }, [expenses])

  const categoryDistribution = useMemo(() => {
    const map: Record<string, number> = {}
    recent.forEach(e => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount || 0)
    })
    return Object.entries(map)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
  }, [recent])

  const addExpense = async (data: AddExpenseInput) => {
    if (!data.amount || Number(data.amount) <= 0) {
      toast({ title: 'Errore', description: 'Importo non valido', variant: 'destructive' as any })
      return
    }
    if (!data.date) {
      toast({ title: 'Errore', description: 'Data obbligatoria', variant: 'destructive' as any })
      return
    }
    return addMutation.mutateAsync(data)
  }

  const updateExpense = (data: UpdateExpenseInput) => updateMutation.mutateAsync(data)
  const deleteExpense = (id: string) => deleteMutation.mutateAsync(id)
  const setMonthlyBudget = (v: number) => budgetMutation.mutateAsync(v)

  return {
    expenses,
    recent,
    scheduled,
    isLoading: isLoading || isBudgetLoading,
    isError,
    error: error as any,
    addExpense,
    updateExpense,
    deleteExpense,
    monthlyBudget,
    setMonthlyBudget,
    totalCurrentMonth,
    remainingBudget,
    dailyTrend,
    weeklyTrend,
    monthlyTrend,
    categoryDistribution,
  }
}