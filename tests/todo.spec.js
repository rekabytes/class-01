const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

test('shows login, signup, and forgot-password views', async ({ page }) => {
  await expect(page).toHaveTitle('Today — Todo list');
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
  await expect(page.getByLabel('Email address').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log in', exact: true }).last()).toBeVisible();
  await expect(page.locator('#todo-card')).toBeHidden();

  await page.getByRole('tab', { name: 'Sign up' }).click();
  await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
  await expect(page.locator('#signup-password')).toHaveAttribute('autocomplete', 'new-password');
  await expect(page.locator('#signup-confirm')).toBeVisible();

  await page.getByRole('tab', { name: 'Log in' }).click();
  await page.getByRole('button', { name: 'Forgot your password?' }).click();
  await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send reset link' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to login' }).click();
  await expect(page.locator('#login-form')).toBeVisible();
});

test('validates matching signup passwords before making a request', async ({ page }) => {
  await page.getByRole('tab', { name: 'Sign up' }).click();
  await page.locator('#signup-email').fill('person@example.com');
  await page.locator('#signup-password').fill('password-one');
  await page.locator('#signup-confirm').fill('password-two');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('status')).toContainText('Passwords do not match.');
});

test('authentication interface reflows at 320px without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
  const sizes = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth
  }));
  expect(sizes.document).toBeLessThanOrEqual(sizes.viewport);
  expect(sizes.body).toBeLessThanOrEqual(sizes.viewport);
});
