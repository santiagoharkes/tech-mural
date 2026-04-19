import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useNotesQuery } from '@/features/notes/api/notes-query'
import { useBoardPan } from '@/features/notes/hooks/use-board-pan'
import { useBoardSort } from '@/features/notes/hooks/use-board-sort'
import { useBoardFilters } from '@/features/filters/api/use-board-filters'
import { useViewMode } from '@/features/view-mode/store'
import { applyNoteFilters } from '@/features/filters/lib/filter-notes'
import { sortNotes } from '@/features/notes/lib/sort-notes'
import type { Note, NotesResponse } from '@/features/notes/types'
import { NoteCard } from './note-card'
import { NoteList } from './note-list'

/**
 * Top-level view of the notes. Resolves {filters, sort, viewMode} into the
 * derived list once and renders either the spatial board or the list.
 *
 * Every derivation is memoised on its inputs; swapping the view mode does
 * not re-run `applyNoteFilters` or `sortNotes`.
 */
export function NoteBoard() {
  const query = useNotesQuery({ select: selectBoardModel })
  const { filters, activeCount, clear } = useBoardFilters()
  const { sortBy } = useBoardSort()
  const viewMode = useViewMode()

  const processed = useMemo<Note[]>(() => {
    if (!query.data) return []
    const filtered = applyNoteFilters(query.data.notes, filters)
    return sortNotes(filtered, sortBy)
  }, [query.data, filters, sortBy])

  if (query.isPending) return <BoardSkeleton />
  if (query.isError) return <BoardError message={query.error.message} onRetry={query.refetch} />
  if (query.data.notes.length === 0) return <BoardEmpty />
  if (processed.length === 0) {
    return <BoardEmptyFiltered activeCount={activeCount} onClear={clear} />
  }

  if (viewMode === 'list') {
    return <NoteList notes={processed} authorMap={query.data.authorMap} />
  }

  return <SpatialBoard notes={processed} authorMap={query.data.authorMap} />
}

function SpatialBoard({
  notes,
  authorMap,
}: {
  notes: readonly Note[]
  authorMap: ReadonlyMap<string, string>
}) {
  const { offset, bind, isPanning } = useBoardPan()

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
