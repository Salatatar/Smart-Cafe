import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e', // โฟลเดอร์สำหรับ e2e เท่านั้น
  testMatch: ['**/*.e2e.spec.{ts,tsx,js}'], // ตั้งนามสกุลชัดเจน
  testIgnore: [
    '**/__tests__/**', // เพิกเฉย unit tests ของ Vitest
    '**/*.spec.ts', // กันไฟล์ .spec.ts ทั่วไปไม่ให้ชน
  ],
  timeout: 60_000,
  retries: 0,
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
  projects: [{ name: 'Chromium', use: { ...devices['Desktop Chrome'] } }],
});
