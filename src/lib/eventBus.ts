type Handler<T> = (payload: T) => void

export class EventBus<Events extends Record<string, any> = Record<string, any>> {
  private handlers = new Map<keyof Events, Set<Handler<any>>>()

  on<K extends keyof Events>(event: K, handler: Handler<Events[K]>) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(handler)
    return () => this.off(event, handler)
  }

  off<K extends keyof Events>(event: K, handler: Handler<Events[K]>) {
    this.handlers.get(event)?.delete(handler)
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]) {
    this.handlers.get(event)?.forEach((h) => h(payload))
  }
}

export const eventBus = new EventBus();

export const EVENTS = {
  storageChange: 'storageChange',
  todosUpdated: 'todos.updated',
  calendarUpdated: 'calendar.updated',
  syncStateChanged: 'sync.state.changed',
  notificationScheduled: 'notification.scheduled',
  expensesUpdated: 'expenses.updated',
  settingsUpdated: 'settings.updated',
} as const;
