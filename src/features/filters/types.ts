import type { AuthorId, NoteColor } from '@/features/notes/types'

/**
 * User-selected filters on the board.
 *
 * Semantics: within each dimension the selected values are OR-ed
 * ("show notes by Ada OR Grace"); across dimensions they are AND-ed
 * ("yellow OR pink, AND by Ada OR Grace"). An empty array means "no filter on
 * that dimension" — not "show nothing".
 */
export interface BoardFilters {
  authors: AuthorId[]
  colors: NoteColor[]
}

export const EMPTY_FILTERS: BoardFilters = {
  authors: [],
  colors: [],
}
