import { describe, it, expect } from 'vitest'
import { userEvent } from '@testing-library/user-event'
import { NuqsTestingAdapter, type OnUrlUpdateFunction } from 'nuqs/adapters/testing'
import { screen, within } from '@testing-library/react'
import { renderWithClient } from '@/test/utils'
import { FilterBar } from './filter-bar'

function renderBar({
  searchParams = '',
  onUrlUpdate,
}: { searchParams?: string; onUrlUpdate?: OnUrlUpdateFunction } = {}) {
  return renderWithClient(
    <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
      <FilterBar />
    </NuqsTestingAdapter>,
  )
}

describe('<FilterBar />', () => {
  it('renders author and color sections once the query resolves', async () => {
    renderBar()

    // 8 authors from the fixture, surfaced as checkboxes with counts.
    const authorFilter = await screen.findByTestId('author-filter')
    const authorBoxes = within(authorFilter).getAllByRole('checkbox')
    expect(authorBoxes).toHaveLength(8)

    // 6 colors on the palette.
    const colorFilter = screen.getByTestId('color-filter')
    expect(within(colorFilter).getAllByRole('checkbox')).toHaveLength(6)
  })

  it('toggles a filter and pushes the state into the URL', async () => {
    const updates: string[] = []
    const onUrlUpdate: OnUrlUpdateFunction = (event) => {
      updates.push(event.queryString)
    }

    renderBar({ onUrlUpdate })

    const authorFilter = await screen.findByTestId('author-filter')
    const firstAuthor = within(authorFilter).getAllByRole('checkbox')[0]!
    await userEvent.click(firstAuthor)

    expect(updates.at(-1)).toMatch(/authors=user_1/)
  })

  it('pre-checks options that come from the URL and marks clear enabled', async () => {
    renderBar({ searchParams: '?authors=user_1&colors=yellow' })

    const clear = await screen.findByTestId('clear-filters')
    expect(clear).toBeEnabled()
    expect(clear).toHaveAccessibleName(/clear 2 active filters/i)

    const user1 = await screen.findByRole('checkbox', { name: /ada lovelace/i })
    expect(user1).toHaveAttribute('aria-checked', 'true')

    const yellow = screen.getByRole('checkbox', { name: /yellow/i })
    expect(yellow).toHaveAttribute('aria-checked', 'true')
  })
})
