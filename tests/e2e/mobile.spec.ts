import { test, expect } from '@playwright/test'

// Mobile viewport override — we stay in chromium to avoid pulling webkit
// into the install path. The behaviour under test is layout, not engine.
test.use({ viewport: { width: 390, height: 844 } })

test.describe('Mobile layout', () => {
  test('desktop sidebar is hidden; filters live behind a sheet trigger', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear())
    await page.goto('/')

    // The desktop sidebar carries `hidden md:flex`, so at this viewport it is
    // not in the layout.
    await expect(page.getByTestId('filter-bar')).toBeHidden()

    const trigger = page.getByTestId('mobile-filter-trigger')
    await expect(trigger).toBeVisible()
    await expect(trigger).toHaveAccessibleName(/^Filters$/)
  })

  test('sheet opens, applies a filter, badge reflects active count', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear())
    await page.goto('/')

    await page.getByTestId('mobile-filter-trigger').click()

    const sheet = page.getByTestId('mobile-filter-sheet')
    await expect(sheet).toBeVisible()

    // Wait until the sheet has painted its content (slide-in animation can
    // delay hit-testing), then click Ada's row via its label.
    await expect(sheet.getByText('Ada Lovelace')).toBeVisible()
    await sheet.getByText('Ada Lovelace').click()

    // URL reflects the filter — proves the Sheet shares state with the app.
    await expect.poll(() => page.url()).toMatch(/authors=user_1/)

    // Close the sheet and assert the trigger shows a count badge now.
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()

    const trigger = page.getByTestId('mobile-filter-trigger')
    await expect(trigger).toHaveAccessibleName(/Filters, 1 active/i)
  })
})
