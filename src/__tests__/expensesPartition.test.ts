import { describe, it, expect } from 'vitest'
import { partitionExpenses } from '@/features/expenses/partition'
import type { Expense } from '@/lib/supabase'

describe('partitionExpenses', () => {
  const mock: Expense[] = [
    { id: '1', amount: 10, category: 'Food', description: 'A', icon: '🍽️', date: '2024-01-05' },
    { id: '2', amount: 20, category: 'Transport', description: 'B', icon: '🚌', date: '2024-01-03' },
    { id: '3', amount: 30, category: 'Other', description: 'C', icon: '💳', date: '2024-01-10' },
    { id: '4', amount: 40, category: 'Shopping', description: 'D', icon: '🛍️', date: '2024-01-01' },
  ]

  it('splits by today and sorts ascending', () => {
    const today = '2024-01-05'
    const { recent, scheduled } = partitionExpenses(mock, today)
    expect(recent.map(e => e.id)).toEqual(['4', '2', '1']) // <= 2024-01-05
    expect(scheduled.map(e => e.id)).toEqual(['3'])        // >  2024-01-05
  })

  it('all scheduled if all dates are in future', () => {
    const today = '2023-12-31'
    const { recent, scheduled } = partitionExpenses(mock, today)
    expect(recent.length).toBe(0)
    expect(scheduled.length).toBe(4)
  })
})
