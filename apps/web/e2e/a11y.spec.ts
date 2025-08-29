import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('menu page has no critical a11y violations', async ({ page }) => {
  await page.goto('/menu');
  const results = await new AxeBuilder({ page }).analyze();
  const criticals = results.violations.filter((v) =>
    ['critical', 'serious'].includes(v.impact || ''),
  );
  expect(criticals).toEqual([]);
});
