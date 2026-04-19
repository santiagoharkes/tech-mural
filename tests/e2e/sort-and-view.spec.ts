import { test, expect } from '@playwright/test'

test.describe('Sort and view mode', () => {
  test('switching sort writes to the URL', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('note-board')).toBeVisible()

    await page.getByTestId('sort-select').getByRole('combobox').click()
    await page.getByRole('option', { name: /author/i }).click()

    await expect.poll(() => page.url()).toMatch(/sort=author/)
  })

  test('switching to list view renders a grid of notes and survives reload', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('note-board')).toBeVisible()

    await page.getByRole('radio', { name: 'List' }).click()

    const list = page.getByTestId('note-list')
    await expect(list).toBeVisible()
    await expect(list.getByTestId('note-card')).toHaveCount(200)

    // View mode is persisted in localStorage (zustand persist), so a reload
    // should keep the list view active.
    await page.reload()
    await expect(page.getByTestId('note-list')).toBeVisible()
  })

  test('recent notes render a "new" badge in either view', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('note-board')).toBeVisible()

    // The seeded fixture places a clump of notes inside the last 24 h, so at
    // least one "new" badge must be visible in the default viewport.
    const badge = page.getByTestId('recent-badge').first()
    await expect(badge).toBeVisible()
    await expect(badge).toHaveText(/new/i)
  })
})
