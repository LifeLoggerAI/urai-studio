import { test, expect } from '@playwright/test';

test.describe('Studio Smoke Test', () => {
  const pages = ['/', '/upload', '/jobs', '/content'];

  for (const page of pages) {
    test(`should load ${page} without console errors`, async ({ page: pageInstance }) => {
      const errors: string[] = [];
      pageInstance.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await pageInstance.goto(page, { waitUntil: 'networkidle' });

      // Assert that specific elements are present on each page
      if (page === '/') {
        await expect(pageInstance.getByTestId('dashboard-header')).toBeVisible();
      } else if (page === '/upload') {
        await expect(pageInstance.getByTestId('upload-header')).toBeVisible();
      } else if (page === '/jobs') {
        await expect(pageInstance.getByTestId('jobs-header')).toBeVisible();
      } else if (page === '/content') {
        await expect(pageInstance.getByTestId('content-header')).toBeVisible();
      }

      expect(errors).toHaveLength(0);
    });
  }
});
