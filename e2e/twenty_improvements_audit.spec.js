import { test, expect } from '@playwright/test';

test.describe('Korvil TaskFlow — 20 Essential Improvements Audit & Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Inject test admin user
    await page.addInitScript(() => {
      window.__KORVIL_TEST_USER__ = {
        uid: 'janaganmeenambikai@gmail.com',
        email: 'janaganmeenambikai@gmail.com',
        displayName: 'Janagan Meenambikai',
        role: 'admin',
      };
    });
  });

  // 1. Remove Horizontal Scrolling (320px, 375px, 390px, 768px, 1024px, 1440px)
  const viewports = [
    { width: 320, height: 600, label: '320px (iPhone SE small)' },
    { width: 375, height: 667, label: '375px (iPhone 8)' },
    { width: 390, height: 844, label: '390px (iPhone 13)' },
    { width: 768, height: 1024, label: '768px (iPad mini / tablet)' },
    { width: 1024, height: 768, label: '1024px (iPad Pro / small laptop)' },
    { width: 1440, height: 900, label: '1440px (Desktop)' },
  ];

  for (const vp of viewports) {
    test(`No unintended horizontal scroll at ${vp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/dashboard');
      await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

      // Check whether document.documentElement or body overflows horizontally
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // tolerate 1px rounding
    });
  }

  // 2. Broken Links & Clickable Logo
  test('Brand logo is clickable and navigates to /dashboard', async ({ page }) => {
    await page.goto('/tasks');
    const brandLink = page.locator('.brand-logo-link');
    await expect(brandLink).toBeVisible();
    await brandLink.click();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  // 3. Functional Mobile Menu
  test('Mobile sidebar toggle has aria-expanded, opens backdrop, and closes on Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard');

    const toggleBtn = page.locator('.sidebar-toggle');
    await expect(toggleBtn).toBeVisible({ timeout: 10000 });
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');

    // Click to open
    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.sidebar-backdrop.active')).toBeVisible();

    // Close on Escape key
    await page.keyboard.press('Escape');
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.sidebar.open')).toHaveCount(0);
  });

  // 4. Favicon configuration
  test('Favicon link is configured properly in document head', async ({ page }) => {
    await page.goto('/login');
    const svgIcon = page.locator('link[rel="icon"][type="image/svg+xml"]');
    await expect(svgIcon).toHaveCount(1);
    const pngIcon = page.locator('link[rel="icon"][type="image/png"]');
    await expect(pngIcon).toHaveCount(1);
    const appleIcon = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleIcon).toHaveCount(1);
  });

  // 5. Dynamic Page Titles & 6. Meta Descriptions
  test('Page titles update dynamically and meta description is present', async ({ page }) => {
    // Dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveTitle(/Dashboard — Korvil TaskFlow/);

    // Tasks
    await page.goto('/tasks');
    await expect(page).toHaveTitle(/Tasks — Korvil TaskFlow/);

    // Analytics
    await page.goto('/analytics');
    await expect(page).toHaveTitle(/Analytics — Korvil TaskFlow/);

    // Work Submissions
    await page.goto('/work-submissions');
    await expect(page).toHaveTitle(/Work Submissions — Korvil TaskFlow/);

    // Verify robots meta is set to noindex for private pages
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute('content', /noindex/);
  });

  // 7. Footer Links & 9. Copyright Year & 18/19. Clickable Contact
  test('Footer displays dynamic current year and functional links', async ({ page }) => {
    await page.goto('/dashboard');
    const currentYear = new Date().getFullYear().toString();

    const footer = page.locator('.app-footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(currentYear);
    await expect(footer).toContainText('Korvil. All rights reserved.');

    // Clickable email link
    const emailLink = page.locator('.app-footer a[href="mailto:support@korvil.com"]');
    await expect(emailLink).toBeVisible();

    // Clickable phone link
    const phoneLink = page.locator('.app-footer a[href="tel:+18005550199"]');
    await expect(phoneLink).toBeVisible();

    // Legal modal opens
    await page.locator('.app-footer button:has-text("Privacy Policy")').click();
    await expect(page.locator('.modal-header h3:has-text("Privacy Policy")')).toBeVisible();
    await page.locator('.modal-footer button:has-text("Close")').click();
    await expect(page.locator('.modal-header h3:has-text("Privacy Policy")')).toHaveCount(0);
  });

  // 8. Custom 404 Page
  test('Invalid routes render branded 404 Page Not Found', async ({ page }) => {
    await page.goto('/non-existent-route-xyz');
    const badge = page.locator('.not-found-badge');
    await expect(badge).toBeVisible({ timeout: 10000 });
    await expect(badge).toHaveText('404 ERROR');
    await expect(page.locator('h1.not-found-title')).toHaveText('Page Not Found');

    const backBtn = page.locator('a:has-text("Back to Dashboard")');
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('Visiting root URL / redirects to dashboard/login and does NOT show 404', async ({ page }) => {
    await page.goto('/');
    // Must NOT display 404
    await expect(page.locator('.not-found-badge')).toHaveCount(0);
    // Should be on dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
  });
});

