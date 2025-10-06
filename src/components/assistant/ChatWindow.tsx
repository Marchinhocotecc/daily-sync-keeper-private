import React, { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'

export interface ChatWindowProps {
  messages: Array<{ id: string; role: 'user' | 'assistant'; message: string; created_at?: string }>
  loading?: boolean
  title?: string
  footer?: React.ReactNode
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, loading, title = 'Chat', footer }) => {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [messages, loading])

  return (
    <div className="flex flex-col h-full w-full">
      <div className="px-3 pt-3 pb-2 border-b border-border/60">
        <h2 className="text-sm font-medium tracking-wide text-foreground">{title}</h2>
      </div>
      <div
        ref={ref}
        className="flex-1 overflow-y-auto scroll-smooth space-y-3 px-3 py-3"
      >
        {messages.map(m => (
          <MessageBubble
            key={m.id}
            role={m.role}
            text={m.message}
            ts={m.created_at}
          />
        ))}
        {loading && (
          <div data-testid="chat-loading">
            <MessageBubble role="assistant" text="…" />
          </div>
        )}
      </div>
      {footer && (
        <div className="border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  )
}
