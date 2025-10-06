import React from 'react'

/**
 * ErrorBoundary
 * Lightweight boundary for localized subtree crashes. Pair with GlobalErrorBoundary.
 */
interface State { hasError: boolean; error?: any }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false }
  static getDerivedStateFromError(error: any): State {
    return { hasError: true, error }
  }
  componentDidCatch(error: any, info: any) {
    // Detailed console log
    console.error('[ErrorBoundary] Uncaught error:', error)
    console.error('[ErrorBoundary] Stack info:', info?.componentStack)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="p-6 m-4 rounded-xl border border-destructive/40 bg-destructive/10 text-sm text-destructive">
          <strong>Something went wrong. Check console for details.</strong>
        </div>
      )
    }
    return this.props.children ?? <div role="alert">Fallback content (no children)</div>
  }
}

export default ErrorBoundary
