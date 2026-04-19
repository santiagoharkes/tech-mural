import { test, expect } from '@playwright/test'

test.describe('Accessibility', () => {
  test('skip-to-board link reveals on focus and jumps to the canvas', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('note-board')).toBeVisible()

    // Tab once from the document start — the skip link is the first focusable
    // child of the app shell.
    await page.keyboard.press('Tab')

    const skip = page.getByTestId('skip-to-board')
    await expect(skip).toBeFocused()
    // The `sr-only` class is removed on focus; the link must be visible.
    await expect(skip).toBeVisible()

    await skip.press('Enter')

    // The main landmark takes focus (tabIndex=-1 target of the anchor).
    await expect(page.locator('#board-canvas')).toBeFocused()
  })

  test('arrow keys pan the spatial canvas when the board region has focus', async ({ page }) => {
    await page.goto('/')
    const board = page.getByTestId('note-board')
    await expect(board).toBeVisible()

    const canvas = page.getByTestId('note-board-canvas')
    const initialTransform = await canvas.evaluate((el) => getComputedStyle(el).transform)

    // Focus the board region directly.
    await board.focus()
    await board.press('ArrowRight')
    await board.press('ArrowRight')

    const movedTransform = await canvas.evaluate((el) => getComputedStyle(el).transform)
    expect(movedTransform).not.toBe(initialTransform)
    expect(movedTransform).toMatch(/matrix/)

    // Home recenters.
    await board.press('Home')
    const resetTransform = await canvas.evaluate((el) => getComputedStyle(el).transform)
    expect(resetTransform).toBe(initialTransform)
  })
})
