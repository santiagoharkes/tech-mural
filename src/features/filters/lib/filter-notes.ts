import type { Note } from '@/features/notes/types'
import type { BoardFilters } from '@/features/filters/types'

/**
 * Apply the active filters to a list of notes. Pure function so it is
 * trivially cacheable (memoisation in the hook layer) and exhaustively
 * testable without React in the loop.
 *
 * Optimisation: when no filter is active we return the original array
 * reference unchanged. This lets consumers bail out of re-renders with
 * reference equality instead of walking 200 items per render.
 */
export function applyNoteFilters(notes: Note[], filters: BoardFilters): Note[] {
  const hasAuthorFilter = filters.authors.length > 0
  const hasColorFilter = filters.colors.length > 0

  if (!hasAuthorFilter && !hasColorFilter) return notes

  const authorSet = hasAuthorFilter ? new Set(filters.authors) : null
  const colorSet = hasColorFilter ? new Set(filters.colors) : null

  return notes.filter((note) => {
    if (authorSet && !authorSet.has(note.author)) return false
    if (colorSet && !colorSet.has(note.color)) return false
    return true
  })
}
