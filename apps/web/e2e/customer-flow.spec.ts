import { test, expect } from '@playwright/test';

test('customer -> barista -> customer ready', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await Promise.all([
    page.waitForURL(/\/menu$/),
    page.getByRole('link', { name: 'ดูเมนูเครื่องดื่ม' }).click(),
  ]);
  await expect(page.getByRole('heading', { name: 'เมนูเครื่องดื่ม' })).toBeVisible();

  await page.getByRole('button', { name: 'เพิ่ม Americano #1 ใส่ตะกร้า' }).click();
  await page.getByRole('button', { name: 'เพิ่ม Latte #2 ใส่ตะกร้า' }).click();
  await page.getByRole('button', { name: 'เพิ่ม Cappuccino #3 ใส่ตะกร้า' }).click();
  await page.getByRole('button', { name: 'เพิ่ม Mocha #4 ใส่ตะกร้า' }).click();
  await page.getByRole('button', { name: 'เพิ่ม Mocha #8 ใส่ตะกร้า' }).click();
  await Promise.all([
    page.waitForURL(/\/cart$/),
    page.getByRole('link', { name: 'ไปที่ตะกร้า (5 รายการ)' }).click(),
  ]);
  await expect(page.getByRole('heading', { name: 'ตะกร้าสินค้า' })).toBeVisible();

  await page.getByRole('button', { name: 'ชำระเงิน (mock' }).click();
  await expect(page.getByRole('heading', { name: 'สร้างคำสั่งซื้อสำเร็จ' })).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/order\/\d+$/),
    page.getByRole('button', { name: 'ไปหน้าติดตามคำสั่งซื้อ' }).click(),
  ]);
  await expect(page.getByRole('heading', { name: 'ติดตามคำสั่งซื้อ' })).toBeVisible();

  await Promise.all([
    page.waitForURL(/\/barista$/),
    page.getByRole('link', { name: 'บาริสต้า' }).click(),
  ]);
  await expect(page.getByRole('heading', { name: 'คิวบาริสต้า' })).toBeVisible();
  await page.getByRole('button', { name: 'คิวที่กำลังทำ' }).click();
  // await page.getByRole('row', { name: '#23 Latte #2 × 1 Cappuccino #' }).getByRole('button').click();
});
