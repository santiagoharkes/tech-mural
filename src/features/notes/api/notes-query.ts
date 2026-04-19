import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import type { NotesResponse } from '@/features/notes/types'

export const notesQueryKey = ['notes'] as const
export type NotesQueryKey = typeof notesQueryKey

/** Low-level fetcher. Exported so tests and prefetches can hit the same code path. */
export async function fetchNotes(signal?: AbortSignal): Promise<NotesResponse> {
  const response = await fetch('/api/notes', { signal })
  if (!response.ok) {
    throw new Error(`Failed to load notes (${response.status} ${response.statusText})`)
  }
  return (await response.json()) as NotesResponse
}

type NotesQueryOptions<TData = NotesResponse> = Omit<
  UseQueryOptions<NotesResponse, Error, TData, NotesQueryKey>,
  'queryKey' | 'queryFn'
>

/**
 * Read-side hook for the notes collection.
 *
 * Accepts an optional `select` (and other query options) so callers can derive
 * data without widening the cache footprint — a filtered list, a count, a
 * grouped-by-author map all share one network request and one cache entry.
 */
export function useNotesQuery<TData = NotesResponse>(options?: NotesQueryOptions<TData>) {
  return useQuery<NotesResponse, Error, TData, NotesQueryKey>({
    queryKey: notesQueryKey,
    queryFn: ({ signal }) => fetchNotes(signal),
    ...options,
  })
}
