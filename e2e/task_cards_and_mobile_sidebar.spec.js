import { test, expect } from '@playwright/test';

test.describe('Korvil TaskFlow - Task Cards Responsive Layout & Mobile Sidebar', () => {

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

  test('Mobile sidebar opens above backdrop, shows logo, navigates, and closes reliably', async ({ page }) => {
    // 1. Set mobile viewport (390px iPhone 13/14)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard');

    const toggleBtn = page.locator('#sidebar-toggle-btn');
    const sidebar = page.locator('#app-sidebar');
    const backdrop = page.locator('#sidebar-backdrop');
    const logoImg = page.locator('.sidebar-logo-badge .brand-logo');
    const brandInfo = page.locator('.sidebar-brand .brand-info');

    // Toggle button should be visible on mobile
    await expect(toggleBtn).toBeVisible({ timeout: 10000 });

    // Verify toggle button aria-expanded is false initially
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');

    // Sidebar should not be open initially
    await expect(sidebar).not.toHaveClass(/open/);

    // 2. Tap hamburger menu
    await toggleBtn.click();

    // 3. Verify sidebar opens and backdrop becomes active
    await expect(sidebar).toHaveClass(/open/);
    await expect(sidebar).toBeVisible();
    await expect(backdrop).toHaveClass(/active/);
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');

    // 4. Verify CSS stacking order: Sidebar (1000) > Backdrop (998)
    const sidebarZIndex = await sidebar.evaluate((el) => window.getComputedStyle(el).zIndex);
    const backdropZIndex = await backdrop.evaluate((el) => window.getComputedStyle(el).zIndex);
    const backdropFilter = await backdrop.evaluate((el) => window.getComputedStyle(el).backdropFilter);
    expect(Number(sidebarZIndex)).toBeGreaterThan(Number(backdropZIndex));
    // Backdrop filter blur should be 'none' to avoid blurring the sidebar
    expect(backdropFilter).toBe('none');

    // 5. Verify Korvil logo and TASKFLOW branding are visible at top of sidebar
    await expect(logoImg).toBeVisible();
    await expect(brandInfo).toBeVisible();
    await expect(brandInfo).toContainText('TaskFlow');
    await expect(brandInfo).toContainText('TEAM WORKSPACE');

    // 6. Tap navigation item (Tasks) and confirm navigation works and sidebar closes
    const tasksLink = page.locator('#app-sidebar a.sidebar-link[href="/tasks"]');
    await tasksLink.click();
    await page.waitForURL('**/tasks');
    await expect(sidebar).not.toHaveClass(/open/);

    // 7. Open sidebar again on Tasks page
    await toggleBtn.click();
    await expect(sidebar).toHaveClass(/open/);

    // 8. Tap the backdrop to close
    await backdrop.click({ position: { x: 350, y: 300 } });
    await expect(sidebar).not.toHaveClass(/open/);

    // 9. Open sidebar again and test Escape key
    await toggleBtn.click();
    await expect(sidebar).toHaveClass(/open/);
    await page.keyboard.press('Escape');
    await expect(sidebar).not.toHaveClass(/open/);

    // 10. Open sidebar and test Close button (FiX)
    await toggleBtn.click();
    await expect(sidebar).toHaveClass(/open/);
    const closeBtn = page.locator('.sidebar-close-btn');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(sidebar).not.toHaveClass(/open/);
  });

  const mobileBreakpoints = [
    { name: 'Ultra-small 320px', width: 320, height: 568 },
    { name: 'Compact 360px', width: 360, height: 640 },
    { name: 'Modern 390px', width: 390, height: 844 },
    { name: 'Large Mobile 430px', width: 430, height: 932 },
    { name: 'Tablet 768px', width: 768, height: 1024 },
  ];

  for (const bp of mobileBreakpoints) {
    test(`Task cards and layout at ${bp.name} have 100% width, no overflow, and badges nowrap`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto('/tasks');
      await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

      // Check zero horizontal scroll on body
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

      // Verify task cards
      const taskCards = page.locator('.task-card');
      const count = await taskCards.count();

      if (count > 0) {
        for (let i = 0; i < Math.min(count, 3); i++) {
          const card = taskCards.nth(i);
          await expect(card).toBeVisible();

          // Verify card uses full available width
          const cardBox = await card.boundingBox();
          expect(cardBox.width).toBeGreaterThan(bp.width - 60);

          // Verify checkbox does not shrink
          const checkbox = card.locator('.task-checkbox');
          if (await checkbox.isVisible()) {
            const box = await checkbox.boundingBox();
            expect(box.width).toBeGreaterThanOrEqual(20);
            expect(box.height).toBeGreaterThanOrEqual(20);
          }

          // Verify badges have white-space: nowrap and do not wrap letter-by-letter
          const badges = card.locator('.task-badge');
          const badgeCount = await badges.count();
          for (let j = 0; j < badgeCount; j++) {
            const badge = badges.nth(j);
            const ws = await badge.evaluate((el) => window.getComputedStyle(el).whiteSpace);
            const flexShrink = await badge.evaluate((el) => window.getComputedStyle(el).flexShrink);
            expect(ws).toBe('nowrap');
            expect(flexShrink).toBe('0');
          }
        }
      }
    });
  }

  test('Desktop layout preserves permanent sidebar and hides hamburger toggle', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    const toggleBtn = page.locator('#sidebar-toggle-btn');
    const sidebar = page.locator('#app-sidebar');

    // Toggle button should be hidden on desktop
    await expect(toggleBtn).toBeHidden();

    // Sidebar should be permanently visible
    await expect(sidebar).toBeVisible();

    // Backdrop should be hidden
    const backdrop = page.locator('#sidebar-backdrop');
    await expect(backdrop).toBeHidden();

    // Dashboard task columns should render side by side
    const columns = page.locator('.dashboard-task-columns');
    if (await columns.isVisible()) {
      const display = await columns.evaluate((el) => window.getComputedStyle(el).display);
      expect(display).toBe('grid');
    }
  });

});
