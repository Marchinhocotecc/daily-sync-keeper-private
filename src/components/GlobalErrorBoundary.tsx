import React from 'react'

interface State {
  hasError: boolean
  error?: Error
}

let alertedOnce = false
function criticalErrorToast(message: string) {
  if (alertedOnce) return
  alertedOnce = true
  try {
    // Simple fallback; could be replaced by a toast system if already mounted
    alert(message)
  } catch {
    /* noop */
  }
}

/**
 * GlobalErrorBoundary
 * Catches ANY render/runtime error below it to guarantee "no white screen".
 * Use for the outermost shell; inner granular boundaries can still isolate zones.
 */
export default class GlobalErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[GlobalErrorBoundary] UI crash captured', { error, info })
    criticalErrorToast('A critical UI error occurred. Check console for details.')
  }

  handleReload = () => {
    try {
      sessionStorage.clear()
      localStorage.setItem('last_crash', new Date().toISOString())
    } catch {}
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-950 text-gray-100">
        <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-sm opacity-80 mb-4 text-center max-w-md">
          The application encountered an unexpected error. A log is available in the browser console.
        </p>
        {this.state.error && (
          <pre className="w-full max-w-xl text-xs bg-gray-800 p-3 rounded overflow-auto mb-4">
            {this.state.error.message}
            {'\n'}
            {this.state.error.stack}
          </pre>
        )}
        <button
          onClick={this.handleReload}
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 transition text-white text-sm"
        >
          Reload
        </button>
      </div>
    )
  }
}
