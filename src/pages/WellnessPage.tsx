import React, { useMemo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LifeSyncCard } from '@/components/LifeSyncCard'
import { LifeSyncButton } from '@/components/LifeSyncButton'
import { useToast } from '@/hooks/use-toast'
import { useWellness, type WellnessRow } from '@/services/wellness'
import { Heart, Pencil, Trash2, Check, Settings } from 'lucide-react'

const num = (v: any) => {
  if (v === '' || v === null || typeof v === 'undefined') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}
const todayStr = () => new Date().toISOString().split('T')[0]

const WellnessPage: React.FC = () => {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<WellnessRow | null>(null)

  const { items, loading, error, refetch, add, update, remove, setRange, filters, stats } = useWellness()

  const [form, setForm] = useState({
    date: todayStr(),
    mood: '' as any,
    energy: '' as any,
    steps: '' as any,
    calories: '' as any,
    notes: '' as string
  })

  const [editForm, setEditForm] = useState({
    date: todayStr(),
    mood: '' as any,
    energy: '' as any,
    steps: '' as any,
    calories: '' as any,
    notes: '' as string
  })

  useEffect(() => {
    if (editing) {
      setEditForm({
        date: editing.date,
        mood: editing.mood ?? '',
        energy: editing.energy ?? '',
        steps: editing.steps ?? '',
        calories: editing.calories ?? '',
        notes: editing.notes ?? ''
      })
    }
  }, [editing])

  const validate = (data: { date: string; mood?: any; energy?: any; steps?: any; calories?: any }) => {
    if (!data.date || Number.isNaN(Date.parse(data.date))) {
      toast({ title: 'Errore', description: 'Inserisci una data valida', variant: 'destructive' as any })
      return false
    }
    const moodN = num(data.mood)
    const energyN = num(data.energy)
    const stepsN = num(data.steps)
    const caloriesN = num(data.calories)
    if (moodN !== undefined && (moodN < 1 || moodN > 5)) {
      toast({ title: 'Errore', description: 'Umore deve essere tra 1 e 5', variant: 'destructive' as any })
      return false
    }
    if (energyN !== undefined && (energyN < 1 || energyN > 5)) {
      toast({ title: 'Errore', description: 'Energia deve essere tra 1 e 5', variant: 'destructive' as any })
      return false
    }
    if (stepsN !== undefined && stepsN < 0) {
      toast({ title: 'Errore', description: 'Passi non può essere negativo', variant: 'destructive' as any })
      return false
    }
    if (caloriesN !== undefined && caloriesN < 0) {
      toast({ title: 'Errore', description: 'Calorie non può essere negativo', variant: 'destructive' as any })
      return false
    }
    return true
  }

  const handleAdd = async () => {
    const payload = {
      date: form.date,
      mood: num(form.mood),
      energy: num(form.energy),
      steps: num(form.steps),
      calories: num(form.calories),
      notes: form.notes?.trim() || null
    }
    if (!validate(payload)) return
    try {
      await add(payload)
      toast({ title: t('save') || 'Salvato', description: 'Dati wellness salvati' })
      setShowAdd(false)
      setForm({ date: todayStr(), mood: '', energy: '', steps: '', calories: '', notes: '' })
    } catch (e: any) {
      toast({ title: 'Errore', description: e?.message || 'Impossibile salvare i dati', variant: 'destructive' as any })
    }
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    const payload = {
      date: editForm.date,
      mood: num(editForm.mood),
      energy: num(editForm.energy),
      steps: num(editForm.steps),
      calories: num(editForm.calories),
      notes: editForm.notes?.trim() || null
    }
    if (!validate(payload)) return
    try {
      await update(editing.id, payload)
      toast({ title: t('save') || 'Salvato', description: 'Dati aggiornati' })
      setEditing(null)
    } catch (e: any) {
      toast({ title: 'Errore', description: e?.message || 'Impossibile aggiornare', variant: 'destructive' as any })
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Eliminare questi dati?')) return
    try {
      await remove(id)
      toast({ title: 'Eliminato', description: 'Riga rimossa' })
    } catch (e: any) {
      toast({ title: 'Errore', description: e?.message || 'Impossibile eliminare', variant: 'destructive' as any })
    }
  }

  const list = useMemo(() => items.slice().sort((a, b) => b.date.localeCompare(a.date)), [items])

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mobile-padding pt-8 pb-4 gradient-surface">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('wellness.title') || 'Benessere'}</h1>
            <p className="text-sm text-muted-foreground">
              {t('wellness.subtitle') || 'Traccia umore, energia e attività giornaliere'}
            </p>
          </div>
          <LifeSyncButton
            variant="primary"
            size="icon"
            className="rounded-full shadow-ocean"
            onClick={() => setShowAdd(s => !s)}
            title="Aggiungi"
          >
            <Heart size={18} />
          </LifeSyncButton>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="date"
            value={filters.start || ''}
            onChange={(e) => setRange(e.target.value || undefined, filters.end)}
            className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm"
            aria-label={t('wellness.startDate') || 'Start'}
          />
            <input
              type="date"
              value={filters.end || ''}
              onChange={(e) => setRange(filters.start, e.target.value || undefined)}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm"
              aria-label={t('wellness.endDate') || 'End'}
            />
            <LifeSyncButton
              variant="outline"
              onClick={() => {
                const end = todayStr()
                const s = new Date()
                s.setDate(s.getDate() - 29)
                const start = s.toISOString().split('T')[0]
                setRange(start, end)
              }}
            >
              {t('wellness.last30') || 'Ultimi 30'}
            </LifeSyncButton>
            <LifeSyncButton variant="ghost" onClick={() => refetch()} title={t('common.refresh') || 'Aggiorna'}>
              <Settings size={16} />
            </LifeSyncButton>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <LifeSyncCard padding="sm" variant="elevated">
            <div className="text-xs text-muted-foreground">Media Umore • Media Energia</div>
            <div className="text-lg font-bold text-foreground">
              {stats.avgMood.toFixed(1)} / {stats.avgEnergy.toFixed(1)}
            </div>
          </LifeSyncCard>
          <LifeSyncCard padding="sm" variant="elevated">
            <div className="text-xs text-muted-foreground">Passi • Calorie</div>
            <div className="text-lg font-bold text-foreground">
              {stats.totalSteps} • {stats.totalCalories}
            </div>
          </LifeSyncCard>
        </div>
      </div>

      {error && (
        <div className="mobile-padding">
          <LifeSyncCard>
            <div className="flex items-center justify-between">
              <div className="text-sm text-destructive">{t('wellness.loadError') || 'Errore di caricamento'}</div>
              <LifeSyncButton variant="outline" size="sm" onClick={() => refetch()}>
                {t('retry') || 'Riprova'}
              </LifeSyncButton>
            </div>
          </LifeSyncCard>
        </div>
      )}

      {showAdd && (
        <div className="mobile-padding">
          <LifeSyncCard>
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">{t('wellness.newEntry') || 'Nuovo record'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
                <input
                  type="number"
                  min={1}
                  max={5}
                  placeholder={t('wellness.moodPlaceholder') || 'Umore (1-5)'}
                  value={form.mood}
                  onChange={(e) => setForm(p => ({ ...p, mood: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
                <input
                  type="number"
                  min={1}
                  max={5}
                  placeholder={t('wellness.energyPlaceholder') || 'Energia (1-5)'}
                  value={form.energy}
                  onChange={(e) => setForm(p => ({ ...p, energy: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="number"
                  min={0}
                  placeholder={t('wellness.stepsPlaceholder') || 'Passi'}
                  value={form.steps}
                  onChange={(e) => setForm(p => ({ ...p, steps: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
                <input
                  type="number"
                  min={0}
                  placeholder={t('wellness.caloriesPlaceholder') || 'Calorie'}
                  value={form.calories}
                  onChange={(e) => setForm(p => ({ ...p, calories: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
              </div>
              <input
                type="text"
                placeholder={t('wellness.notesPlaceholder') || 'Note'}
                value={form.notes}
                onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
              />
              <div className="flex gap-2">
                <LifeSyncButton variant="primary" onClick={handleAdd} className="flex-1">
                  <Check size={16} className="mr-2" />
                  {t('save') || 'Salva'}
                </LifeSyncButton>
                <LifeSyncButton variant="outline" onClick={() => setShowAdd(false)} className="flex-1">
                  {t('cancel') || 'Annulla'}
                </LifeSyncButton>
              </div>
            </div>
          </LifeSyncCard>
        </div>
      )}

      {loading && (
        <div className="mobile-padding">
          <LifeSyncCard className="animate-pulse">
            <div className="h-16 bg-muted rounded-xl mb-2" />
            <div className="h-16 bg-muted rounded-xl" />
          </LifeSyncCard>
        </div>
      )}

      {!loading && (
        <div className="mobile-padding">
          <LifeSyncCard>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {t('wellness.entries') || 'Registrazioni'}
            </h3>
            {list.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                {t('wellness.empty') || 'Nessun dato nel periodo selezionato'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-3">Data</th>
                      <th className="py-2 pr-3">Umore</th>
                      <th className="py-2 pr-3">Energia</th>
                      <th className="py-2 pr-3">Passi</th>
                      <th className="py-2 pr-3">Calorie</th>
                      <th className="py-2 pr-3">Note</th>
                      <th className="py-2 pr-0 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map(r => (
                      <tr key={r.id} className="border-t">
                        <td className="py-2 pr-3">{new Date(`${r.date}T00:00:00`).toLocaleDateString('it-IT')}</td>
                        <td className="py-2 pr-3">{r.mood ?? '-'}</td>
                        <td className="py-2 pr-3">{r.energy ?? '-'}</td>
                        <td className="py-2 pr-3">{r.steps ?? '-'}</td>
                        <td className="py-2 pr-3">{r.calories ?? '-'}</td>
                        <td className="py-2 pr-3">{r.notes || '-'}</td>
                        <td className="py-2 pr-0">
                          <div className="flex justify-end gap-2">
                            <button
                              className="px-2 py-1 text-xs rounded-lg border hover:bg-accent"
                              onClick={() => setEditing(r)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className="px-2 py-1 text-xs rounded-lg border hover:bg-accent text-destructive"
                              onClick={() => handleDelete(r.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </LifeSyncCard>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-5 rounded-2xl border bg-background shadow-lg space-y-3">
            <h3 className="font-semibold text-foreground">Modifica record</h3>
            <input
              type="date"
              value={editForm.date}
              onChange={(e) => setEditForm(p => ({ ...p, date: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border bg-background"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min={1}
                max={5}
                value={editForm.mood as any}
                onChange={(e) => setEditForm({ ...editForm, mood: e.target.value })}
                className="px-3 py-2 rounded-xl border bg-background"
                placeholder="Umore (1-5)"
              />
              <input
                type="number"
                min={1}
                max={5}
                value={editForm.energy as any}
                onChange={(e) => setEditForm({ ...editForm, energy: e.target.value })}
                className="px-3 py-2 rounded-xl border bg-background"
                placeholder="Energia (1-5)"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min={0}
                value={editForm.steps as any}
                onChange={(e) => setEditForm({ ...editForm, steps: e.target.value })}
                className="px-3 py-2 rounded-xl border bg-background"
                placeholder="Passi"
              />
              <input
                type="number"
                min={0}
                value={editForm.calories as any}
                onChange={(e) => setEditForm({ ...editForm, calories: e.target.value })}
                className="px-3 py-2 rounded-xl border bg-background"
                placeholder="Calorie"
              />
            </div>
            <input
              type="text"
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border bg-background"
              placeholder="Note"
            />
            <div className="flex justify-end gap-2 pt-2">
              <LifeSyncButton variant="ghost" onClick={() => setEditing(null)}>Chiudi</LifeSyncButton>
              <LifeSyncButton variant="primary" onClick={handleSaveEdit}>{t('save') || 'Salva'}</LifeSyncButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { WellnessPage }
export default WellnessPage
