import { useTodosSlice } from '@/state/global/GlobalStateProvider'

export const useTodos = () => {
  const { todos, loading, addTodo, toggleTodo, deleteTodo, refetch } = useTodosSlice()
  // todos is now always a normalized array (never an object with items)
  return { todos, loading, addTodo, toggleTodo, deleteTodo, refetch }
}