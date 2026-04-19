import { useNotesQuery } from '@/features/notes/api/notes-query'

export default function App() {
  return (
    <main
      aria-labelledby="app-title"
      className="bg-background text-foreground flex min-h-screen items-center justify-center"
    >
      <section className="max-w-xl px-6 text-center">
        <h1 id="app-title" className="text-3xl font-semibold tracking-tight">
          Board Activity Explorer
        </h1>
        <p className="text-muted-foreground mt-3">
          Stage 2 — data layer wired. The spatial board arrives in Stage 3.
        </p>
        <BoardSummary />
      </section>
    </main>
  )
}

/**
 * Tiny status panel that proves the query layer is alive: it renders the
 * loading skeleton, error message, or the note / author counts coming from the
 * MSW-backed `GET /api/notes`. Kept in `App.tsx` on purpose — Stage 3 replaces
 * it with the real `<NoteBoard />`.
 */
function BoardSummary() {
  const { data, isPending, isError, error, refetch, isFetching } = useNotesQuery({
    select: ({ notes, authors }) => ({
      noteCount: notes.length,
      authorCount: authors.length,
    }),
  })

  if (isPending) {
    return (
      <p className="text-muted-foreground mt-6 text-sm" role="status" aria-live="polite">
        Loading board activity…
      </p>
    )
  }

  if (isError) {
    return (
      <div className="mt-6 space-y-3" role="alert">
        <p className="text-destructive text-sm">Could not load notes: {error.message}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium shadow-xs transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <p
      className="text-muted-foreground mt-6 text-sm"
      role="status"
      aria-live="polite"
      data-testid="board-summary"
    >
      Loaded <strong className="text-foreground">{data.noteCount}</strong> notes from{' '}
      <strong className="text-foreground">{data.authorCount}</strong> contributors
      {isFetching ? ' (refreshing…)' : ''}.
    </p>
  )
}
