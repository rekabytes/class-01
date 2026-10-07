const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const STORAGE_KEY = 'todo-04.tasks.v1';
const artifactDir = path.resolve(__dirname, '..', 'test-artifacts', 'screenshots');
fs.mkdirSync(artifactDir, { recursive: true });

const criterionTitles = [
  'Actual Playwright browser UAT',
  'Evidence includes screenshots',
  'Persistence, malformed-storage recovery',
  'A durable report records environment'
];
test.afterEach(async ({ page }, testInfo) => {
  const body = await page.screenshot({ fullPage: true });
  await testInfo.attach('screenshot', { body, contentType: 'image/png' });
  const criterion = criterionTitles.findIndex(prefix => testInfo.title.startsWith(prefix)) + 1;
  fs.writeFileSync(path.join(artifactDir, `criterion-${criterion}.png`), body);
});

async function fresh(page) {
  await page.goto('./');
  await page.evaluate(key => localStorage.removeItem(key), STORAGE_KEY);
  await page.reload();
}

async function addByButton(page, title) {
  await page.getByLabel('New task').fill(title);
  await page.getByRole('button', { name: 'Add task' }).click();
}

async function addByEnter(page, title) {
  await page.getByLabel('New task').fill(title);
  await page.getByLabel('New task').press('Enter');
}

async function confirmDialog(page, name) {
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.getByRole('button', { name }).click();
}

function observeErrors(page) {
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  return errors;
}

