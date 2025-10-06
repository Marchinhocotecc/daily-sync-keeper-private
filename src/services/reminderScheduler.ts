import { showInstantNotification } from './notifications'

export interface LocalReminder {
  id: string
  type: 'todo' | 'event'
  refId: string
  fireAt: string
  title: string
  body: string
  fired?: boolean
}

type FireCb = (id: string) => void

const timeouts = new Map<string, number>()

export const registerServiceWorker = async () => {
  // no-op placeholder
}

export const rescheduleAll = async () => {
  // no-op placeholder
}

export const scheduleInPage = async () => {
  // no-op placeholder
}

function fire(rem: LocalReminder, onFire: FireCb) {
  showInstantNotification(rem.title, rem.body)
  onFire(rem.id)
}
