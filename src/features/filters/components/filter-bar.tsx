import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useNotesQuery } from '@/features/notes/api/notes-query'
import { computeFilterCounts } from '@/features/filters/lib/filter-counts'
import { useBoardFilters } from '@/features/filters/api/use-board-filters'
import { AuthorFilter } from './author-filter'
import { ColorFilter } from './color-filter'

/**
 * Sidebar filter panel. Subscribes to the full notes dataset to derive counts
 * for every filter option. Kept cache-cheap: `useNotesQuery` dedupes with the
 * other consumers so this does not cost a second network request.
 */
export function FilterBar() {
  const { data, isPending } = useNotesQuery()
  const { filters, toggleAuthor, toggleColor, clear, activeCount } = useBoardFilters()

  const { authors, counts } = useMemo(() => {
    if (!data) return { authors: [], counts: computeFilterCounts([]) }
    return {
      authors: data.authors,
      counts: computeFilterCounts(data.notes),
    }
  }, [data])

  return (
    <aside
      aria-label="Filters"
      data-testid="filter-bar"
      className="border-border/70 bg-background flex w-72 shrink-0 flex-col gap-4 border-r p-5"
    >
      <header className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">Filters</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clear}
          disabled={activeCount === 0}
          data-testid="clear-filters"
          aria-label={activeCount ? `Clear ${activeCount} active filters` : 'Clear filters'}
        >
          Clear{activeCount > 0 ? ` (${activeCount})` : ''}
        </Button>
      </header>

      <Separator />

      {isPending ? (
        <p className="text-muted-foreground text-sm" role="status">
          Loading filters…
        </p>
      ) : (
        <div className="space-y-5 overflow-y-auto">
          <AuthorFilter
            authors={authors}
            selected={filters.authors}
            counts={counts.byAuthor}
            onToggle={toggleAuthor}
          />
          <Separator />
          <ColorFilter selected={filters.colors} counts={counts.byColor} onToggle={toggleColor} />
        </div>
      )}
    </aside>
  )
}
