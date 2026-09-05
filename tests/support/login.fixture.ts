import type { APIRequestContext, Page, Request } from '@playwright/test';

export const LOGIN_PATH = '/api/v1/auth/login';
export const VALID_EMAIL = 'qa.user+login@example.com';
export const VALID_PASSWORD = 'Correct-Horse_Battery-Staple-123!';

export const invalidCredentialsResponse = {
  success: false,
  errors: ['Invalid credentials'],
  error_code: 'AUTH_FAILED',
};

export const suspendedResponse = {
  success: false,
  errors: ['Account is suspended'],
  error_code: 'AUTH_FAILED',
};

export const rateLimitResponse = {
  error: 'Too many login attempts, please try again in 15 minutes',
  status: 429,
};

export function loginSuccessResponse(email = VALID_EMAIL) {
  return {
    success: true,
    message: 'Login successful',
    data: {
      user: { id: 1, email, name: 'QA User', role: 'owner', status: 'active' },
      tokens: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_at: '2099-01-21T00:00:00Z',
        refresh_expires_at: '2099-01-28T00:00:00Z',
      },
      subscription: { status: 'active', subscription_type: 'trial' },
      feature_flags: {},
    },
  };
}

export async function postLogin(request: APIRequestContext, email: string, password: string) {
  return request.post(LOGIN_PATH, { data: { auth: { email, password } } });
}

export async function mockLogin(
  page: Page,
  status: number,
  body: unknown,
  onRequest?: (request: Request) => void,
) {
  await page.route(`**${LOGIN_PATH}`, async (route) => {
    onRequest?.(route.request());
    await route.fulfill({
      status,
      contentType: 'application/json',
      headers: status === 429 ? { 'Retry-After': '900' } : undefined,
      body: JSON.stringify(body),
    });
  });
}

export function requiredEnv(name: string) {
  return process.env[name]?.trim() || '';
}
