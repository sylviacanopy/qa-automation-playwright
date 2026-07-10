import { test, expect } from '@playwright/test';


test('test', async ({ page }) => {
  
  //Precondition  
  await page.goto('https://www.emra.chat/login');
  
  //Steps
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('testingemrachat@gmail.com');
  await page.getByRole('textbox', { name: 'Email' }).press('Tab');
  await page.getByRole('link', { name: 'Forgot?' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('tester!3');
  await page.getByRole('button', { name: 'Sign In' }).click();
  
  //Expected Result
  await expect(page.getByRole('button', { name: 'Fadhli Maulidri Baru' })).toBeVisible();
});