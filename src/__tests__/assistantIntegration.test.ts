import { describe, it, expect, vi } from 'vitest'
import { handler } from '@/server/api/assistant'

;(global as any).crypto = { randomUUID: () => 'uuid-int' }

const inserts: any[] = []
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      insert: vi.fn().mockImplementation((row: any) => {
        inserts.push(row)
        return { error: null }
      }),
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => ({ data: [] })
          })
        })
      })
    })
  })
}))

function mockReqRes(body: any) {
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
  return { req, res, getPayload: () => payload }
}

describe('assistant integration create_task', () => {
  it('creates a task via intent', async () => {
    const { req, res, getPayload } = mockReqRes({ input: 'Crea una task chiamata Compito Importante domani alle 10', userId: 'u1' })
    await handler(req as any, res as any)
    const resp = JSON.parse(getPayload())
    expect(resp.actions.some((a: any) => a.type === 'create_task' && a.status === 'ok')).toBe(true)
    expect(inserts.some(r => r.text?.includes('Compito'))).toBe(true)
  })
})
