// AI_Assistant placeholder module
// Provides an isolated surface where a future on-device AI model can plug in.

import { todosStore, calendarStore, type CalendarEvent, type Todo } from '@/lib/supabase'
import { useTranslation } from "react-i18next";
import { toArray } from '@/utils/toArray'

/**
 * Strips a leading "assistant." (common legacy prefix) from a translation key.
 * Safe to call on keys without that prefix.
 */
export function stripAssistantPrefix(key: string) {
  return key.startsWith("assistant.") ? key.slice("assistant.".length) : key;
}

/**
 * Wrapper hook for legacy code that might still pass keys like "assistant.title".
 * Use: const { t } = useAssistantT();  t("assistant.title") === t("title")
 */
export function useAssistantT(ns?: string | string[]) {
  const i18 = useTranslation(ns);
  const rawT = i18.t;
  const wrapped = ((k: string, opts?: any) => rawT(stripAssistantPrefix(k), opts)) as typeof rawT;
  return { ...i18, t: wrapped };
}

// If later you need a batch resource transform, add a function here that
// iterates resources and re-injects keys without the "assistant" prefix.

export type AssistantSuggestion = {
  id: string
  title: string
  description?: string
  apply: () => Promise<void> | void
}

type Ctx = {
  addEvent?: (e: { title: string; date: string; time: string; duration: number; color: string }) => Promise<void>
}

