import { test, expect } from '@playwright/test'

test.describe('Smoke', () => {
  test('renders the app shell and loads the board summary', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', { level: 1, name: /board activity explorer/i }),
    ).toBeVisible()

    // The MSW-backed summary confirms the whole data pipeline (service worker
    // + fetch + TanStack Query + selector) is wired up end-to-end.
    const summary = page.getByTestId('board-summary')
    await expect(summary).toBeVisible()
    await expect(summary).toContainText('200')
    await expect(summary).toContainText('8')
  })
})