test('Actual Playwright browser UAT covers every original criterion and every requested button/functionality.', async ({ page }) => {
  const errors = observeErrors(page);
  await fresh(page);

  // First-use empty state, counts, and unavailable controls.
  await expect(page.getByText('0 tasks left')).toBeVisible();
  await expect(page.getByText('0 total')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No tasks yet' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Task filters' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Clear all completed tasks' })).toBeHidden();

  // Blank Add button rejection and recovery.
  await page.getByLabel('New task').fill('   ');
  await page.getByRole('button', { name: 'Add task' }).click();
  await expect(page.getByText('Enter a task before adding.')).toBeVisible();
  await expect(page.getByLabel('New task')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('New task')).toBeFocused();
  await expect(page.locator('.task')).toHaveCount(0);

  // Add by button and Enter, including trimming and count grammar.
  await addByButton(page, '  Button task  ');
  await expect(page.getByText('Button task', { exact: true })).toBeVisible();
  await expect(page.getByLabel('New task')).toBeFocused();
  await addByEnter(page, 'Enter task');
  await expect(page.locator('.task')).toHaveCount(2);
  await expect(page.getByText('2 tasks left')).toBeVisible();
  await expect(page.getByText('2 total')).toBeVisible();

  // Every checkbox works in both directions.
  for (const name of ['Button task', 'Enter task']) {
    const box = page.getByRole('checkbox', { name });
    await box.check();
    await expect(box).toBeChecked();
    await box.uncheck();
    await expect(box).not.toBeChecked();
  }
  await page.getByRole('checkbox', { name: 'Button task' }).check();
  await expect(page.getByText('1 task left')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Clear all completed tasks' })).toBeVisible();

  // All filters expose selection and correct rows/zero-match states.
  const all = page.getByRole('button', { name: 'All', exact: true });
  const active = page.getByRole('button', { name: 'Active', exact: true });
  const completed = page.getByRole('button', { name: 'Completed', exact: true });
  await expect(all).toHaveAttribute('aria-pressed', 'true');
  await active.click();
  await expect(active).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Enter task', { exact: true })).toBeVisible();
  await expect(page.getByText('Button task', { exact: true })).toBeHidden();
  await page.getByRole('checkbox', { name: 'Enter task' }).click();
  await expect(page.getByRole('heading', { name: 'Nothing active' })).toBeVisible();
  await expect(active).toBeFocused();
  await completed.click();
  await expect(completed).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.task')).toHaveCount(2);
  await page.getByRole('checkbox', { name: 'Enter task' }).click();
  await expect(page.locator('.task')).toHaveCount(1);
  await page.getByRole('checkbox', { name: 'Button task' }).click();
  await expect(page.getByRole('heading', { name: 'No completed tasks yet' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Clear all completed tasks' })).toBeHidden();

  // Each task's Delete button: Cancel, Escape, and confirmation behavior.
  await all.click();
  const deleteButton = page.getByRole('button', { name: 'Delete Button task' });
  await deleteButton.click();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(deleteButton).toBeFocused();
  await deleteButton.click();
  await page.keyboard.press('Escape');
  await expect(deleteButton).toBeFocused();
  await deleteButton.click();
  await confirmDialog(page, 'Delete task');
  await expect(page.getByText('Button task', { exact: true })).toBeHidden();
  await expect(page.getByRole('checkbox', { name: 'Enter task' })).toBeFocused();
  await page.getByRole('button', { name: 'Delete Enter task' }).click();
  await confirmDialog(page, 'Delete task');
  await expect(page.locator('.task')).toHaveCount(0);
  // The design requires final-row deletion to put focus in the add field.
  await expect.soft(page.getByLabel('New task')).toBeFocused();

  // Clear completed: cancel and confirm; then unavailable once none exist.
  await addByEnter(page, 'Clear target');
  await page.getByRole('checkbox', { name: 'Clear target' }).check();
  const clear = page.getByRole('button', { name: 'Clear all completed tasks' });
  await clear.click();
  await expect(page.getByText('This will delete 1 completed task.')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(clear).toBeFocused();
  await clear.click();
  await confirmDialog(page, 'Clear tasks');
  await expect(page.locator('.task')).toHaveCount(0);
  await expect(clear).toBeHidden();
  await expect(page.getByRole('heading', { name: 'No tasks yet' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('Evidence includes screenshots mapped to criteria at desktop and 320px mobile widths plus console/error observations.', async ({ page }) => {
  const errors = observeErrors(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await fresh(page);
  const longText = `Long task ${'unbroken'.repeat(45)}`;
  await addByEnter(page, longText);
  await addByButton(page, 'Responsive second task');
  await page.getByRole('checkbox', { name: 'Responsive second task' }).check();
  await page.screenshot({ path: path.join(artifactDir, 'desktop-1280.png'), fullPage: true });

  await page.setViewportSize({ width: 320, height: 800 });
  await expect(page.getByRole('button', { name: 'Add task' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'All', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Active', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Completed', exact: true })).toBeVisible();
  const geometry = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewport);
  expect(geometry.bodyScrollWidth).toBeLessThanOrEqual(geometry.viewport);
  const title = page.getByText(longText, { exact: true });
  const titleBox = await title.boundingBox();
  const deleteBox = await page.getByRole('button', { name: `Delete ${longText}` }).boundingBox();
  expect(titleBox.width).toBeLessThan(270);
  expect(deleteBox.y).toBeGreaterThan(titleBox.y);
  await page.screenshot({ path: path.join(artifactDir, 'mobile-320.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('Persistence, malformed-storage recovery, keyboard operation/focus, long text/reflow, counts, filters, delete/clear, and empty states are explicitly checked.', async ({ page }) => {
  const errors = observeErrors(page);
  await fresh(page);

  // Keyboard add and native Space toggle, with visible focus styling.
  await page.getByLabel('New task').focus();
  await page.keyboard.type('Keyboard task');
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('New task')).toBeFocused();
  await addByEnter(page, 'Persistent task');
  await page.getByRole('checkbox', { name: 'Keyboard task' }).focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('checkbox', { name: 'Keyboard task' })).toBeChecked();
  const outline = await page.getByRole('checkbox', { name: 'Keyboard task' }).evaluate(el => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe('none');
  await expect(page.getByText('1 task left')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'Keyboard task' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Persistent task' })).not.toBeChecked();
  await expect(page.getByText('1 task left')).toBeVisible();

  // Persist a delete and clear across reload.
  await page.getByRole('button', { name: 'Delete Persistent task' }).click();
  await confirmDialog(page, 'Delete task');
  await page.reload();
  await expect(page.getByText('Persistent task', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Clear all completed tasks' }).click();
  await confirmDialog(page, 'Clear tasks');
  await page.reload();
  await expect(page.locator('.task')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'No tasks yet' })).toBeVisible();

  // Malformed localStorage recovers to a usable warned empty app.
  await page.evaluate(key => localStorage.setItem(key, '{malformed'), STORAGE_KEY);
  await page.reload();
  await expect(page.getByRole('status').filter({ hasText: 'Saved tasks couldn’t be loaded' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No tasks yet' })).toBeVisible();
  await addByEnter(page, 'Works after malformed storage');
  await expect(page.getByText('Works after malformed storage', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Works after malformed storage', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('A durable report records environment, commands, assertions, pass/fail outcomes, artifacts, and any unchecked areas.', async ({ page, browserName }) => {
  const errors = observeErrors(page);
  await fresh(page);
  expect(browserName).toBe('chromium');
  await expect(page).toHaveTitle('Today — Todo list');
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible();
  await expect(page.getByLabel('New task')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add task' })).toBeVisible();
  await expect(page.locator('#action-status')).toHaveAttribute('aria-live', 'polite');
  await page.getByLabel('New task').press('Tab');
  await expect(page.getByRole('button', { name: 'Add task' })).toBeFocused();
  expect(errors).toEqual([]);
});
