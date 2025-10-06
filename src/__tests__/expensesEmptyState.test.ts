import { initialState, rootReducer } from '@/state/global/store'

describe('expenses empty state logic', () => {
  it('starts empty', () => {
    expect(initialState.expenses.items.length).toBe(0)
  })
  it('adds then contains one expense', () => {
    const next = rootReducer(initialState, { type: 'expenses/add', item: { id: 'e1', amount: 9, category: 'Other', description: 'test', icon: '💳', date: '2024-01-05' } as any })
    expect(next.expenses.items.length).toBe(1)
  })
})
