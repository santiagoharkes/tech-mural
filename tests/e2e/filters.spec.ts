import { test, expect, type Page } from '@playwright/test'

async function totalNotes(page: Page): Promise<number> {
  const value = await page.getByTestId('note-board').getAttribute('data-total-notes')
  return Number(value)
}

test.describe('Filters', () => {
  test('toggling an author filter narrows the board and writes to the URL', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('note-board')).toBeVisible()

    expect(await totalNotes(page)).toBe(200)

    const bar = page.getByTestId('filter-bar')
    await bar.getByRole('checkbox', { name: /ada lovelace/i }).click()

    await expect.poll(() => page.url()).toMatch(/authors=user_1/)
    await expect(page.getByTestId('board-summary')).toContainText(/Showing \d+ of 200/)

    // Ada has ~27 notes in the deterministic fixture — the filtered total is
    // below 200 and above zero. Specific counts stay the concern of unit
    // tests; the e2e only cares that the filter reached the board.
    const filteredTotal = await totalNotes(page)
    expect(filteredTotal).toBeLessThan(200)
    expect(filteredTotal).toBeGreaterThan(0)
  })

  test('URL state survives a reload', async ({ page }) => {
    await page.goto('/?authors=user_1&colors=yellow')
    await expect(page.getByTestId('note-board')).toBeVisible()

    await expect(page.getByRole('checkbox', { name: /ada lovelace/i })).toBeChecked()
    await expect(page.getByRole('checkbox', { name: /yellow/i })).toBeChecked()
    await expect(page.getByTestId('clear-filters')).toBeEnabled()

    const before = await totalNotes(page)
    await page.reload()
    await expect(page.getByTestId('note-board')).toBeVisible()
    expect(await totalNotes(page)).toBe(before)
  })

  test('clear-filters returns the board to the full dataset', async ({ page }) => {
    await page.goto('/?authors=user_1&colors=yellow')
    await expect(page.getByTestId('note-board')).toBeVisible()

    await page.getByTestId('clear-filters').click()

    await expect.poll(() => totalNotes(page)).toBe(200)
    await expect(page).toHaveURL(/^[^?]+\/?$/)
  })
})
