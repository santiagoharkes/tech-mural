import { test, expect } from '@playwright/test'

test.describe('Theme toggle', () => {
  test('cycles light → dark → system and writes the dark class on <html>', async ({ page }) => {
    // Start from a clean localStorage and force prefers-color-scheme = light
    // so the "system" branch is deterministic.
    await page.addInitScript(() => localStorage.clear())
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')

    const toggle = page.getByTestId('theme-toggle')
    await expect(toggle).toBeVisible()

    // Initial state: default is `system` + prefers-light → no `.dark` class.
    await expect(toggle).toHaveAttribute('data-theme', 'system')
    await expect(page.locator('html')).not.toHaveClass(/dark/)

    // system → light (no change), light → dark (class added).
    await toggle.click()
    await expect(toggle).toHaveAttribute('data-theme', 'light')
    await expect(page.locator('html')).not.toHaveClass(/dark/)

    await toggle.click()
    await expect(toggle).toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('html')).toHaveClass(/dark/)

    // dark → system (prefers-light → class removed again).
    await toggle.click()
    await expect(toggle).toHaveAttribute('data-theme', 'system')
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })

  test('system theme tracks prefers-color-scheme: dark', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear())
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')

    const toggle = page.getByTestId('theme-toggle')
    await expect(toggle).toHaveAttribute('data-theme', 'system')
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('explicit dark choice survives a reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    // Clear once in-page so the reload does not wipe the preference we are
    // about to set. (`addInitScript` fires on every navigation, including
    // reloads — it would defeat the persistence we are testing.)
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    const toggle = page.getByTestId('theme-toggle')
    await toggle.click() // system → light
    await toggle.click() // light → dark
    await expect(page.locator('html')).toHaveClass(/dark/)

    await page.reload()
    await expect(page.getByTestId('theme-toggle')).toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('html')).toHaveClass(/dark/)
  })
})
