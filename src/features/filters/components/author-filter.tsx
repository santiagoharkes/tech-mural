import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { Author, AuthorId } from '@/features/notes/types'

export interface AuthorFilterProps {
  authors: readonly Author[]
  selected: readonly AuthorId[]
  counts: Map<AuthorId, number>
  onToggle: (id: AuthorId) => void
}

/**
 * Multi-select list of contributors. One checkbox per author plus a count of
 * how many notes they have contributed to the full board (not the current
 * filtered view — that way unchecking a filter previews what would come back).
 */
export function AuthorFilter({ authors, selected, counts, onToggle }: AuthorFilterProps) {
  const selectedSet = new Set(selected)

  return (
    <fieldset className="space-y-2" data-testid="author-filter">
      <legend className="text-foreground text-sm font-medium">By author</legend>
      <ul>
        {authors.map((author) => {
          const id = `author-${author.id}`
          const checked = selectedSet.has(author.id)
          const count = counts.get(author.id) ?? 0
          return (
            <li key={author.id} className="flex items-center gap-3 py-1.5">
              <Checkbox id={id} checked={checked} onCheckedChange={() => onToggle(author.id)} />
              <Label
                htmlFor={id}
                className="flex flex-1 cursor-pointer items-center justify-between py-1 text-sm font-normal"
              >
                <span>{author.name}</span>
                <span className="text-muted-foreground tabular-nums">{count}</span>
              </Label>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}
