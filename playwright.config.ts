import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // TẮT chạy đa luồng để ép chạy tuần tự 100%, test 1 xong mới mở page test 2
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // Cài đặt workers = 1 đảm bảo không bao giờ mở 2 cửa sổ chạy cùng lúc
  workers: 1,
  // Thêm 'list' reporter in text màu xanh/đỏ sinh động lên Terminal để thầy giáo dễ chấm điểm realtime theo từng step
  reporter: [['html', { open: 'always' }], ['list']],
  use: {
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 },
    headless: false,
    video: 'on',
    actionTimeout: 15000,
  },
  timeout: 60000,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // THÊM CẤU HÌNH THIẾT BỊ DI ĐỘNG (MOBILE EMULATION)
    // Đã bị vô hiệu hóa để chỉ chạy 13 cases trên Chromium
    /*
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 13'],
        headless: false,
      },
    },
    */
  ],
});
