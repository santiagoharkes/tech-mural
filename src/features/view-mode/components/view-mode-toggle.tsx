import { useSetViewMode, useViewMode, VIEW_MODES, type ViewMode } from '@/features/view-mode/store'
import { cn } from '@/lib/utils'

const LABELS: Record<ViewMode, string> = {
  board: 'Board',
  list: 'List',
}

/**
 * Segmented control for the view mode. Rendered as a real radiogroup so
 * keyboard and screen-reader users get the expected semantics. The pressed
 * option is announced via `aria-checked` — no extra ARIA contortions.
 */
export function ViewModeToggle() {
  const current = useViewMode()
  const setViewMode = useSetViewMode()

  return (
    <div
      role="radiogroup"
      aria-label="View mode"
      data-testid="view-mode-toggle"
      className="bg-muted/80 inline-flex items-center rounded-md p-0.5"
    >
      {VIEW_MODES.map((mode) => {
        const selected = current === mode
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setViewMode(mode)}
            className={cn(
              'focus-visible:ring-ring/60 rounded px-3 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
              selected
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {LABELS[mode]}
          </button>
        )
      })}
    </div>
  )
}
