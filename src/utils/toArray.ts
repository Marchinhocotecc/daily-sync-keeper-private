export function toArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val.filter(Boolean) as T[]
  if (val == null) return []
  // Iterable but not string
  if (typeof (val as any)[Symbol.iterator] === 'function' && typeof val !== 'string') {
    return Array.from(val as Iterable<T>).filter(Boolean)
  }
  return [val as T].filter(Boolean)
}

// Defensive helpers (optional exports)
export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0
}
