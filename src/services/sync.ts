import { calendarStore, todosStore, Todo, CalendarEvent } from '@/lib/supabase'
import { eventBus, EVENTS } from '@/lib/eventBus'
import { aGetJSON, aSetJSON, STORAGE_KEYS } from '@/services/storage'

export type SyncLatencyPolicy = {
  debounceMs: number
  retryMs: number
  maxRetries: number
}

export type SyncPhase = 'idle' | 'scheduled' | 'syncing' | 'error'

// Define persisted sync status shape
type SyncStatus = { state: SyncPhase }

type Task = {
  name: string
  run: () => Promise<void>
}

const DEFAULT_POLICY: SyncLatencyPolicy = {
  debounceMs: 250,
  retryMs: 2000,
  maxRetries: 3
}

const DEFAULT_DEBOUNCE_MS = 800
const MAX_BACKOFF_MS = 15_000

export class SyncManager {
  private policy: SyncLatencyPolicy
  private phase: SyncPhase = 'idle'
  private timer: any = null
  private backoff = 0
  private queue = new Set<string>()
  private tasks = new Map<string, Task>()

  constructor(policy?: Partial<SyncLatencyPolicy>) {
    this.policy = { ...DEFAULT_POLICY, ...(policy || {}) }
  }

  async init() {
    const saved = await aGetJSON<SyncStatus>(STORAGE_KEYS.syncMetadata, { state: 'idle' })
    this.phase = saved.state as SyncPhase
    eventBus.emit(EVENTS.syncStateChanged, this.phase)
    window.addEventListener('online', () => this.triggerNow('connectivity:online'))
  }

  registerTask(name: string, run: Task['run']) {
    this.tasks.set(name, { name, run })
  }

  scheduleSync(reason?: string, debounceMs = DEFAULT_DEBOUNCE_MS) {
    this.queue.add(reason || 'unknown')
    if (this.timer) clearTimeout(this.timer)
    this.phase = 'scheduled'
    this.persistState()
    this.timer = setTimeout(() => this.sync(), debounceMs)
  }

  async triggerNow(reason?: string) {
    this.queue.add(reason || 'manual')
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    await this.sync()
  }

  getState(): SyncPhase {
    return this.phase
  }

  private async sync() {
    if (this.phase === 'syncing') return
    this.phase = 'syncing'
    this.persistState()
    try {
      // For now, we just run all registered tasks sequentially.
      for (const [, task] of this.tasks) {
        await task.run()
      }
      // reset
      this.queue.clear()
      this.backoff = 0
      this.phase = 'idle'
      this.persistState()
    } catch (e) {
      console.error('Sync error:', e)
      this.phase = 'error'
      this.persistState()
      // simple backoff
      this.backoff = Math.min(this.backoff ? this.backoff * 2 : 1000, MAX_BACKOFF_MS)
      this.timer = setTimeout(() => this.sync(), this.backoff)
    }
  }

  private persistState() {
    // fire-and-forget persistence + event
    aSetJSON<SyncStatus>(STORAGE_KEYS.syncMetadata, { state: this.phase }).catch(() => {})
    eventBus.emit(EVENTS.syncStateChanged, this.phase)
  }
}

export const syncManager = new SyncManager()

