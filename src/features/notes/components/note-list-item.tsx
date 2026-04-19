import { memo } from 'react'
import { Locate } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/relative-time'
import type { Note, NoteId } from '@/features/notes/types'
import { NOTE_COLOR_PALETTE, noteColorClasses } from '@/features/notes/lib/note-colors'
import { isRecentNote } from '@/features/notes/lib/recency'

export interface NoteListItemProps {
  note: Note
  authorName: string
  now?: Date
  /**
   * Invoked when the user asks to reveal this note on the spatial board.
   * The list view wires this to a handler that sets the focus URL param and
   * flips the view mode to `board`.
   */
  onReveal?: (id: NoteId) => void
}

/**
 * List-view counterpart to `NoteCard`. Same palette, same a11y semantics,
 * but relative (not absolute) positioning — it lives inside a CSS grid in
 * `<NoteList />`. Factoring this out (rather than forking `NoteCard` with a
 * layout prop) keeps each component single-purpose and keeps CSS concerns
 * close to the component that actually lays them out.
 */
function NoteListItemImpl({ note, authorName, now, onReveal }: NoteListItemProps) {
  const { id, text, color, createdAt } = note
  const palette = NOTE_COLOR_PALETTE[color]
  const labelId = `list-note-${id}-text`
  const recent = isRecentNote(note, now)

  return (
    <article
      aria-labelledby={labelId}
      data-testid="note-card"
      data-color={color}
      data-recent={recent ? 'true' : undefined}
      tabIndex={0}
      className={cn(
        'group relative rounded-md border p-3 shadow-sm motion-safe:transition-transform',
        'focus-visible:ring-ring/60 focus-visible:ring-2 focus-visible:outline-none',
        'hover:shadow-md motion-safe:hover:-translate-y-0.5',
        noteColorClasses(color),
      )}
    >
      {recent ? (
        <span
          data-testid="recent-badge"
          className="bg-foreground text-background absolute -top-1.5 -right-1.5 rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold tracking-wide uppercase shadow"
        >
          New
        </span>
      ) : null}
      <p id={labelId} className="pr-6 text-sm leading-snug font-medium">
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
      {onReveal ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          data-testid="reveal-on-board"
          aria-label={`Show "${text}" on the board`}
          onClick={(event) => {
            event.stopPropagation()
            onReveal(id)
          }}
          className={cn(
            'absolute top-1 right-1 size-7 opacity-60 motion-safe:transition-opacity',
            'group-hover:opacity-100 hover:opacity-100 focus-visible:opacity-100',
            palette.accent,
          )}
        >
          <Locate className="size-3.5" aria-hidden />
        </Button>
      ) : null}
    </article>
  )
}

export const NoteListItem = memo(NoteListItemImpl)
NoteListItem.displayName = 'NoteListItem'
