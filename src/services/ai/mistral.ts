import { MISTRAL_API_URL } from '@/config/env'

export type Role = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: Role
  content: string
}

export interface ChatCompleteParams {
  baseUrl?: string
  apiKey: string
  model: string
  messages: ChatMessage[]
  temperature?: number
  maxRetries?: number
  signal?: AbortSignal
}

const DEFAULT_BASE = MISTRAL_API_URL

function normalizeBase(base: string): string {
  let b = (base || DEFAULT_BASE).trim().replace(/\/+$/, '')
  if (!/\/v\d+$/.test(b)) b = `${b}/v1`
  return b
}

async function doFetchJson(url: string, init: RequestInit) {
  const res = await fetch(url, init)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`HTTP ${res.status} ${res.statusText} - ${text}`) as any
    err.status = res.status
    throw err
  }
  return res.json()
}

export async function chatComplete(params: ChatCompleteParams): Promise<string> {
  const {
    apiKey,
    model,
    messages,
    temperature = 0.2,
    maxRetries = 2,
    signal,
  } = params

  if (!apiKey) throw new Error('missing_api_key')

  const base = normalizeBase(params.baseUrl || DEFAULT_BASE)
  const endpoint = `${base}/chat/completions`

  const body = JSON.stringify({
    model,
    messages,
    temperature,
    safe_prompt: true,
    stream: false,
  })

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }

  let attempt = 0
  let lastError: any

  while (attempt <= maxRetries) {
    try {
      const data = await doFetchJson(endpoint, { method: 'POST', headers, body, signal })

      // Mistral responses usually: { choices: [{ message: { content: string } }] }
      const content =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.delta?.content ??
        data?.output_text ??
        ''

      if (typeof content !== 'string' || content.trim() === '') {
        throw new Error('empty_response')
      }
      return content
    } catch (e: any) {
      lastError = e
      // Retry on network/server errors; avoid retry on 4xx except 429
      const status = e?.status
      const retriable = e?.name === 'AbortError' ? false : !status || status >= 500 || status === 429
      if (!retriable || attempt === maxRetries) break
      const backoff = Math.min(1500 * Math.pow(2, attempt), 5000)
      await new Promise((r) => setTimeout(r, backoff))
      attempt++
    }
  }

  throw lastError || new Error('chat_complete_failed')
}
