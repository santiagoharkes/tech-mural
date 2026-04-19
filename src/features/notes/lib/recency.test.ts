import { describe, it, expect } from 'vitest'
import { isRecentNote } from './recency'

const NOW = new Date('2026-04-19T12:00:00Z')

describe('isRecentNote', () => {
  it('treats notes in the last 24 h as recent by default', () => {
    expect(isRecentNote({ createdAt: '2026-04-19T11:00:00Z' }, NOW)).toBe(true)
    expect(isRecentNote({ createdAt: '2026-04-18T13:00:00Z' }, NOW)).toBe(true)
  })

  it('treats notes older than 24 h as not recent', () => {
    expect(isRecentNote({ createdAt: '2026-04-18T11:59:00Z' }, NOW)).toBe(false)
  })

  it('respects a custom window', () => {
    const oneHour = 60 * 60 * 1000
    expect(isRecentNote({ createdAt: '2026-04-19T11:30:00Z' }, NOW, oneHour)).toBe(true)
    expect(isRecentNote({ createdAt: '2026-04-19T10:30:00Z' }, NOW, oneHour)).toBe(false)
  })
})
