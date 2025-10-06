import { describe, it, expect } from 'vitest'
import { rootReducer, initialState } from '@/state/global/store'
import type { Expense } from '@/lib/supabase'

describe('expenses error state', () => {
  it('sets and clears error', () => {
    const withError = rootReducer(initialState, { type: 'expenses/error', error: 'load_failed' })
    expect(withError.expenses.error).toBe('load_failed')
    const cleared = rootReducer(withError, { type: 'expenses/set', items: [] })
    expect(cleared.expenses.error).toBe(null)
  })

  it('does not affect items when setting error', () => {
    const item: Expense = { id: 'e1', amount: 9, category: 'Other', description: 'x', icon: '💳', date: '2024-01-05' }
    const withItem = rootReducer(initialState, { type: 'expenses/add', item })
    const withError = rootReducer(withItem, { type: 'expenses/error', error: 'x' })
    expect(withError.expenses.items.length).toBe(1)
  })
})
