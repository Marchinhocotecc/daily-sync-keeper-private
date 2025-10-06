import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handler } from '@/server/api/assistant'

// Mock crypto.randomUUID for deterministic id in Node <19
;(global as any).crypto = { randomUUID: () => 'uuid-test' }

const supabaseInsert = vi.fn()
const supabaseSelect = vi.fn().mockResolvedValue({ data: [] })

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      insert: supabaseInsert.mockResolvedValue({ error: null }),
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => supabaseSelect
          })
        })
      })
    })
  })
}))

beforeEach(() => {
  supabaseInsert.mockClear()
  supabaseSelect.mockClear()
})

function mockReqRes(body: any) {
  const chunks: any[] = []
  const req: any = {
    method: 'POST',
    [Symbol.asyncIterator]: async function* () {
      yield Buffer.from(JSON.stringify(body))
    }
  }
  let statusCode = 0
  let payload: any = null
  const res: any = {
    setHeader() {},
    end: (d: any) => { payload = d },
    get statusCode() { return statusCode },
    set statusCode(v: number) { statusCode = v }
  }
  return { req, res, getPayload: () => payload, getStatus: () => statusCode }
}

describe('assistant endpoint', () => {
  it('returns assistant reply', async () => {
    const { req, res, getPayload, getStatus } = mockReqRes({ input: 'ciao', userId: 'u1' })
    await handler(req as any, res as any)
    expect(getStatus()).toBe(200)
    const json = JSON.parse(getPayload())
    expect(json.messages[0].role).toBe('assistant')
    expect(supabaseInsert).toHaveBeenCalled()
  })

  it('extracts fallback intent create_task', async () => {
    const { req, res, getPayload } = mockReqRes({ input: 'Crea task chiamata Test domani alle 10', userId: 'u1' })
    await handler(req as any, res as any)
    const json = JSON.parse(getPayload())
    expect(json.actions.some((a: any) => a.type === 'create_task')).toBe(true)
  })
})
