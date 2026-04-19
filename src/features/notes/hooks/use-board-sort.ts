import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { DEFAULT_SORT, SORT_OPTIONS } from '@/features/notes/lib/sort-notes'

const sortParser = parseAsStringLiteral(SORT_OPTIONS).withDefault(DEFAULT_SORT)

/**
 * URL-backed sort order. Same rationale as filters: the chosen order is part
 * of the user's intent and should survive reloads and be shareable.
 */
export function useBoardSort() {
  const [sortBy, setSortBy] = useQueryState('sort', sortParser)
  return { sortBy, setSortBy }
}
