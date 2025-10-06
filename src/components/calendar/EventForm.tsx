import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { CalendarEventRecord } from '@/hooks/useCalendarEvents'

interface EventFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: Omit<CalendarEventRecord, 'id'>) => Promise<any> | any
  initialDate?: string
  editing?: CalendarEventRecord | null
}

const defaultColor = '#2563eb'

const EventForm: React.FC<EventFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialDate,
  editing,
}) => {
  const { t } = useTranslation()

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(initialDate || '')
  const [time, setTime] = useState('09:00')
  const [duration, setDuration] = useState(60)
  const [color, setColor] = useState(defaultColor)
  const [category, setCategory] = useState<string | null>(null)
  const [description, setDescription] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      if (editing) {
        setTitle(editing.title)
        setDate(editing.date)
        setTime(editing.time)
        setDuration(editing.duration)
        setColor(editing.color || defaultColor)
        setCategory(editing.category || null)
        setDescription(editing.description || null)
      } else {
        setTitle('')
        setDate(initialDate || '')
        setTime('09:00')
        setDuration(60)
        setColor(defaultColor)
        setCategory(null)
        setDescription(null)
      }
    }
  }, [open, editing, initialDate])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !date || !time) return
    setSubmitting(true)
    try {
      await onSubmit({
        title,
        date,
        time,
        duration,
        color,
        category,
        description,
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-xl border bg-background p-4 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            {editing
              ? t('calendar.form.editTitle', 'Edit Event')
              : t('calendar.form.createTitle', 'New Event')}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={submitting}
          >
            {t('common.close', 'Close')}
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-medium">
              {t('calendar.form.title', 'Title')}
            </label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder={t('calendar.form.titlePlaceholder', 'Event title') as string}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium">
                {t('calendar.form.date', 'Date')}
              </label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium">
                {t('calendar.form.time', 'Time')}
              </label>
              <Input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1 col-span-1">
              <label className="text-[11px] font-medium">
                {t('calendar.form.duration', 'Duration (min)')}
              </label>
              <Input
                type="number"
                min={5}
                step={5}
                value={duration}
                onChange={e => setDuration(parseInt(e.target.value || '0', 10))}
                required
              />
            </div>
            <div className="space-y-1 col-span-2">
              <label className="text-[11px] font-medium">
                {t('calendar.form.color', 'Color')}
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  className="h-9 w-16 p-1"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                />
                <Input
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  placeholder="#2563eb"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium">
              {t('calendar.form.category', 'Category')}
            </label>
            <Input
              value={category || ''}
              onChange={e => setCategory(e.target.value || null)}
              placeholder={t('calendar.form.categoryPlaceholder', 'e.g. work') as string}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium">
              {t('calendar.form.description', 'Description')}
            </label>
            <textarea
              className="w-full rounded-md border bg-background p-2 text-sm resize-y min-h-[80px] focus:outline-none focus:ring-1 focus:ring-primary"
              value={description || ''}
              onChange={e => setDescription(e.target.value || null)}
              placeholder={t('calendar.form.descriptionPlaceholder', 'Optional details') as string}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !title || !date || !time}
            >
              {submitting
                ? t('common.saving', 'Saving...')
                : editing
                  ? t('common.save', 'Save')
                  : t('common.create', 'Create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export { EventForm }
export default EventForm
