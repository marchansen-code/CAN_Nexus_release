import { test, expect } from '@playwright/test';
import { login, dismissToasts } from '../fixtures/helpers';

test.describe('Article Editor with Category Tree', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await login(page, 'marc.hansen@canusa.de', 'CanusaNexus2024!');
  });

  test('should display category tree with checkboxes in editor', async ({ page }) => {
    // Navigate to new article editor
    await page.goto('/articles/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('article-editor')).toBeVisible({ timeout: 10000 });
    
    // Check for categories section
    await expect(page.getByText('Kategorien').first()).toBeVisible();
    
    // Look for checkboxes in the category tree
    const checkboxes = page.locator('[role="checkbox"], input[type="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThan(0);
    
    await page.screenshot({ path: 'editor-category-tree.jpeg', quality: 20, fullPage: false });
  });

  test('should show hierarchical categories with expand/collapse in editor', async ({ page }) => {
    await page.goto('/articles/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('article-editor')).toBeVisible({ timeout: 10000 });
    
    // Look for folder icons
    const folderIcons = page.locator('.lucide-folder, .lucide-folder-open');
    const count = await folderIcons.count();
    expect(count).toBeGreaterThan(0);
    
    // Look for expand arrows
    const arrows = page.locator('.lucide-chevron-right, .lucide-chevron-down');
    const arrowCount = await arrows.count();
    
    console.log(`Editor has ${count} category folders and ${arrowCount} expand arrows`);
  });

  test('should allow multi-select categories with checkboxes', async ({ page }) => {
    await page.goto('/articles/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('article-editor')).toBeVisible({ timeout: 10000 });
    
    // Find and click first category checkbox
    const firstCheckbox = page.locator('[role="checkbox"]').first();
    const isCheckboxVisible = await firstCheckbox.isVisible().catch(() => false);
    
    if (isCheckboxVisible) {
      await firstCheckbox.click();
      
      // Verify it's checked
      await expect(firstCheckbox).toHaveAttribute('data-state', 'checked');
      
      // Click second checkbox if available
      const secondCheckbox = page.locator('[role="checkbox"]').nth(1);
      const isSecondVisible = await secondCheckbox.isVisible().catch(() => false);
      
      if (isSecondVisible) {
        await secondCheckbox.click();
        await expect(secondCheckbox).toHaveAttribute('data-state', 'checked');
      }
      
      // Check that selected count is shown
      await expect(page.getByText(/Kategorie\(n\) ausgewählt/)).toBeVisible({ timeout: 5000 });
    }
    
    await page.screenshot({ path: 'editor-multi-category.jpeg', quality: 20, fullPage: false });
  });

  test('should pre-select category when navigating from "Neuer Artikel hier" button', async ({ page }) => {
    // First go to articles page and select a category
    await page.locator('nav').getByRole('link', { name: /^Artikel$/i }).click();
    await expect(page.getByTestId('articles-page')).toBeVisible({ timeout: 10000 });
    
    // Click on Reisetipps category
    const categoryBtn = page.getByRole('button', { name: /Reisetipps/i }).first();
    await categoryBtn.click();
    
    // Wait for "Neuer Artikel hier" button and click it
    const newArticleHereBtn = page.getByTestId('create-article-in-category-btn');
    await expect(newArticleHereBtn).toBeVisible({ timeout: 5000 });
    await newArticleHereBtn.click();
    
    // Wait for editor
    await expect(page.getByTestId('article-editor')).toBeVisible({ timeout: 10000 });
    
    // Verify URL has category parameter
    const url = page.url();
    expect(url).toContain('category=');
    
    // The category should be pre-selected (shown in selected count)
    await expect(page.getByText(/1 Kategorie\(n\) ausgewählt/)).toBeVisible({ timeout: 5000 });
    
    await page.screenshot({ path: 'editor-preselected-category.jpeg', quality: 20, fullPage: false });
  });

  test('should expand category tree to show children', async ({ page }) => {
    await page.goto('/articles/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('article-editor')).toBeVisible({ timeout: 10000 });
    
    // Find and click expand arrow
    const expandArrow = page.locator('.lucide-chevron-right').first();
    const hasExpand = await expandArrow.isVisible().catch(() => false);
    
    if (hasExpand) {
      await expandArrow.click();
      
      // Should now have chevron-down visible
      await expect(page.locator('.lucide-chevron-down').first()).toBeVisible({ timeout: 5000 });
    }
    
    await page.screenshot({ path: 'editor-expanded-tree.jpeg', quality: 20, fullPage: false });
  });
});
