import { describe, expect, it } from 'vitest'
import { getSemesterWeek, getSpecialDate } from './semester'

describe('semester calendar', () => {
  it('maps Taipei dates into the 16 Monday-based semester weeks', () => {
    expect(getSemesterWeek(new Date('2026-09-07T09:00:00+08:00'))).toBe(1)
    expect(getSemesterWeek(new Date('2026-12-21T09:00:00+08:00'))).toBe(16)
    expect(getSemesterWeek(new Date('2026-12-28T09:00:00+08:00'))).toBeNull()
  })

  it('returns CDPS holiday overrides without replacing the roadmap topic', () => {
    expect(getSpecialDate('CDPS', '2026-09-28')?.kind).toBe('holiday')
    expect(getSpecialDate('CDPS', '2026-10-26')?.kind).toBe('holiday')
  })
})
