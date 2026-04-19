import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { renderHookWithClient } from '@/test/utils'
import { useNotesQuery } from './notes-query'

describe('useNotesQuery', () => {
  it('starts in pending state and resolves to the fixture', async () => {
    const { result } = renderHookWithClient(() => useNotesQuery())

    expect(result.current.isPending).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.notes).toHaveLength(200)
    expect(result.current.data?.authors).toHaveLength(8)
  })

  it('applies `select` to derive data without widening the cache', async () => {
    const { result } = renderHookWithClient(() =>
      useNotesQuery({ select: (data) => data.notes.length }),
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe(200)
  })

  it('surfaces HTTP errors through `error`', async () => {
    server.use(
      http.get('/api/notes', () => HttpResponse.json({ message: 'boom' }, { status: 500 })),
    )

    const { result } = renderHookWithClient(() => useNotesQuery())

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toMatch(/500/)
  })
})
