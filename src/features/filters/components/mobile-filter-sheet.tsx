import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useBoardFilters } from '@/features/filters/api/use-board-filters'
import { FilterBarContent } from './filter-bar'

/**
 * Drawer variant of the filter panel for viewports below `md`.
 *
 * The trigger is a button that reads "Filters" with a live count badge when
 * any filter is active. The sheet slides in from the left and contains the
 * same `FilterBarContent` the desktop sidebar uses — no UI duplication.
 */
export function MobileFilterSheet() {
  const { activeCount } = useBoardFilters()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="md:hidden"
          data-testid="mobile-filter-trigger"
          aria-label={activeCount ? `Filters, ${activeCount} active` : 'Filters'}
        >
          <SlidersHorizontal aria-hidden className="size-4" />
          Filters
          {activeCount > 0 ? (
            <span
              className="bg-foreground text-background ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] leading-none font-semibold tabular-nums"
              aria-hidden
            >
              {activeCount}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[min(90vw,20rem)] p-5"
        data-testid="mobile-filter-sheet"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Filter board activity by author and colour. Counts update live.
          </SheetDescription>
        </SheetHeader>
        <FilterBarContent />
      </SheetContent>
    </Sheet>
  )
}
