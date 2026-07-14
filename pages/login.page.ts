import { type Locator, type Page } from '@playwright/test';


export class LoginPage {

  // ===== PAGE INSTANCE =====

  readonly page: Page;


  // ===== LOCATORS =====

  readonly emailField: Locator;

  readonly passwordField: Locator;

  readonly loginButton: Locator;


  // ===== CONSTRUCTOR =====

  constructor(page: Page) {

    this.page = page;


    // Initialize semua locator

    this.emailField = page.locator("#email");

    this.passwordField = page.getByRole('textbox', { name: 'Password' });

    this.loginButton = page.getByRole('button', { name: 'Sign In' });

  }


  // ===== ACTION METHODS =====

  async loginAs(email: string, password: string) {

    await this.emailField.fill(email);

    await this.passwordField.fill(password);

    await this.loginButton.click();

  }

}