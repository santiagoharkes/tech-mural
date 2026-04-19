import { test, expect } from '@playwright/test'

test.describe('Filters', () => {
  test('toggling an author filter narrows the board and writes to the URL', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('note-board')).toBeVisible()

    const initialCount = await page.getByTestId('note-card').count()
    expect(initialCount).toBe(200)

    const bar = page.getByTestId('filter-bar')
    const adaCheckbox = bar.getByRole('checkbox', { name: /ada lovelace/i })
    await adaCheckbox.click()

    await expect.poll(() => page.url()).toMatch(/authors=user_1/)

    // The header summary must reflect the filter. 8 authors → roughly 1/8 of
    // 200 notes survive the author filter. We assert "< initial" and the
    // "Showing X of 200" template rather than a magic number.
    const summary = page.getByTestId('board-summary')
    await expect(summary).toContainText(/Showing \d+ of 200/)

    const filteredCount = await page.getByTestId('note-card').count()
    expect(filteredCount).toBeLessThan(initialCount)
    expect(filteredCount).toBeGreaterThan(0)
  })

  test('URL state survives a reload', async ({ page }) => {
    await page.goto('/?authors=user_1&colors=yellow')
    await expect(page.getByTestId('note-board')).toBeVisible()

    // Both options come in pre-checked from the URL.
    await expect(page.getByRole('checkbox', { name: /ada lovelace/i })).toBeChecked()
    await expect(page.getByRole('checkbox', { name: /yellow/i })).toBeChecked()
    await expect(page.getByTestId('clear-filters')).toBeEnabled()

    const beforeCount = await page.getByTestId('note-card').count()
    await page.reload()
    await expect(page.getByTestId('note-board')).toBeVisible()
    const afterCount = await page.getByTestId('note-card').count()
    expect(afterCount).toBe(beforeCount)
  })

  test('clear-filters returns the board to the full dataset', async ({ page }) => {
    await page.goto('/?authors=user_1&colors=yellow')
    await expect(page.getByTestId('note-board')).toBeVisible()

    await page.getByTestId('clear-filters').click()

    await expect(page.getByTestId('note-card')).toHaveCount(200)
    await expect(page).toHaveURL(/^[^?]+\/?$/)
  })
})
