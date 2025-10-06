// (migrated unchanged from auth.ts)
import { getJSON, setItem, setJSON, removeItem, STORAGE_KEYS } from './storage'
// ...existing code...
export type AuthUser = {
  id: string
  email: string
  createdAt: number
}
// ...existing code...
export type AuthSession = {
  userId: string
  email: string
  token: string
  expiresAt: string
}
// ...existing code...
const USERS_KEY = 'auth:users'
// ...existing code...
const readUsers = (): AuthUser[] & { password?: string }[] => {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
// ...existing code...
const writeUsers = (users: any[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}
// ...existing code...
function makeSession(email: string, remember: boolean): AuthSession {
  const now = Date.now()
  const ttl = remember ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 12
  return {
    userId: `user_${btoa(email).replace(/=/g, '')}`,
    email,
    token: `tok_${Math.random().toString(36).slice(2)}`,
    expiresAt: new Date(now + ttl).toISOString(),
  }
}
// ...existing code...
function persistSession(session: AuthSession | null) {
  if (session) {
    setJSON(STORAGE_KEYS.authSession, session)
    try {
      localStorage.setItem(STORAGE_KEYS.authSession, JSON.stringify(session))
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEYS.authSession,
          newValue: JSON.stringify(session),
        })
      )
    } catch {}
  } else {
    removeItem(STORAGE_KEYS.authSession)
    try {
      localStorage.removeItem(STORAGE_KEYS.authSession)
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEYS.authSession,
          newValue: null,
        })
      )
    } catch {}
  }
}
// ...existing code...
export const authService = {
  getSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.authSession)
      if (raw) {
        const s = JSON.parse(raw) as AuthSession
        if (new Date(s.expiresAt).getTime() > Date.now()) return s
      }
    } catch {}
    return null
  },
  async register(email: string, password: string, remember = true): Promise<AuthSession> {
    if (!email || !password) throw new Error('Dati registrazione non validi')
    email = email.trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Email non valida')
    if (password.length < 6) throw new Error('Password troppo corta')
    const users = readUsers()
    const exists = users.find((u: any) => u.email === email)
    if (exists) throw new Error('Utente già registrato')
    const user: any = { id: `user_${btoa(email).replace(/=/g, '')}`, email, createdAt: Date.now(), password }
    users.push(user)
    writeUsers(users)
    const session = makeSession(email, remember)
    persistSession(session)
    return session
  },
  async login(email: string, password: string, remember = true): Promise<AuthSession> {
    if (!email || !password) throw new Error('Credenziali non valide')
    email = email.trim().toLowerCase()
    const users = readUsers()
    const user: any = users.find((u: any) => u.email === email && u.password === password)
    if (!user) throw new Error('Credenziali non valide')
    const session = makeSession(email, remember)
    persistSession(session)
    return session
  },
  async logout(): Promise<void> {
    persistSession(null)
  },
}
// ...existing code...
export type { AuthSession as AuthSessionType }
