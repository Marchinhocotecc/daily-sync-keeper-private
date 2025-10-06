import { useEffect, useMemo, useState } from 'react'
import { getJson, setJson } from './storage'

export type WellnessRow = {
  id: string
  date: string // YYYY-MM-DD
  mood?: number | null // 1..5
  energy?: number | null // 1..5
  steps?: number | null
  calories?: number | null
  notes?: string | null
}

const KEY = 'wellness.items'

function readAll(): WellnessRow[] {
  return getJson<WellnessRow[]>(KEY, []) || []
}
function writeAll(items: WellnessRow[]) {
  setJson(KEY, items)
}
function todayStr() { return new Date().toISOString().split('T')[0] }

export function useWellness() {
  const [items, setItems] = useState<WellnessRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<{ start?: string; end?: string }>({})

  useEffect(() => {
    try {
      const all = readAll()
      setItems(all)
    } catch (e: any) {
      setError(e?.message || 'Load error')
    } finally {
      setLoading(false)
    }
  }, [])

  const setRange = (start?: string, end?: string) => setFilters({ start, end })

  const filtered = useMemo(() => {
    const start = filters.start
    const end = filters.end
    return items.filter(r => {
      if (start && r.date < start) return false
      if (end && r.date > end) return false
      return true
    })
  }, [items, filters])

  const add = async (payload: Omit<WellnessRow, 'id'>) => {
    const id = crypto?.randomUUID?.() || String(Date.now())
    const row: WellnessRow = { id, ...payload }
    const next = [...items, row]
    setItems(next)
    writeAll(next)
    return row
  }

  const update = async (id: string, patch: Partial<WellnessRow>) => {
    const next = items.map(r => (r.id === id ? { ...r, ...patch } : r))
    setItems(next)
    writeAll(next)
  }

  const remove = async (id: string) => {
    const next = items.filter(r => r.id !== id)
    setItems(next)
    writeAll(next)
  }

  useEffect(() => {
    // Default to last 30 days
    if (!filters.start && !filters.end) {
      const end = todayStr()
      const s = new Date()
      s.setDate(s.getDate() - 29)
      const start = s.toISOString().split('T')[0]
      setFilters({ start, end })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stats = useMemo(() => {
    const moodVals = filtered.map(r => Number(r.mood)).filter(n => Number.isFinite(n))
    const energyVals = filtered.map(r => Number(r.energy)).filter(n => Number.isFinite(n))
    const stepsVals = filtered.map(r => Number(r.steps)).filter(n => Number.isFinite(n))
    const calVals = filtered.map(r => Number(r.calories)).filter(n => Number.isFinite(n))
    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)
    return {
      avgMood: avg(moodVals),
      avgEnergy: avg(energyVals),
      totalSteps: stepsVals.reduce((a, b) => a + b, 0),
      totalCalories: calVals.reduce((a, b) => a + b, 0),
    }
  }, [filtered])

  const refetch = () => {
    try {
      setItems(readAll())
    } catch (e: any) {
      setError(e?.message || 'Load error')
    }
  }

  return {
    items: filtered,
    loading,
    error,
    refetch,
    add,
    update,
    remove,
    setRange,
    filters,
    stats,
  }
}
