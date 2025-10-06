import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Calendar, X, Check, RefreshCcw } from 'lucide-react';
import { LifeSyncCard } from '@/components/LifeSyncCard';
import { LifeSyncButton } from '@/components/LifeSyncButton';
import { useCalendarSlice } from '@/state/global/GlobalStateProvider';
import { useNow } from '@/hooks/useNow';
import { requestNotificationPermission, showInstantNotification } from '@/services/notifications';
import { useTranslation } from 'react-i18next';
import type { CalendarEvent } from '@/lib/supabase'
import { fetchEventsByDate, fetchEventsByRange } from '@/services/calendarQueries'

const AgendaPage = () => {
  const { t } = useTranslation();
  const tr = (k: string, fb: string) => { const v = t(k); return v === k ? fb : v; };

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    time: '',
    duration: 60,
    color: '#005f99',
    description: '',
    recurrence: 'none',
    date: new Date().toISOString().split('T')[0]
  });

  const {
    events,
    loading,
    addEvent,
    deleteEvent,
    updateEvent,
    getEventsForDate,
    refetch
  } = useCalendarSlice();

  const now = useNow(30000);

  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [filterColor, setFilterColor] = useState<string | null>(null);
  const [editing, setEditing] = useState<null | {
    id: string; title: string; time: string; duration: number; color: string; description?: string; recurrence?: string; date: string
  }>(null);

  const presetColors = ['#005f99', '#3f00ff', '#ff6b6b', '#16a34a', '#f59e0b'];

  const applyColorFilter = <T extends { color: string }>(list: T[]) =>
    filterColor ? list.filter(e => e.color === filterColor) : list;

  const selectedDateEvents = applyColorFilter(getEventsForDate(selectedDate));

  // Local UI-focused loading tied to on-demand fetches for day/week
  const [uiLoading, setUiLoading] = useState(false)
  // Cached data for current view
  const [dayData, setDayData] = useState<CalendarEvent[]>([])
  const [weekData, setWeekData] = useState<Record<string, CalendarEvent[]>>({})

  // Query helpers ---------------------------------------------------
  const isoDate = (d: Date) => d.toISOString().split('T')[0]
  const startOfWeekMonday = (d: Date) => {
    const s = new Date(d)
    const weekday = (s.getDay() + 6) % 7 // Monday=0
    s.setDate(s.getDate() - weekday)
    s.setHours(0,0,0,0)
    return s
  }
  const endOfWeekSunday = (d: Date) => {
    const s = startOfWeekMonday(d)
    const e = new Date(s)
    e.setDate(s.getDate() + 6)
    e.setHours(23,59,59,999)
    return e
  }

  const loadDay = async () => {
    setUiLoading(true)
    try {
      const date = isoDate(selectedDate)
      const list = await fetchEventsByDate(date)
      setDayData(applyColorFilter(list))
    } finally {
      setUiLoading(false)
    }
  }

  const loadWeek = async () => {
    setUiLoading(true)
    try {
      const start = startOfWeekMonday(currentDate)
      const end = endOfWeekSunday(currentDate)
      const map = await fetchEventsByRange(isoDate(start), isoDate(end))
      // Apply color filter per-day
      const filtered: Record<string, CalendarEvent[]> = {}
      getWeekDays().forEach(d => {
        const key = isoDate(d)
        filtered[key] = applyColorFilter(map[key] || [])
      })
      setWeekData(filtered)
    } finally {
      setUiLoading(false)
    }
  }

  // Trigger fetch on selection / mode change ------------------------
  // Note: keep month view as-is (uses existing local materialization for cells).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(() => {
    // initial load
    if (viewMode === 'day') loadDay()
    else if (viewMode === 'week') loadWeek()
  })

  // Simple effect when dependencies change
  // (We avoid complex deps to keep predictable refresh behavior)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(() => {
    const handler = async () => {
      if (viewMode === 'day') await loadDay()
      else if (viewMode === 'week') await loadWeek()
    }
    handler()
  }, [selectedDate, viewMode, filterColor, currentDate])

  // Refresh button should re-run current-mode query
  const doRefresh = async () => {
    if (viewMode === 'day') await loadDay()
    else if (viewMode === 'week') await loadWeek()
    else await refetch?.()
  }

  const handleAddEvent = () => {
    if (newEvent.title.trim() && newEvent.time) {
      const dateString = newEvent.date || selectedDate.toISOString().split('T')[0];
      const at = parseEventDateTime(dateString, newEvent.time);
      const delta = at.getTime() - Date.now();

      addEvent(
        newEvent.title,
        dateString,
        newEvent.time,
        newEvent.duration,
        newEvent.color,
        newEvent.description,
        newEvent.recurrence as any
      );

      if (delta >= 0 && delta <= 15 * 60_000) {
        requestNotificationPermission().then(async (granted) => {
          if (granted) {
            await showInstantNotification({
              title: 'Promemoria evento',
              body: `Tra ${formatRemaining(delta)}: ${newEvent.title}`,
              channelId: 'high',
              priority: 'high',
            });
          }
        });
      }

      doRefresh().catch(() => {})

      setNewEvent({ title: '', time: '', duration: 60, color: '#005f99', description: '', recurrence: 'none', date: selectedDate.toISOString().split('T')[0] });
      setShowAddEvent(false);
    }
  };

  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay() + 1); // Start from Monday
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('it-IT', { 
      weekday: 'short', 
      day: 'numeric' 
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
    
    // Update current date if needed for week view
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    if (newDate < startOfWeek || newDate > endOfWeek) {
      setCurrentDate(newDate);
    }
  };

  // Helpers for countdown
  const parseEventDateTime = (dateStr: string, timeStr: string) => {
    // dateStr: YYYY-MM-DD, timeStr: HH:mm
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

  // Drag & Drop handlers (simple date move)
  const onDragStart = (e: React.DragEvent, evId: string) => {
    e.dataTransfer.setData('text/event-id', evId);
  };
  const onDayCellDrop = (e: React.DragEvent, date: string) => {
    const id = e.dataTransfer.getData('text/event-id');
    if (!id) return;
    const ev = events.find(x => x.id === id);
    if (!ev) return;
    updateEvent(id, { date });
  };
  const allowDrop = (e: React.DragEvent) => e.preventDefault();

  // Month view helpers
  const monthDays = () => {
    const yr = currentDate.getFullYear();
    const mo = currentDate.getMonth();
    const first = new Date(yr, mo, 1);
    const startWeekDay = (first.getDay() + 6) % 7; // make Monday=0
    const daysInMonth = new Date(yr, mo + 1, 0).getDate();
    const cells: Date[] = [];
    for (let i = 0; i < startWeekDay; i++) {
      cells.push(new Date(yr, mo, 1 - (startWeekDay - i)));
    }
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(yr, mo, d));
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1];
      cells.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
    }
    return cells;
  };

  const openEdit = (ev: any) => {
    setEditing({
      id: ev.id,
      title: ev.title,
      time: ev.time,
      duration: ev.duration,
      color: ev.color,
      description: ev.description,
      recurrence: ev.recurrence || 'none',
      date: ev.date
    });
  };

  const saveEdit = () => {
    if (!editing) return;
    updateEvent(editing.id, {
      title: editing.title,
      time: editing.time,
      duration: editing.duration,
      color: editing.color,
      description: editing.description,
      recurrence: editing.recurrence as any,
      date: editing.date
    });
    setEditing(null);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="mobile-padding pt-8 pb-4 gradient-surface">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('agenda.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {currentDate.toLocaleDateString('it-IT', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LifeSyncButton 
              variant="ghost" 
              size="icon" 
              onClick={() => doRefresh()}
              title="Aggiorna"
            >
              <RefreshCcw size={18} />
            </LifeSyncButton>
            <LifeSyncButton 
              variant="primary" 
              size="icon" 
              className="rounded-full shadow-ocean"
              onClick={() => setShowAddEvent(!showAddEvent)}
            >
              <Plus size={20} />
            </LifeSyncButton>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 px-4">
          <div className="flex rounded-xl overflow-hidden border">
            {(['day','week','month'] as const).map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1 text-sm ${viewMode === m ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent/30'}`}
              >
                {m === 'day' ? 'Giorno' : m === 'week' ? 'Settimana' : 'Mese'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Filtro:</span>
            <button
              onClick={() => setFilterColor(null)}
              className={`w-6 h-6 rounded-full border ${!filterColor ? 'ring-2 ring-primary' : ''}`}
              title="Tutti"
            />
            {presetColors.map(c => (
              <button
                key={c}
                onClick={() => setFilterColor(c === filterColor ? null : c)}
                className={`w-6 h-6 rounded-full border`}
                style={{ background: c }}
              >
                {filterColor === c && <Check size={14} className="text-background" />}
              </button>
            ))}
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-4">
          <LifeSyncButton
            variant="ghost"
            size="icon"
            onClick={() => {
              const prev = new Date(currentDate);
              prev.setDate(prev.getDate() - 7);
              setCurrentDate(prev);
            }}
          >
            <ChevronLeft size={20} />
          </LifeSyncButton>
          
          <div className="flex items-center space-x-1">
            {getWeekDays().map((date, index) => (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`
                  flex flex-col items-center p-2 rounded-xl transition-all duration-200
                  ${isSelected(date) 
                    ? 'bg-primary text-primary-foreground shadow-ocean' 
                    : isToday(date)
                    ? 'bg-accent/30 text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/20'
                  }
                `}
              >
                <span className="text-xs font-medium">
                  {formatDate(date).split(' ')[0]}
                </span>
                <span className="text-sm font-bold">
                  {formatDate(date).split(' ')[1]}
                </span>
              </button>
            ))}
          </div>
          
          <LifeSyncButton
            variant="ghost"
            size="icon"
            onClick={() => {
              const next = new Date(currentDate);
              next.setDate(next.getDate() + 7);
              setCurrentDate(next);
            }}
          >
            <ChevronRight size={20} />
          </LifeSyncButton>
        </div>
      </div>

      {/* NEW: Add Event Form moved to top */}
      {showAddEvent && (
        <div className="mobile-padding">
          <LifeSyncCard className="mb-4">
            {/* ...existing add-event form code (unchanged content)... */}
            {/* copied from old bottom block */}
            {/* Title / date / time etc */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e)=>setNewEvent({...newEvent, date: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder={t('eventTitlePlaceholder') || ''}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={newEvent.duration}
                    onChange={(e) => setNewEvent({ ...newEvent, duration: Number(e.target.value || 0) })}
                    className="px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                    placeholder={t('durationPlaceholder') || ''}
                  />
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background">
                    <label htmlFor="event-color" className="text-sm text-muted-foreground">{t('color')}</label>
                    <input
                      id="event-color"
                      type="color"
                      value={newEvent.color}
                      onChange={(e) => setNewEvent({ ...newEvent, color: e.target.value })}
                      className="h-8 w-10 rounded border-0 p-0 bg-transparent"
                    />
                  </div>
                </div>
              </div>
              <textarea
                value={newEvent.description}
                onChange={(e)=>setNewEvent({...newEvent, description: e.target.value})}
                placeholder="Descrizione (opzionale)"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm"
                rows={2}
              />
              <div className="flex items-center gap-2 flex-wrap">
                {presetColors.map(c => (
                  <button
                    key={c}
                    onClick={()=>setNewEvent({...newEvent, color: c})}
                    className={`w-7 h-7 rounded-full border ${newEvent.color === c ? 'ring-2 ring-primary' : ''}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <select
                value={newEvent.recurrence}
                onChange={(e)=>setNewEvent({...newEvent, recurrence: e.target.value})}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm"
              >
                <option value="none">Nessuna ricorrenza</option>
                <option value="daily">Ogni giorno</option>
                <option value="weekly">Ogni settimana</option>
                <option value="monthly">Ogni mese</option>
              </select>
              <div className="flex justify-end gap-2">
                <LifeSyncButton variant="ghost" onClick={() => setShowAddEvent(false)}>
                  {t('cancel')}
                </LifeSyncButton>
                <LifeSyncButton variant="primary" onClick={handleAddEvent}>
                  {t('addEvent')}
                </LifeSyncButton>
              </div>
            </div>
          </LifeSyncCard>
        </div>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="mobile-padding mt-4">
          <LifeSyncCard>
            <div className="grid grid-cols-7 text-xs font-medium mb-2">
              {['Lun','Mar','Mer','Gio','Ven','Sab','Dom'].map(d => (
                <div key={d} className="text-center text-muted-foreground">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthDays().map((d,i) => {
                const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                const dayEvents = applyColorFilter(getEventsForDate(d)).slice(0,3);
                return (
                  <div
                    key={i}
                    onDragOver={allowDrop}
                    onDrop={(e)=>onDayCellDrop(e, d.toISOString().split('T')[0])}
                    className={`relative h-24 p-1 rounded-lg border ${
                      d.toDateString() === selectedDate.toDateString() ? 'border-primary' : 'border-border'
                    } ${!isCurrentMonth ? 'opacity-40' : ''} cursor-pointer bg-background/60`}
                    onClick={() => { setSelectedDate(d); setViewMode('day') }}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold">{d.getDate()}</span>
                      <button
                        className="text-xs px-1 rounded hover:bg-accent"
                        onClick={(e) => { e.stopPropagation(); setSelectedDate(d); setShowAddEvent(true) }}
                      >+</button>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.map(ev => (
                        <div
                          key={ev.id}
                          draggable
                          onDragStart={(e)=>onDragStart(e, ev.id)}
                          onClick={(e)=>{e.stopPropagation();openEdit(ev)}}
                          className="text-[10px] truncate px-1 py-0.5 rounded"
                          style={{ background: ev.color, color: '#fff' }}
                          title={`${ev.time} ${ev.title}`}
                        >
                          {ev.time} {ev.title}
                        </div>
                      ))}
                      {applyColorFilter(getEventsForDate(d)).length > 3 && (
                        <div className="text-[10px] text-muted-foreground">+{applyColorFilter(getEventsForDate(d)).length - 3}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </LifeSyncCard>
        </div>
      )}

      {/* Existing Week navigation & daily list only when week/day */}
      {viewMode !== 'month' && (
        <>
          {/* Events */}
          <div className="mobile-padding">
            <LifeSyncCard>
              <div className="flex items-center space-x-2 mb-4">
                <Calendar size={20} className="text-primary" />
                <h3 className="font-semibold text-foreground">
                  {t('agenda.events')}
                </h3>
              </div>

              {/* Loading indicator bound to our on-demand fetch */}
              {uiLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : viewMode === 'day' ? (
                // Day mode: list of events for selected day
                dayData.length > 0 ? (
                  <div className="space-y-3">
                    {dayData.map((event) => {
                      const at = parseEventDateTime(event.date, event.time);
                      const delta = at.getTime() - now.getTime();
                      const isOngoing = delta <= 0 && now.getTime() < at.getTime() + event.duration * 60_000;
                      const suffix = delta > 0
                        ? ` • tra ${formatRemaining(delta)}`
                        : (isOngoing ? ' • in corso' : '');
                      return (
                        <div
                          key={event.id}
                          draggable
                          onDragStart={(e)=>onDragStart(e, event.id)}
                          onClick={(e)=>{e.stopPropagation();openEdit(event)}}
                          className="p-4 rounded-xl border-l-4 transition-all duration-200 hover:shadow-card bg-background/50"
                          style={{ borderLeftColor: event.color }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-foreground">{event.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {event.time} • {event.duration} min{suffix}
                              </p>
                            </div>
                            <button
                              onClick={() => deleteEvent(event.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors duration-200"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar size={48} className="mx-auto mb-3 opacity-50" />
                    <p>Nessun evento per questo giorno</p>
                  </div>
                )
              ) : (
                // Week mode: 7 sections, one per day (Mon-Sun)
                (() => {
                  const days = getWeekDays()
                  const total = days.reduce((acc, d) => acc + ((weekData[isoDate(d)] || []).length), 0)
                  if (total === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar size={48} className="mx-auto mb-3 opacity-50" />
                        <p>Nessun evento per questa settimana</p>
                      </div>
                    )
                  }
                  return (
                    <div className="space-y-4">
                      {days.map((date) => {
                        const key = isoDate(date)
                        const list = weekData[key] || []
                        return (
                          <div key={key} className="rounded-xl border bg-background/50">
                            <div className="px-4 py-2 text-sm font-semibold text-foreground">
                              {date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'short' })}
                            </div>
                            {list.length === 0 ? (
                              <div className="px-4 pb-3 text-sm text-muted-foreground">
                                Nessun evento
                              </div>
                            ) : (
                              <div className="px-4 pb-3 space-y-2">
                                {list.map((event) => (
                                  <div
                                    key={event.id}
                                    draggable
                                    onDragStart={(e)=>onDragStart(e, event.id)}
                                    onClick={(e)=>{e.stopPropagation();openEdit(event)}}
                                    className="p-3 rounded-xl border-l-4 bg-background/50"
                                    style={{ borderLeftColor: event.color }}
                                    title={`${event.time} ${event.title}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="text-sm font-medium text-foreground">{event.title}</div>
                                        <div className="text-xs text-muted-foreground">{event.time} • {event.duration} min</div>
                                      </div>
                                      <button
                                        onClick={() => deleteEvent(event.id)}
                                        className="text-muted-foreground hover:text-destructive transition-colors duration-200"
                                      >
                                        <X size={16} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })()
              )}
            </LifeSyncCard>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-5 rounded-2xl border bg-background shadow-lg space-y-3">
            <h3 className="font-semibold text-foreground">Modifica evento</h3>
            <input
              value={editing.title}
              onChange={e=>setEditing({...editing, title: e.target.value})}
              className="w-full px-3 py-2 rounded-xl border bg-background"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="time"
                value={editing.time}
                onChange={e=>setEditing({...editing, time: e.target.value})}
                className="px-3 py-2 rounded-xl border bg-background"
              />
              <input
                type="number"
                min={5}
                step={5}
                value={editing.duration}
                onChange={e=>setEditing({...editing, duration: Number(e.target.value || 0)})}
                className="px-3 py-2 rounded-xl border bg-background"
              />
              <select
                value={editing.recurrence}
                onChange={e=>setEditing({...editing, recurrence: e.target.value})}
                className="px-3 py-2 rounded-xl border bg-background text-sm"
              >
                <option value="none">Singolo</option>
                <option value="daily">Giornaliero</option>
                <option value="weekly">Settimanale</option>
                <option value="monthly">Mensile</option>
              </select>
            </div>
            <input
              type="date"
              value={editing.date}
              onChange={e=>setEditing({...editing, date: e.target.value})}
              className="w-full px-3 py-2 rounded-xl border bg-background"
            />
            <textarea
              value={editing.description}
              onChange={e=>setEditing({...editing, description: e.target.value})}
              className="w-full px-3 py-2 rounded-xl border bg-background text-sm"
              rows={3}
              placeholder="Descrizione"
            />
            <div className="flex gap-2 flex-wrap">
              {presetColors.map(c => (
                <button
                  key={c}
                  onClick={()=>setEditing({...editing, color: c})}
                  className={`w-7 h-7 rounded-full border ${editing.color === c ? 'ring-2 ring-primary' : ''}`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <LifeSyncButton variant="ghost" onClick={()=>setEditing(null)}>Chiudi</LifeSyncButton>
              <LifeSyncButton variant="destructive" onClick={() => { deleteEvent(editing.id); setEditing(null) }}>Elimina</LifeSyncButton>
              <LifeSyncButton variant="primary" onClick={saveEdit}>Salva</LifeSyncButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgendaPage;