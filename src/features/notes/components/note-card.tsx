import { memo } from 'react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/relative-time'
import type { Note } from '@/features/notes/types'
import { NOTE_COLOR_PALETTE, noteColorClasses } from '@/features/notes/lib/note-colors'
import { isRecentNote } from '@/features/notes/lib/recency'

export interface NoteCardProps {
  note: Note
  /** Resolved author display name. Passed in (not looked up here) so the card stays pure. */
  authorName: string
  /** "Now" reference for relative timestamps + recency window. Injectable for deterministic tests. */
  now?: Date
  /**
   * When true, renders a temporary highlight ring around the card. Used by
   * the "reveal on board" flow — the list view asks for focus, SpatialBoard
   * flashes this for ~2.5 s. The ring fades via CSS, so toggling this off
   * animates out smoothly.
   */
  isHighlighted?: boolean
  /** Card is the current click-focus target: lifts above the rest, stronger shadow. */
  isFocused?: boolean
  /** Another card owns the focus: fade + disable pointer to make the focused one the star. */
  isDimmed?: boolean
}

/**
 * A single sticky note on the board. Presentational and memoised — the parent
 * owns the data. Positioned absolutely via `style` so that a render pass of
 * one card does not trigger the spatial container to reflow.
 */
function NoteCardImpl({
  note,
  authorName,
  now,
  isHighlighted,
  isFocused,
  isDimmed,
}: NoteCardProps) {
  const { id, text, x, y, color, createdAt } = note
  const palette = NOTE_COLOR_PALETTE[color]
  const labelId = `note-${id}-text`
  const descId = `note-${id}-desc`
  const recent = isRecentNote(note, now)
  const relativeTime = formatRelativeTime(createdAt, now)

  return (
    <article
      aria-labelledby={labelId}
      aria-describedby={descId}
      data-testid="note-card"
      data-note-id={id}
      data-color={color}
      data-recent={recent ? 'true' : undefined}
      data-highlighted={isHighlighted ? 'true' : undefined}
      data-focused={isFocused ? 'true' : undefined}
      data-dimmed={isDimmed ? 'true' : undefined}
      data-no-pan
      className={cn(
        'absolute w-44 rounded-md border p-3 shadow-sm',
        'motion-safe:transition-[transform,box-shadow,opacity] motion-safe:duration-300',
        !isFocused &&
          !isDimmed &&
          'focus-within:z-20 hover:z-20 hover:shadow-md motion-safe:hover:-translate-y-0.5',
        noteColorClasses(color),
        recent && 'ring-ring/40 ring-2 ring-offset-1',
        isHighlighted && 'ring-primary z-10 shadow-lg ring-4 ring-offset-2',
        isFocused && 'z-30 scale-110 shadow-2xl',
        isDimmed && 'pointer-events-none opacity-15',
      )}
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      {recent ? (
        <span
          data-testid="recent-badge"
          className="bg-foreground text-background absolute -top-1.5 -right-1.5 rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold tracking-wide uppercase shadow"
        >
          New
        </span>
      ) : null}
      <p id={labelId} className="text-sm leading-snug font-medium">
        {text}
      </p>
      <footer
        className={cn('mt-3 flex items-center justify-between text-xs font-medium', palette.accent)}
      >
        <span data-testid="note-author">{authorName}</span>
        <time dateTime={createdAt} title={new Date(createdAt).toLocaleString()}>
          {relativeTime}
        </time>
      </footer>
      <span id={descId} className="sr-only">
        {recent ? 'Posted in the last 24 hours. ' : ''}By {authorName}, {relativeTime}.
      </span>
    </article>
  )
}

/**
 * Memoisation key: the card is pure in its props. `memo` with the default
 * shallow equality is enough because `note`, `authorName`, and `now` are all
 * stable references when the parent plays by the rules (memoised selector, a
 * module-level Date for `now`).
 */
export const NoteCard = memo(NoteCardImpl)
NoteCard.displayName = 'NoteCard'
