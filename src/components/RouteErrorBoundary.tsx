import React from 'react'

interface State { hasError: boolean; error?: Error }

export class RouteErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }
  componentDidCatch(err: Error, info: any) {
    // Optionally log
    console.error('Route error boundary:', err, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 space-y-2">
          <h2 className="font-semibold text-destructive">Component load failed</h2>
          <p className="text-sm text-muted-foreground">Check console for details. Fix the error and save to retry.</p>
          <button
            className="text-xs underline"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
