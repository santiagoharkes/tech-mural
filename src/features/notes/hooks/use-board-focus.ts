import { useCallback } from 'react'
import { parseAsString, useQueryState } from 'nuqs'

const focusParser = parseAsString

/**
 * URL-backed "focused note" id. Used by the list view to reveal a note on
 * the spatial board: clicking the reveal button sets `?focus=note_…`, the
 * board reads it, centers the canvas on that note, and flashes a highlight
 * ring.
 *
 * URL state is the right place: the user's intent to "look at this note" is
 * shareable, reload-safe, and survives a back-button press.
 */
export function useBoardFocus() {
  const [focus, setFocus] = useQueryState('focus', focusParser)

  const clear = useCallback(() => {
    void setFocus(null)
  }, [setFocus])

  return { focus, setFocus, clear }
}
