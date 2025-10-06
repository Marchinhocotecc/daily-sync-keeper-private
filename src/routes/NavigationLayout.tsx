import React from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const tabs = [
  { to: '/', key: 'nav.home', icon: '🏠' },
  { to: '/calendar', key: 'nav.calendar', icon: '🗓️' },
  { to: '/expenses', key: 'nav.expenses', icon: '💰' },
  { to: '/assistant', key: 'nav.assistant', icon: '🤖' },
  { to: '/settings', key: 'nav.settings', icon: '⚙️' },
]

export const NavigationLayout: React.FC = () => {
  const { t } = useTranslation()
  const loc = useLocation()
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </div>
      <nav
        aria-label={t('nav.label')}
        style={{
          display: 'flex',
          borderTop: '1px solid var(--border,#ddd)',
          background: 'var(--nav-bg,#fafafa)'
        }}
      >
        {tabs.map(tab => {
            const active = loc.pathname === tab.to
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              style={{
                flex: 1,
                padding: '0.6rem 0.25rem',
                textAlign: 'center',
                textDecoration: 'none',
                fontSize: '0.75rem',
                color: active ? 'var(--accent,#2563eb)' : 'var(--text,#444)',
                fontWeight: active ? 600 : 400
              }}
            >
              <div style={{ fontSize: '1.1rem' }}>{tab.icon}</div>
              {t(tab.key)}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
