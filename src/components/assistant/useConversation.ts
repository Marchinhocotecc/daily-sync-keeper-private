import { useCallback, useState } from 'react'
import { formatMessage } from './formatMessage'

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  message: string
  created_at?: string
  metadata?: any
}

const id = () => {
  try { return crypto.randomUUID() } catch { return Math.random().toString(36).slice(2) }
}

export function useConversation(initial?: ConversationMessage[]) {
  const [messages, setMessages] = useState<ConversationMessage[]>(initial || [])
  const [loading, setLoading] = useState(false)

  const addUserMessage = useCallback((text: string) => {
    const m = formatMessage(text)
    if (!m) return
    setMessages(prev => [...prev, { id: id(), role: 'user', message: m }])
  }, [])

  const addAssistantMessage = useCallback((text: string, meta?: any) => {
    setMessages(prev => [...prev, { id: id(), role: 'assistant', message: text, metadata: meta }])
  }, [])

  return {
    messages,
    loading,
    setLoading,
    addUserMessage,
    addAssistantMessage,
    reset: () => setMessages([]),
  }
}
