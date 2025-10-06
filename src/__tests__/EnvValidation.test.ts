import { getMissingEnvVars } from '@/utils/envValidation'

test('detects missing variables', () => {
  const required = ['V1', 'V2', 'V3']
  const envObj = { V1: 'ok', V3: '' }
  expect(getMissingEnvVars(required, envObj)).toEqual(['V2', 'V3'])
})

test('returns empty array when all present', () => {
  const required = ['A', 'B']
  const envObj = { A: 'x', B: 'y' }
  expect(getMissingEnvVars(required, envObj)).toEqual([])
})
