import { rootReducer, initialState } from '@/state/global/store'
import type { Todo, Expense } from '@/lib/supabase'

describe('global reducer', () => {
  it('adds a todo', () => {
    const todo: Todo = { id: '1', text: 'Test', completed: false, priority: 'medium', created_at: new Date().toISOString() }
    const next = rootReducer(initialState, { type: 'todos/add', item: todo })
    expect(next.todos.items.length).toBe(1)
    expect(next.todos.items[0].text).toBe('Test')
  })

  it('toggles a todo', () => {
    const todo: Todo = { id: '1', text: 'Test', completed: false, priority: 'medium', created_at: new Date().toISOString() }
    const withTodo = rootReducer(initialState, { type: 'todos/add', item: todo })
    const toggled = rootReducer(withTodo, { type: 'todos/update', id: '1', changes: { completed: true } })
    expect(toggled.todos.items[0].completed).toBe(true)
  })

  it('adds an expense', () => {
    const expense: Expense = { id: 'e1', amount: 10, category: 'food', description: 'snack', icon: '🍎', date: '2024-01-01' }
    const next = rootReducer(initialState, { type: 'expenses/add', item: expense })
    expect(next.expenses.items[0].amount).toBe(10)
  })

  it('updates monthly budget', () => {
    const next = rootReducer(initialState, { type: 'expenses/budget', monthlyBudget: 2500 })
    expect(next.expenses.monthlyBudget).toBe(2500)
  })

  it('sorts calendar events by date+time', () => {
    const ev1 = { id: 'e1', title: 'Later', date: '2024-01-01', time: '15:00', duration: 30, color: '#fff' }
    const ev2 = { id: 'e2', title: 'Earlier', date: '2024-01-01', time: '09:00', duration: 30, color: '#fff' }
    const s1 = rootReducer(initialState, { type: 'calendar/add', item: ev1 as any })
    const s2 = rootReducer(s1, { type: 'calendar/add', item: ev2 as any })
    expect(s2.calendar.items[0].id).toBe('e2')
  })
})
