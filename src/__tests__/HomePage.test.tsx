import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HomePage from '@/pages/HomePage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'

// Minimal i18n mock
const tFn = (k: string) => k
const fakeI18n: any = { t: tFn, language: 'it' }

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: tFn }),
}))

// Mock calendar slice provider needs: wrap with empty object
vi.mock('@/state/global/GlobalStateProvider', () => ({
  useCalendarSlice: () => ({ events: [], getEventsByDay: () => [] }),
}))

// Hook mock
const addTaskMock = vi.fn()
const updateTaskMock = vi.fn()
const deleteTaskMock = vi.fn()

vi.mock('@/hooks/useTasks', () => ({
  useTasks: () => ({
    tasks: null,
    isLoading: false,
    isError: false,
    addTask: addTaskMock,
    updateTask: updateTaskMock,
    deleteTask: deleteTaskMock,
    adding: false,
  }),
}))

const renderPage = () =>
  render(
    <I18nextProvider i18n={fakeI18n}>
      <QueryClientProvider client={new QueryClient()}>
        <HomePage />
      </QueryClientProvider>
    </I18nextProvider>
  )

describe('HomePage', () => {
  beforeEach(() => {
    addTaskMock.mockReset()
  })

  it('renders without crashing when tasks is null', () => {
    renderPage()
    expect(screen.getByText('home.tasks.title')).toBeInTheDocument()
  })

  it('shows empty state when no tasks', () => {
    renderPage()
    expect(screen.getByTestId('tasks-empty')).toBeInTheDocument()
  })

  it('calls addTask on submit', () => {
    renderPage()
    fireEvent.click(screen.getByTestId('add-task-button'))
    const input = screen.getByPlaceholderText('home.tasks.form.titlePlaceholder')
    fireEvent.change(input, { target: { value: 'New Task' } })
    fireEvent.click(screen.getByRole('button', { name: 'home.tasks.form.submit' }))
    expect(addTaskMock).toHaveBeenCalledWith('New Task', 'medium')
  })
})
