import { loadPersisted, GLOBAL_STATE_KEY, initialState } from '@/state/global/store'

describe('persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loads persisted expenses and todos', () => {
    const mock = {
      ...initialState,
      expenses: { ...initialState.expenses, items: [{ id: 'x', amount: 5, category: 'food', description: 'snack', icon: '🍎', date: '2024-01-01' }] },
      todos: { ...initialState.todos, items: [{ id: 't1', text: 'Hi', completed: false, priority: 'low', created_at: new Date().toISOString() }] }
    }
    localStorage.setItem(GLOBAL_STATE_KEY, JSON.stringify(mock))
    const loaded = loadPersisted()
    expect(loaded.expenses.items.length).toBe(1)
    expect(loaded.todos.items.length).toBe(1)
  })
})
