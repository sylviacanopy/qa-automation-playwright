import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

//disable due to credential not able to use
// test('User successfully login using valid credential', async ({ page }) => {
  
//   //Precondition  
//   const loginPage = new LoginPage(page)
//   await page.goto('https://www.emra.chat/login');
  
//   //Steps
//   await loginPage.loginAs ('testingemrachat@gmail.com','tester!3')
  
//   //Expected Result
//   await expect(page.getByRole('button', { name: 'Fadhli Maulidri Baru' })).toBeVisible();
// });

test('User unsuccessfully login using invalid credential', async ({ page }) => {
  
  //Precondition  
  const loginPage = new LoginPage(page)
  await page.goto('https://www.emra.chat/login');
  
  //Steps
  await loginPage.loginAs ('canopy@gmail.com','tester!1234')
  
  //Expected Result
  await expect(page.getByText('Invalid credentials')).toBeVisible();
});
