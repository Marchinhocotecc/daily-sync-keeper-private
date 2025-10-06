import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const ENV_LOCAL = path.join(ROOT, '.env.local')

const TEMPLATE = `# Local-only config (not tracked). Do NOT commit real secrets.

# === REQUIRED (Auth + core) ===
# Find these in Supabase: Project Settings → API
# Example URL: https://abcd1234.supabase.co
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# === OPTIONAL / RECOMMENDED ===
VITE_ENABLE_REMOTE=1
VITE_DEFAULT_LANGUAGE=en
VITE_APP_NAME=Daily-sync-keeper
VITE_APP_DESCRIPTION=Your personal assistant...

# Google OAuth
VITE_GOOGLE_CLIENT_ID=
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback

# Weather widget
VITE_WEATHER_API_KEY=

# AI / Mistral (optional)
VITE_MISTRAL_API_URL=https://api.mistral.ai/v1
VITE_MISTRAL_API_KEY=
VITE_MISTRAL_MODEL=mistral-large-latest
`

function ensureFile() {
  if (!fs.existsSync(ENV_LOCAL)) {
    fs.writeFileSync(ENV_LOCAL, TEMPLATE, 'utf8')
    console.log('Created .env.local with placeholders. Fill in your Supabase URL and anon key, then restart dev server.')
    return
  }
  const content = fs.readFileSync(ENV_LOCAL, 'utf8')
  const needUrl = !/^VITE_SUPABASE_URL=/m.test(content)
  const needKey = !/^VITE_SUPABASE_ANON_KEY=/m.test(content)
  if (needUrl || needKey) {
    const append: string[] = []
    if (needUrl) append.push('VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co')
    if (needKey) append.push('VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY')
    fs.appendFileSync(ENV_LOCAL, `\n# Added missing required keys\n${append.join('\n')}\n`)
    console.log('Updated .env.local by adding missing required keys. Fill them in, then restart dev server.')
  } else {
    console.log('.env.local already exists and includes required keys.')
  }
}

ensureFile()
