/* Run with:
   npx tsx scripts/verify-supabase-config.ts
   or: node --loader tsx scripts/verify-supabase-config.ts
*/
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

function loadEnvLocal() {
  const p = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(p)) return
  const text = fs.readFileSync(p, 'utf8')
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.+?)\s*$/)
    if (!m) continue
    const k = m[1]
    let v = m[2]
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1)
    if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1)
    if (!(k in process.env)) process.env[k] = v
  }
}

loadEnvLocal()

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

const fail = (msg: string) => {
  console.error('✖', msg)
  process.exit(1)
}

if (!url || /YOUR-PROJECT/i.test(url)) fail('VITE_SUPABASE_URL missing or placeholder. Paste your project URL.')
if (!key || /YOUR_SUPABASE_ANON_KEY/i.test(key)) fail('VITE_SUPABASE_ANON_KEY missing or placeholder. Paste your anon key.')

console.log('→ Using', { url, anonKeyLen: key.length })

const supabase = createClient(url, key)

async function main() {
  // 1) Network reachability via dummy select (expect either data or an error != network failure)
  try {
    const { error } = await supabase.from('nonexistent_table').select('*').limit(1)
    if (error && /Failed to fetch|ENOTFOUND|getaddrinfo/i.test(error.message)) {
      fail(`Network error contacting Supabase: ${error.message}`)
    }
    console.log('✓ Network reachable')
  } catch (e: any) {
    if (/Failed to fetch|ENOTFOUND|getaddrinfo/i.test(String(e?.message))) {
      fail(`Network error contacting Supabase: ${e?.message}`)
    }
    console.log('✓ Network reachable (caught non-network error as expected)')
  }

  // 2) Auth endpoint reachability
  const { data: sess, error: authErr } = await supabase.auth.getSession()
  if (authErr && /Failed to fetch/i.test(authErr.message)) {
    fail(`Auth endpoint unreachable: ${authErr.message}`)
  }
  console.log('✓ Auth endpoint OK (session:', !!sess?.session, ')')

  // 3) Public table check (may be RLS-protected, but should not 401/404 at the REST level)
  const { error: tableErr } = await supabase.from('profiles').select('*').limit(1)
  if (tableErr && tableErr.code === 'PGRST116') {
    // RLS ok, no rows or forbidden, but table exists
    console.log('✓ Table exists (RLS may block results): profiles')
  } else if (tableErr && tableErr.code) {
    console.log('• profiles error (expected under RLS):', tableErr.code, tableErr.message)
  } else {
    console.log('✓ profiles query succeeded (anon may have access)')
  }

  console.log('All checks done.')
}

main().catch((e) => fail(String(e?.message || e)))
