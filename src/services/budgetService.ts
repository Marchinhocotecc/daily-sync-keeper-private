import { useEffect, useState, useCallback } from 'react'
import supabase from '@/lib/supabaseClient'
import { getCurrentUserId } from './authService'
import type { BudgetRow } from '@/types/supabase'

export function currentYm() {
  const d = new Date()
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

export async function getMonthlyBudget(year: number, month: number): Promise<BudgetRow | null> {
  const uid = await getCurrentUserId()
  if (!uid) return null
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', uid)
    .eq('year', year)
    .eq('month', month)
    .maybeSingle()
  if (error) return null
  return data as BudgetRow | null
}

export async function upsertMonthlyBudget(amount: number, year: number, month: number): Promise<BudgetRow> {
  const uid = await getCurrentUserId()
  if (!uid) throw new Error('not_authenticated')
  const payload = {
    user_id: uid,
    year,
    month,
    amount,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase
    .from('budgets')
    .upsert(payload, { onConflict: 'user_id,year,month' })
    .select()
    .maybeSingle()
  if (error) throw error
  return data as BudgetRow
}

export function useMonthlyBudget() {
  const [{ year, month }] = useState(currentYm())
  const [budget, setBudget] = useState<BudgetRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setBudget(await getMonthlyBudget(year, month))
    } catch (e: any) {
      setError(e?.message || 'load_failed')
    } finally {
      setLoading(false)
    }
  }, [year, month])
  useEffect(() => { refresh() }, [refresh])

  const save = useCallback(async (amount: number) => {
    try {
      setLoading(true)
      const row = await upsertMonthlyBudget(amount, year, month)
      setBudget(row)
      return row
    } catch (e: any) {
      setError(e?.message || 'save_failed')
      throw e
    } finally {
      setLoading(false)
    }
  }, [year, month])

  return { budget, amount: budget?.amount ?? 0, year, month, loading, error, refresh, save }
}
