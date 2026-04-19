import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SORT_LABELS, SORT_OPTIONS, type SortOption } from '@/features/notes/lib/sort-notes'
import { useBoardSort } from '@/features/notes/hooks/use-board-sort'

/**
 * Sort dropdown bound to the URL-backed `useBoardSort` hook. Keeps the
 * Select controlled with the single source of truth; no local copy of state.
 */
export function SortSelect() {
  const { sortBy, setSortBy } = useBoardSort()

  return (
    <div className="flex items-center gap-2" data-testid="sort-select">
      <Label htmlFor="sort" className="text-muted-foreground text-xs font-medium">
        Sort
      </Label>
      <Select value={sortBy} onValueChange={(value) => void setSortBy(value as SortOption)}>
        <SelectTrigger id="sort" size="sm" className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {SORT_LABELS[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
