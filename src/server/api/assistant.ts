/* Serverless handler (adapt to your platform export style)
   Vite dev: use express/fastify middleware wrapper
   Netlify/Vercel: export default handler(req,res)
*/
import type { IncomingMessage, ServerResponse } from 'http'
import { createClient } from '@supabase/supabase-js'

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || process.env.VITE_MISTRAL_API_KEY
const MISTRAL_API_URL = process.env.MISTRAL_API_URL || 'https://api.mistral.ai/v1'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
// Add import.meta.env fallback for local dev bundlers
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  ((typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_SUPABASE_URL) || '')

// Minimal guard: never run privileged ops without keys
const admin = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null

type ActionResult = { type: string; status: 'ok' | 'error'; message?: string }

interface Intent {
  type: 'create_task' | 'create_event' | 'create_expense'
  payload: any
}

// Simple regex fallback if no real AI available or key missing
function ruleBasedIntents(userText: string): Intent[] {
  const intents: Intent[] = []
  const lower = userText.toLowerCase()

  // Task
  const taskMatch = lower.match(/crea( una)? task chiamata ([^]+?)( domani| tomorrow)?( alle (\d{1,2})([:.](\d{2}))?)?$/)
  if (taskMatch) {
    const title = taskMatch[2].trim()
    const hour = taskMatch[5] ? taskMatch[5].padStart(2,'0') : '09'
    const date = taskMatch[3] ? nextDateISO(1) : todayISO()
    intents.push({
      type: 'create_task',
      payload: { title, priority: 'medium', date, time: `${hour}:00` }
    })
  }

  // Event
  const eventMatch = lower.match(/crea( un)? evento ([^]+?) il (\d{4}-\d{2}-\d{2}) alle (\d{2}):(\d{2})/)
  if (eventMatch) {
    intents.push({
      type: 'create_event',
      payload: {
        title: eventMatch[2].trim(),
        date: eventMatch[3],
        time: `${eventMatch[4]}:${eventMatch[5]}`,
        duration: 60,
        color: '#005f99'
      }
    })
  }

  // Expense
  const expenseMatch = lower.match(/(aggiungi|crea) (una )?spesa di ([0-9]+([.,][0-9]+)?) ?€? per (.+)/)
  if (expenseMatch) {
    intents.push({
      type: 'create_expense',
      payload: {
        amount: parseFloat(expenseMatch[3].replace(',', '.')),
        description: expenseMatch[6].trim(),
        category: 'other',
        icon: '💸',
        date: todayISO()
      }
    })
  }

  return intents
}

const todayISO = () => new Date().toISOString().split('T')[0]
const nextDateISO = (offset: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}

