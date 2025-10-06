import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaskList } from '@/components/home/TaskList'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

describe('TaskList rendering', () => {
  it('shows empty state', () => {
    render(
      <TaskList
        tasks={[]}
        onChangePriority={() => {}}
        onDelete={() => {}}
      />
    )
    expect(screen.getByTestId('tasks-empty')).toBeInTheDocument()
  })

  it('renders tasks and allows priority change + delete', () => {
    const changeSpy = vi.fn()
    const delSpy = vi.fn()
    const tasks = [
      { id: '1', title: 'Alpha', priority: 'medium' },
      { id: '2', title: 'Beta', priority: 'low' },
    ] as any
    render(
      <TaskList
        tasks={tasks}
        onChangePriority={changeSpy}
        onDelete={delSpy}
      />
    )
    expect(screen.queryByTestId('tasks-empty')).toBeNull()
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'high' } })
    expect(changeSpy).toHaveBeenCalledWith('1', 'high')

    // Confirm dialog is called; stub confirm
    const origConfirm = window.confirm
    window.confirm = () => true
    const delButtons = screen.getAllByRole('button', { name: 'common.delete' })
    fireEvent.click(delButtons[0])
    expect(delSpy).toHaveBeenCalledWith('1')
    window.confirm = origConfirm
  })
})
