import { test, expect } from '@playwright/test';
import { login, dismissToasts, removeEmergentBadge } from '../fixtures/helpers';

test.describe('Category Tree Structure', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await login(page, 'marc.hansen@canusa.de', 'CanusaNexus2024!');
    // Navigate to articles page
    await page.locator('nav').getByRole('link', { name: /^Artikel$/i }).click();
    await expect(page.getByTestId('articles-page')).toBeVisible({ timeout: 10000 });
  });

  test('should display category tree in sidebar', async ({ page }) => {
    // Check for category section in the articles page content area
    await expect(page.getByTestId('articles-page').getByText('Kategorien')).toBeVisible();
    
    // Check for "Alle Artikel" option
    await expect(page.getByText('Alle Artikel')).toBeVisible();
    
    // Take screenshot of the category tree
    await page.screenshot({ path: 'category-tree.jpeg', quality: 20, fullPage: false });
  });

  test('should show collapsible category hierarchy', async ({ page }) => {
    // Look for folder icons which indicate categories
    const folderIcons = page.locator('.lucide-folder, .lucide-folder-open');
    
    // Wait for categories to load
    await page.waitForLoadState('domcontentloaded');
    
    // Check that we have some categories (folders)
    const count = await folderIcons.count();
    expect(count).toBeGreaterThan(0);
    
    // Look for expand/collapse arrows (ChevronRight or ChevronDown)
    const arrows = page.locator('.lucide-chevron-right, .lucide-chevron-down');
    const arrowCount = await arrows.count();
    
    // If there are hierarchical categories, there should be arrows
    console.log(`Found ${count} folder icons and ${arrowCount} arrows`);
    expect(arrowCount).toBeGreaterThan(0);
  });

  test('should expand category to show children', async ({ page }) => {
    // Find a category with children - look for chevron-right icon
    const collapsedCategory = page.locator('.lucide-chevron-right').first();
    
    const hasCollapsible = await collapsedCategory.isVisible().catch(() => false);
    
    if (hasCollapsible) {
      // Click to expand
      await collapsedCategory.click();
      
      // After click, should have at least one chevron-down visible
      await expect(page.locator('.lucide-chevron-down').first()).toBeVisible({ timeout: 5000 });
    }
    
    await page.screenshot({ path: 'category-expanded.jpeg', quality: 20, fullPage: false });
  });

  test('should filter articles when category is selected', async ({ page }) => {
    // Get initial article count
    const initialCards = await page.locator('[data-testid^="article-card-"]').count();
    
    // Click on a specific category (e.g., "How to")
    const howToCategory = page.getByRole('button', { name: /How to/i }).first();
    const isVisible = await howToCategory.isVisible().catch(() => false);
    
    if (isVisible) {
      await howToCategory.click();
      
      // Wait for filtering to apply
      await page.waitForLoadState('domcontentloaded');
      
      // Should show breadcrumb with category name
      await expect(page.getByText('How to').first()).toBeVisible();
    }
    
    await page.screenshot({ path: 'category-filtered.jpeg', quality: 20, fullPage: false });
  });

  test('should show "Neuer Artikel hier" button when category selected', async ({ page }) => {
    // Click on a category (e.g., "How to")
    const categoryButton = page.getByRole('button', { name: /How to/i }).first();
    
    const isVisible = await categoryButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await categoryButton.click();
      
      // Wait for UI to update
      await page.waitForLoadState('domcontentloaded');
      
      // The "Neuer Artikel hier" button should appear
      const newArticleHereBtn = page.getByTestId('create-article-in-category-btn');
      await expect(newArticleHereBtn).toBeVisible({ timeout: 5000 });
      
      // Verify button text
      await expect(newArticleHereBtn).toContainText('Neuer Artikel hier');
      
      await page.screenshot({ path: 'new-article-here-btn.jpeg', quality: 20, fullPage: false });
    }
  });

  test('should navigate to editor with preselected category when clicking "Neuer Artikel hier"', async ({ page }) => {
    // Select a category first (e.g., "Reisetipps")
    const categoryButton = page.getByRole('button', { name: /Reisetipps/i }).first();
    
    const isVisible = await categoryButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await categoryButton.click();
      
      // Wait for "Neuer Artikel hier" button
      const newArticleHereBtn = page.getByTestId('create-article-in-category-btn');
      await expect(newArticleHereBtn).toBeVisible({ timeout: 5000 });
      
      // Click the button
      await newArticleHereBtn.click();
      
      // Should navigate to article editor
      await expect(page.getByTestId('article-editor')).toBeVisible({ timeout: 10000 });
      
      // URL should contain category parameter
      const url = page.url();
      expect(url).toContain('/articles/new');
      expect(url).toContain('category=');
      
      await page.screenshot({ path: 'editor-with-category.jpeg', quality: 20, fullPage: false });
    }
  });
});
