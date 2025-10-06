import supabase from '@/lib/supabaseClient'

export interface ExpenseRecord {
  id: string
  amount: number
  category: string
  description: string
  icon?: string | null
  date: string // YYYY-MM-DD
  created_at?: string
}

export interface ExpenseInput {
  description: string
  amount: number
  category: string
  date: string
}

export const expenseKeys = {
  all: () => ['expenses'] as const,
  list: () => [...expenseKeys.all(), 'list'] as const,
}

export async function fetchExpenses(): Promise<ExpenseRecord[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('id, amount, category, description, icon, date, created_at')
    .order('date', { ascending: false })
  if (error) throw error
  if (!data) return []
  return data.map(d => ({
    ...d,
    amount: Number(d.amount || 0),
    date: (d.date || '').slice(0, 10),
  }))
}

export async function addExpense(input: ExpenseInput): Promise<ExpenseRecord> {
  const payload = {
    amount: input.amount,
    category: input.category,
    description: input.description,
    date: input.date,
  }
  const { data, error } = await supabase.from('expenses').insert(payload).select().single()
  if (error) throw error
  return {
    id: data.id,
    amount: Number(data.amount || 0),
    category: data.category,
    description: data.description,
    icon: data.icon,
    date: (data.date || '').slice(0, 10),
    created_at: data.created_at,
  }
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
  return { id }
}
