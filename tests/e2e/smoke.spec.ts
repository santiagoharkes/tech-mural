import { test, expect } from '@playwright/test'

test.describe('Smoke', () => {
  test('renders the app shell and main heading', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('heading', { level: 1, name: /board activity explorer/i }),
    ).toBeVisible()
  })
})
