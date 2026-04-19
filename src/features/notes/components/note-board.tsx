import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useNotesQuery } from '@/features/notes/api/notes-query'
import { useBoardPan } from '@/features/notes/hooks/use-board-pan'
import type { NotesResponse } from '@/features/notes/types'
import { NoteCard } from './note-card'

/**
 * Spatial board view. Owns the data fetch, the pan interaction, and the
 * state-branching (loading / empty / error / success). Notes are rendered
 * absolutely positioned inside a translated layer so that a pan only updates
 * one transform — not 200 elements.
 */
export function NoteBoard() {
  const query = useNotesQuery({ select: selectBoardModel })
  const { offset, bind, isPanning } = useBoardPan()

  if (query.isPending) return <BoardSkeleton />
  if (query.isError) return <BoardError message={query.error.message} onRetry={query.refetch} />
  if (query.data.notes.length === 0) return <BoardEmpty />

  const { notes, authorMap } = query.data
  return (
    <section
      role="region"
      aria-label={`Board canvas, ${notes.length} notes`}
      data-testid="note-board"
      className={cn(
        'bg-muted/30 relative h-full w-full touch-none overflow-hidden select-none',
        isPanning ? 'cursor-grabbing' : 'cursor-grab',
      )}
      {...bind}
    >
      <div
        data-testid="note-board-canvas"
        className="absolute inset-0 will-change-transform"
        style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}
      >
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            authorName={authorMap.get(note.author) ?? note.author}
          />
        ))}
      </div>
    </section>
  )
}

interface BoardModel {
  notes: NotesResponse['notes']
  authorMap: Map<string, string>
}

/**
 * Pulled out of the component so TanStack Query memoises it by reference: the
 * returned model is stable across renders until the underlying data changes.
 */
function selectBoardModel(response: NotesResponse): BoardModel {
  return {
    notes: response.notes,
    authorMap: new Map(response.authors.map((a) => [a.id, a.name])),
  }
}

// ---------------------------------------------------------------------------
// State branches — kept as small sub-components for readability and so tests
// can target them through their role/testid.
// ---------------------------------------------------------------------------

function BoardSkeleton() {
  const placeholders = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const seed = (i + 1) * 137
        return {
          id: i,
          left: (seed * 37) % 900,
          top: (seed * 53) % 500,
          rotate: ((seed % 10) - 5) * 0.6,
        }
      }),
    [],
  )

  return (
    <section
      role="status"
      aria-live="polite"
      aria-label="Loading board activity"
      className="bg-muted/30 relative h-full w-full overflow-hidden"
      data-testid="note-board-skeleton"
    >
      {placeholders.map((p) => (
        <div
          key={p.id}
          className="bg-muted absolute h-24 w-44 animate-pulse rounded-md shadow-sm"
          style={{
            left: `${p.left}px`,
            top: `${p.top}px`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </section>
  )
}

function BoardError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section
      role="alert"
      className="flex h-full w-full flex-col items-center justify-center gap-3 text-center"
      data-testid="note-board-error"
    >
      <p className="text-destructive text-sm">Could not load notes: {message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium shadow-xs transition-colors"
      >
        Retry
      </button>
    </section>
  )
}

function BoardEmpty() {
  return (
    <section
      className="text-muted-foreground flex h-full w-full flex-col items-center justify-center text-sm"
      data-testid="note-board-empty"
    >
      <p>No notes on this board yet.</p>
    </section>
  )
}
