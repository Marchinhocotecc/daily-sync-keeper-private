import { useState } from 'react';
import { Activity, Target, TrendingUp, Edit3 } from 'lucide-react';
import { LifeSyncCard } from './LifeSyncCard';
import { LifeSyncButton } from './LifeSyncButton';
import { useWellness } from '@/hooks/useWellness';

const WellnessWidget = () => {
  const { wellnessData, loading, updateWellnessData } = useWellness();
  const [isEditing, setIsEditing] = useState(false);
  // Inputs as strings to allow empty state and clean typing
  const [editValues, setEditValues] = useState({
    steps: '',
    calories: '',
    stepGoal: '',
    calorieGoal: ''
  });

  const handleSave = () => {
    const toInt = (v: string, fallback = 0) => {
      const n = parseInt(v || '', 10);
      return Number.isFinite(n) ? Math.max(0, n) : fallback;
    };

    updateWellnessData(
      toInt(editValues.steps, wellnessData.steps),
      toInt(editValues.calories, wellnessData.calories),
      toInt(editValues.stepGoal, wellnessData.step_goal),
      toInt(editValues.calorieGoal, wellnessData.calorie_goal)
    );
    setIsEditing(false);
  };

  const stepsPercentage = Math.min((wellnessData.steps / wellnessData.step_goal) * 100, 100);
  const caloriesPercentage = Math.min((wellnessData.calories / wellnessData.calorie_goal) * 100, 100);
  const stepsBarClass =
    stepsPercentage < 33 ? 'bg-destructive' : stepsPercentage < 66 ? 'bg-warning' : 'bg-success';
  const caloriesBarClass =
    caloriesPercentage < 33 ? 'bg-destructive' : caloriesPercentage < 66 ? 'bg-warning' : 'bg-success';

  return (
    <LifeSyncCard className="mobile-section">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Benessere
        </h3>
        <div className="flex space-x-2">
          <LifeSyncButton
            variant="ghost"
            size="icon"
            onClick={() => {
              // Initialize inputs; start empty if current value is 0
              setEditValues({
                steps: wellnessData.steps > 0 ? String(wellnessData.steps) : '',
                calories: wellnessData.calories > 0 ? String(wellnessData.calories) : '',
                stepGoal: wellnessData.step_goal > 0 ? String(wellnessData.step_goal) : '',
                calorieGoal: wellnessData.calorie_goal > 0 ? String(wellnessData.calorie_goal) : ''
              });
              setIsEditing(!isEditing);
            }}
          >
            <Edit3 size={16} />
          </LifeSyncButton>
          <div className="p-2 bg-success/10 rounded-xl">
            <Activity className="text-success" size={20} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-16 bg-muted animate-pulse rounded-xl" />
          <div className="h-16 bg-muted animate-pulse rounded-xl" />
        </div>
      ) : isEditing ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Passi</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={editValues.steps}
              onFocus={(e) => {
                if (e.currentTarget.value === '0') {
                  setEditValues(prev => ({ ...prev, steps: '' }));
                }
              }}
              onChange={(e) =>
                setEditValues(prev => ({ ...prev, steps: e.target.value.replace(/\D/g, '') }))
              }
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
              placeholder="Inserisci passi"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Obiettivo passi</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={editValues.stepGoal}
              onFocus={(e) => {
                if (e.currentTarget.value === '0') {
                  setEditValues(prev => ({ ...prev, stepGoal: '' }));
                }
              }}
              onChange={(e) =>
                setEditValues(prev => ({ ...prev, stepGoal: e.target.value.replace(/\D/g, '') }))
              }
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
              placeholder="Es. 10000"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Calorie</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={editValues.calories}
              onFocus={(e) => {
                if (e.currentTarget.value === '0') {
                  setEditValues(prev => ({ ...prev, calories: '' }));
                }
              }}
              onChange={(e) =>
                setEditValues(prev => ({ ...prev, calories: e.target.value.replace(/\D/g, '') }))
              }
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
              placeholder="Inserisci calorie"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Obiettivo calorie</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={editValues.calorieGoal}
              onFocus={(e) => {
                if (e.currentTarget.value === '0') {
                  setEditValues(prev => ({ ...prev, calorieGoal: '' }));
                }
              }}
              onChange={(e) =>
                setEditValues(prev => ({ ...prev, calorieGoal: e.target.value.replace(/\D/g, '') }))
              }
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
              placeholder="Es. 600"
            />
          </div>
          <div className="flex space-x-2">
            <LifeSyncButton variant="primary" onClick={handleSave} className="flex-1">
              Salva
            </LifeSyncButton>
            <LifeSyncButton variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
              Annulla
            </LifeSyncButton>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Steps */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target size={16} className="text-primary" />
                <span className="text-sm font-medium text-foreground">Passi</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {wellnessData.steps.toLocaleString()} / {wellnessData.step_goal.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`${stepsBarClass} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${stepsPercentage}%` }}
              />
            </div>
          </div>

          {/* Calories */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp size={16} className="text-accent" />
                <span className="text-sm font-medium text-foreground">Calorie</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {wellnessData.calories} / {wellnessData.calorie_goal}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`${caloriesBarClass} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${caloriesPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.round(stepsPercentage)}%
              </div>
              <div className="text-xs text-muted-foreground">Obiettivo passi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">
                {Math.round(caloriesPercentage)}%
              </div>
              <div className="text-xs text-muted-foreground">Obiettivo calorie</div>
            </div>
          </div>
        </div>
      )}
    </LifeSyncCard>
  );
};

export { WellnessWidget };