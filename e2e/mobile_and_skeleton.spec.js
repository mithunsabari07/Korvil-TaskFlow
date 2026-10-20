import { test, expect } from '@playwright/test';

test.describe('Mobile Responsiveness & Skeleton Loading Suite', () => {

  const viewports = [
    { name: 'Ultra-small 320px (iPhone SE 1st gen)', width: 320, height: 568 },
    { name: 'Compact 360px (Samsung Galaxy S8/S9)', width: 360, height: 640 },
    { name: 'Standard 375px (iPhone SE/6/7/8)', width: 375, height: 667 },
    { name: 'Modern 390px (iPhone 12/13/14/15)', width: 390, height: 844 },
    { name: 'Android 412px (Pixel / Galaxy S20+)', width: 412, height: 915 },
    { name: 'Phablet 480px', width: 480, height: 800 },
    { name: 'Tablet 768px (iPad portrait)', width: 768, height: 1024 },
  ];

  for (const vp of viewports) {
    test(`Zero horizontal scrolling on ${vp.name} [${vp.width}x${vp.height}]`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Verify no horizontal scrolling on root document
      const overflow = await page.evaluate(() => {
        const docElem = document.documentElement;
        const body = document.body;
        return {
          docScrollWidth: docElem.scrollWidth,
          docClientWidth: docElem.clientWidth,
          bodyScrollWidth: body.scrollWidth,
          bodyClientWidth: body.clientWidth,
          windowInnerWidth: window.innerWidth,
        };
      });

      expect(overflow.docScrollWidth).toBeLessThanOrEqual(overflow.windowInnerWidth);
      expect(overflow.bodyScrollWidth).toBeLessThanOrEqual(overflow.windowInnerWidth);
    });
  }

  test('Skeleton shimmer classes and CSS rules are defined', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const hasShimmerClass = await page.evaluate(() => {
      const styleSheets = Array.from(document.styleSheets);
      for (const sheet of styleSheets) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (const rule of rules) {
            if (rule.selectorText && rule.selectorText.includes('skeleton-shimmer')) {
              return true;
            }
          }
        } catch {
          // Cross-origin styles ignored
        }
      }
      return false;
    });

    expect(hasShimmerClass).toBe(true);
  });

  test('Mobile sidebar toggle works cleanly without page horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Seed mock session to enter dashboard
    await page.addInitScript(() => {
      window.localStorage.setItem('korvil_demo_user', JSON.stringify({
        uid: 'demo-employee',
        email: 'alex@korvil.com',
        displayName: 'Alex Rivers',
        role: 'employee',
      }));
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Check if sidebar toggle button is present on mobile
    const toggleBtn = page.locator('.sidebar-toggle');
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      await page.waitForTimeout(300);

      // Verify page still has zero horizontal scroll while sidebar is open
      const overflowWithOpenSidebar = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth;
      });
      expect(overflowWithOpenSidebar).toBe(true);
    }
  });
});
