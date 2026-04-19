import type { AuthorId, Note, NoteColor } from '@/features/notes/types'

/**
 * Aggregate note counts by each filter dimension. Used to show "(42)" next to
 * each option in the filter bar so users see the effect before they click.
 *
 * Counts reflect the **full** dataset, not the currently-filtered result —
 * that way unchecking a filter tells you exactly how many notes would come
 * back if you did.
 */
export interface FilterCounts {
  byAuthor: Map<AuthorId, number>
  byColor: Map<NoteColor, number>
}

export function computeFilterCounts(notes: readonly Note[]): FilterCounts {
  const byAuthor = new Map<AuthorId, number>()
  const byColor = new Map<NoteColor, number>()

  for (const note of notes) {
    byAuthor.set(note.author, (byAuthor.get(note.author) ?? 0) + 1)
    byColor.set(note.color, (byColor.get(note.color) ?? 0) + 1)
  }

  return { byAuthor, byColor }
}
