import { test, expect } from '@playwright/test';
import { login, navigateToArticles, removeEmergentBadge, dismissToasts } from '../fixtures/helpers';

test.describe('Login and Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    
    // Check login form is visible
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();
    
    // Fill login form
    await page.getByTestId('login-email').fill('marc.hansen@canusa.de');
    await page.getByTestId('login-password').fill('CanusaNexus2024!');
    await page.getByTestId('login-submit').click();
    
    // Wait for dashboard
    await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 10000 });
  });

  test('should display dashboard after login', async ({ page }) => {
    await login(page, 'marc.hansen@canusa.de', 'CanusaNexus2024!');
    
    // Verify dashboard elements
    await expect(page.getByTestId('dashboard')).toBeVisible();
    await expect(page.getByTestId('new-article-btn')).toBeVisible();
  });

  test('should navigate to articles page', async ({ page }) => {
    await login(page, 'marc.hansen@canusa.de', 'CanusaNexus2024!');
    
    // Navigate to articles - sidebar shows "Artikel"
    await page.locator('nav').getByRole('link', { name: /^Artikel$/i }).click();
    await expect(page.getByTestId('articles-page')).toBeVisible({ timeout: 10000 });
  });
});
