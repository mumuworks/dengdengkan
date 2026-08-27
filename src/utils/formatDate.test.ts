import { describe, expect, it } from 'vitest'
import { formatDate } from './formatDate'

describe('formatDate', () => {
  it('formats a valid ISO date into a non-empty, locale-formatted string', () => {
    const result = formatDate('2026-07-18T12:00:00Z')
    expect(result).not.toBe('')
    expect(result).toContain('2026')
  })

  it('returns an empty string for an unparseable date', () => {
    expect(formatDate('not-a-date')).toBe('')
  })
})
