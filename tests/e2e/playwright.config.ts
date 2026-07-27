import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.PAY_URL ?? 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.CI
    ? undefined
    : [
        {
          command: 'pnpm --filter @revenue/api dev',
          url: 'http://localhost:4000/api/v1/health',
          reuseExistingServer: true,
        },
        {
          command: 'pnpm --filter @revenue/pay dev',
          url: 'http://localhost:3001',
          reuseExistingServer: true,
        },
      ],
});
