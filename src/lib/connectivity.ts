export function canRemoteSync(): boolean {
  return false
}

export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