async function callMistral(userText: string, history: Array<{ role: string; content: string }>) {
  if (!MISTRAL_API_KEY) {
    // Fallback
    return {
      content: `Hai scritto: "${userText}". (Modalità fallback senza Mistral)`,
      intents: ruleBasedIntents(userText)
    }
  }
  try {
    const res = await fetch(`${MISTRAL_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
        messages: [
          { role: 'system', content: 'Se possibile estrai intenzioni strutturate per creare task, eventi o spese.' },
          ...history,
          { role: 'user', content: userText }
        ],
        temperature: 0.3
      })
    })
    if (!res.ok) throw new Error('Mistral error ' + res.status)
    const data: any = await res.json()
    const content = data?.choices?.[0]?.message?.content || '(nessuna risposta)'
    // Basic naive extraction AFTER model response (can be replaced by JSON schema mode)
    const intents = [...ruleBasedIntents(userText), ...ruleBasedIntents(content)]
    return { content, intents }
  } catch (e: any) {
    return {
      content: 'Non riesco a contattare il modello. Modalità fallback.',
      intents: ruleBasedIntents(userText)
    }
  }
}

// Validate & sanitize payloads
function validateIntent(intent: Intent): Intent | null {
  switch (intent.type) {
    case 'create_task': {
      const { title, priority } = intent.payload || {}
      if (!title || typeof title !== 'string') return null
      return {
        type: intent.type,
        payload: {
          title: title.slice(0, 120),
          priority: ['low','medium','high'].includes(priority) ? priority : 'medium'
        }
      }
    }
    case 'create_event': {
      const { title, date, time, duration, color } = intent.payload || {}
      if (!title || !date || !time) return null
      return {
        type: intent.type,
        payload: {
          title: String(title).slice(0,140),
          date,
          time,
          duration: Number(duration) > 0 ? Number(duration) : 60,
          color: /^#?[0-9a-f]{6}$/i.test(color) ? color : '#005f99'
        }
      }
    }
    case 'create_expense': {
      const { amount, description, category, icon, date } = intent.payload || {}
      if (isNaN(Number(amount)) || Number(amount) <= 0) return null
      return {
        type: intent.type,
        payload: {
          amount: Number(amount),
          description: String(description || '').slice(0,140),
            category: String(category || 'other').slice(0,40),
            icon: String(icon || '💸').slice(0,8),
            date: date || todayISO()
        }
      }
    }
    default:
      return null
  }
}

async function executeActions(userId: string, intents: Intent[]): Promise<ActionResult[]> {
  if (!admin) return intents.map(i => ({ type: i.type, status: 'error', message: 'No admin supabase client' }))
  const results: ActionResult[] = []
  for (const raw of intents) {
    const intent = validateIntent(raw)
    if (!intent) {
      results.push({ type: raw.type, status: 'error', message: 'Invalid payload' })
      continue
    }
    try {
      if (intent.type === 'create_task') {
        const { error } = await admin.from('todos').insert({
          user_id: userId,
          text: intent.payload.title,
          completed: false,
          priority: intent.payload.priority,
          created_at: new Date().toISOString()
        })
        if (error) throw error
      } else if (intent.type === 'create_event') {
        const { error } = await admin.from('calendar_events').insert({
          user_id: userId,
          title: intent.payload.title,
          date: intent.payload.date,
          time: intent.payload.time,
          duration: intent.payload.duration,
          color: intent.payload.color
        })
        if (error) throw error
      } else if (intent.type === 'create_expense') {
        const { error } = await admin.from('expenses').insert({
          user_id: userId,
          amount: intent.payload.amount,
          description: intent.payload.description,
          category: intent.payload.category,
          icon: intent.payload.icon,
          date: intent.payload.date
        })
        if (error) throw error
      }
      results.push({ type: intent.type, status: 'ok' })
    } catch (e: any) {
      results.push({ type: raw.type, status: 'error', message: e.message })
    }
  }
  return results
}

async function saveMessage(userId: string | null, role: 'user' | 'assistant', message: string, metadata?: any) {
  if (!admin || !userId) return
  await admin.from('assistant_messages').insert({
    user_id: userId,
    role,
    message,
    metadata
  })
}

async function handler(req: IncomingMessage & { body?: any }, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end('Method Not Allowed')
    return
  }

  const chunks: Buffer[] = []
  for await (const c of req) chunks.push(c as Buffer)
  const rawBody = Buffer.concat(chunks).toString('utf8')
  let body: any
  try { body = JSON.parse(rawBody || '{}') } catch { body = {} }

  const input: string = String(body.input || '').trim()
  const userId: string | null = body.userId || body.user_id || null // could be inferred via auth middleware

  if (!input) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Empty input' }))
    return
  }

  // Persist user message (best effort, role = user)
  await saveMessage(userId, 'user', input)

  // Retrieve minimal history for context (last 10 messages) - optional
  let history: Array<{ role: string; content: string }> = []
  if (admin && userId) {
    const { data } = await admin
      .from('assistant_messages')
      .select('role,message')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    history = (data || []).reverse().map(r => ({ role: r.role, content: r.message }))
  }

  const ai = await callMistral(input, history)
  const actionResults = await executeActions(userId || '', ai.intents)

  // Build assistant message including a summary of executed actions
  const actionSummaryOk = actionResults.filter(a => a.status === 'ok')
  const actionText = actionSummaryOk.length
    ? `\n\nAzioni eseguite: ${actionSummaryOk.map(a => a.type).join(', ')}`
    : ''
  const assistantMsg = ai.content + actionText

  await saveMessage(userId, 'assistant', assistantMsg, { intents: ai.intents, actions: actionResults })

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    messages: [{ id: crypto.randomUUID(), role: 'assistant', message: assistantMsg }],
    actions: actionResults
  }))
}

// Export patterns (adjust per platform)
export default handler
export { handler }

// Types for alternate (simple) handler
type Req = {
  method?: string
  [Symbol.asyncIterator]?: () => AsyncIterator<Buffer>
}
type Res = {
  statusCode: number
  setHeader: (k: string, v: string) => void
  end: (payload: string) => void
}

// FIX: proper const function assignment
const parseBody = async (req: Req): Promise<any> => {
  const chunks: Buffer[] = []
  if (req?.[Symbol.asyncIterator]) {
    for await (const c of req as any) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c))
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  try { return raw ? JSON.parse(raw) : {} } catch { return {} }
}

function extractTitle(input: string): string {
  // Simple heuristic around "chiamata <Title>" or "chiamato <Title>"
  const m = input.match(/chiamat[oa]\s+([^,]+?)(?:\s+(domani|oggi|\ball[e]?\b)|$)/i)
  return m?.[1]?.trim() || input
}

// Rename to avoid duplicate identifier and keep a simple variant available
export async function simpleHandler(req: Req, res: Res) {
  try {
    if (req.method !== 'POST') {
      res.statusCode = 405
      res.setHeader('Content-Type', 'application/json')
      return res.end(JSON.stringify({ error: 'Method not allowed' }))
    }

    const body = await parseBody(req)
    const input: string = body?.input || ''
    const userId: string | undefined = body?.userId

    // Create supabase client (credentials are irrelevant in tests; createClient is mocked)
    const sb = createClient(
      (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_SUPABASE_URL) || process.env.VITE_SUPABASE_URL || '',
      (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY) || process.env.VITE_SUPABASE_ANON_KEY || ''
    )

    const actions: any[] = []
    let assistantReply = 'Fatto.'

    // Fallback intent detection for create task
    if (/^\s*(crea|aggiungi|nuova)\b/i.test(input) && /\b(task|attività|todo)\b/i.test(input)) {
      const title = extractTitle(input)
      await sb.from('todos').insert({ text: title, user_id: userId || null })
      actions.push({ type: 'create_task', status: 'ok', title })
      assistantReply = `Creo la task: ${title}`
    } else {
      assistantReply = 'Come posso aiutarti?'
    }

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    return res.end(
      JSON.stringify({
        messages: [{ role: 'assistant', content: assistantReply }],
        actions,
      })
    )
  } catch (e: any) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ error: e?.message || 'error' }))
  }
}
