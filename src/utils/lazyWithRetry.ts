import React from 'react'

type Factory<T extends React.ComponentType<any>> = () => Promise<{ default: T }>

export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: Factory<T>,
  options?: {
    retries?: number
    delayMs?: number
    id?: string
    softFail?: boolean
    fallback?: React.ComponentType
    fallbackMessage?: string
  }
) {
  const {
    retries = 1,
    delayMs = 200,
    id = 'lazy',
    softFail = false,
    fallback,
    fallbackMessage = 'Module failed to load.'
  } = options || {}

  return React.lazy(async () => {
    let lastErr: any
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const mod = await factory()
        if (attempt > 0) {
          // eslint-disable-next-line no-console
          console.info(`[lazyWithRetry:${id}] succeeded on attempt ${attempt + 1}`)
        }
        return mod
      } catch (e: any) {
        lastErr = e
        // eslint-disable-next-line no-console
        console.warn(`[lazyWithRetry:${id}] attempt ${attempt + 1} failed`, e)
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, delayMs * (attempt + 1)))
          continue
        }
      }
    }
    // eslint-disable-next-line no-console
    console.error(`[lazyWithRetry:${id}] giving up after ${retries + 1} attempts`, lastErr)
    if (softFail) {
      const Fallback: React.FC = () =>
        React.createElement(
          'div',
          { className: 'p-6 text-sm text-destructive space-y-2' },
          React.createElement('div', null, fallbackMessage),
            React.createElement(
              'button',
              { className: 'underline', onClick: () => window.location.reload() },
              'Reload'
            )
        )
      return { default: (fallback || Fallback) as T }
    }
    throw lastErr
  })
}
