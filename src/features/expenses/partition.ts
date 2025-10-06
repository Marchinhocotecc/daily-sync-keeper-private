import type { Expense } from '@/lib/supabase'
import { toArray } from '@/utils/toArray'

export type PartitionedExpenses = {
  recent: Expense[]    // date <= today
  scheduled: Expense[] // date > today
}

export function partitionExpenses(
  expenses: Expense[],
  todayISO: string = new Date().toISOString().split('T')[0]
): PartitionedExpenses {
  const list = toArray(expenses)
  const sorted = [...list].sort((a, b) => {
    const ad = new Date(a.date).getTime()
    const bd = new Date(b.date).getTime()
    if (ad !== bd) return ad - bd
    // stable description-based tiebreaker
    return (a.description || '').localeCompare(b.description || '')
  })
  const recent = sorted.filter(e => e.date <= todayISO)
  const scheduled = sorted.filter(e => e.date > todayISO)
  return { recent, scheduled }
}
