import { test, expect } from '@playwright/test';

test.describe('Authentication & Login Page', () => {
  test('displays Korvil branding, logo, and sign-in form', async ({ page }) => {
    await page.goto('/login');

    // Branding checks
    await expect(page.locator('h1')).toHaveText('Korvil TaskFlow');
    await expect(page.locator('.login-brand p')).toHaveText('Smart task management for teams');
    await expect(page.locator('img[alt="Korvil"]')).toBeVisible();

    // Form elements
    await expect(page.locator('h2')).toHaveText('Welcome Back');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toHaveText('Sign In');

    // Google Sign-in button
    await expect(page.locator('.btn-google')).toContainText('Sign in with Google');
  });

  test('toggles smoothly between Sign In and Create Account', async ({ page }) => {
    await page.goto('/login');

    // Switch to Sign Up
    await page.click('button:has-text("Don\'t have an account? Sign up")');
    await expect(page.locator('h2')).toHaveText('Create Account');
    await expect(page.locator('input#displayName')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toHaveText('Create Account');

    // Switch back to Sign In
    await page.click('button:has-text("Already have an account? Sign in")');
    await expect(page.locator('h2')).toHaveText('Welcome Back');
    await expect(page.locator('input#displayName')).not.toBeVisible();
  });

  test('validates required fields', async ({ page }) => {
    await page.goto('/login');
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled();

    // Required attribute on email
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('required', '');
  });
});
