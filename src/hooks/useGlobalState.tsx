import { useMemo } from 'react'
import { useTodos } from '@/hooks/useTodos'
import { useCalendarEvents } from '@/hooks/useCalendarEvents'
import { useExpenses } from '@/hooks/useExpenses'
import { toArray } from '@/utils/toArray'

export const useGlobalState = () => {
  const t = useTodos()
  const c = useCalendarEvents()
  const e = useExpenses()

  const todos = toArray(t?.todos)
  const events = toArray(c?.events)
  const expenses = toArray(e?.expenses)
  const monthlyBudget = typeof e?.monthlyBudget === 'number' ? e.monthlyBudget : 0

  const loading = !!(t?.loading || c?.loading || e?.loading)

  return useMemo(() => ({
    todos,
    events,
    expenses,
    monthlyBudget,
    loading,
    addTodo: t?.addTodo,
    toggleTodo: t?.toggleTodo,
    deleteTodo: t?.deleteTodo,
    addEvent: c?.addEvent,
    deleteEvent: c?.deleteEvent,
    getEventsForDate: c?.getEventsForDate,
    addExpense: e?.addExpense
  }), [todos, events, expenses, monthlyBudget, loading, t, c, e])
}
