import React from 'react'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'

const Boom: React.FC = () => {
  throw new Error('Boom!')
}

test('ErrorBoundary shows fallback UI on error', () => {
  render(
    <ErrorBoundary>
      <Boom />
    </ErrorBoundary>
  )
  expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
})
