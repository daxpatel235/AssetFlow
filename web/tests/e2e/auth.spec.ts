import { test, expect } from '@playwright/test';

// Seeded admin from the mock data
const ADMIN_EMAIL = 'aria.whitfield@assetflow.io';
const ADMIN_PASSWORD = 'Owner@2026!';

test('unauthenticated user is redirected to login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
});

test('admin can sign in and reach the dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(/Welcome back, Aria/)).toBeVisible();
});

test('assets page lists seeded data', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  
  // Actually the asset table relies on the Zustand mock store in the UI for now,
  // but it will correctly navigate to the route.
  await page.goto('/assets');

  await expect(page.getByText('MacBook Pro').first()).toBeVisible();
});
