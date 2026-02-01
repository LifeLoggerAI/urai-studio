
import { test, expect } from '@playwright/test';

test('basic navigation smoke test', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'URAI Studio' })).toBeVisible();
  await page.getByRole('link', { name: 'Projects' }).click();
  await expect(page).toHaveURL('/projects');
  await expect(page.getByRole('heading', { name: 'My Projects' })).toBeVisible();
});

test('shared content gallery smoke test', async ({ page }) => {
  await page.goto('/share');
  await expect(page.getByRole('heading', { name: 'Shared Gallery' })).toBeVisible();
});

test('recipes gallery smoke test', async ({ page }) => {
  await page.goto('/recipes');
  await expect(page.getByRole('heading', { name: 'Recipes' })).toBeVisible();
});
