import React from 'react'

interface Props {
  children: React.ReactNode
  name?: string
}
interface State { error: any }

export class DebugErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: any) {
    return { error }
  }

  componentDidCatch(error: any, info: any) {
    if (import.meta.env.DEV) {
      console.error('[DebugErrorBoundary] caught error:', error, info)
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: '1rem',
            border: '2px solid #dc2626',
            background: '#fef2f2',
            fontFamily: 'monospace',
            fontSize: 12,
            lineHeight: 1.4
        }}>
          <strong>DebugErrorBoundary ({this.props.name || 'root'})</strong>
          <div>Si è verificato un errore che potrebbe causare la pagina bianca.</div>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <div>Apri la console per lo stack completo.</div>
        </div>
      )
    }
    return this.props.children
  }
}
