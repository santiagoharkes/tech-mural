import { useCallback, useMemo } from 'react'
import { parseAsArrayOf, parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs'
import { NOTE_COLORS, type AuthorId, type NoteColor } from '@/features/notes/types'
import type { BoardFilters } from '@/features/filters/types'

/**
 * URL-state parsers. Declared at module scope so every call site shares one
 * parser identity — nuqs uses referential equality to decide whether to
 * re-parse, and re-creating a parser per render defeats that.
 */
const authorsParser = parseAsArrayOf(parseAsString).withDefault([])
const colorsParser = parseAsArrayOf(parseAsStringLiteral(NOTE_COLORS)).withDefault([])

/**
 * Source-of-truth hook for the board filters. The URL is canonical: reloading
 * the page, sharing a link, or hitting back-button restores the same filter
 * state by construction. Zustand is intentionally not involved here — filters
 * are user intent, and user intent is what URLs are for.
 *
 * All mutators return `void`. Consumers fire-and-forget; the URL update is
 * debounced by the router and never throws.
 */
export function useBoardFilters() {
  const [authors, setAuthors] = useQueryState('authors', authorsParser)
  const [colors, setColors] = useQueryState('colors', colorsParser)

  const filters = useMemo<BoardFilters>(() => ({ authors, colors }), [authors, colors])

  const toggleAuthor = useCallback(
    (id: AuthorId) => {
      void setAuthors((current) =>
        current.includes(id) ? current.filter((a) => a !== id) : [...current, id],
      )
    },
    [setAuthors],
  )

  const toggleColor = useCallback(
    (color: NoteColor) => {
      void setColors((current) =>
        current.includes(color) ? current.filter((c) => c !== color) : [...current, color],
      )
    },
    [setColors],
  )

  const clear = useCallback(() => {
    void setAuthors(null)
    void setColors(null)
  }, [setAuthors, setColors])

  const activeCount = authors.length + colors.length

  return {
    filters,
    toggleAuthor,
    toggleColor,
    clear,
    activeCount,
  }
}
