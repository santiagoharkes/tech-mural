import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useElementSize } from '@/lib/use-element-size'
import { useNotesQuery } from '@/features/notes/api/notes-query'
import { useBoardPan } from '@/features/notes/hooks/use-board-pan'
import { useBoardSort } from '@/features/notes/hooks/use-board-sort'
import { useBoardFocus } from '@/features/notes/hooks/use-board-focus'
import { useBoardFilters } from '@/features/filters/api/use-board-filters'
import { useSetViewMode, useViewMode } from '@/features/view-mode/store'
import { applyNoteFilters } from '@/features/filters/lib/filter-notes'
import { sortNotes } from '@/features/notes/lib/sort-notes'
import { centerOnNote } from '@/features/notes/lib/center-on-note'
import { isNoteVisible } from '@/features/notes/lib/viewport-culling'
import type { Note, NoteId, NotesResponse } from '@/features/notes/types'
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
  const setViewMode = useSetViewMode()
  const { setFocus } = useBoardFocus()

  const processed = useMemo<Note[]>(() => {
    if (!query.data) return []
    const filtered = applyNoteFilters(query.data.notes, filters)
    return sortNotes(filtered, sortBy)
  }, [query.data, filters, sortBy])

  /**
   * "Show on board" handler. Sets the focused-note URL param and swaps the
   * view mode to `board`. SpatialBoard reads the focus id, recentres, and
   * flashes a highlight ring.
   */
  const onReveal = useCallback(
    (id: NoteId) => {
      void setFocus(id)
      setViewMode('board')
    },
    [setFocus, setViewMode],
  )

  if (query.isPending) return <BoardSkeleton />
  if (query.isError) return <BoardError message={query.error.message} onRetry={query.refetch} />
  if (query.data.notes.length === 0) return <BoardEmpty />
  if (processed.length === 0) {
    return <BoardEmptyFiltered activeCount={activeCount} onClear={clear} />
  }

  if (viewMode === 'list') {
    return <NoteList notes={processed} authorMap={query.data.authorMap} onReveal={onReveal} />
  }

  return <SpatialBoard notes={processed} authorMap={query.data.authorMap} />
}

/** Keyboard pan distance per arrow-key press, in CSS pixels. */
const KEYBOARD_PAN_STEP = 80

/** How long the reveal highlight ring stays on before fading. */
const HIGHLIGHT_DURATION_MS = 2500

/** Multiplicative zoom step per keypress (`+` / `-`). */
const KEYBOARD_ZOOM_STEP = 1.25

/**
 * Exponential decay from the wheel's deltaY into a zoom factor. Tuned to feel
 * smooth on both mouse wheels (one notch ≈ 53 px deltaY) and trackpad pinch
 * (continuous small deltas). Math.exp(-deltaY * 0.0015):
 *   notch down (53)  → 0.924 (zoom out)
 *   notch up  (-53)  → 1.082 (zoom in)
 */
const WHEEL_ZOOM_SENSITIVITY = 0.0015

