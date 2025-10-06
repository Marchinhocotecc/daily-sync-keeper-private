import React, { useState } from 'react'
import { AI_API_KEY, MISTRAL_API_URL, MISTRAL_MODEL } from '@/config/env'
import { LifeSyncCard } from '@/components/LifeSyncCard'
import { LifeSyncButton } from '@/components/LifeSyncButton'
import { useTranslation } from 'react-i18next'
import { chatComplete } from '@/services/ai/mistral'
import { buildSystemPrompt, tryExecuteCommandsFromText } from '@/services/assistant'
import { useTodosSlice, useExpensesSlice, usePreferencesSlice } from '@/state/global/GlobalStateProvider'

interface Msg { role: 'user' | 'assistant'; content: string }

const AssistantPanel: React.FC = () => {
  const { t } = useTranslation()
  const { todos } = useTodosSlice()
  const { expenses } = useExpensesSlice()
  const { language } = usePreferencesSlice()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])

  const disabled = !AI_API_KEY

  const send = async () => {
    if (!input.trim() || disabled) return
    const userMsg: Msg = { role: 'user', content: input.trim() }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      if (!AI_API_KEY) throw new Error('missing_api_key')

      const system = buildSystemPrompt({
        language,
        appName: 'Daily Sync Keeper',
        todos: todos?.items || [],
        expenses: expenses?.items || [],
      })

      const chat = [
        { role: 'system' as const, content: system },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        userMsg,
      ]

      const replyText = await chatComplete({
        baseUrl: MISTRAL_API_URL,
        apiKey: AI_API_KEY,
        model: MISTRAL_MODEL,
        messages: chat,
        temperature: 0.2,
        maxRetries: 2,
      })

      setMessages(m => [...m, { role: 'assistant', content: replyText }])

      const actionResults = await tryExecuteCommandsFromText(replyText)
      if (actionResults.length) {
        setMessages(m => [...m, { role: 'assistant', content: actionResults.join('\n') }])
      }
    } catch (e: any) {
      setError(
        e?.message === 'missing_api_key'
          ? t('assistant.missingKey')
          : e?.name === 'AbortError'
            ? t('assistant.errorGeneric')
            : t('assistant.errorGeneric')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('assistant.title')}</h1>
      <LifeSyncCard className="space-y-4">
        <div className="h-64 overflow-y-auto space-y-3 pr-1">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">{t('assistant.empty')}</p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-auto max-w-[85%]'
                  : 'bg-accent/40 text-foreground mr-auto max-w-[85%]'
              }`}
            >
              {m.content}
            </div>
          ))}
          {loading && <div className="text-xs text-muted-foreground">{t('assistant.loading')}</div>}
        </div>
        {error && <div className="text-xs text-destructive">{error}</div>}
        {disabled && (
          <div className="text-xs text-muted-foreground">
            {t('assistant.missingKeyHint')}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send() }}
            placeholder={t('assistant.inputPlaceholder') || ''}
            className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm"
            disabled={loading || disabled}
          />
          <LifeSyncButton
            variant="primary"
            onClick={send}
            disabled={loading || !input.trim() || disabled}
          >
            {loading ? t('assistant.sending') : t('assistant.send')}
          </LifeSyncButton>
        </div>
      </LifeSyncCard>
    </div>
  )
}

export default AssistantPanel
