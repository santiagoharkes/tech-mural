import { useRef, type KeyboardEvent } from 'react'
import { useSetViewMode, useViewMode, VIEW_MODES, type ViewMode } from '@/features/view-mode/store'
import { cn } from '@/lib/utils'

const LABELS: Record<ViewMode, string> = {
  board: 'Board',
  list: 'List',
}

/**
 * Segmented control for the view mode. Rendered as a real radiogroup so
 * keyboard and screen-reader users get the expected semantics:
 *
 * - Arrow keys (Left/Right, Up/Down) move selection between options, wrapping
 *   at the ends, per the WAI-ARIA radiogroup pattern.
 * - Home / End jump to the first / last option.
 * - Roving `tabIndex` keeps the group to a single Tab stop — only the selected
 *   radio is reachable from the outside.
 */
export function ViewModeToggle() {
  const current = useViewMode()
  const setViewMode = useSetViewMode()
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  const focusAndSelect = (index: number) => {
    const wrapped = (index + VIEW_MODES.length) % VIEW_MODES.length
    const mode = VIEW_MODES[wrapped]
    setViewMode(mode)
    refs.current[wrapped]?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        focusAndSelect(index + 1)
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        focusAndSelect(index - 1)
        break
      case 'Home':
        event.preventDefault()
        focusAndSelect(0)
        break
      case 'End':
        event.preventDefault()
        focusAndSelect(VIEW_MODES.length - 1)
        break
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label="View mode"
      data-testid="view-mode-toggle"
      className="bg-muted/80 inline-flex items-center rounded-md p-0.5"
    >
      {VIEW_MODES.map((mode, index) => {
        const selected = current === mode
        return (
          <button
            key={mode}
            ref={(el) => {
              refs.current[index] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => setViewMode(mode)}
            onKeyDown={(event) => handleKeyDown(event, index)}
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
