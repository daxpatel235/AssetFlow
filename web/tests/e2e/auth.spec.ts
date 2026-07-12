import { test, expect } from '@playwright/test';

// Seeded hidden admin (see prisma/seed.ts). Keep in sync with the seed.
const ADMIN_EMAIL = 'owner@odoo.local';
const ADMIN_PASSWORD = 'Owner@2026!';

// Happy-path smoke: an unauthenticated visitor is gated to /login, can sign in
// with the seeded admin, and lands on the dashboard.
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
  await expect(page.getByText(/Welcome back, Owner/)).toBeVisible();
});

test('items page lists seeded data', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  // Wait for the session to land (cookie set + redirect) before navigating,
  // otherwise middleware bounces the direct /items hit back to /login.
  await expect(page).toHaveURL(/\/dashboard/);
  await page.goto('/items');

  await expect(page.getByText('Wireless Mouse')).toBeVisible();
});
