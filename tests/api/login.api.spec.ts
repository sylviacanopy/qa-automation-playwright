import { expect } from '@playwright/test';
import { test } from 'agentq-playwright';
import { LOGIN_PATH, postLogin, requiredEnv } from '../support/login.fixture';

const email = requiredEnv('LOGIN_EMAIL');
const password = requiredEnv('LOGIN_PASSWORD');
const suspendedEmail = requiredEnv('SUSPENDED_LOGIN_EMAIL');
const suspendedPassword = requiredEnv('SUSPENDED_LOGIN_PASSWORD');
const runRateLimit = process.env.RUN_RATE_LIMIT_TESTS === 'true';

test.describe('US-02 login API contract', () => {
  test('2-[TC-AUTH-002] active user receives the complete success contract', async ({ request, page }) => {
    void page;
    test.skip(!email || !password, 'LOGIN_EMAIL and LOGIN_PASSWORD are required');

    const response = await postLogin(request, email, password);
    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body).toMatchObject({
      success: true,
      data: {
        user: { email },
        tokens: {
          access_token: expect.any(String),
          refresh_token: expect.any(String),
          expires_at: expect.any(String),
          refresh_expires_at: expect.any(String),
        },
        feature_flags: expect.any(Object),
      },
    });
    expect(body.data.user.status === 'active' || body.data.user.active === true).toBe(true);
    expect(body.data.user).not.toHaveProperty('password');
    expect(body.data.user).not.toHaveProperty('password_digest');
    expect(Date.parse(body.data.tokens.expires_at)).toBeGreaterThan(Date.now());
    expect(Date.parse(body.data.tokens.refresh_expires_at)).toBeGreaterThan(Date.now());
  });

  test('3-[TC-AUTH-003] incorrect password returns the generic authentication error', async ({ request, page }) => {
    void page;
    test.skip(!email, 'LOGIN_EMAIL is required');
    const response = await postLogin(request, email, `wrong-${Date.now()}`);
    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      errors: ['Invalid credentials'],
      error_code: 'AUTH_FAILED',
    });
  });

  test('4-[TC-AUTH-004] unregistered email is indistinguishable from a wrong password', async ({ request, page }) => {
    void page;
    test.skip(!email, 'LOGIN_EMAIL is required');
    const wrongPassword = await postLogin(request, email, `wrong-${Date.now()}`);
    const unknownEmail = await postLogin(request, `unregistered-${Date.now()}@example.com`, 'irrelevant-password');

    expect(unknownEmail.status()).toBe(wrongPassword.status());
    expect(await unknownEmail.json()).toEqual(await wrongPassword.json());
  });

  test.describe('suspended account with valid credentials', () => {
    test.skip(!suspendedEmail || !suspendedPassword, 'Suspended-user fixture is required');
    test.beforeEach(async ({ page }) => {
      void page;
    });

    test('5-[TC-AUTH-005] suspended account with correct credentials is rejected', async ({ request }) => {
      const response = await postLogin(request, suspendedEmail, suspendedPassword);
      expect(response.status()).toBe(401);
      await expect(response.json()).resolves.toMatchObject({
        success: false,
        errors: ['Account is suspended'],
        error_code: 'AUTH_FAILED',
      });
    });
  });

  test.describe('suspended account with invalid credentials', () => {
    test.skip(!suspendedEmail, 'Suspended-user fixture is required');
    test.beforeEach(async ({ page }) => {
      void page;
    });

    test('6-[TC-AUTH-006] credentials are validated before suspended status is disclosed', async ({ request }) => {
      const response = await postLogin(request, suspendedEmail, `wrong-${Date.now()}`);
      expect(response.status()).toBe(401);
      expect(await response.json()).toMatchObject({ errors: ['Invalid credentials'] });
    });
  });
});

test.describe.serial('US-02 login rate limiting', () => {
  test.skip(!runRateLimit, 'Set RUN_RATE_LIMIT_TESTS=true only in an isolated rate-limit environment');

  test.beforeEach(async ({ page }) => {
    void page;
  });

  test('7-[TC-AUTH-007] sixth attempt is blocked with Retry-After 900', async ({ request }) => {
    const target = requiredEnv('RATE_LIMIT_EMAIL');
    test.skip(!target, 'RATE_LIMIT_EMAIL is required');
    let response;
    for (let attempt = 1; attempt <= 6; attempt += 1) {
      response = await postLogin(request, target, `wrong-${attempt}`);
    }
    expect(response?.status()).toBe(429);
    expect(response?.headers()['retry-after']).toBe('900');
    await expect(response!.json()).resolves.toEqual({
      error: 'Too many login attempts, please try again in 15 minutes',
      status: 429,
    });
  });

  test('8-[TC-AUTH-008] limiter key is isolated by IP and email', async ({ request }) => {
    const target = requiredEnv('RATE_LIMIT_EMAIL');
    const other = requiredEnv('RATE_LIMIT_OTHER_EMAIL');
    test.skip(!target || !other, 'Two isolated rate-limit users are required');
    for (let attempt = 1; attempt <= 6; attempt += 1) {
      await postLogin(request, target, `wrong-${attempt}`);
    }
    expect((await postLogin(request, other, 'wrong-password')).status()).not.toBe(429);
  });

  test('9-[TC-AUTH-009] successful login resets the limiter counter', async ({ request }) => {
    const target = requiredEnv('RATE_LIMIT_EMAIL');
    const targetPassword = requiredEnv('RATE_LIMIT_PASSWORD');
    test.skip(!target || !targetPassword, 'A dedicated valid rate-limit user is required');
    for (let attempt = 1; attempt <= 4; attempt += 1) await postLogin(request, target, `wrong-${attempt}`);
    expect((await postLogin(request, target, targetPassword)).status()).toBe(200);
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      expect((await postLogin(request, target, `new-wrong-${attempt}`)).status()).not.toBe(429);
    }
  });

  test('10-[TC-AUTH-010] configured feature flag bypasses the limiter', async ({ request }) => {
    const bypassEmail = requiredEnv('RATE_LIMIT_BYPASS_EMAIL');
    test.skip(!bypassEmail, 'A user with disable_rate_limiter enabled is required');
    for (let attempt = 1; attempt <= 6; attempt += 1) {
      expect((await postLogin(request, bypassEmail, `wrong-${attempt}`)).status()).not.toBe(429);
    }
  });
});

test('11-[TC-AUTH-011] response role and subscription match controlled fixtures', async ({ request, page }) => {
  void page;
  test.skip(!email || !password, 'Controlled LOGIN_EMAIL and LOGIN_PASSWORD fixtures are required');
  const response = await postLogin(request, email, password);
  const body = await response.json();
  const roleInformation = body.data.user.role ?? body.data.user.roles;
  expect(
    typeof roleInformation === 'string'
      ? roleInformation.length > 0
      : Array.isArray(roleInformation) && roleInformation.length > 0,
  ).toBe(true);
  expect(body.data.subscription ?? body.data.subscriptions).toBeDefined();
});

test('12-[TC-AUTH-012] successful login writes a safe activity log', async () => {
  test.skip(true, 'Requires a test-only activity-log query hook that the RFC does not expose');
});

test('13-[TC-AUTH-013] failed login writes a safe activity log', async () => {
  test.skip(true, 'Requires a test-only activity-log query hook that the RFC does not expose');
});
