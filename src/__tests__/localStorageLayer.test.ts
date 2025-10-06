import { localStorageLayer, initialState, GLOBAL_STATE_KEY, type GlobalState } from '@/state/global/store'

describe('localStorageLayer', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves state to localStorage', () => {
    const mock: GlobalState = {
      ...initialState,
      todos: { items: [{ id: 't-1', text: 'Task', completed: false, priority: 'low', created_at: new Date().toISOString() }] },
    }
    localStorageLayer.setState(mock)
    const raw = localStorage.getItem(GLOBAL_STATE_KEY)
    expect(raw).toBeTruthy()
    const parsed = raw ? JSON.parse(raw) : null
    expect(parsed.todos.items.length).toBe(1)
  })

  it('retrieves state from localStorage', () => {
    const mock: GlobalState = {
      ...initialState,
      expenses: {
        ...initialState.expenses,
        items: [{ id: 'e-1', amount: 10, category: 'food', description: 'Snack', icon: '🍎', date: '2024-01-01' }],
        monthlyBudget: 100,
        error: null,
      },
    }
    localStorage.setItem(GLOBAL_STATE_KEY, JSON.stringify(mock))
    const loaded = localStorageLayer.getState()
    expect(loaded.expenses.items.length).toBe(1)
    expect(loaded.expenses.monthlyBudget).toBe(100)
  })

  it('clears state from localStorage', () => {
    localStorage.setItem(GLOBAL_STATE_KEY, JSON.stringify(initialState))
    localStorageLayer.clearState()
    expect(localStorage.getItem(GLOBAL_STATE_KEY)).toBeNull()
    const loaded = localStorageLayer.getState()
    expect(loaded).toEqual(initialState)
  })
})
