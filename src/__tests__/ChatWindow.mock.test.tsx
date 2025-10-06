import React from 'react'
import { render, screen } from '@testing-library/react'
import { ChatWindow } from '@/components/assistant/ChatWindow'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

describe('ChatWindow', () => {
  it('renders messages', () => {
    render(
      <ChatWindow
        loading={false}
        messages={[
          { id: '1', role: 'user', message: 'Hello' },
          { id: '2', role: 'assistant', message: 'Hi there!' },
        ]}
      />
    )
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('Hi there!')).toBeInTheDocument()
  })

  it('shows loading indicator', () => {
    render(
      <ChatWindow
        loading
        messages={[]}
      />
    )
    expect(screen.getByTestId('chat-loading')).toBeInTheDocument()
  })
})
