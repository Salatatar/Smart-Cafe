import { test, expect } from '@playwright/test';

// ต้องรัน web (3000) + api (4000) ไว้ก่อน (ดูส่วนสคริปต์ด้านล่าง)

test('customer -> barista -> customer ready', async ({ page, context }) => {
  // ลูกค้าเปิดเมนูและเพิ่มสินค้าลงตะกร้า
  await page.goto('/menu');
  await page.getByRole('button', { name: 'เพิ่มใส่ตะกร้า' }).first().click();
  await page.goto('/cart');
  await page.getByRole('button', { name: /ชำระเงิน/ }).click();

  // ไปหน้าติดตามและจดเลข order
  await page.getByRole('button', { name: 'ไปหน้าติดตามคำสั่งซื้อ' }).click();
  await expect(page.getByText(/ติดตามคำสั่งซื้อ/)).toBeVisible();

  // เปิดหน้าบาริสต้าในแท็บใหม่และกด Done ออเดอร์ล่าสุด
  const barista = await context.newPage();
  await barista.goto('/barista');
  const doneBtn = barista.getByRole('button', { name: 'ทำเสร็จแล้ว' }).first();
  await doneBtn.click();

  // กลับมาหน้าลูกค้า → เห็นสถานะพร้อมรับแล้ว (อาจต้องรอ SSE + refetch)
  await expect(page.getByText('พร้อมรับแล้ว')).toBeVisible({ timeout: 10_000 });
});
