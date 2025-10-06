import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { NavigationLayout } from '@/routes/NavigationLayout'
import { lazyWithRetry } from '@/utils/lazyWithRetry'
const HomePage = lazyWithRetry(() => import('@/pages/HomePage'), { id: 'home' })
const CalendarPage = lazyWithRetry(() => import('@/pages/CalendarPage'), { id: 'calendar' })
const ExpensesPage = lazyWithRetry(() => import('@/pages/ExpensesPage'), { id: 'expenses' })
const AssistantPage = lazyWithRetry(() => import('@/pages/AssistantPage'), { id: 'assistant' })
const SettingsPage = lazyWithRetry(() => import('@/pages/SettingsPage'), { id: 'settings' })
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary'
import '@/i18n/registerPageResources'

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <RouteErrorBoundary>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route element={<NavigationLayout />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/assistant" element={<AssistantPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
    </BrowserRouter>
  )
}
