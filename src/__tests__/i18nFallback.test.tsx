import i18n from '@/i18n'

describe('i18n fallback', () => {
  it('returns key when translation missing', () => {
    const key = 'non.existent.translation.key'
    const res = i18n.t(key)
    expect(res).toBe(key)
  })
})
