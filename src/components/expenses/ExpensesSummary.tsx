import React from 'react'
// Ensure you import the correct hook that exposes getCurrentMonthExpenses
import { useExpenses } from '@/hooks/useExpenses' // or the actual path where your hook is exported

export function ExpensesSummary() {
  // RIGHT: invoke the hook
  const {
    getCurrentMonthExpenses,
    getCurrentMonthTotal,
    monthlyBudget,
    // ...other properties you use...
  } = useExpenses()

  // Optional runtime guard to prevent hard crash if something is miswired
  const safeGetCurrentMonthExpenses =
    typeof getCurrentMonthExpenses === 'function' ? getCurrentMonthExpenses : () => []

  const monthExpenses = safeGetCurrentMonthExpenses()
  const monthTotal = typeof getCurrentMonthTotal === 'function' ? getCurrentMonthTotal() : 0

  // ...existing code that renders using monthExpenses, monthTotal, monthlyBudget...
}
