import { useState } from 'react';
import { Home, Calendar, Receipt, User, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const PropsSchema = z.object({
    activeTab: z.string(),
    onTabChange: z.function().args(z.string()).returns(z.void())
  });
  PropsSchema.parse({ activeTab, onTabChange });

  const { t } = useTranslation();
  const tabs = [
    { id: 'home', label: t('nav.home', 'Home'), icon: Home },
    { id: 'agenda', label: t('nav.agenda', 'Agenda'), icon: Calendar },
    { id: 'spese', label: t('nav.spese', 'Spese'), icon: Receipt },
    { id: 'assistente', label: t('nav.assistente', 'Assistente'), icon: MessageCircle },
    { id: 'profilo', label: t('nav.profilo', 'Profilo'), icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex justify-around items-center">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200',
                  'min-w-[60px] relative',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className={cn(
                  'p-1.5 rounded-lg transition-all duration-200',
                  isActive && 'bg-primary/20 scale-110'
                )}>
                  <IconComponent 
                    size={20} 
                    className={cn(
                      'transition-all duration-200',
                      isActive && 'text-primary'
                    )}
                  />
                </div>
                <span className={cn(
                  'text-xs font-medium mt-1 transition-all duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export { Navigation };