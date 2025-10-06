import { rootReducer, initialState } from '@/state/global/store'

describe('calendar sorting', () => {
  it('re-sorts after update changing time', () => {
    const a = { id: 'a', title: 'A', date: '2024-02-01', time: '10:00', duration: 10, color: '#000' }
    const b = { id: 'b', title: 'B', date: '2024-02-01', time: '09:00', duration: 10, color: '#000' }
    let s = rootReducer(initialState, { type: 'calendar/add', item: a as any })
    s = rootReducer(s, { type: 'calendar/add', item: b as any })
    expect(s.calendar.items.map(e => e.id)).toEqual(['b','a'])
    s = rootReducer(s, { type: 'calendar/update', id: 'b', changes: { time: '11:00' } })
    expect(s.calendar.items.map(e => e.id)).toEqual(['a','b'])
  })
})
