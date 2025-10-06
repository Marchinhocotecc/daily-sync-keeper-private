import React from 'react'

export interface MessageBubbleProps {
  role: 'user' | 'assistant'
  text: string
  ts?: string
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ role, text, ts }) => {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
        }`}
      >
        {text}
        {ts && (
          <div className="text-[10px] opacity-60 mt-1">
            {new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  )
}