function SpatialBoard({
  notes,
  authorMap,
}: {
  notes: readonly Note[]
  authorMap: ReadonlyMap<string, string>
}) {
  const { offset, scale, bind, isPanning, panBy, reset, setOffset, zoomBy, resetZoom } =
    useBoardPan()
  const { focus } = useBoardFocus()
  const [containerRef, size] = useElementSize<HTMLElement>()
  const [highlightId, setHighlightId] = useState<NoteId | null>(null)
  const [focusedId, setFocusedId] = useState<NoteId | null>(null)
  const centeredFor = useRef<NoteId | null>(null)
  // Pointer position at mousedown; used to distinguish a click (dismiss focus)
  // from a pan drag that happens to release on the background.
  const pointerDownAt = useRef<{ x: number; y: number } | null>(null)

  /**
   * When the URL carries a focus id (set by the list view's reveal button),
   * centre the pan on that note once and fire the highlight. Keyed on `focus`
   * so switching notes or arriving from a shared link both trigger it; guarded
   * by a ref so a viewport resize does not yank the pan back after the user
   * has started navigating.
   */
  useEffect(() => {
    if (!focus || size.width === 0 || size.height === 0) return
    if (centeredFor.current === focus) return
    const note = notes.find((n) => n.id === focus)
    if (!note) return
    setOffset(centerOnNote(note, size, scale))
    centeredFor.current = focus
    // Intentional: this syncs a transient visual effect to URL + measured size.
    // Neither `offset` nor `highlightId` are in this effect's deps, so there is
    // no cascade. The rule is overly cautious for this synchronisation pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHighlightId(focus)
  }, [focus, notes, size, scale, setOffset])

  /** Let the highlight fade itself. Ring class transitions via CSS. */
  useEffect(() => {
    if (!highlightId) return
    const timer = setTimeout(() => setHighlightId(null), HIGHLIGHT_DURATION_MS)
    return () => clearTimeout(timer)
  }, [highlightId])

  // Treat focus as cleared whenever the focused note is not in the current
  // (filtered) set. Derived in render so a filter that hides the card hides
  // the focus styles too, and a filter that brings it back restores them —
  // no effect, no cascading renders.
  const activeFocusedId = useMemo(
    () => (focusedId && notes.some((n) => n.id === focusedId) ? focusedId : null),
    [focusedId, notes],
  )

  // Viewport culling. We fall back to rendering everything until the
  // container has been measured (initial render, jsdom, no-ResizeObserver
  // environments) — a one-time 200-card paint is cheaper than a wrong cull.
  const visibleNotes = useMemo(() => {
    if (size.width === 0 || size.height === 0) return notes
    return notes.filter((note) => isNoteVisible(note, offset, size, scale))
  }, [notes, offset, size, scale])

  /**
   * Keyboard pan. Arrow keys pan the canvas by a fixed step; `Home` recenters.
   * Bound to the `<section>` itself so it only fires when the canvas region
   * has keyboard focus — tab-stopping into a note card preserves its own key
   * semantics (Enter / Space).
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Escape' && activeFocusedId) {
        setFocusedId(null)
        event.preventDefault()
        return
      }
      switch (event.key) {
        case 'ArrowLeft':
          panBy(KEYBOARD_PAN_STEP, 0)
          break
        case 'ArrowRight':
          panBy(-KEYBOARD_PAN_STEP, 0)
          break
        case 'ArrowUp':
          panBy(0, KEYBOARD_PAN_STEP)
          break
        case 'ArrowDown':
          panBy(0, -KEYBOARD_PAN_STEP)
          break
        case 'Home':
          reset()
          break
        case '+':
        case '=':
          zoomBy(KEYBOARD_ZOOM_STEP)
          break
        case '-':
        case '_':
          zoomBy(1 / KEYBOARD_ZOOM_STEP)
          break
        case '0':
          resetZoom()
          break
        default:
          return
      }
      event.preventDefault()
    },
    [panBy, reset, zoomBy, resetZoom, activeFocusedId],
  )

  /**
   * Click-to-focus: delegate through the canvas. A click on a note toggles
   * focus; a click elsewhere (background) dismisses it, but only if it was a
   * real click — we measure pointer travel between down and up, because the
   * pan drag also ends with a click event on this element.
   */
  const CLICK_DRAG_THRESHOLD = 5

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      pointerDownAt.current = { x: event.clientX, y: event.clientY }
      bind.onPointerDown(event)
    },
    [bind],
  )

  const handleClick = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      const target = event.target as HTMLElement
      const card = target.closest<HTMLElement>('[data-note-id]')
      if (card) {
        const id = card.dataset.noteId as NoteId | undefined
        if (!id) return
        setFocusedId((prev) => (prev === id ? null : id))
        return
      }
      if (!activeFocusedId) return
      const origin = pointerDownAt.current
      if (!origin) return
      const dx = Math.abs(event.clientX - origin.x)
      const dy = Math.abs(event.clientY - origin.y)
      if (dx <= CLICK_DRAG_THRESHOLD && dy <= CLICK_DRAG_THRESHOLD) {
        setFocusedId(null)
      }
    },
    [activeFocusedId],
  )

  /**
   * Wheel zoom. Canvas-style: the wheel always zooms (no modifier needed),
   * since the surface is not scrollable in the traditional sense. We pull
   * the cursor position out of the event so the zoom is anchored to the
   * point under the pointer.
   *
   * React attaches `onWheel` as a passive listener by default, so
   * `preventDefault()` on the synthetic event is a no-op — the page would
   * still scroll. We therefore subscribe natively with `{ passive: false }`.
   */
  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const onWheel = (event: globalThis.WheelEvent) => {
      event.preventDefault()
      const rect = element.getBoundingClientRect()
      const center = { x: event.clientX - rect.left, y: event.clientY - rect.top }
      const factor = Math.exp(-event.deltaY * WHEEL_ZOOM_SENSITIVITY)
      zoomBy(factor, center)
    }

    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [containerRef, zoomBy])

  return (
    <section
      ref={containerRef}
      role="region"
      aria-label={`Board canvas, ${notes.length} notes`}
      aria-describedby="note-board-shortcuts"
      aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Home + - 0"
      tabIndex={0}
      data-testid="note-board"
      data-total-notes={notes.length}
      data-visible-notes={visibleNotes.length}
      data-scale={scale.toFixed(2)}
      className={cn(
        'group/board bg-muted/30 relative h-full w-full touch-none overflow-hidden select-none',
        'focus-visible:ring-ring/60 focus-visible:ring-2 focus-visible:outline-none',
        isPanning ? 'cursor-grabbing' : 'cursor-grab',
      )}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      <div
        data-testid="note-board-canvas"
        className="absolute inset-0 origin-top-left will-change-transform"
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
        }}
      >
        {visibleNotes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            authorName={authorMap.get(note.author) ?? note.author}
            isHighlighted={note.id === highlightId}
            isFocused={note.id === activeFocusedId}
            isDimmed={activeFocusedId !== null && note.id !== activeFocusedId}
          />
        ))}
      </div>
      {/* Visible hint for keyboard users — only shows while the region has
          focus-visible, so it does not clutter the canvas for pointer users.
          Also acts as the aria-describedby target for screen-reader users. */}
      <p
        id="note-board-shortcuts"
        data-testid="note-board-shortcuts"
        className={cn(
          'pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2',
          'bg-background/90 text-muted-foreground rounded-full border px-3 py-1 text-xs shadow-sm',
          'opacity-0 motion-safe:transition-opacity',
          'group-focus-visible/board:opacity-100',
        )}
      >
        Arrow keys pan · Home recenters · <kbd className="font-sans">+</kbd>{' '}
        <kbd className="font-sans">-</kbd> zoom · <kbd className="font-sans">0</kbd> resets
      </p>
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
          className="bg-muted absolute h-24 w-44 rounded-md shadow-sm motion-safe:animate-pulse"
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
