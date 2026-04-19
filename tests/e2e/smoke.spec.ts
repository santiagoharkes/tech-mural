import { test, expect } from '@playwright/test'

test.describe('Smoke', () => {
  test('renders the app header and a populated board', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', { level: 1, name: /board activity explorer/i }),
    ).toBeVisible()

    const summary = page.getByTestId('board-summary')
    await expect(summary).toContainText('200')
    await expect(summary).toContainText('8')

    // The spatial board culls notes to the viewport. We assert the dataset
    // total via `data-total-notes` and that at least one card is on screen.
    const board = page.getByTestId('note-board')
    await expect(board).toBeVisible()
    await expect(board).toHaveAttribute('data-total-notes', '200')
    await expect(board.getByTestId('note-card').first()).toBeVisible()

    const visible = await board.getAttribute('data-visible-notes')
    const visibleCount = Number(visible)
    expect(visibleCount).toBeGreaterThan(0)
    expect(visibleCount).toBeLessThanOrEqual(200)
  })
})
