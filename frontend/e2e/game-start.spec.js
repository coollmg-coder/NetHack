import { expect, test } from '@playwright/test';

async function clickByText(page, selector, prefix) {
  const els = page.locator(selector);
  const count = await els.count();
  for (let i = 0; i < count; i++) {
    const el = els.nth(i);
    const text = ((await el.textContent()) || '').trim();
    if (text === prefix || text.startsWith(prefix)) {
      await el.click();
      return true;
    }
  }
  return false;
}

async function overlayTitle(page) {
  const overlay = page.locator('.overlay');
  const title = overlay.locator('.title');
  if ((await title.count()) === 0) {
    return null;
  }
  return (await title.textContent()) || '';
}

test('boots and completes manual character selection', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('load');

  await expect(page.locator('.overlay .title')).toContainText(
    'Shall I pick character',
    { timeout: 15000 },
  );

  await clickByText(page, '.overlay .actions button', 'No');
  await expect(page.locator('.overlay .title')).toContainText(
    'Pick a role or profession',
    { timeout: 5000 },
  );

  await clickByText(page, '.overlay .item', 'a Barbarian');
  await expect(page.locator('.overlay .title')).toContainText(
    'Pick a race or species',
    { timeout: 5000 },
  );
  await expect(page.locator('.overlay .item').first()).toContainText(
    'Barbarian',
  );

  await clickByText(page, '.overlay .item', 'human');
  await expect(page.locator('.overlay .title')).toContainText(
    'Pick a gender or sex',
    { timeout: 5000 },
  );

  await clickByText(page, '.overlay .item', 'male');
  await expect(page.locator('.overlay .title')).toContainText(
    'Pick an alignment or creed',
    { timeout: 5000 },
  );

  await clickByText(page, '.overlay .item', 'neutral');
  await expect(page.locator('.overlay .title')).toContainText('Is this ok?', {
    timeout: 5000,
  });

  await clickByText(page, '.overlay .item', 'Yes; start game');
});

test('reaches the input loop without crashing after skipping tutorial', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForLoadState('load');

  await expect(page.locator('.overlay .title')).toContainText(
    'Shall I pick character',
    { timeout: 15000 },
  );

  await clickByText(page, '.overlay .actions button', 'Yes');
  await clickByText(page, '.overlay .item', 'Yes; start game');
  await clickByText(page, '.overlay .item', 'Dismiss');
  await clickByText(page, '.overlay .item', 'No, just start play');

  await expect
    .poll(async () => await overlayTitle(page), { timeout: 15000 })
    .toBeNull();

  const log = page.locator('#log-panel');
  await expect(log).toContainText('welcome to NetHack');

  await expect(page.locator('#player-panel .stat .value').first()).not.toHaveText(
    '',
  );

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);
});
