import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChatWindow } from '@/components/assistant/ChatWindow'
import { ChatInput } from '@/components/assistant/ChatInput'
import { LifeSyncCard } from '@/components/LifeSyncCard'
import { LifeSyncButton } from '@/components/LifeSyncButton'
import { useTasks } from '@/hooks/useTasks'
import { useCalendarEvents } from '@/hooks/useCalendarEvents'
import { useExpenses } from '@/hooks/useExpenses'
import { useToast } from '@/hooks/use-toast'

// Diagnostic: confirm module evaluation (helps when dynamic import returns 500)
console.debug('[AssistantPage] module loaded')

type AssistantMessage = {
  id: string
  role: 'user' | 'assistant'
  message: string
  created_at?: string
  metadata?: any
}

type AssistantResponse = {
  messages: AssistantMessage[]
  actions?: Array<{ type: string; status: 'ok' | 'error'; message?: string }>
}

const genId = () => {
  try {
    return crypto.randomUUID()
  } catch {
    return Math.random().toString(36).slice(2)
  }
}

const AssistantPage: React.FC = () => {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { refetch: refetchTasks } = useTasks()
  const { refetch: refetchEvents } = useCalendarEvents()
  const { refetch: refetchExpenses } = useExpenses()
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // Initial greeting (only once)
  useEffect(() => {
    setMessages(m => (m.length ? m : [{
      id: 'greet',
      role: 'assistant',
      message: t('assistant.greeting', 'Ciao! Sono il tuo assistente. Come posso aiutarti?')
    }]))
  }, [t])

  // (Optional) load persisted history (lazy) — endpoint could be extended
  useEffect(() => {
    // Placeholder for future GET /api/assistant?history=1
  }, [])

  const runRefetches = (actionTypes: string[]) => {
    if (actionTypes.some(a => a.includes('task'))) refetchTasks?.()
    if (actionTypes.some(a => a.includes('event'))) refetchEvents?.()
    if (actionTypes.some(a => a.includes('expense'))) refetchExpenses?.()
  }

  const send = useCallback(async (text: string) => {
    if (!text.trim()) return
    // Push user message locally
    const userMsg: AssistantMessage = { id: genId(), role: 'user', message: text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: text }),
        signal: abortRef.current.signal
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: AssistantResponse = await res.json()
      if (data.messages?.length) {
        setMessages(prev => [...prev, ...data.messages])
      }
      if (data.actions?.length) {
        const ok = data.actions.filter(a => a.status === 'ok')
        if (ok.length) {
          toast({ title: t('assistant.actionsApplied', 'Azioni applicate'), description: ok.map(a => a.type).join(', ') })
          runRefetches(ok.map(a => a.type))
        }
        const failed = data.actions.filter(a => a.status === 'error')
        if (failed.length) {
          toast({ title: t('assistant.actionErrors', 'Alcune azioni non riuscite'), description: failed.map(a => a.type).join(', '), variant: 'destructive' as any })
        }
      }
    } catch (e: any) {
      console.error('[AssistantPage.send] error', e)
      setMessages(prev => [...prev, {
        id: genId(),
        role: 'assistant',
        message: t('assistant.errorGeneric', 'Si è verificato un errore. Riprova più tardi.')
      }])
    } finally {
      setLoading(false)
    }
  }, [t, toast])

  const cancel = () => {
    abortRef.current?.abort()
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mobile-padding pt-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('assistant.title', 'Assistente')}</h1>
            <p className="text-sm text-muted-foreground">{t('assistant.subtitle', 'Organizza attività, eventi e spese tramite linguaggio naturale.')}</p>
          </div>
          {loading && (
            <LifeSyncButton size="sm" variant="outline" onClick={cancel}>
              {t('assistant.cancel', 'Annulla')}
            </LifeSyncButton>
          )}
        </div>

        <LifeSyncCard className="flex flex-col h-[70vh]">
          <ChatWindow messages={messages} loading={loading} />
          <ChatInput disabled={loading} onSend={send} placeholder={t('assistant.inputPlaceholder', 'Scrivi un messaggio...')} />
        </LifeSyncCard>
      </div>
    </div>
  )
}

export default AssistantPage
