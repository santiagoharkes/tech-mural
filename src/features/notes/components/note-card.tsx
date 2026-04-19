import { memo } from 'react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/relative-time'
import type { Note } from '@/features/notes/types'
import { NOTE_COLOR_PALETTE, noteColorClasses } from '@/features/notes/lib/note-colors'

export interface NoteCardProps {
  note: Note
  /** Resolved author display name. Passed in (not looked up here) so the card stays pure. */
  authorName: string
  /** "Now" reference for relative timestamps. Injectable for deterministic tests. */
  now?: Date
}

/**
 * A single sticky note on the board. Presentational and memoised — the parent
 * owns the data. Positioned absolutely via `style` so that a render pass of
 * one card does not trigger the spatial container to reflow.
 */
function NoteCardImpl({ note, authorName, now }: NoteCardProps) {
  const { id, text, x, y, color, createdAt } = note
  const palette = NOTE_COLOR_PALETTE[color]
  const labelId = `note-${id}-text`

  return (
    <article
      aria-labelledby={labelId}
      data-testid="note-card"
      data-color={color}
      data-no-pan
      tabIndex={0}
      className={cn(
        'absolute w-44 rounded-md border p-3 shadow-sm transition-transform',
        'focus-visible:ring-ring/60 focus-visible:ring-2 focus-visible:outline-none',
        'hover:-translate-y-0.5 hover:shadow-md',
        noteColorClasses(color),
      )}
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      <p id={labelId} className="text-sm leading-snug font-medium">
        {text}
      </p>
      <footer
        className={cn('mt-3 flex items-center justify-between text-xs font-medium', palette.accent)}
      >
        <span data-testid="note-author">{authorName}</span>
        <time dateTime={createdAt} title={new Date(createdAt).toLocaleString()}>
          {formatRelativeTime(createdAt, now)}
        </time>
      </footer>
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
