import React from 'react'
import { useAuthSlice } from '@/state/global/GlobalStateProvider'
import { Navigate, useLocation } from 'react-router-dom'

/**
 * ProtectedRoute:
 * - Se autenticato -> render children
 * - Altrimenti redirect a /login con stato "from"
 * - Garantisce che l'app non vada in crash anche se lo stato auth non è pronto
 */
const ProtectedRoute: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { isAuthenticated, loading } = useAuthSlice()
  const location = useLocation()

  if (loading) {
    return <div style={{ padding: 32 }}>Verifica sessione...</div>
  }
  if (!isAuthenticated) {
    console.info('[ProtectedRoute] Utente non autenticato → redirect /login')
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}

export default ProtectedRoute
