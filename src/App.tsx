import { useNotesQuery } from '@/features/notes/api/notes-query'
import { useBoardFilters } from '@/features/filters/api/use-board-filters'
import { applyNoteFilters } from '@/features/filters/lib/filter-notes'
import { FilterBar } from '@/features/filters/components/filter-bar'
import { NoteBoard } from '@/features/notes/components/note-board'

export default function App() {
  return (
    <div className="bg-background text-foreground flex h-screen flex-col">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <FilterBar />
        <main aria-label="Board canvas" className="flex-1 overflow-hidden">
          <NoteBoard />
        </main>
      </div>
    </div>
  )
}

/**
 * Persistent header. Subscribes to the same query as `<NoteBoard />` — React
 * Query dedupes the request, so this second `useNotesQuery` does not cost a
 * second round-trip; it only re-derives a small summary via `select`.
 */
function AppHeader() {
  const { data, isPending, isError } = useNotesQuery()
  const { filters, activeCount } = useBoardFilters()

  const summary = (() => {
    if (isPending) return 'Loading…'
    if (isError || !data) return 'Offline'
    const total = data.notes.length
    const authors = data.authors.length
    if (activeCount === 0) {
      return (
        <>
          <strong className="text-foreground">{total}</strong> notes ·{' '}
          <strong className="text-foreground">{authors}</strong> contributors
        </>
      )
    }
    const filtered = applyNoteFilters(data.notes, filters).length
    return (
      <>
        Showing <strong className="text-foreground">{filtered}</strong> of{' '}
        <strong className="text-foreground">{total}</strong> notes ·{' '}
        <strong className="text-foreground">{authors}</strong> contributors
      </>
    )
  })()

  return (
    <header className="border-border/70 flex h-16 shrink-0 items-center justify-between border-b px-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Board Activity Explorer</h1>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Explore sticky-note activity across the board
        </p>
      </div>
      <p
        className="text-muted-foreground text-sm tabular-nums"
        role="status"
        aria-live="polite"
        data-testid="board-summary"
      >
        {summary}
      </p>
    </header>
  )
}
