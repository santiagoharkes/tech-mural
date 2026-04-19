import { test, expect } from '@playwright/test'

test.describe('Reveal on board', () => {
  test('clicking reveal on a list item switches to board and highlights the note', async ({
    page,
  }) => {
    // Start in list view and clear any persisted view-mode from prior runs.
    await page.addInitScript(() => localStorage.clear())
    await page.goto('/')

    await page.getByRole('radio', { name: 'List' }).click()
    const list = page.getByTestId('note-list')
    await expect(list).toBeVisible()

    const firstReveal = list.getByTestId('reveal-on-board').first()
    const accessibleName = await firstReveal.getAttribute('aria-label')
    expect(accessibleName).toMatch(/show .* on the board/i)
    await firstReveal.click()

    // URL carries the focus id, and the view flips to the spatial board.
    await expect.poll(() => page.url()).toMatch(/focus=note_/)
    await expect(page.getByTestId('note-board')).toBeVisible()

    // The focused note is rendered with a data-highlighted attribute while the
    // ring animation is still on screen.
    await expect(page.locator('[data-testid="note-card"][data-highlighted="true"]')).toHaveCount(1)
  })

  test('deep-linking with ?focus= centres the board on that note', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear())
    await page.goto('/?focus=note_0042')

    const board = page.getByTestId('note-board')
    await expect(board).toBeVisible()

    const canvas = page.getByTestId('note-board-canvas')
    // A non-trivial transform implies the board auto-centred on the note.
    const transform = await canvas.evaluate((el) => getComputedStyle(el).transform)
    expect(transform).toMatch(/matrix/)
    expect(transform).not.toBe('matrix(1, 0, 0, 1, 0, 0)')

    await expect(page.locator('[data-testid="note-card"][data-highlighted="true"]')).toHaveCount(1)
  })
})
