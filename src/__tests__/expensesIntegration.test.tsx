import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SpesePage from '@/pages/SpesePage'
import { GlobalStateProvider } from '@/state/global/GlobalStateProvider'

// In-memory DB
let expenses: any[] = []
const now = new Date()
const CUR_YEAR = now.getFullYear()
const CUR_MONTH = now.getMonth() + 1
let budgets: any[] = [{ id: 'b1', user_id: 'u1', year: CUR_YEAR, month: CUR_MONTH, amount: 500 }]

vi.mock('@/lib/supabaseClient', () => ({
  default: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signOut: vi.fn().mockResolvedValue({}),
    },
    from: (table: string) => {
      if (table === 'expenses') {
        return {
          select: () => ({
            order: () => ({ data: [...expenses], error: null }),
            single: () => ({ data: expenses[0] || null, error: null }),
          }),
          insert: (rows: any[]) => ({
            select: () => ({
              single: () => {
                const row = { ...rows[0], id: String(Date.now()) }
                expenses.push(row)
                return { data: row, error: null }
              },
            }),
          }),
          update: (_p: any) => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }) }),
          delete: () => ({ eq: (_c: string, id: string) => { expenses = expenses.filter(e => e.id !== id); return { error: null } } }),
        }
      }
      if (table === 'budgets') {
        const filters: Record<string, any> = {}
        const builder = {
          eq: (col: string, val: any) => { filters[col] = val; return builder },
          maybeSingle: () => {
            const match = budgets.find(b =>
              (filters.user_id ? b.user_id === filters.user_id : true) &&
              (filters.year ? b.year === filters.year : true) &&
              (filters.month ? b.month === filters.month : true)
            )
            return { data: match || null, error: null }
          },
          select: () => builder,
          upsert: (row: any) => {
            const idx = budgets.findIndex(b => b.user_id === row.user_id && b.year === row.year && b.month === row.month)
            if (idx === -1) budgets.push({ id: 'bx', ...row })
            else budgets[idx] = { ...budgets[idx], ...row }
            return { select: () => ({ maybeSingle: () => ({ data: { id: 'bx', ...row }, error: null }) }) }
          },
        }
        return builder
      }
      return {}
    },
  },
}))

const renderPage = () =>
  render(
    <GlobalStateProvider>
      <SpesePage />
    </GlobalStateProvider>
  )

describe('SpesePage integration', () => {
  beforeEach(() => {
    expenses = []
    budgets = [{ id: 'b1', user_id: 'u1', year: CUR_YEAR, month: CUR_MONTH, amount: 500 }]
  })

  it('adds an expense and updates list & chart', async () => {
    renderPage()
    fireEvent.click(screen.getByTestId('add-expense-toggle'))
    const amountInput = screen.getByPlaceholderText(/./i) as HTMLInputElement // amount placeholder i18n unknown
    fireEvent.change(amountInput, { target: { value: '25' } })
    fireEvent.change(screen.getByPlaceholderText(/descrizione/i), { target: { value: 'Test expense' } })
    fireEvent.click(screen.getByTestId('submit-expense'))

    await waitFor(() => expect(screen.getByTestId('recent-expenses').textContent).toMatch(/25\.00/))
    await waitFor(() => expect(screen.getByTestId('expenses-chart')).toBeInTheDocument())
  })
})
