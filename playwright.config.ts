import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

const webBaseUrl = process.env.BASE_URL || 'https://www.emra.chat';
const apiBaseUrl = process.env.API_BASE_URL || webBaseUrl;
const agentQEnabled = process.env.AGENTQ_ENABLED === 'true';

if (agentQEnabled) {
  const requiredAgentQVariables = [
    'AGENTQ_API_KEY',
    'AGENTQ_PROJECT_ID',
    'AGENTQ_TESTRUN_ID',
  ];
  const missingAgentQVariables = requiredAgentQVariables.filter((name) => !process.env[name]?.trim());
  if (missingAgentQVariables.length > 0) {
    throw new Error(`AgentQ API-key sync cannot start. Missing: ${missingAgentQVariables.join(', ')}`);
  }
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.RETRY ? parseInt(process.env.RETRY, 10) : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.WORKER ? parseInt(`${process.env.WORKER}`, 10) : 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: webBaseUrl,
    trace: 'on-first-retry',     // Alat debug spesifik
    screenshot: 'only-on-failure',
    // video: 'retain-on-failure',
    // GitHub-hosted runners do not have an X server, so CI must stay headless.
    // Locally, HEADLESS=false can still be used to open the browser UI.
    headless: process.env.CI ? true : process.env.HEADLESS !== 'false',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'api',
      testMatch: /.*\/api\/.*\.spec\.ts/,
      use: { baseURL: apiBaseUrl },
    },
    {
      name: 'ui',
      testMatch: /.*\/ui\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
