import { describe, it, expect } from 'vitest'
import { generateNotes, NOTES_FIXTURE } from './notes'
import { NOTE_COLORS } from '@/features/notes/types'

describe('generateNotes', () => {
  it('produces the requested number of notes', () => {
    const { notes } = generateNotes({ count: 42 })
    expect(notes).toHaveLength(42)
  })

  it('is deterministic for a given seed', () => {
    const a = generateNotes({ seed: 123, count: 10 })
    const b = generateNotes({ seed: 123, count: 10 })
    expect(a).toEqual(b)
  })

  it('produces different output for different seeds', () => {
    const a = generateNotes({ seed: 1, count: 10 })
    const b = generateNotes({ seed: 2, count: 10 })
    expect(a.notes).not.toEqual(b.notes)
  })

  it('keeps positions inside the requested canvas', () => {
    const canvas = { width: 100, height: 80 }
    const { notes } = generateNotes({ count: 500, canvas })
    for (const note of notes) {
      expect(note.x).toBeGreaterThanOrEqual(0)
      expect(note.x).toBeLessThanOrEqual(canvas.width)
      expect(note.y).toBeGreaterThanOrEqual(0)
      expect(note.y).toBeLessThanOrEqual(canvas.height)
    }
  })

  it('assigns valid colors and non-empty text to every note', () => {
    const { notes } = generateNotes({ count: 100 })
    for (const note of notes) {
      expect(NOTE_COLORS).toContain(note.color)
      expect(note.text.length).toBeGreaterThan(0)
    }
  })

  it('spreads createdAt inside the requested history window', () => {
    const now = new Date('2026-04-19T12:00:00.000Z')
    const { notes } = generateNotes({ count: 100, daysOfHistory: 3, now })
    const minMs = now.getTime() - 3 * 24 * 60 * 60 * 1000
    for (const note of notes) {
      const createdAtMs = new Date(note.createdAt).getTime()
      expect(createdAtMs).toBeGreaterThanOrEqual(minMs)
      expect(createdAtMs).toBeLessThanOrEqual(now.getTime())
    }
  })
})

describe('NOTES_FIXTURE', () => {
  it('uses the documented default size', () => {
    expect(NOTES_FIXTURE.notes).toHaveLength(200)
    expect(NOTES_FIXTURE.authors).toHaveLength(8)
  })

  it('uses stable note ids', () => {
    const ids = NOTES_FIXTURE.notes.map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids[0]).toBe('note_0001')
  })
})
