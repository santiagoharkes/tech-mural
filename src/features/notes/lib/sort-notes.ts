import type { Note } from '@/features/notes/types'

export const SORT_OPTIONS = ['recent', 'oldest', 'author', 'position'] as const
export type SortOption = (typeof SORT_OPTIONS)[number]

export const DEFAULT_SORT: SortOption = 'recent'

export const SORT_LABELS: Record<SortOption, string> = {
  recent: 'Most recent',
  oldest: 'Oldest first',
  author: 'Author (A–Z)',
  position: 'Position (top → bottom)',
}

/**
 * Pure sort. Returns a new array — consumers never mutate the underlying
 * query cache, and `useMemo` can hash on (notes, sortBy) without surprises.
 *
 * Tie-breakers matter because several notes can share an author or a row, and
 * we never want sort to look random. Everything falls back to note `id`,
 * which is stable by construction in the fixture.
 */
export function sortNotes(notes: readonly Note[], sortBy: SortOption): Note[] {
  const copy = [...notes]
  switch (sortBy) {
    case 'recent':
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id))
    case 'oldest':
      return copy.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
    case 'author':
      return copy.sort(
        (a, b) =>
          a.author.localeCompare(b.author) ||
          b.createdAt.localeCompare(a.createdAt) ||
          a.id.localeCompare(b.id),
      )
    case 'position':
      return copy.sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id))
  }
}
