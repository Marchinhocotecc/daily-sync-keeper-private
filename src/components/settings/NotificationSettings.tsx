import { usePreferencesSlice } from '@/state/global/GlobalStateProvider'
import { LifeSyncCard } from '@/components/LifeSyncCard'

const leadOptions = [1,5,10,15]

export const NotificationSettings = () => {
  const {
    notificationsEnabled,
    notificationLeadMinutes,
    setNotificationsEnabled,
    setNotificationLead
  } = usePreferencesSlice()

  return (
    <LifeSyncCard className="space-y-4">
      <h3 className="font-semibold text-foreground">Notifiche</h3>
      <div className="flex items-center justify-between">
        <span className="text-sm">Abilita notifiche</span>
        <input
          type="checkbox"
          checked={notificationsEnabled}
          onChange={e => setNotificationsEnabled(e.target.checked)}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm">Anticipo promemoria</span>
        <select
          value={notificationLeadMinutes}
          onChange={e => setNotificationLead(parseInt(e.target.value,10))}
          className="px-2 py-1 rounded-md border border-border bg-background"
          disabled={!notificationsEnabled}
        >
          {leadOptions.map(v => <option key={v} value={v}>{v} min</option>)}
        </select>
      </div>
      {!notificationsEnabled && (
        <p className="text-xs text-muted-foreground">Le notifiche locali sono disattivate.</p>
      )}
    </LifeSyncCard>
  )
}
