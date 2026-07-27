import { test, expect } from '@playwright/test';

test.describe('Pay portal', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading')).toContainText(/payment|revenue|pay/i);
  });
});
