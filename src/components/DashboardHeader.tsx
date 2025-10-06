import { useState, useEffect } from 'react';
import { Bell, Settings, Sun, Moon } from 'lucide-react';
import { LifeSyncButton } from './LifeSyncButton';
import { cn } from '@/lib/utils';
import { z } from 'zod';

interface DashboardHeaderProps {
  userName?: string;
}

const DashboardHeader = ({ userName = 'Utente' }: DashboardHeaderProps) => {
  z.object({ userName: z.string().optional() }).parse({ userName });

  const [darkMode, setDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Buongiorno';
    if (hour < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  return (
    <header className="mobile-padding pt-8 pb-4 gradient-surface">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 gradient-ocean rounded-full flex items-center justify-center shadow-ocean">
            <span className="text-primary-foreground font-bold text-lg">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {getGreeting()}, {userName}!
            </h1>
            <p className="text-sm text-muted-foreground capitalize">
              {formatDate()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <LifeSyncButton
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-full"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </LifeSyncButton>
          
          <LifeSyncButton
            variant="ghost"
            size="icon"
            className="rounded-full relative"
          >
            <Bell size={20} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse-gentle" />
          </LifeSyncButton>
          
          <LifeSyncButton
            variant="ghost"
            size="icon"
            className="rounded-full"
          >
            <Settings size={20} />
          </LifeSyncButton>
        </div>
      </div>
    </header>
  );
};

export { DashboardHeader };