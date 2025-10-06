import { useState, useEffect } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { LifeSyncCard } from './LifeSyncCard';
import { LifeSyncButton } from './LifeSyncButton';
import { cn } from '@/lib/utils';
import { useTodos } from '@/hooks/useTodos';
import supabase from '@/lib/supabaseClient';

const TodoWidget = () => {
  const { addTodo, toggleTodo, deleteTodo } = useTodos();
  const [todayTodos, setTodayTodos] = useState<any[]>([]);
  const [loadingToday, setLoadingToday] = useState<boolean>(true);
  const [newTodo, setNewTodo] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [showInput, setShowInput] = useState(false);
  const [dueDate, setDueDate] = useState<string>('');
  const [dueTime, setDueTime] = useState<string>('');

  const todayStr = new Date().toISOString().split('T')[0];

  const refetchToday = async () => {
    setLoadingToday(true);
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('due_date', todayStr)
        .order('due_time', { ascending: true });
      if (error) {
        console.error('[TodoWidget] fetch today todos error:', error);
        setTodayTodos([]);
      } else if (!data) {
        console.warn('[TodoWidget] fetch today todos returned no data');
        setTodayTodos([]);
      } else {
        const list = (data || []).slice().sort((a: any, b: any) => {
          const ta = (a.due_time || '99:99');
          const tb = (b.due_time || '99:99');
          return ta.localeCompare(tb);
        });
        setTodayTodos(list);
      }
    } catch (e) {
      console.error('[TodoWidget] fetch today todos exception:', e);
      setTodayTodos([]);
    } finally {
      setLoadingToday(false);
    }
  };

  useEffect(() => {
    refetchToday();
  }, []);

  const handleAddTodo = async () => {
    if (newTodo.trim()) {
      await addTodo(newTodo, newPriority, dueDate || undefined, dueTime || undefined);
      setNewTodo('');
      setNewPriority('medium');
      setDueDate('');
      setDueTime('');
      setShowInput(false);
      await refetchToday();
    }
  };

  const handleToggle = async (id: string) => {
    await toggleTodo(id);
    await refetchToday();
  };

  const handleDelete = async (id: string) => {
    await deleteTodo(id);
    await refetchToday();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/20 text-destructive';
      case 'medium': return 'bg-warning/20 text-warning';
      case 'low': return 'bg-success/20 text-success';
      default: return 'bg-muted';
    }
  };

  const activeTodos = todayTodos.filter(t => !t.completed);
  const completedCount = todayTodos.filter(t => t.completed).length;

  return (
    <LifeSyncCard className="mobile-section">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Attività di oggi
          </h3>
          <p className="text-sm text-muted-foreground">
            {activeTodos.length} da fare, {completedCount} completate
          </p>
        </div>
        <LifeSyncButton
          variant="primary"
          size="icon"
          onClick={() => setShowInput(!showInput)}
          className="rounded-full shadow-ocean"
        >
          <Plus size={20} />
        </LifeSyncButton>
      </div>

      {showInput && (
        <div className="mb-4 animate-slide-up">
          <div className="space-y-3">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Aggiungi una nuova attività..."
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
              autoFocus
            />
            <div className="flex space-x-2">
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
              >
                <option value="low">Bassa priorità</option>
                <option value="medium">Media priorità</option>
                <option value="high">Alta priorità</option>
              </select>
              <LifeSyncButton variant="primary" size="icon" onClick={handleAddTodo}>
                <Check size={16} />
              </LifeSyncButton>
            </div>
            <div className="flex space-x-2">
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
              />
              <input
                type="time"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
              />
            </div>
          </div>
        </div>
      )}

      {loadingToday ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : todayTodos.length === 0 ? (
        <div className="text-sm text-muted-foreground py-2">
          Nessuna attività per oggi
        </div>
      ) : (
        <div className="space-y-3">
          {todayTodos.slice(0, 4).map((todo) => (
            <div
              key={todo.id}
              className={cn(
                'flex items-center space-x-3 p-3 rounded-xl transition-all duration-200',
                'hover:bg-accent/30',
                todo.completed && 'opacity-60'
              )}
            >
              <button
                onClick={() => handleToggle(todo.id)}
                className={cn(
                  'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200',
                  todo.completed
                    ? 'bg-success border-success text-success-foreground'
                    : 'border-border hover:border-primary'
                )}
              >
                {todo.completed && <Check size={12} />}
              </button>

              <div className="flex-1">
                <span className={cn(
                  'text-sm',
                  todo.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                )}>
                  {todo.text}
                </span>
                <div className={cn(
                  'inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium',
                  getPriorityColor(todo.priority)
                )}>
                  {todo.priority === 'high' ? 'Alta' : todo.priority === 'medium' ? 'Media' : 'Bassa'}
                </div>
              </div>

              <button
                onClick={() => handleDelete(todo.id)}
                className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors duration-200"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {todayTodos.length > 4 && !loadingToday && (
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            +{todayTodos.length - 4} altre attività
          </p>
        </div>
      )}
    </LifeSyncCard>
  );
};

export { TodoWidget };