function toDateString(d: Date) {
  return d.toISOString().split('T')[0]
}
function toTimeString(d: Date) {
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

export class AIAssistant {
  private ctx: Ctx
  private pendingEvent: Partial<{
    date: string
    time: string
    title: string
    duration: number
    color: string
    awaiting: 'title' | 'time'
  }> | null = null

  constructor(ctx: Ctx = {}) {
    this.ctx = ctx
  }

  async suggestImprovements(): Promise<AssistantSuggestion[]> {
    const todos = await todosStore.load()
    const events = await calendarStore.load()

    const suggestions: AssistantSuggestion[] = []
    const now = new Date()

    // 1) High priority tasks not scheduled -> suggest focus block
    const high = todos.filter(t => !t.completed && t.priority === 'high')
    if (high.length > 0) {
      const nextHour = new Date(now)
      nextHour.setMinutes(0, 0, 0)
      if (now.getMinutes() > 0) nextHour.setHours(nextHour.getHours() + 1)

      suggestions.push({
        id: 'suggest-focus-high-priority',
        title: `Blocco di focus per ${high.length} attività importanti`,
        description: 'Pianifica 60 minuti per concentrarti sulle attività ad alta priorità',
        apply: async () => {
          if (!this.ctx.addEvent) return
          await this.ctx.addEvent({
            title: 'Focus: attività prioritarie',
            date: toDateString(nextHour),
            time: toTimeString(nextHour),
            duration: 60,
            color: '#ff6b6b',
          })
        },
      })
    }

    // 2) No events today -> suggest planning
    const today = toDateString(now)
    const todayEvents = events.filter(e => e.date === today)
    if (todayEvents.length === 0) {
      const planAt = new Date(now)
      planAt.setHours(9, 0, 0, 0)
      suggestions.push({
        id: 'suggest-daily-planning',
        title: 'Pianifica la giornata',
        description: 'Aggiungi un breve evento per pianificare le priorità di oggi',
        apply: async () => {
          if (!this.ctx.addEvent) return
          await this.ctx.addEvent({
            title: 'Pianificazione giornaliera',
            date: toDateString(planAt),
            time: toTimeString(planAt),
            duration: 15,
            color: '#3f00ff',
          })
        },
      })
    }

    // 3) If many todos, suggest review
    if (todos.filter(t => !t.completed).length >= 10) {
      suggestions.push({
        id: 'suggest-weekly-review',
        title: 'Rivedi l’elenco attività',
        description: 'Valuta priorità e archivia ciò che non è più necessario',
        apply: async () => {
          // no-op placeholder
        },
      })
    }

    return suggestions
  }

  async reply(userText: string): Promise<{ text: string; created?: { id?: string; title: string; date: string; time: string } }> {
    const text = userText.trim()
    if (!text) return { text: 'Dimmi pure, come posso aiutarti?' }

    // If we are awaiting missing info for a pending event
    const pending = this.pendingEvent
    if (pending) {
      if (pending.awaiting === 'title') {
        const title = this.extractTitle(text) || text
        if (!title || title.length < 2) {
          return { text: 'Ok! Come vuoi chiamarlo?' }
        }
        pending.title = title
        pending.awaiting = undefined
        this.pendingEvent = pending
        return await this.tryCreateEventFromPending()
      }
      if (pending.awaiting === 'time') {
        const time = this.parseTime(text)
        if (!time) {
          return { text: 'A che ora vuoi fissarlo? (es. 15:00)' }
        }
        pending.time = time
        pending.awaiting = undefined
        this.pendingEvent = pending
        return await this.tryCreateEventFromPending()
      }
    }

    // Detect intents
    const lower = text.toLowerCase()

    // list today/tomorrow
    if (/(cosa|che)\s+ho\s+oggi|eventi\s+(di|per)\s+oggi/.test(lower)) {
      return { text: await this.describeEventsForDaysFromNow(0) }
    }
    if (/(cosa|che)\s+ho\s+domani|eventi\s+(di|per)\s+domani/.test(lower)) {
      return { text: await this.describeEventsForDaysFromNow(1) }
    }

    // create event intent
    if (/(aggiungi|crea|imposta)\s+(un|una)?\s*(task|evento|appuntamento|promemoria)/.test(lower)) {
      const parsed = this.parseEventCommand(text)
      // We’ll default date to today if not specified
      if (!parsed.date) parsed.date = this.toDateString(new Date())
      // Missing time or title -> ask follow-up and stash pending
      if (!parsed.time && !parsed.title) {
        this.pendingEvent = { ...parsed, awaiting: 'time' }
        return { text: 'Perfetto! A che ora lo fissiamo?' }
      }
      if (!parsed.time) {
        this.pendingEvent = { ...parsed, awaiting: 'time' }
        return { text: 'A che ora vuoi fissarlo? (es. 15:00)' }
      }
      if (!parsed.title) {
        this.pendingEvent = { ...parsed, awaiting: 'title' }
        return { text: `Ok, ${parsed.date === this.toDateString(new Date()) ? 'oggi' : 'in quella data'} alle ${parsed.time}. Come vuoi chiamarlo?` }
      }
      // We have enough info -> create now
      this.pendingEvent = parsed
      return await this.tryCreateEventFromPending()
    }

    // generic fallback
    return { text: this.genericAnswer(lower) }
  }

  // Helpers --------------------------------------------------------

  private async tryCreateEventFromPending() {
    if (!this.ctx.addEvent || !this.pendingEvent) {
      this.pendingEvent = null
      return { text: 'Non riesco ad aggiungere eventi ora.' }
    }
    const { title, date, time } = this.pendingEvent
    const duration = this.pendingEvent.duration ?? 60
    const color = this.pendingEvent.color ?? '#005f99'

    if (!title) {
      this.pendingEvent.awaiting = 'title'
      return { text: 'Come vuoi chiamarlo?' }
    }
    if (!time) {
      this.pendingEvent.awaiting = 'time'
      return { text: 'A che ora vuoi fissarlo? (es. 15:00)' }
    }

    // All good -> create
    try {
      await this.ctx.addEvent({ title, date: date!, time, duration, color })
      const created = { title, date: date!, time }
      this.pendingEvent = null
      const whenText = this.formatWhenText(date!, time, duration)
      return { text: `Fatto! Ho aggiunto "${title}" ${whenText}.`, created }
    } catch {
      this.pendingEvent = null
      return { text: 'C’è stato un problema nell’aggiunta. Riprova tra poco.' }
    }
  }

  private formatWhenText(date: string, time: string, duration: number) {
    const today = this.toDateString(new Date())
    const label = date === today ? 'oggi' : `il ${date}`
    return `${label} alle ${time} (${duration} min)`
  }

  private parseEventCommand(text: string): Partial<{ title: string; date: string; time: string; duration: number; color: string }> {
    const out: Partial<{ title: string; date: string; time: string; duration: number; color: string }> = {}

    // date
    const lower = text.toLowerCase()
    if (/\bdomani\b/.test(lower)) {
      const d = new Date(); d.setDate(d.getDate() + 1)
      out.date = this.toDateString(d)
    } else if (/\boggi\b/.test(lower)) {
      out.date = this.toDateString(new Date())
    } else {
      // il dd/mm or dd-mm
      const m = lower.match(/\bil\s+(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/)
      if (m) {
        const day = parseInt(m[1], 10)
        const mon = parseInt(m[2], 10) - 1
        const year = m[3] ? parseInt(m[3], 10) : new Date().getFullYear()
        const d = new Date(year, mon, day)
        out.date = this.toDateString(d)
      }
    }

    // time: "alle 15", "alle 15:30", "ore 9", "h 18"
    const t = lower.match(/\b(?:alle|ore|h)\s+(\d{1,2})(?::|\.?(\d{2}))?/)
    if (t) {
      const hh = t[1].padStart(2, '0')
      const mm = t[2] ? t[2].padStart(2, '0') : '00'
      out.time = `${hh}:${mm}`
    }

    // duration: "per 30 min", "per 1 ora", "durata 45", "di 90 minuti"
    const dur = lower.match(/\b(?:per|durata|di)\s+(\d{1,3})\s*(min|minuti|ora|ore)?/)
    if (dur) {
      const n = parseInt(dur[1], 10)
      const unit = dur[2] || 'min'
      out.duration = /ora|ore/.test(unit) ? n * 60 : n
    }

    // title: quoted or after "per" without unit or "titolo ..."
    const quoted = text.match(/["“”](.+?)["“”]/)
    if (quoted) {
      out.title = quoted[1].trim()
    } else {
      const titleAfterTitolo = text.match(/\btitolo\s+(.+)$/i)
      if (titleAfterTitolo) {
        out.title = titleAfterTitolo[1].trim()
      } else {
        // "per chiamare Luca" but avoid "per 30 min"
        const perPhrase = text.match(/\bper\s+(.+)$/i)
        if (perPhrase && !/\b\d{1,3}\s*(min|minuti|ora|ore)\b/i.test(perPhrase[1])) {
          out.title = perPhrase[1].trim()
        }
      }
    }

    return out
  }

  private extractTitle(text: string) {
    const cleaned = text
      .replace(/^(ok|va bene|perfetto|bene|allora|e\s+)?\s*/i, '')
      .replace(/(?:per|di)\s+(fare|fare un|fare una)\s+/i, '')
      .trim()

    // If quoted text exists, prefer it
    const quoted = cleaned.match(/["“”](.+?)["“”]/)
    if (quoted) return quoted[1].trim()

    // Remove common filler words at the end
    const trimmed = cleaned.replace(/\b(per favore|grazie)\.?$/i, '').trim()

    // Keep it reasonably short
    return trimmed.length > 120 ? trimmed.slice(0, 117).trimEnd() + '…' : trimmed
  }

  private async describeEventsForDaysFromNow(deltaDays: number) {
    const events = await calendarStore.load()
    const d = new Date()
    d.setDate(d.getDate() + deltaDays)
    const dateStr = this.toDateString(d)
    const list = toArray(events).filter(e => e.date === dateStr).sort((a, b) => a.time.localeCompare(b.time))
    if (list.length === 0) {
      return deltaDays === 0 ? 'Oggi non hai eventi in agenda.' : 'Domani non hai eventi in agenda.'
    }
    const intro = deltaDays === 0 ? 'Oggi hai:' : 'Domani hai:'
    const body = list.map(e => `• ${e.time} — ${e.title} (${e.duration} min)`).join('\n')
    return `${intro}\n${body}`
  }

  private genericAnswer(lower: string) {
    if (/aiuto|help|cosa sai fare/.test(lower)) {
      return 'Posso aiutarti a pianificare: chiedimi di aggiungere un evento (es. “Aggiungi un task alle 15:00 per chiamare Luca”), oppure chiedimi cosa hai oggi o domani.'
    }
    if (/grazie|tnx|thanks/.test(lower)) {
      return 'Prego! 😊'
    }
    return 'Ok! Posso aggiungere eventi, ricordarti gli impegni o dirti cosa hai in agenda.'
  }
}

export { AIAssistant as default }

