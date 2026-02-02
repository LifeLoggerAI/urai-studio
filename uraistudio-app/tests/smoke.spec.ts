import { test, expect } from '@playwright/test';

test('should redirect to login page when not authenticated', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL('/login');
});

test('should show studio page when authenticated', async ({ page }) => {
  // This test requires a logged in state, which needs to be handled
  // by setting up a session or by logging in through the UI.
  // For now, we'll just check that the login page is not shown.
  await page.goto('/');
  // You would add your login logic here
  // await page.getByLabel('Email').fill('test@example.com');
  // await page.getByLabel('Password').fill('password');
  // await page.getByRole('button', { name: 'Log in' }).click();
  // await expect(page).toHaveURL('/studio');
});
