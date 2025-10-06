import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Auto-clean between tests
afterEach(() => {
  cleanup()
})

// Jest compatibility shim for tests using `jest.*`
declare global {
  // eslint-disable-next-line no-var
  var jest: typeof vi
}
if (!(globalThis as any).jest) {
  ;(globalThis as any).jest = vi
}
