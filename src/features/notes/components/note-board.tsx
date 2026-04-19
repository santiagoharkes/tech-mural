import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useNotesQuery } from '@/features/notes/api/notes-query'
import { useBoardPan } from '@/features/notes/hooks/use-board-pan'
import { useBoardFilters } from '@/features/filters/api/use-board-filters'
import { applyNoteFilters } from '@/features/filters/lib/filter-notes'
import type { Note, NotesResponse } from '@/features/notes/types'
import { NoteCard } from './note-card'

/**
 * Spatial board view. Owns the data fetch, the pan interaction, and the
 * state-branching (loading / empty / error / success / filtered-empty).
 * Notes render inside a single translated layer so that a pan only updates
 * one transform — not N elements.
 */
export function NoteBoard() {
  const query = useNotesQuery({ select: selectBoardModel })
  const { filters, activeCount, clear } = useBoardFilters()
  const { offset, bind, isPanning } = useBoardPan()

  const filtered = useMemo<Note[]>(
    () => (query.data ? applyNoteFilters(query.data.notes, filters) : []),
    [query.data, filters],
  )

  if (query.isPending) return <BoardSkeleton />
  if (query.isError) return <BoardError message={query.error.message} onRetry={query.refetch} />
  if (query.data.notes.length === 0) return <BoardEmpty />
  if (filtered.length === 0) return <BoardEmptyFiltered activeCount={activeCount} onClear={clear} />

  const { authorMap } = query.data
  return (
    <section
      role="region"
      aria-label={`Board canvas, ${filtered.length} notes`}
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
        {filtered.map((note) => (
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

function selectBoardModel(response: NotesResponse): BoardModel {
  return {
    notes: response.notes,
    authorMap: new Map(response.authors.map((a) => [a.id, a.name])),
  }
}

// ---------------------------------------------------------------------------
// State branches
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
      <Button type="button" variant="outline" onClick={onRetry}>
        Retry
      </Button>
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

function BoardEmptyFiltered({
  activeCount,
  onClear,
}: {
  activeCount: number
  onClear: () => void
}) {
  return (
    <section
      className="flex h-full w-full flex-col items-center justify-center gap-3 text-center"
      data-testid="note-board-empty-filtered"
    >
      <p className="text-muted-foreground text-sm">No notes match the current filters.</p>
      <Button type="button" variant="outline" size="sm" onClick={onClear}>
        Clear {activeCount} active filter{activeCount === 1 ? '' : 's'}
      </Button>
    </section>
  )
}
