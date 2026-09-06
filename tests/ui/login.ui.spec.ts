import { expect } from '@playwright/test';
import { test } from 'agentq-playwright';
import { LoginPage } from '../../pages/login.page';
import {
  LOGIN_PATH,
  VALID_EMAIL,
  VALID_PASSWORD,
  invalidCredentialsResponse,
  loginSuccessResponse,
  mockLogin,
  rateLimitResponse,
  suspendedResponse,
} from '../support/login.fixture';

test.describe('US-02 login UI', () => {
  test.beforeEach(async ({ page }) => new LoginPage(page).goto());

  test('14-[TC-AUTH-014] exposes the required accessible controls', async ({ page }) => {
    const login = new LoginPage(page);
    await expect(login.heading).toBeVisible();
    await expect(login.emailField).toBeVisible();
    await expect(login.passwordField).toHaveAttribute('type', 'password');
    await expect(login.forgotPasswordLink).toBeVisible();
    await expect(login.loginButton).toBeVisible();
    await expect(login.emailField).toHaveAttribute('required', '');
    await expect(login.passwordField).toHaveAttribute('required', '');
  });

  test('15-[TC-AUTH-015] Sign In availability follows the completeness matrix', async ({ page }) => {
    const login = new LoginPage(page);
    await expect(login.loginButton).toBeDisabled();
    await login.emailField.fill(VALID_EMAIL);
    await expect(login.loginButton).toBeDisabled();
    await login.emailField.clear();
    await login.passwordField.fill(VALID_PASSWORD);
    await expect(login.loginButton).toBeDisabled();
    await login.emailField.fill(VALID_EMAIL);
    await expect(login.loginButton).toBeEnabled();
  });

  test('16-[TC-AUTH-016] invalid email dataset sends no login request', async ({ page }) => {
    const login = new LoginPage(page);
    let requests = 0;
    await page.route(`**${LOGIN_PATH}`, (route) => {
      requests += 1;
      return route.abort();
    });
    for (const email of ['plainaddress', '@example.com', 'user@', 'user name@example.com']) {
      await login.emailField.fill(email);
      await login.passwordField.fill(VALID_PASSWORD);
      await login.loginButton.click();
      expect(await login.emailField.evaluate((input: HTMLInputElement) => input.validity.valid)).toBe(false);
    }
    expect(requests).toBe(0);
  });

  test('17-[TC-AUTH-017] submits the RFC method, endpoint, and nested payload', async ({ page }) => {
    await mockLogin(page, 401, invalidCredentialsResponse);
    const login = new LoginPage(page);
    const requestPromise = page.waitForRequest((request) => new URL(request.url()).pathname === LOGIN_PATH);
    await login.loginAs(VALID_EMAIL, VALID_PASSWORD);
    const captured = await requestPromise;
    expect(captured.method()).toBe('POST');
    expect(new URL(captured.url()).pathname).toBe(LOGIN_PATH);
    expect(captured.postDataJSON()).toEqual({ auth: { email: VALID_EMAIL, password: VALID_PASSWORD } });
  });

  test('18-[TC-AUTH-018] pending login prevents duplicate submissions', async ({ page }) => {
    let requestCount = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    await page.route(`**${LOGIN_PATH}`, async (route) => {
      requestCount += 1;
      await gate;
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify(invalidCredentialsResponse) });
    });
    const login = new LoginPage(page);
    await login.emailField.fill(VALID_EMAIL);
    await login.passwordField.fill(VALID_PASSWORD);
    await login.loginButton.click();
    await expect(login.loadingIndicator).toBeVisible();
    await expect(login.loginButton).toHaveCount(0);
    expect(requestCount).toBe(1);
    release();
    await expect(login.errorMessage('Invalid credentials')).toBeVisible();
  });

  test('19-[TC-AUTH-019] invalid response leaves a reusable unauthenticated form', async ({ page }) => {
    await mockLogin(page, 401, invalidCredentialsResponse);
    const login = new LoginPage(page);
    await login.loginAs(VALID_EMAIL, VALID_PASSWORD);
    await expect(login.errorMessage('Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
    await expect(login.storedTokens()).resolves.toEqual({ access: null, refresh: null });
    await login.emailField.fill(VALID_EMAIL);
    await login.passwordField.fill('Corrected-password-123!');
    await expect(login.loginButton).toBeEnabled();
  });

  test('20-[TC-AUTH-020] suspended response creates no session', async ({ page }) => {
    await mockLogin(page, 401, suspendedResponse);
    const login = new LoginPage(page);
    await login.loginAs(VALID_EMAIL, VALID_PASSWORD);
    await expect(login.errorMessage('Account is suspended')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
    await expect(login.storedTokens()).resolves.toEqual({ access: null, refresh: null });
  });

  test('21-[TC-AUTH-021] rate-limit response is presented on Login', async ({ page }) => {
    await mockLogin(page, 429, rateLimitResponse);
    const login = new LoginPage(page);
    await login.loginAs(VALID_EMAIL, VALID_PASSWORD);
    await expect(login.errorMessage(rateLimitResponse.error)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('22-[TC-AUTH-022] success stores tokens and redirects once', async ({ page }) => {
    await mockLogin(page, 200, loginSuccessResponse());
    const login = new LoginPage(page);
    await login.loginAs(VALID_EMAIL, VALID_PASSWORD);
    await expect(page).toHaveURL(/\/home(?:\?.*)?$/);
    await expect.poll(() => login.storedToken('access_token')).toBe('mock-access-token');
    await expect.poll(() => login.storedToken('refresh_token')).toBe('mock-refresh-token');
  });
});
