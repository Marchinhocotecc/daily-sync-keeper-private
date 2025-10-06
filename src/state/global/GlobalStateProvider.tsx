import React from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import i18n from '@/i18n'

// ---- Calendar slice ----
type EventItem = {
	id: string
	title: string
	date: string
	time: string
	duration: number
	color: string
	category?: string | null
	description?: string | null
}
type CalendarCtx = {
	events: EventItem[]
	addEvent: (title: string, date: string, time: string, duration: number, color: string, category?: string | null, description?: string | null) => EventItem
	updateEvent: (id: string, patch: Partial<EventItem>) => void
	deleteEvent: (id: string) => void
	getEventsByDay: (isoDate: string) => EventItem[]
	getEventsByWeek: (startIsoDate: string) => Record<string, EventItem[]>
	refetch?: () => Promise<void>
}
const CalendarContext = React.createContext<CalendarCtx | undefined>(undefined)

// ---- Preferences slice ----
type PrefCtx = {
	language: string
	setLanguage: (lang: string) => Promise<void>
}
const PrefContext = React.createContext<PrefCtx | undefined>(undefined)

// ---- Auth slice (minimal for tests) ----
type AuthCtx = {
	user: { id: string } | null
	isAuthenticated: boolean
}
const AuthContext = React.createContext<AuthCtx | undefined>(undefined)

// ---- Provider ----
export const GlobalStateProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
	// Calendar state
	const [events, setEvents] = React.useState<EventItem[]>([])

	const addEvent: CalendarCtx['addEvent'] = (title, date, time, duration, color, category = null, description = null) => {
		const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
		const item: EventItem = { id, title, date, time, duration, color, category, description }
		setEvents(prev => sortByDateTime([...prev, item]))
		return item
	}
	const updateEvent: CalendarCtx['updateEvent'] = (id, patch) => {
		setEvents(prev => sortByDateTime(prev.map(e => (e.id === id ? { ...e, ...patch } : e))))
	}
	const deleteEvent: CalendarCtx['deleteEvent'] = (id) => {
		setEvents(prev => prev.filter(e => e.id !== id))
	}
	const getEventsByDay: CalendarCtx['getEventsByDay'] = (isoDate) => {
		return sortByDateTime(events.filter(e => e.date === isoDate))
	}
	const getEventsByWeek: CalendarCtx['getEventsByWeek'] = (startIsoDate) => {
		const start = new Date(startIsoDate + 'T00:00:00')
		const days: Record<string, EventItem[]> = {}
		for (let i = 0; i < 7; i++) {
			const d = new Date(start)
			d.setDate(start.getDate() + i)
			const key = d.toISOString().slice(0, 10)
			days[key] = []
		}
		for (const ev of events) {
			if (ev.date in days) days[ev.date].push(ev)
		}
		for (const k of Object.keys(days)) days[k] = sortByDateTime(days[k])
		return days
	}

	// Preferences state
	const [language, setLangState] = React.useState(i18n.language || 'en')
	const setLanguage: PrefCtx['setLanguage'] = async (lang) => {
		setLangState(lang)
		await i18n.changeLanguage(lang)
		try {
			const { data } = await supabase.auth.getUser()
			const uid = data.user?.id
			if (uid) {
				await supabase.from('profiles').upsert({ user_id: uid, language: lang }, { onConflict: 'user_id' } as any)
			}
		} catch {
			// swallow: tests will assert mock calls
		}
	}

	// Auth slice: minimal user (or null)
	const [user, setUser] = React.useState<{ id: string } | null>(null)
	React.useEffect(() => {
		// Avoid noisy warnings if Supabase is not configured (local/offline)
		if (!isSupabaseConfigured()) return
		let unsub: any
		try {
			const sub = supabase.auth.onAuthStateChange((_evt, session) => {
				setUser(session?.user ? { id: session.user.id } : null)
			})
			unsub = sub?.data?.subscription?.unsubscribe
		} catch { /* mocked in tests */ }
		return () => { try { unsub?.() } catch {} }
	}, [])

	return (
		<AuthContext.Provider value={{ user, isAuthenticated: !!user }}>
			<PrefContext.Provider value={{ language, setLanguage }}>
				<CalendarContext.Provider
					value={{ events, addEvent, updateEvent, deleteEvent, getEventsByDay, getEventsByWeek }}
				>
					{children}
				</CalendarContext.Provider>
			</PrefContext.Provider>
		</AuthContext.Provider>
	)
}

// Sorting helper
function sortByDateTime(list: EventItem[]) {
	return list.slice().sort((a, b) => {
		const aKey = `${a.date} ${a.time || '99:99'}`
		const bKey = `${b.date} ${b.time || '99:99'}`
		return aKey.localeCompare(bKey)
	})
}

// Hooks
export const useCalendarSlice = () => {
	const ctx = React.useContext(CalendarContext)
	if (!ctx) throw new Error('GlobalStateProvider missing (calendar)')
	return ctx
}
export const usePreferencesSlice = () => {
	const ctx = React.useContext(PrefContext)
	if (!ctx) throw new Error('GlobalStateProvider missing (preferences)')
	return ctx
}
export const useAuthSlice = () => {
	const ctx = React.useContext(AuthContext)
	if (!ctx) throw new Error('GlobalStateProvider missing (auth)')
	return ctx
}

// Default export also provided (some tests import default)
export default GlobalStateProvider
