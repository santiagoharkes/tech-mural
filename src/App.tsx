import { useNotesQuery } from '@/features/notes/api/notes-query'
import { useBoardFilters } from '@/features/filters/api/use-board-filters'
import { applyNoteFilters } from '@/features/filters/lib/filter-notes'
import { FilterBar } from '@/features/filters/components/filter-bar'
import { MobileFilterSheet } from '@/features/filters/components/mobile-filter-sheet'
import { NoteBoard } from '@/features/notes/components/note-board'
import { SortSelect } from '@/features/notes/components/sort-select'
import { ViewModeToggle } from '@/features/view-mode/components/view-mode-toggle'
import { ThemeSync } from '@/features/theme/components/theme-sync'
import { ThemeToggle } from '@/features/theme/components/theme-toggle'

export default function App() {
  return (
    <div className="bg-background text-foreground flex h-screen flex-col">
      <ThemeSync />
      <SkipToBoard />
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <FilterBar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <BoardToolbar />
          <main
            id="board-canvas"
            aria-label="Board canvas"
            tabIndex={-1}
            className="flex-1 overflow-hidden focus:outline-none"
          >
            <NoteBoard />
          </main>
        </div>
      </div>
    </div>
  )
}

/**
 * Keyboard-only users hit ~20 stops (header, filter sidebar, toolbar) before
 * reaching the first note. A visually-hidden skip link that reveals on focus
 * lets them jump straight to the board canvas — WCAG 2.4.1 Bypass Blocks.
 */
function SkipToBoard() {
  return (
    <a
      href="#board-canvas"
      data-testid="skip-to-board"
      className="focus-visible:bg-background focus-visible:text-foreground sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-50 focus-visible:rounded-md focus-visible:border focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:shadow focus-visible:outline-none"
    >
      Skip to board
    </a>
  )
}

/**
 * Persistent header. Subscribes to the same query as `<NoteBoard />` — React
 * Query dedupes the request, so this second `useNotesQuery` does not cost a
 * second round-trip; it only re-derives a small summary via `select`.
 *
 * Responsive: subtitle collapses below `sm`, summary shrinks to a compact
 * variant so the header fits on a 360 px viewport.
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
    <header className="border-border/70 flex h-16 shrink-0 items-center justify-between gap-3 border-b px-4 sm:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">
          Board Activity Explorer
        </h1>
        <p className="text-muted-foreground mt-0.5 hidden text-xs sm:block">
          Explore sticky-note activity across the board
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <p
          className="text-muted-foreground text-xs tabular-nums sm:text-sm"
          role="status"
          aria-live="polite"
          data-testid="board-summary"
        >
          {summary}
        </p>
        <ThemeToggle />
      </div>
    </header>
  )
}

/**
 * Toolbar above the board. Desktop shows `[Sort] [ViewMode]`; below `md` the
 * MobileFilterSheet trigger joins on the left so filters are reachable
 * without a sidebar. Wraps onto two rows on extremely narrow viewports.
 */
function BoardToolbar() {
  return (
    <div
      className="border-border/70 bg-background/60 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-2 md:h-14 md:flex-nowrap md:py-0"
      data-testid="board-toolbar"
    >
      <div className="flex items-center gap-3">
        <MobileFilterSheet />
        <SortSelect />
      </div>
      <ViewModeToggle />
    </div>
  )
}
