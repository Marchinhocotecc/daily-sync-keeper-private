import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, CalendarDays, Bot, Settings, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const BottomNav: React.FC = () => {
  const { t } = useTranslation()
  const tr = (k: string, fb: string) => (t(k) === k ? fb : t(k))
  const items = [
    { to: '/home', label: tr('nav.home', 'Home'), Icon: Home },
    { to: '/calendario', label: tr('nav.calendar', 'Calendario'), Icon: CalendarDays },
    { to: '/spese', label: tr('nav.expenses', 'Spese'), Icon: Wallet },
    { to: '/assistente', label: tr('nav.assistant', 'Assistente'), Icon: Bot },
    { to: '/settings', label: tr('nav.settings', 'Impostazioni'), Icon: Settings },
  ] as const

  return (
    <nav
      className={cn(
        'fixed bottom-0 inset-x-0 z-50',
        'border-t border-border',
        'bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60',
        'pb-[env(safe-area-inset-bottom)]'
      )}
      aria-label="Bottom Navigation"
    >
      <div className="mx-auto max-w-xl">
        <ul className="grid grid-cols-5">
          {items.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'group flex h-14 flex-col items-center justify-center gap-0.5',
                    'text-xs transition-colors duration-200',
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={cn(
                        'grid place-items-center rounded-xl p-2 transition-all duration-200',
                        isActive
                          ? 'bg-primary/10 text-primary scale-110 shadow-ocean'
                          : 'text-muted-foreground group-hover:text-foreground'
                      )}>
                      <Icon size={20} />
                    </div>
                    <span className={cn('font-medium', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

export default BottomNav
// Provide a legacy alias to avoid ReferenceError in older code paths.
export const Navbar = BottomNav
