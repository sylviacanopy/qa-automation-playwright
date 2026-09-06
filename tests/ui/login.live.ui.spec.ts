import { expect } from '@playwright/test';
import { test } from 'agentq-playwright';
import { LoginPage } from '../../pages/login.page';
import { requiredEnv } from '../support/login.fixture';

const email = requiredEnv('LOGIN_EMAIL');
const password = requiredEnv('LOGIN_PASSWORD');
const suspendedEmail = requiredEnv('SUSPENDED_LOGIN_EMAIL');
const suspendedPassword = requiredEnv('SUSPENDED_LOGIN_PASSWORD');

test('1-[TC-AUTH-001] active user completes the real login journey', async ({ page }) => {
  test.skip(!email || !password, 'LOGIN_EMAIL and LOGIN_PASSWORD are required');
  const login = new LoginPage(page);
  await login.goto();
  await login.loginAs(email, password);
  await expect(page).toHaveURL(/\/home(?:\?.*)?$/);
});

test('23-[TC-AUTH-023] invalid credentials fail through the real user journey', async ({ page }) => {
  test.skip(!email, 'LOGIN_EMAIL is required');
  const login = new LoginPage(page);
  await login.goto();
  await login.loginAs(email, `wrong-${Date.now()}`);
  await expect(login.errorMessage('Invalid credentials')).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
  await expect(login.storedTokens()).resolves.toEqual({ access: null, refresh: null });
});

test('24-[TC-AUTH-024] suspended user is blocked through the real user journey', async ({ page }) => {
  test.skip(!suspendedEmail || !suspendedPassword, 'Suspended-user fixture is required');
  const login = new LoginPage(page);
  await login.goto();
  await login.loginAs(suspendedEmail, suspendedPassword);
  await expect(login.errorMessage('Account is suspended')).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
  await expect(login.storedTokens()).resolves.toEqual({ access: null, refresh: null });
});

test('25-[TC-AUTH-025] core login journey is usable on a mobile viewport', async ({ page }) => {
  const login = new LoginPage(page);
  await login.useMobileViewport();
  await login.goto();
  await expect(login.heading).toBeVisible();
  await expect(login.emailField).toBeVisible();
  await expect(login.passwordField).toBeVisible();
  await expect(login.forgotPasswordLink).toBeVisible();
  await expect(login.loginButton).toBeVisible();
  expect(await login.documentWidth()).toBeLessThanOrEqual(320);
});
