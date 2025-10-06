import { useEffect, useMemo, useState } from 'react'
import { getJson, setJson } from './storage'
import { getMonthlyBudget, setMonthlyBudget } from './settings'

export type ExpenseItem = {
  id: string
  amount: number
  category: string
  description: string
  icon?: string
  date: string // YYYY-MM-DD
}

const EXP_KEY = 'expenses.items'

function readAll(): ExpenseItem[] {
  return getJson<ExpenseItem[]>(EXP_KEY, []) || []
}
function writeAll(items: ExpenseItem[]) {
  setJson(EXP_KEY, items)
}

function ym(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function getCurrentMonthExpenses(): ExpenseItem[] {
  const now = new Date()
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return readAll().filter(e => ym(e.date) === current)
}

export function computeCurrentMonthTotal(): number {
  return getCurrentMonthExpenses().reduce((s, e) => s + Number(e.amount || 0), 0)
}

export function useExpenses() {
  const [items, setItems] = useState<ExpenseItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [monthlyBudget, setBudgetState] = useState<number>(getMonthlyBudget())

  useEffect(() => {
    try {
      setItems(readAll())
    } catch (e: any) {
      setError(e?.message || 'Load error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refetch = () => {
    try {
      setItems(readAll())
    } catch (e: any) {
      setError(e?.message || 'Load error')
    }
  }

  const add = async (payload: Omit<ExpenseItem, 'id'>) => {
    const id = crypto?.randomUUID?.() || String(Date.now())
    const item: ExpenseItem = { id, ...payload }
    const next = [...items, item]
    setItems(next)
    writeAll(next)
    return item
  }

  const update = async (id: string, patch: Partial<ExpenseItem>) => {
    const next = items.map(it => (it.id === id ? { ...it, ...patch } : it))
    setItems(next)
    writeAll(next)
  }

  const remove = async (id: string) => {
    const next = items.filter(it => it.id !== id)
    setItems(next)
    writeAll(next)
  }

  const setBudget = async (v: number) => {
    setMonthlyBudget(v)
    setBudgetState(v)
  }

  const currentMonth = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }, [])

  const currentMonthTotal = useMemo(
    () => items.filter(e => ym(e.date) === currentMonth).reduce((s, e) => s + Number(e.amount || 0), 0),
    [items, currentMonth]
  )

  return {
    items,
    monthlyBudget,
    isLoading,
    error,
    refetch,
    add,
    update,
    remove,
    setBudget,
    currentMonth,
    currentMonthTotal,
  }
}
