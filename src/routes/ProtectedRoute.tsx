import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthSlice } from '@/state/global/GlobalStateProvider'

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuthSlice()
  const location = useLocation()

  if (loading) {
    return <div style={{ padding: 24 }}>Loading…</div>
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

export default ProtectedRoute
