import '@/polyfills/process-shim';
import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import App from '@/App'
import '@/index.css'
// import { AuthProvider } from '@/hooks/useAuth' // REMOVED
import '@/styles/animations.css'
import { GlobalStateProvider } from '@/state/global/GlobalStateProvider'
import i18n from '@/i18n'
import { useAuth } from '@/hooks/useAuth'
import { DebugErrorBoundary } from '@/components/DebugErrorBoundary'
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary'
import ErrorBoundary from '@/components/ErrorBoundary'
import { EnvGuard } from '@/components/EnvGuard'
import '@/polyfills/process-shim'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query' // + React Query provider

// Initialize i18n once for the whole app
import '@/i18n';

// -----------------------------------------------------------------------------
// BootFallback: always-visible minimal UI during Suspense or catastrophic mount.
// -----------------------------------------------------------------------------
const BootFallback: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-950 text-gray-100 p-6">
    <div className="animate-pulse text-lg font-medium">{label}</div>
    <div className="text-xs opacity-60">If this persists, open console (F12) for diagnostics.</div>
  </div>
)

// -----------------------------------------------------------------------------
// AuthGate (unchanged logic + minor doc comments)
// -----------------------------------------------------------------------------
const AuthPage = React.lazy(() => import('@/pages/Auth'))
const AuthGate: React.FC = () => {
  const { isAuthenticated, loading } = useAuth()
  const [loadingStuck, setLoadingStuck] = React.useState(false)
  React.useEffect(() => {
    console.log('[AuthGate] mount', { isAuthenticated, loading })
  }, [])
  React.useEffect(() => {
    if (loading) {
      const id = setTimeout(() => {
        if (loading) {
          setLoadingStuck(true)
          if (import.meta.env.DEV) console.warn('[AuthGate] loading >5s (possible provider init issue)')
        }
      }, 5000)
      return () => clearTimeout(id)
    }
  }, [loading])
  if (loading) return <BootFallback label={`Auth…${loadingStuck ? ' (slow)' : ''}`} />
  return isAuthenticated ? <App /> : <AuthPage />
}

// -----------------------------------------------------------------------------
// i18n bootstrap (already defensive) + add guard log for missing resources
// -----------------------------------------------------------------------------
i18n.on?.('failedLoading', (lng: string, ns: string, msg: string) => {
  console.warn('[i18n] failedLoading', { lng, ns, msg, fallback: 'en' })
})

// DEV: log sanitized env vars once at bootstrap to help diagnose white-screen due to misconfig
if (import.meta.env?.DEV) {
  try {
    // Only expose safe keys; redact secrets by pattern
    const safeEnv = Object.fromEntries(
      Object.keys(import.meta.env)
        .filter(k => k.startsWith('VITE_') || ['MODE', 'DEV', 'PROD'].includes(k))
        .map(k => [
          k,
          /KEY|TOKEN|SECRET/i.test(k) ? '[redacted]' : (import.meta.env as any)[k]
        ])
    )
    console.log('[bootstrap] import.meta.env (safe)', safeEnv)
  } catch (e) {
    console.warn('[bootstrap] env log failed', e)
  }
}

// -----------------------------------------------------------------------------
// Global window error hooks (unchanged except small doc comment)
// -----------------------------------------------------------------------------
;(function installGlobalErrorHooks() {
  if ((window as any).__APP_GLOBAL_ERR_HOOKS__) return
  ;(window as any).__APP_GLOBAL_ERR_HOOKS__ = true

  let alerted = false

  const normalizeError = (err: any) => {
    if (err instanceof Error) return { message: err.message, stack: err.stack }
    if (typeof err === 'string') return { message: err }
    return err
  }

  const notify = (label: string, err: any) => {
    const data = normalizeError(err)
    console.error(`[global.${label}]`, data)
    if (!alerted && import.meta.env.PROD) {
      alerted = true
      try { alert('A critical error occurred. Check console for details.') } catch {}
    }
  }

  window.addEventListener('error', (e: ErrorEvent) =>
    notify('error', e.error ?? { message: e.message, filename: e.filename, lineno: e.lineno, colno: e.colno })
  )
  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) =>
    notify('unhandledrejection', (e as any).reason)
  )
})()

// -----------------------------------------------------------------------------
// Root render with layered boundaries & EnvGuard
// -----------------------------------------------------------------------------

// Ensure the Root is reused across HMR reloads
declare global {
  interface Window {
    __LSK_ROOT__?: Root
    __LSK_QUERY_CLIENT__?: QueryClient // added for reuse
  }
}

// Create (or reuse) a single QueryClient (avoid recreating on HMR)
const queryClient =
  window.__LSK_QUERY_CLIENT__ ??
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
  })
window.__LSK_QUERY_CLIENT__ = queryClient

const container = document.getElementById('root')!
const root = window.__LSK_ROOT__ ?? createRoot(container)
window.__LSK_ROOT__ = root

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* React Query now available to entire tree */}
      <GlobalErrorBoundary>
        <ErrorBoundary>
          <EnvGuard>
            <DebugErrorBoundary>
              <React.Suspense fallback={<BootFallback />}>
                <GlobalStateProvider>
                  <AuthGate />
                </GlobalStateProvider>
              </React.Suspense>
            </DebugErrorBoundary>
          </EnvGuard>
        </ErrorBoundary>
      </GlobalErrorBoundary>
    </QueryClientProvider>
  </React.StrictMode>
)

if (import.meta.hot) {
  import.meta.hot.accept()
  // Do NOT recreate root on HMR; React will reconcile.
}
