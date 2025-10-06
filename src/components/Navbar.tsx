import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuthSlice, useStatsSlice } from '@/state/global/GlobalStateProvider'

const linkStyle: React.CSSProperties = { marginRight: 12, textDecoration: 'none' }
const activeStyle: React.CSSProperties = { fontWeight: 700 }

const Navbar: React.FC = () => {
  const { signOut } = useAuthSlice()
  const { currentMonthExpensesCount } = useStatsSlice()

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid #eee' }}>
      <NavLink to="/spese" style={linkStyle} className={({ isActive }) => (isActive ? 'active' : '')}>
        {({ isActive }) => <span style={isActive ? activeStyle : undefined}>Spese ({currentMonthExpensesCount})</span>}
      </NavLink>
      <NavLink to="/wellness" style={linkStyle}>
        {({ isActive }) => <span style={isActive ? activeStyle : undefined}>Wellness</span>}
      </NavLink>
      <NavLink to="/settings" style={linkStyle}>
        {({ isActive }) => <span style={isActive ? activeStyle : undefined}>Settings</span>}
      </NavLink>
      {/* aggiungi altre pagine qui */}
      <div style={{ flex: 1 }} />
      <button onClick={signOut}>Logout</button>
    </nav>
  )
}

export default Navbar
