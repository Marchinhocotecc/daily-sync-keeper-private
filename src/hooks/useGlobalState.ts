import { useTodos } from '@/hooks/useTodos'
import { useCalendarEvents } from '@/hooks/useCalendarEvents'
import { useExpenses } from '@/hooks/useExpenses'

export const useGlobalState = () => {
  const { todos, loading: loadingTodos, addTodo, toggleTodo, deleteTodo, refetch: refetchTodos } = useTodos()
  const { events, loading: loadingEvents, addEvent, deleteEvent, getEventsForDate, refetch: refetchEvents } = useCalendarEvents()
  const { expenses, loading: loadingExpenses, addExpense, monthlyBudget, refetch: refetchExpenses } = useExpenses()

  return {
    todos,
    events,
    expenses,
    monthlyBudget,
    loading: loadingTodos || loadingEvents || loadingExpenses,
    // actions
    addTodo,
    toggleTodo,
    deleteTodo,
    addEvent,
    deleteEvent,
    getEventsForDate,
    addExpense,
    // refetch
    refetchTodos,
    refetchEvents,
    refetchExpenses,
  }
}
