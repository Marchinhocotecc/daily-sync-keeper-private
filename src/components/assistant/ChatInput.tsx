import React, { useCallback, useRef, useState } from 'react'
import { LifeSyncButton } from '@/components/LifeSyncButton'
import { formatMessage } from './formatMessage'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled?: boolean
  placeholder?: string
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled, placeholder }) => {
  const [value, setValue] = useState('')
  const taRef = useRef<HTMLTextAreaElement | null>(null)

  const doSend = useCallback(() => {
    const formatted = formatMessage(value)
    if (!formatted) return
    onSend(formatted)
    setValue('')
    if (taRef.current) {
      taRef.current.style.height = 'auto'
    }
  }, [value, onSend])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!disabled) doSend()
    }
  }

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  return (
    <div className="flex gap-2 items-end">
      <textarea
        ref={taRef}
        className="flex-1 resize-none text-sm rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        disabled={disabled}
        rows={1}
        aria-label={placeholder}
      />
      <LifeSyncButton
        size="sm"
        onClick={doSend}
        disabled={disabled || !formatMessage(value)}
      >
        Invia
      </LifeSyncButton>
    </div>
  )
}

export default ChatInput
