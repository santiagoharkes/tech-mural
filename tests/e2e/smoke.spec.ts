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

    const board = page.getByTestId('note-board')
    await expect(board).toBeVisible()

    // At least a dozen notes should be visible in the default viewport.
    await expect(board.getByTestId('note-card').first()).toBeVisible()
    const count = await board.getByTestId('note-card').count()
    expect(count).toBe(200)
  })
})
