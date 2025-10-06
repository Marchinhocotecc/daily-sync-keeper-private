import { useState, useEffect } from 'react'
import supabase from '@/lib/supabaseClient'
import type { WellnessData } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
// Replace sync storage with async helpers
import { aGetJSON, aSetJSON, STORAGE_KEYS } from '@/services/storage'

export const useWellness = () => {
  const [wellnessData, setWellnessData] = useState<WellnessData>({
    id: '',
    steps: 0,
    step_goal: 10000,
    calories: 0,
    calorie_goal: 600,
    date: new Date().toISOString().split('T')[0],
    user_id: undefined,
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchTodayData()
  }, [])

  const getUserId = async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase.auth.getUser()
      if (error) {
        // eslint-disable-next-line no-console
        console.warn('[useWellness] getUser error:', error)
        return null
      }
      if (!data || !data.user) return null
      return data.user.id ?? null
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[useWellness] getUser exception:', e)
      return null
    }
  }

  const fetchTodayData = async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    try {
      const uid = await getUserId()
      if (uid) {
        // Ensure we filter by date (and user) as requested
        const { data, error } = await supabase
          .from('wellness_data')
          .select('*')
          .eq('user_id', uid)
          .eq('date', today) // eq.<YYYY-MM-DD>
          .maybeSingle()

        if (!error && data) {
          setWellnessData(data)
          await aSetJSON(STORAGE_KEYS.wellness, data)
          return
        }
      }

      // Fallback to local storage
      const local = await aGetJSON<WellnessData | null>(STORAGE_KEYS.wellness, null)
      if (local && local.date === today) {
        setWellnessData(local)
      } else {
        // Keep defaults for today
        setWellnessData((prev) => ({ ...prev, date: today }))
      }
    } catch (error) {
      const local = await aGetJSON<WellnessData | null>(STORAGE_KEYS.wellness, null)
      if (local) setWellnessData(local)
      // eslint-disable-next-line no-console
      console.error('Error fetching wellness data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateWellnessData = async (steps: number, calories: number, stepGoal?: number, calorieGoal?: number) => {
    const today = new Date().toISOString().split('T')[0]
    const optimistic: WellnessData = {
      id: wellnessData.id || '',
      steps,
      calories,
      step_goal: stepGoal ?? wellnessData.step_goal,
      calorie_goal: calorieGoal ?? wellnessData.calorie_goal,
      date: today,
      user_id: wellnessData.user_id,
      mood: wellnessData.mood ?? 0,
      energy: wellnessData.energy ?? 0,
      notes: wellnessData.notes ?? null,
    }

    try {
      // Optimistic update + local persist
      setWellnessData(optimistic)
      await aSetJSON(STORAGE_KEYS.wellness, optimistic)

      const uid = await getUserId()
      if (!uid) {
        toast({
          title: "Salvataggio offline",
          description: "Non autenticato. Dati salvati localmente.",
        })
        return
      }

      // Build payload without id to let DB generate if missing
      const payload = {
        user_id: uid,
        date: today,
        steps: optimistic.steps,
        calories: optimistic.calories,
        step_goal: optimistic.step_goal,
        calorie_goal: optimistic.calorie_goal,
        // keep current mood/energy/notes when present
        mood: optimistic.mood ?? 0,
        energy: optimistic.energy ?? 0,
        notes: optimistic.notes ?? null,
      }

      const { data, error } = await supabase
        .from('wellness_data')
        .upsert(payload, { onConflict: 'user_id,date' })
        .select()
        .single()

      if (error) throw error

      setWellnessData(data)
      await aSetJSON(STORAGE_KEYS.wellness, data)

      toast({ title: "Successo", description: "Dati benessere aggiornati" })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating wellness data:', error)
      toast({
        title: "Salvataggio offline",
        description: "Dati aggiornati localmente. Verrai sincronizzato più tardi.",
      })
    }
  }

  return {
    wellnessData,
    loading,
    updateWellnessData,
    refetch: fetchTodayData
  }
}