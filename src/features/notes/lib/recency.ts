import type { Note } from '@/features/notes/types'

const DEFAULT_WINDOW_MS = 24 * 60 * 60 * 1000

/**
 * Whether a note counts as "recent" for the highlight badge. Default window
 * is 24 h; callers can narrow it to match a different product moment (for
 * example, "last hour" when watching a live session).
 *
 * Accepting `now` as an argument keeps the function pure — tests inject a
 * fixed clock and avoid the classic "it passes in CI but flakes at midnight"
 * failure mode.
 */
export function isRecentNote(
  note: Pick<Note, 'createdAt'>,
  now: Date = new Date(),
  windowMs: number = DEFAULT_WINDOW_MS,
): boolean {
  return now.getTime() - new Date(note.createdAt).getTime() < windowMs
}
