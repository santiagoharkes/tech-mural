import { describe, it, expect } from 'vitest'
import { formatRelativeTime } from './relative-time'

const NOW = new Date('2026-04-19T12:00:00Z')

describe('formatRelativeTime', () => {
  it('returns a minute-scale label inside the hour', () => {
    expect(formatRelativeTime('2026-04-19T11:57:00Z', NOW)).toBe('3 minutes ago')
  })

  it('rounds up to hours past 59 minutes', () => {
    expect(formatRelativeTime('2026-04-19T10:00:00Z', NOW)).toBe('2 hours ago')
  })

  it('uses the day bucket after 24 h', () => {
    expect(formatRelativeTime('2026-04-18T12:00:00Z', NOW)).toBe('yesterday')
  })

  it('stays the same for "just now" events within one minute', () => {
    expect(formatRelativeTime('2026-04-19T11:59:30Z', NOW)).toBe('now')
  })
})
