/**
 * Assistant utilities:
 * - Build a compact, structured system prompt with user's context.
 * - Parse JSON command blocks from AI replies.
 * - Execute supported commands (placeholder).
 *
 * Commands are provided inside a fenced ```json block. Either a single object:
 * { "action": "create_expense", "payload": { ... } }
 * or an array of such objects.
 */

// Lightweight status exposure (for UI spinners/messages)
let assistantApiLoading = false
let assistantApiError: string | null = null
function setAssistantLoading(v: boolean) {
  assistantApiLoading = v
}
function setAssistantError(msg: string | null) {
  assistantApiError = msg
  if (msg) console.error('[assistant] error:', msg)
}
export function getAssistantApiStatus() {
  return { loading: assistantApiLoading, error: assistantApiError }
}

export type UiTodo = { id?: string; text: string; completed?: boolean; priority?: 'low' | 'medium' | 'high'; created_at?: string }
export type UiExpense = { id?: string; amount: number; category: string; description?: string; icon?: string; date: string }
export type UiEvent = { id?: string; title: string; date: string; time: string; duration: number; color?: string }

export interface ContextData {
  language?: string
  appName?: string
  todos?: UiTodo[]
  expenses?: UiExpense[]
  events?: UiEvent[]
}

function toArray<T>(v: T | T[] | null | undefined): T[] {
  if (!v) return []
  return Array.isArray(v) ? v : [v]
}

export function buildSystemPrompt(ctx: ContextData): string {
  const lang = ctx.language || 'en'
  const app = ctx.appName || 'Daily Sync Keeper'

  const recentTodos = toArray(ctx.todos).slice(-10)
  const recentExpenses = toArray(ctx.expenses).slice(-10)
  const recentEvents = toArray(ctx.events).slice(-10)

  const todoLines = recentTodos.map(t => `- [${t.completed ? 'x' : ' '}] ${t.text} (prio:${t.priority || 'n/a'})`).join('\n')
  const expLines = recentExpenses.map(e => `- ${e.date} ${e.category} ${e.amount} "${e.description || ''}" ${e.icon || ''}`.trim()).join('\n')
  const evLines = recentEvents.map(e => `- ${e.date} ${e.time} ${e.title} (${e.duration}m)`).join('\n')

  return [
    `You are a helpful assistant for ${app}.`,
    `Language: ${lang}`,
    `Recent todos:\n${todoLines || '(none)'}`,
    `Recent expenses:\n${expLines || '(none)'}`,
    `Recent events:\n${evLines || '(none)'}`,
    `When you need to act, return a fenced json block with { "action": ..., "payload": ... }.`,
  ].join('\n\n')
}

type Command =
  | { action: 'create_todo'; payload: Partial<UiTodo> & { text: string } }
  | { action: 'update_todo'; payload: Partial<UiTodo> & { id: string } }
  | { action: 'create_expense'; payload: UiExpense }
  | { action: 'update_expense'; payload: Partial<UiExpense> & { id: string } }
  | { action: 'create_event'; payload: UiEvent }
  | { action: 'update_event'; payload: Partial<UiEvent> & { id: string } }
  | { action: 'track_wellness'; payload: { metric: 'steps' | 'calories' | 'mood' | 'energy'; value: number; date: string } }
  | { action: 'update_wellness'; payload: { id: string; value?: number; date?: string; metric?: 'steps' | 'calories' | 'mood' | 'energy' } }

function extractJsonBlocks(text: string): any[] {
  const out: any[] = []
  if (!text) return out
  const re = /```json\s*([\s\S]*?)\s*```/gim
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const raw = m[1]
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) out.push(...parsed)
      else out.push(parsed)
    } catch {
      // ignore invalid blocks
    }
  }
  return out
}

async function execCommand(_cmd: Command): Promise<string> {
  // Placeholder execution. Integrate with app stores as needed.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return 'ok'
}

export async function tryExecuteCommandsFromText(text: string): Promise<string[]> {
  const cmds = extractJsonBlocks(text) as Command[]
  if (!cmds.length) return []
  setAssistantLoading(true)
  setAssistantError(null)
  try {
    const results: string[] = []
    for (const c of cmds) {
      const r = await execCommand(c as any)
      results.push(r)
    }
    return results
  } catch (e: any) {
    setAssistantError(e?.message || 'assistant_exec_failed')
    return []
  } finally {
    setAssistantLoading(false)
  }
}
