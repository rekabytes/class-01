const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  outputDir: './test-artifacts/results',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['line'],
    ['json', { outputFile: 'test-artifacts/playwright-report.json' }]
  ],
  use: {
    baseURL: 'http://127.0.0.1:8000/',
    browserName: 'chromium',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'python3 -m http.server 8000 --bind 127.0.0.1',
    cwd: '.',
    url: 'http://127.0.0.1:8000/',
    reuseExistingServer: false,
    timeout: 30_000
  }
});
