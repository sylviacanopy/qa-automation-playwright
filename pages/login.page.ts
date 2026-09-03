import { type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly logoLink: Locator;
  readonly logoImage: Locator;
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly emailField: Locator;
  readonly passwordField: Locator;
  readonly forgotPasswordLink: Locator;
  readonly loginButton: Locator;
  readonly signUpLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logoLink = page.locator('a[href="/"]').first();
    this.logoImage = page.getByRole('img', { name: 'Emra' });
    this.heading = page.getByText('Welcome Back', { exact: true });
    this.subtitle = page.getByText('Sign in to your Emra account', { exact: true });
    this.emailField = page.getByLabel('Email', { exact: true });
    this.passwordField = page.getByLabel('Password', { exact: true });
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot?', exact: true });
    this.loginButton = page.getByRole('button', { name: 'Sign In', exact: true });
    this.signUpLink = page.getByRole('link', { name: 'Sign up', exact: true });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async loginAs(email: string, password: string) {
    await this.emailField.fill(email);
    await this.passwordField.fill(password);
    await this.loginButton.click();
  }
}
