import { describe, it, expect } from 'vitest'
import type { Note, NoteColor } from '@/features/notes/types'
import { applyNoteFilters } from './filter-notes'
import { EMPTY_FILTERS } from '@/features/filters/types'

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note_1',
    text: 'text',
    x: 0,
    y: 0,
    author: 'user_1',
    color: 'yellow',
    createdAt: '2026-04-19T10:00:00Z',
    ...overrides,
  }
}

const NOTES: Note[] = [
  makeNote({ id: 'n1', author: 'user_1', color: 'yellow' }),
  makeNote({ id: 'n2', author: 'user_2', color: 'pink' }),
  makeNote({ id: 'n3', author: 'user_1', color: 'blue' }),
  makeNote({ id: 'n4', author: 'user_3', color: 'yellow' }),
  makeNote({ id: 'n5', author: 'user_2', color: 'yellow' }),
]

describe('applyNoteFilters', () => {
  it('returns the same reference when no filter is active', () => {
    expect(applyNoteFilters(NOTES, EMPTY_FILTERS)).toBe(NOTES)
  })

  it('filters by a single author', () => {
    const result = applyNoteFilters(NOTES, { authors: ['user_1'], colors: [] })
    expect(result.map((n) => n.id)).toEqual(['n1', 'n3'])
  })

  it('OR-combines multiple authors within the author dimension', () => {
    const result = applyNoteFilters(NOTES, {
      authors: ['user_1', 'user_3'],
      colors: [],
    })
    expect(result.map((n) => n.id)).toEqual(['n1', 'n3', 'n4'])
  })

  it('filters by a single color', () => {
    const result = applyNoteFilters(NOTES, { authors: [], colors: ['yellow'] })
    expect(result.map((n) => n.id)).toEqual(['n1', 'n4', 'n5'])
  })

  it('AND-combines author and color dimensions', () => {
    const result = applyNoteFilters(NOTES, {
      authors: ['user_1', 'user_2'],
      colors: ['yellow'],
    })
    expect(result.map((n) => n.id)).toEqual(['n1', 'n5'])
  })

  it('returns an empty array when no note matches', () => {
    const result = applyNoteFilters(NOTES, {
      authors: ['user_9'],
      colors: ['purple' as NoteColor],
    })
    expect(result).toEqual([])
  })
})
