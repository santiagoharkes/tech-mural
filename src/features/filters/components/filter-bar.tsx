import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useNotesQuery } from '@/features/notes/api/notes-query'
import { computeFilterCounts } from '@/features/filters/lib/filter-counts'
import { useBoardFilters } from '@/features/filters/api/use-board-filters'
import { AuthorFilter } from './author-filter'
import { ColorFilter } from './color-filter'

/**
 * Hook + derivation used by both the desktop sidebar and the mobile sheet.
 * Kept cache-cheap: `useNotesQuery` dedupes with the other consumers so this
 * does not cost a second network request.
 */
function useFilterBarModel() {
  const { data, isPending } = useNotesQuery()
  const state = useBoardFilters()

  const model = useMemo(() => {
    if (!data) return { authors: [], counts: computeFilterCounts([]) }
    return { authors: data.authors, counts: computeFilterCounts(data.notes) }
  }, [data])

  return { ...state, ...model, isPending }
}

interface ClearFiltersButtonProps {
  activeCount: number
  onClear: () => void
}

function ClearFiltersButton({ activeCount, onClear }: ClearFiltersButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClear}
      disabled={activeCount === 0}
      data-testid="clear-filters"
      aria-label={activeCount ? `Clear ${activeCount} active filters` : 'Clear filters'}
    >
      Clear{activeCount > 0 ? ` (${activeCount})` : ''}
    </Button>
  )
}

interface FilterGroupsProps {
  model: ReturnType<typeof useFilterBarModel>
}

/** Author + Color filter lists, shared between the sidebar and the sheet. */
function FilterGroups({ model }: FilterGroupsProps) {
  if (model.isPending) {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        Loading filters…
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <AuthorFilter
        authors={model.authors}
        selected={model.filters.authors}
        counts={model.counts.byAuthor}
        onToggle={model.toggleAuthor}
      />
      <Separator />
      <ColorFilter
        selected={model.filters.colors}
        counts={model.counts.byColor}
        onToggle={model.toggleColor}
      />
    </div>
  )
}

/**
 * Content of the mobile filter sheet. Reserves right-side padding on the
 * header so the Clear button never sits underneath Radix Dialog's built-in
 * close (×) affordance at `top-4 right-4`.
 */
export function FilterBarContent() {
  const model = useFilterBarModel()
  return (
    <div className="flex h-full flex-col gap-4">
      <header className="flex items-center justify-between pr-8">
        <h2 className="text-base font-semibold tracking-tight">Filters</h2>
        <ClearFiltersButton activeCount={model.activeCount} onClear={model.clear} />
      </header>
      <Separator />
      <div className="overflow-y-auto">
        <FilterGroups model={model} />
      </div>
    </div>
  )
}

/**
 * Desktop sidebar. Hidden on narrow viewports; the mobile `MobileFilterSheet`
 * takes over below the `md` breakpoint.
 *
 * Layout pinned so the header aligns with `<BoardToolbar />` — both sit on the
 * same 56 px row directly under `<AppHeader />`, sharing a bottom border.
 */
export function FilterBar() {
  const model = useFilterBarModel()
  return (
    <aside
      aria-label="Filters"
      data-testid="filter-bar"
      className="border-border/70 bg-background hidden w-72 shrink-0 flex-col border-r md:flex"
    >
      <header
        data-testid="filter-bar-header"
        className="border-border/70 flex h-14 shrink-0 items-center justify-between border-b px-5"
      >
        <h2 className="text-base font-semibold tracking-tight">Filters</h2>
        <ClearFiltersButton activeCount={model.activeCount} onClear={model.clear} />
      </header>
      <div className="overflow-y-auto p-5">
        <FilterGroups model={model} />
      </div>
    </aside>
  )
}
