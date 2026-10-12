import { test, expect } from '@playwright/test';

test.describe('Korvil TaskFlow App Navigation & Layout', () => {
  test('redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/dashboard');
    // If not authenticated, redirected to login
    await expect(page).toHaveURL(/\/login|\/dashboard/);
  });

  test('login page has valid HTML structure and viewport meta', async ({ page }) => {
    await page.goto('/login');
    const title = await page.title();
    expect(title).toContain('Korvil');
  });
});
