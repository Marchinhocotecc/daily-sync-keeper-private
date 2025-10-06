export type AssistantChatMessage = {
  id: string
  role: 'user' | 'assistant'
  message: string
  created_at?: string
  metadata?: any
}

export type AssistantActionResult = {
  type: string
  status: 'ok' | 'error'
  message?: string
}

export type AssistantApiResponse = {
  messages: AssistantChatMessage[]
  actions?: AssistantActionResult[]
}
