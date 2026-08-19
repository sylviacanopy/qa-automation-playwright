import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

test('Login successfully with valid email and password', async ({ page }) => {
  
  //Precondition  
  const loginPage = new LoginPage(page)
  await page.goto('https://www.emra.chat/login');
  
  //Steps
  await loginPage.loginAs ('sylviacanopy@gmail.com','tester!3')
  
  //Expected Result
  await expect(page.getByRole('button', { name: 'Sylvia Canopy' })).toBeVisible();
});

test('Login fails with valid email and incorrect password', async ({ page }) => {
  
  //Precondition  
  const loginPage = new LoginPage(page)
  await page.goto('https://www.emra.chat/login');
  
  //Steps
  await loginPage.loginAs ('sylviacanopy@gmail.com','tester!1234')
  
  //Expected Result
  await expect(page.getByText('Invalid credentials')).toBeVisible();
});

test('Login fails with unregistered email', async ({ page }) => {
  
  //Precondition  
  const loginPage = new LoginPage(page)
  await page.goto('https://www.emra.chat/login');
  
  //Steps
  await loginPage.loginAs ('sylviacanopy1@gmail.com','tester!3')
  
  //Expected Result
  await expect(page.getByText('Invalid credentials')).toBeVisible();
});