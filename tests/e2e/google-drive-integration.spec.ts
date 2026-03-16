import { test, expect } from '@playwright/test';
import { dismissToasts, removeEmergentBadge } from '../fixtures/helpers';

/**
 * Iteration 21: Google Drive Integration Frontend Tests
 * Tests for Google Drive connect button, export dropdown, and document upload.
 */

test.describe('Google Drive Integration', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.locator('input[type="email"]').fill('marc.hansen@canusa.de');
    await page.locator('input[type="password"]').fill('CanusaNexus2024!');
    // Use data-testid to click the correct submit button (not Google login)
    await page.getByTestId('login-submit').click();
    
    // Wait for dashboard
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    await removeEmergentBadge(page);
    await dismissToasts(page);
  });

  test.describe('Documents Page - Drive Connection', () => {
    
    test('shows Drive verbinden button when not connected', async ({ page }) => {
      // Navigate to Documents page
      await page.locator('nav').getByRole('link', { name: /Dokumente/i }).click();
      await expect(page.getByTestId('documents-page')).toBeVisible();
      
      // Check for "Drive verbinden" button
      const connectButton = page.getByTestId('connect-google-drive');
      await expect(connectButton).toBeVisible();
      await expect(connectButton).toContainText('Drive verbinden');
    });

    test('shows Google Drive icon on connect button', async ({ page }) => {
      // Navigate to Documents page
      await page.locator('nav').getByRole('link', { name: /Dokumente/i }).click();
      await expect(page.getByTestId('documents-page')).toBeVisible();
      
      // Check for Google Drive icon (SVG with Google Drive colors)
      const connectButton = page.getByTestId('connect-google-drive');
      await expect(connectButton.locator('svg')).toBeVisible();
    });
  });

  test.describe('Documents Page - Standard Upload', () => {
    
    test('file upload button is visible', async ({ page }) => {
      // Navigate to Documents page
      await page.locator('nav').getByRole('link', { name: /Dokumente/i }).click();
      await expect(page.getByTestId('documents-page')).toBeVisible();
      
      // Find the upload button (it's styled as a Button but wrapped in a label)
      const uploadButton = page.getByText(/Datei hochladen/i);
      await expect(uploadButton).toBeVisible();
    });

    test('document list section is displayed', async ({ page }) => {
      // Navigate to Documents page
      await page.locator('nav').getByRole('link', { name: /Dokumente/i }).click();
      await expect(page.getByTestId('documents-page')).toBeVisible();
      
      // Verify documents section is present
      await expect(page.getByText(/Alle Dokumente/i).first()).toBeVisible();
    });
    
    test('folder structure is visible on desktop', async ({ page }) => {
      // Navigate to Documents page
      await page.locator('nav').getByRole('link', { name: /Dokumente/i }).click();
      await expect(page.getByTestId('documents-page')).toBeVisible();
      
      // Check for folder structure section (hidden on mobile, visible on lg+)
      const folderStructure = page.getByText(/Ordnerstruktur/i);
      await expect(folderStructure).toBeVisible();
    });
  });

  test.describe('Article Export Dropdown', () => {
    
    test('export dropdown exists on article view', async ({ page }) => {
      // Navigate to Articles page
      await page.locator('nav').getByRole('link', { name: 'Artikel' }).click();
      await expect(page.getByTestId('articles-page')).toBeVisible();
      
      // Click on first article
      const articleCard = page.locator('[data-testid^="article-card-"]').first();
      await articleCard.click();
      
      // Wait for article view
      await expect(page.getByTestId('article-view')).toBeVisible();
      
      // Check for export dropdown
      const exportDropdown = page.getByTestId('export-dropdown');
      await expect(exportDropdown).toBeVisible();
    });

    test('export dropdown has PDF option', async ({ page }) => {
      // Navigate to Articles page
      await page.locator('nav').getByRole('link', { name: 'Artikel' }).click();
      await expect(page.getByTestId('articles-page')).toBeVisible();
      
      // Click on first article
      const articleCard = page.locator('[data-testid^="article-card-"]').first();
      await articleCard.click();
      
      // Wait for article view
      await expect(page.getByTestId('article-view')).toBeVisible();
      
      // Open export dropdown
      await page.getByTestId('export-dropdown').click();
      
      // Check for PDF export option
      const pdfOption = page.getByTestId('export-pdf-btn');
      await expect(pdfOption).toBeVisible();
      await expect(pdfOption).toContainText(/PDF/i);
    });

    test('export dropdown has DOCX option', async ({ page }) => {
      // Navigate to Articles page
      await page.locator('nav').getByRole('link', { name: 'Artikel' }).click();
      await expect(page.getByTestId('articles-page')).toBeVisible();
      
      // Click on first article
      const articleCard = page.locator('[data-testid^="article-card-"]').first();
      await articleCard.click();
      
      // Wait for article view
      await expect(page.getByTestId('article-view')).toBeVisible();
      
      // Open export dropdown
      await page.getByTestId('export-dropdown').click();
      
      // Check for Word/DOCX export option
      const docxOption = page.getByTestId('export-docx-btn');
      await expect(docxOption).toBeVisible();
      await expect(docxOption).toContainText(/Word/i);
    });

    test('PDF export triggers download', async ({ page }) => {
      // Navigate to Articles page
      await page.locator('nav').getByRole('link', { name: 'Artikel' }).click();
      await expect(page.getByTestId('articles-page')).toBeVisible();
      
      // Click on first article
      const articleCard = page.locator('[data-testid^="article-card-"]').first();
      await articleCard.click();
      
      // Wait for article view
      await expect(page.getByTestId('article-view')).toBeVisible();
      
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');
      
      // Open export dropdown and click PDF
      await page.getByTestId('export-dropdown').click();
      await page.getByTestId('export-pdf-btn').click();
      
      // Verify download started
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    });

    test('DOCX export triggers download', async ({ page }) => {
      // Navigate to Articles page
      await page.locator('nav').getByRole('link', { name: 'Artikel' }).click();
      await expect(page.getByTestId('articles-page')).toBeVisible();
      
      // Click on first article
      const articleCard = page.locator('[data-testid^="article-card-"]').first();
      await articleCard.click();
      
      // Wait for article view
      await expect(page.getByTestId('article-view')).toBeVisible();
      
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');
      
      // Open export dropdown and click DOCX
      await page.getByTestId('export-dropdown').click();
      await page.getByTestId('export-docx-btn').click();
      
      // Verify download started
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.docx$/i);
    });
  });

  test.describe('UI Elements', () => {
    
    test('documents page header shows correct title', async ({ page }) => {
      // Navigate to Documents page
      await page.locator('nav').getByRole('link', { name: /Dokumente/i }).click();
      await expect(page.getByTestId('documents-page')).toBeVisible();
      
      // Check for page title
      await expect(page.getByRole('heading', { name: /Dokumente/i }).first()).toBeVisible();
    });

    test('new folder button is visible for admin', async ({ page }) => {
      // Navigate to Documents page
      await page.locator('nav').getByRole('link', { name: /Dokumente/i }).click();
      await expect(page.getByTestId('documents-page')).toBeVisible();
      
      // Check for new folder button
      const newFolderButton = page.getByRole('button', { name: /Neuer Ordner/i });
      await expect(newFolderButton).toBeVisible();
    });
  });
});
