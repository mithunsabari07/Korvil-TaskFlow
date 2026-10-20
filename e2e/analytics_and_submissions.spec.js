import { test, expect } from '@playwright/test';

test.describe('Korvil TaskFlow - Analytics & Work Submissions Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Inject test admin user
    await page.addInitScript(() => {
      window.__KORVIL_TEST_USER__ = {
        uid: 'mithunsabari.rms@gmail.com',
        email: 'mithunsabari.rms@gmail.com',
        displayName: 'Mithun Sabari',
        role: 'admin',
      };
    });
  });

  test('Sidebar displays Work Submissions and Analytics navigation links', async ({ page }) => {
    await page.goto('/dashboard');

    // Sidebar branding
    const brand = page.locator('.sidebar-brand h2');
    await expect(brand).toBeVisible({ timeout: 10000 });
    await expect(brand).toHaveText('TaskFlow');

    // Work Submissions navigation
    const workSubLink = page.locator('a.sidebar-link[href="/work-submissions"]');
    await expect(workSubLink).toBeVisible();
    await expect(workSubLink).toContainText('Work Submissions');

    // Analytics navigation
    const analyticsLink = page.locator('a.sidebar-link[href="/analytics"]');
    await expect(analyticsLink).toBeVisible();
    await expect(analyticsLink).toContainText('Analytics');
  });

  test('Analytics page separates Assigned Tasks and Personal To-Dos', async ({ page }) => {
    await page.goto('/analytics');

    // Page title and subtitle
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible({ timeout: 10000 });
    await expect(h1).toHaveText('Analytics');
    await expect(page.locator('.header-subtitle')).toContainText('Track assigned work, personal productivity');

    // Period buttons
    await expect(page.locator('button.tab:has-text("Daily")')).toBeVisible();
    await expect(page.locator('button.tab:has-text("Weekly")')).toBeVisible();
    await expect(page.locator('button.tab:has-text("Monthly")')).toBeVisible();
    await expect(page.locator('button.tab:has-text("Custom")')).toBeVisible();

    // Section 1: Assigned Task Analytics
    const assignedSection = page.locator('section.analytics-section').nth(0);
    await expect(assignedSection).toContainText('Assigned Tasks');
    await expect(assignedSection).toContainText('Total Assigned');
    await expect(assignedSection).toContainText('Completed');
    await expect(assignedSection).toContainText('In Progress');
    await expect(assignedSection).toContainText('Pending');
    await expect(assignedSection).toContainText('Overdue');
    await expect(assignedSection).toContainText('Completion Rate');

    // Section 2: Personal To-Do Analytics
    const personalSection = page.locator('section.analytics-section').nth(1);
    await expect(personalSection).toContainText('Personal To-Do');
    await expect(personalSection).toContainText('Total Personal');
    await expect(personalSection).toContainText('Completed');
    await expect(personalSection).toContainText('Personal Rate');

    // Distinct section divider
    await expect(page.locator('.analytics-section-divider')).toBeVisible();

    // Custom date range input toggle
    await page.click('button.tab:has-text("Custom")');
    await expect(page.locator('.custom-date-inputs')).toBeVisible();
  });

  test('Work Submissions page renders review dashboard for admin', async ({ page }) => {
    await page.goto('/work-submissions');

    // Header
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible({ timeout: 10000 });
    await expect(h1).toHaveText('Work Submissions');

    // Summary cards
    await expect(page.locator('.stat-label:has-text("Total Submissions")')).toBeVisible();
    await expect(page.locator('.stat-label:has-text("Awaiting Review")')).toBeVisible();
    await expect(page.locator('.stat-label:has-text("Under Review")')).toBeVisible();
    await expect(page.locator('.stat-label:has-text("Approved")')).toBeVisible();
    await expect(page.locator('.stat-label:has-text("Changes Requested")')).toBeVisible();

    // Search and filter inputs
    await expect(page.locator('input[placeholder*="Search by employee"]')).toBeVisible();
  });

  test('Employee view has Submit Work form and PDF upload dropzone', async ({ page }) => {
    // Set employee user
    await page.addInitScript(() => {
      window.__KORVIL_TEST_USER__ = {
        uid: 'emp_123',
        email: 'employee@korvil.com',
        displayName: 'John Employee',
        role: 'employee',
      };
    });

    await page.goto('/work-submissions');

    // Tab buttons
    const submitWorkTab = page.locator('button.tab:has-text("Submit Work")');
    await expect(submitWorkTab).toBeVisible({ timeout: 10000 });
    await submitWorkTab.click();

    // Form fields
    await expect(page.locator('#submission-title')).toBeVisible();
    await expect(page.locator('#related-task')).toBeVisible();
    await expect(page.locator('#work-desc')).toBeVisible();

    // Dropzone
    await expect(page.locator('.pdf-dropzone')).toBeVisible();
    await expect(page.locator('.pdf-dropzone')).toContainText('Drag and drop your PDF here');
  });

  test('Personal To-Do section does not contain team personal productivity table', async ({ page }) => {
    await page.goto('/analytics');
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible({ timeout: 10000 });

    // Verify "Team Personal Productivity Overview" or team-wide personal to-do breakdown is NOT in the document
    await expect(page.locator('text=Team Personal Productivity Overview')).toHaveCount(0);
    await expect(page.locator('text=Personal to-do completion rates and activity by team member')).toHaveCount(0);
  });
});

