import { useEffect, useState, useRef } from 'react';
import { Bell, Calendar, CheckSquare, Check } from 'lucide-react';
import { LifeSyncCard } from './LifeSyncCard';
import { useTodos } from '@/hooks/useTodos';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { requestNotificationPermission, initNotificationChannels, showInstantNotification } from '@/services/notifications'
import { useNow } from '@/hooks/useNow';
import { toArray } from '@/utils/toArray'

interface Notification {
  id: string;
  title: string;
  time?: string;
  type: 'todo' | 'event';
  priority?: 'low' | 'medium' | 'high';
  timeRemainingLabel?: string;
}

const NotificationWidget = () => {
  const { todos, deleteTodo } = useTodos();
  const { events, deleteEvent } = useCalendarEvents();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const now = useNow(30000);
  const notified = useRef<Set<string>>(new Set());

  // init channels/permissions once
  useEffect(() => {
    const setup = async () => {
      try {
        await requestNotificationPermission()
        await initNotificationChannels()
      } catch (e) {
        console.error('[NotificationWidget] notification setup failed', e)
      }
    }
    setup()
  }, [])

  const parseEventDateTime = (dateStr: string, timeStr: string) => {
    return new Date(`${dateStr}T${timeStr}:00`);
  };
  const formatRemaining = (ms: number) => {
    if (ms < 60_000) return 'meno di 1 min';
    const mins = Math.round(ms / 60_000);
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  };

  /**
   * Extracts the underlying entity ID from notification ID.
   * Supported formats:
   * - todo-<id>
   * - todo-soon-<id>
   * - event-<id>
   */
  const extractEntityId = (n: Notification): string => {
    if (n.type === 'todo') return n.id.replace(/^todo-(?:soon-)?/, '');
    return n.id.replace(/^event-/, '');
  };

  /**
   * Completes a notification by deleting the underlying entity (todo/event).
   * - For todos: deletes the todo via global action (updates state + remote).
   * - For events: deletes the event via global action (updates state + remote).
   * Errors are caught and logged to avoid breaking the UI.
   */
  const handleComplete = async (n: Notification) => {
    try {
      const id = extractEntityId(n);
      if (n.type === 'todo') {
        await deleteTodo(id);
      } else {
        await deleteEvent(id);
      }
      // UI auto-updates because notifications derive from global state.
    } catch (e) {
      console.error('[NotificationWidget][complete][error]', e);
    }
  };

  useEffect(() => {
    const generateNotifications = () => {
      const today = now.toISOString().split('T')[0];
      const todayEvents = toArray(events).filter(event => event.date === today);

      const newNotifications: Notification[] = [];

      // Next upcoming event with time remaining
      const upcoming = todayEvents
        .map(e => ({ e, at: parseEventDateTime(e.date, e.time) }))
        .filter(({ at }) => at.getTime() > now.getTime())
        .sort((a, b) => a.at.getTime() - b.at.getTime())[0];

      if (upcoming) {
        const { e, at } = upcoming;
        const deltaMs = at.getTime() - now.getTime();

        newNotifications.push({
          id: `event-${e.id}`,
          title: e.title,
          time: e.time,
          type: 'event',
          timeRemainingLabel: `tra ${formatRemaining(deltaMs)}`
        });

        // Fire a single instant notification if within 15 minutes and not already sent
        if (deltaMs > 0 && deltaMs <= 15 * 60_000 && !notified.current.has(e.id)) {
          notified.current.add(e.id);
          showInstantNotification({
            title: 'Promemoria evento',
            body: `Tra ${formatRemaining(deltaMs)}: ${e.title}`,
            channelId: 'high',
            priority: 'high'
          });
        }
      }

      // High priority todos (unchanged, no time remaining)
      const highPriorityTodos = toArray(todos)
        .filter(todo => !todo.completed && todo.priority === 'high')
        .slice(0, 3);

      highPriorityTodos.forEach(todo => {
        newNotifications.push({
          id: `todo-${todo.id}`,
          title: todo.text,
          type: 'todo',
          priority: todo.priority
        });
      });

      // Timed todos due soon (<15m, not completed)
      const soonTodos = toArray(todos)
        .filter(t => !t.completed && (t as any).due_date && (t as any).due_time)
        .map(t => {
          const start = new Date(`${(t as any).due_date}T${(t as any).due_time}:00`)
          return { t, delta: start.getTime() - now.getTime(), time: (t as any).due_time }
        })
        .filter(o => o.delta > 0 && o.delta <= 15 * 60_000)
        .sort((a,b) => a.delta - b.delta)
        .slice(0, 3)

      soonTodos.forEach(({ t, delta, time }) => {
        newNotifications.push({
          id: `todo-soon-${t.id}`,
            title: t.text,
            type: 'todo',
            time: time,
            timeRemainingLabel: `tra ${formatRemaining(delta)}`,
            priority: t.priority
        })
      })

      setNotifications(newNotifications);
    };

    generateNotifications();
  }, [todos, events, now]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <LifeSyncCard className="mb-6 bg-primary/5 border-primary/20">
      <div className="flex items-center space-x-2 mb-3">
        <Bell className="text-primary" size={20} />
        <h3 className="font-semibold text-foreground">Notifiche</h3>
      </div>
      
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="flex items-center space-x-3 p-2 rounded-xl bg-background/50"
          >
            {notification.type === 'event' ? (
              <Calendar className="text-primary" size={16} />
            ) : (
              <CheckSquare className="text-accent" size={16} />
            )}
            <div className="flex-1">
              <span className="text-sm font-medium text-foreground">
                {notification.title}
              </span>
              {notification.time && (
                <span className="text-xs text-muted-foreground ml-2">
                  alle {notification.time}
                </span>
              )}
              {notification.timeRemainingLabel && (
                <span className="text-xs text-primary ml-2">
                  {notification.timeRemainingLabel}
                </span>
              )}
              {notification.priority === 'high' && (
                <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full ml-2">
                  Alta priorità
                </span>
              )}
            </div>
            {/* Complete button */}
            <button
              aria-label="Completa"
              title="Completa"
              onClick={() => handleComplete(notification)}
              className="ml-auto text-success hover:text-success/80 transition-colors"
            >
              <Check size={16} />
            </button>
          </div>
        ))}
      </div>
    </LifeSyncCard>
  );
};

export { NotificationWidget };