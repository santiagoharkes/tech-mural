import { useNotesQuery } from '@/features/notes/api/notes-query'
import { NoteBoard } from '@/features/notes/components/note-board'

export default function App() {
  return (
    <div className="bg-background text-foreground flex h-screen flex-col">
      <AppHeader />
      <main aria-label="Board canvas" className="flex-1 overflow-hidden">
        <NoteBoard />
      </main>
    </div>
  )
}

/**
 * Persistent header. Subscribes to the same query as `<NoteBoard />` — React
 * Query dedupes the request, so this second `useNotesQuery` does not cost a
 * second round-trip; it only re-derives a small summary via `select`.
 */
function AppHeader() {
  const { data, isPending, isError } = useNotesQuery({
    select: ({ notes, authors }) => ({
      noteCount: notes.length,
      authorCount: authors.length,
    }),
  })

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
        {isPending ? (
          'Loading…'
        ) : isError ? (
          'Offline'
        ) : (
          <>
            <strong className="text-foreground">{data.noteCount}</strong> notes ·{' '}
            <strong className="text-foreground">{data.authorCount}</strong> contributors
          </>
        )}
      </p>
    </header>
  )
}
