import { describe, it, expect } from 'vitest'
import type { Note } from '@/features/notes/types'
import { sortNotes } from './sort-notes'

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note_1',
    text: 't',
    x: 0,
    y: 0,
    author: 'user_1',
    color: 'yellow',
    createdAt: '2026-04-19T10:00:00Z',
    ...overrides,
  }
}

const NOTES: Note[] = [
  makeNote({ id: 'a', author: 'user_b', createdAt: '2026-04-19T12:00:00Z', x: 10, y: 20 }),
  makeNote({ id: 'b', author: 'user_a', createdAt: '2026-04-19T10:00:00Z', x: 100, y: 5 }),
  makeNote({ id: 'c', author: 'user_a', createdAt: '2026-04-19T11:00:00Z', x: 50, y: 20 }),
]

describe('sortNotes', () => {
  it('orders by most recent first', () => {
    expect(sortNotes(NOTES, 'recent').map((n) => n.id)).toEqual(['a', 'c', 'b'])
  })

  it('orders by oldest first', () => {
    expect(sortNotes(NOTES, 'oldest').map((n) => n.id)).toEqual(['b', 'c', 'a'])
  })

  it('orders by author A–Z, then most recent within an author', () => {
    expect(sortNotes(NOTES, 'author').map((n) => n.id)).toEqual(['c', 'b', 'a'])
  })

  it('orders by position top → bottom then left → right', () => {
    // b: y=5; a: y=20,x=10; c: y=20,x=50 → b, a, c
    expect(sortNotes(NOTES, 'position').map((n) => n.id)).toEqual(['b', 'a', 'c'])
  })

  it('returns a new array rather than mutating the input', () => {
    const input = [...NOTES]
    const result = sortNotes(input, 'recent')
    expect(result).not.toBe(input)
    expect(input.map((n) => n.id)).toEqual(['a', 'b', 'c'])
  })
})
