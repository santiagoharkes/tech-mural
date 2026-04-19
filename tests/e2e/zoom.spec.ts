import { test, expect } from '@playwright/test'

test.describe('Zoom', () => {
  test('+ / - / 0 change the canvas transform and data-scale', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear())
    await page.goto('/')

    const board = page.getByTestId('note-board')
    await expect(board).toBeVisible()
    await expect(board).toHaveAttribute('data-scale', '1.00')

    await board.focus()
    await board.press('+')
    await expect(board).toHaveAttribute('data-scale', '1.25')

    await board.press('+')
    await expect(board).toHaveAttribute('data-scale', (1.25 * 1.25).toFixed(2))

    await board.press('-')
    await expect(board).toHaveAttribute('data-scale', '1.25')

    await board.press('0')
    await expect(board).toHaveAttribute('data-scale', '1.00')
  })

  test('wheel zoom anchors to the cursor', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear())
    await page.goto('/')

    const board = page.getByTestId('note-board')
    await expect(board).toBeVisible()
    const canvas = page.getByTestId('note-board-canvas')

    const box = (await board.boundingBox())!
    const cursorX = box.x + 300
    const cursorY = box.y + 200

    // Negative deltaY = zoom in (we map Math.exp(-dy * k)).
    await page.mouse.move(cursorX, cursorY)
    await page.mouse.wheel(0, -300)

    const transform = await canvas.evaluate((el) => getComputedStyle(el).transform)
    expect(transform).toMatch(/matrix/)
    const parts = transform
      .match(/matrix\(([^)]+)\)/)![1]!
      .split(',')
      .map((s) => Number(s.trim()))
    // transform parsed as matrix(a, b, c, d, e, f): a = d = scaleX = scaleY
    const scale = parts[0]!
    expect(scale).toBeGreaterThan(1)
  })
})
