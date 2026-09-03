import { test, expect, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

const validEmail = 'qa.user+login@example.com';
const validPassword = 'Correct-Horse_Battery-Staple-123!';

async function mockFailedLogin(page: Page, message = 'Invalid credentials') {
  await page.route('**/auth/login', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        errors: [message],
        error_code: 'AUTH_FAILED',
      }),
    });
  });
}

function loginSuccessResponse() {
  return {
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: 1,
        email: validEmail,
        name: 'QA User',
        role: 'owner',
        status: 'active',
      },
      tokens: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_at: '2099-01-21T00:00:00Z',
        refresh_expires_at: '2099-01-28T00:00:00Z',
      },
      subscription: {
        status: 'active',
        subscription_type: 'trial',
      },
      feature_flags: {},
    },
  };
}

test.describe('Login page - skenario utama', () => {
  test('[TC-AUTH-001] login berhasil dengan akun valid', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAs('sylviacanopy@gmail.com', 'tester!3');

    await expect(page).toHaveURL(/\/home(?:\?.*)?$/);
  });

  test('[TC-AUTH-002] login gagal dengan email valid dan password salah', async ({ page }) => {
    await mockFailedLogin(page);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAs(validEmail, 'incorrect-password');

    await expect(page.getByText('Invalid credentials').first()).toBeVisible();
  });

  test('[TC-AUTH-003] login gagal dengan email yang belum terdaftar', async ({ page }) => {
    await mockFailedLogin(page);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAs('unregistered.user@example.com', validPassword);

    await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
  });
});

test.describe('Login page - tampilan dan aksesibilitas', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('[TC-AUTH-004] menampilkan judul halaman login', async () => {
    await expect(loginPage.heading).toBeVisible();
  });

  test('[TC-AUTH-005] menampilkan deskripsi halaman login', async () => {
    await expect(loginPage.subtitle).toBeVisible();
  });

  test('[TC-AUTH-006] menampilkan logo Emra dengan alternative text', async () => {
    await expect(loginPage.logoImage).toBeVisible();
    await expect(loginPage.logoImage).toHaveAttribute('alt', 'Emra');
  });

  test('[TC-AUTH-007] logo mengarah ke halaman utama', async () => {
    await expect(loginPage.logoLink).toHaveAttribute('href', '/');
  });

  test('[TC-AUTH-008] field email dapat ditemukan melalui labelnya', async () => {
    await expect(loginPage.emailField).toBeVisible();
    await expect(loginPage.emailField).toBeEditable();
  });

  test('[TC-AUTH-009] field password dapat ditemukan melalui labelnya', async () => {
    await expect(loginPage.passwordField).toBeVisible();
    await expect(loginPage.passwordField).toBeEditable();
  });

  test('[TC-AUTH-010] menampilkan placeholder email yang sesuai', async () => {
    await expect(loginPage.emailField).toHaveAttribute('placeholder', 'you@example.com');
  });

  test('[TC-AUTH-011] menampilkan placeholder password', async () => {
    await expect(loginPage.passwordField).toHaveAttribute('placeholder', '••••••••');
  });

  test('[TC-AUTH-012] field email menggunakan tipe email', async () => {
    await expect(loginPage.emailField).toHaveAttribute('type', 'email');
  });

  test('[TC-AUTH-013] field password menyamarkan nilai yang diketik', async () => {
    await expect(loginPage.passwordField).toHaveAttribute('type', 'password');
    await loginPage.passwordField.fill(validPassword);
    await expect(loginPage.passwordField).toHaveValue(validPassword);
  });

  test('[TC-AUTH-014] kedua field wajib diisi', async () => {
    await expect(loginPage.emailField).toHaveAttribute('required', '');
    await expect(loginPage.passwordField).toHaveAttribute('required', '');
  });

  test('[TC-AUTH-015] hanya memiliki satu form login', async ({ page }) => {
    await expect(page.locator('form')).toHaveCount(1);
  });

});

test.describe('Login page - state form', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('[TC-AUTH-016] tombol Sign In nonaktif saat form kosong', async () => {
    await expect(loginPage.loginButton).toBeDisabled();
  });

  test('[TC-AUTH-017] tombol tetap nonaktif jika hanya email yang diisi', async () => {
    await loginPage.emailField.fill(validEmail);
    await expect(loginPage.loginButton).toBeDisabled();
  });

  test('[TC-AUTH-018] tombol tetap nonaktif jika hanya password yang diisi', async () => {
    await loginPage.passwordField.fill(validPassword);
    await expect(loginPage.loginButton).toBeDisabled();
  });

  test('[TC-AUTH-019] tombol aktif jika email dan password terisi', async () => {
    await loginPage.emailField.fill(validEmail);
    await loginPage.passwordField.fill(validPassword);
    await expect(loginPage.loginButton).toBeEnabled();
  });

  test('[TC-AUTH-020] nilai email tersimpan di field', async () => {
    await loginPage.emailField.fill(validEmail);
    await expect(loginPage.emailField).toHaveValue(validEmail);
  });

  test('[TC-AUTH-021] password menerima karakter kompleks', async () => {
    const complexPassword = "P@ss word-'_123!#$%^&*()";
    await loginPage.passwordField.fill(complexPassword);
    await expect(loginPage.passwordField).toHaveValue(complexPassword);
  });

  test('[TC-AUTH-022] mengosongkan email menonaktifkan kembali tombol', async () => {
    await loginPage.emailField.fill(validEmail);
    await loginPage.passwordField.fill(validPassword);
    await loginPage.emailField.clear();
    await expect(loginPage.loginButton).toBeDisabled();
  });

  test('[TC-AUTH-023] mengosongkan password menonaktifkan kembali tombol', async () => {
    await loginPage.emailField.fill(validEmail);
    await loginPage.passwordField.fill(validPassword);
    await loginPage.passwordField.clear();
    await expect(loginPage.loginButton).toBeDisabled();
  });

  test('[TC-AUTH-024] input dapat dihapus dengan shortcut keyboard', async () => {
    await loginPage.emailField.fill(validEmail);
    await loginPage.emailField.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await loginPage.emailField.press('Backspace');
    await expect(loginPage.emailField).toHaveValue('');
  });

  test('[TC-AUTH-025] urutan tab berpindah dari email ke Forgot lalu password', async () => {
    await loginPage.emailField.focus();
    await loginPage.emailField.press('Tab');
    await expect(loginPage.forgotPasswordLink).toBeFocused();
    await loginPage.forgotPasswordLink.press('Tab');
    await expect(loginPage.passwordField).toBeFocused();
  });
});

const invalidEmails = [
  'plainaddress',
  '@example.com',
  'user@',
  'user name@example.com',
  'user@example com',
  'user@@example.com',
];

for (const [index, email] of invalidEmails.entries()) {
  const testCaseId = `TC-AUTH-${String(26 + index).padStart(3, '0')}`;

  test(`[${testCaseId}] menolak format email tidak valid: ${email}`, async ({ page }) => {
    const loginPage = new LoginPage(page);
    let loginRequests = 0;
    await page.route('**/auth/login', async (route) => {
      loginRequests += 1;
      await route.abort();
    });
    await loginPage.goto();
    await loginPage.emailField.fill(email);
    await loginPage.passwordField.fill(validPassword);
    await loginPage.loginButton.click();

    expect(await loginPage.emailField.evaluate((input: HTMLInputElement) => input.validity.valid)).toBe(false);
    expect(loginRequests).toBe(0);
  });
}

const acceptedEmails = [
  'user@example.com',
  'USER@example.com',
  'user+tag@example.com',
  'first.last@example.co.id',
  'a@b.co',
];

for (const [index, email] of acceptedEmails.entries()) {
  const testCaseId = `TC-AUTH-${String(32 + index).padStart(3, '0')}`;

  test(`[${testCaseId}] menerima format email valid: ${email}`, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.emailField.fill(email);

    expect(await loginPage.emailField.evaluate((input: HTMLInputElement) => input.validity.valid)).toBe(true);
  });
}

test.describe('Login page - proses autentikasi dengan response terisolasi', () => {
  test('[TC-AUTH-037] mengirim email dan password yang dimasukkan', async ({ page }) => {
    let requestBody: unknown;
    await page.route('**/auth/login', async (route) => {
      requestBody = route.request().postDataJSON();
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' }),
      });
    });
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAs(validEmail, validPassword);

    expect(requestBody).toEqual({ email: validEmail, password: validPassword });
  });

  test('[TC-AUTH-038] mengirim login menggunakan HTTP POST ke endpoint auth/login', async ({ page }) => {
    let requestMethod = '';
    let requestUrl = '';
    await page.route('**/auth/login', async (route) => {
      requestMethod = route.request().method();
      requestUrl = route.request().url();
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, errors: ['Invalid credentials'] }),
      });
    });
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAs(validEmail, validPassword);

    expect(requestMethod).toBe('POST');
    expect(new URL(requestUrl).pathname).toMatch(/\/api\/v1\/auth\/login$/);
  });

  test('[TC-AUTH-039] tidak menyimpan token ketika kredensial salah', async ({ page }) => {
    await mockFailedLogin(page);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAs(validEmail, 'incorrect-password');
    await expect(page.getByText('Invalid credentials').first()).toBeVisible();

    expect(await page.evaluate(() => localStorage.getItem('access_token'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('refresh_token'))).toBeNull();
  });

  test('[TC-AUTH-040] form kembali siap digunakan setelah autentikasi gagal', async ({ page }) => {
    await mockFailedLogin(page);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAs(validEmail, 'incorrect-password');

    await expect(loginPage.emailField).toBeEditable();
    await expect(loginPage.passwordField).toBeEditable();
    await expect(loginPage.loginButton).toBeDisabled();
  });

  test('[TC-AUTH-041] dapat submit menggunakan tombol Enter dari field password', async ({ page }) => {
    let requestCount = 0;
    await page.route('**/auth/login', async (route) => {
      requestCount += 1;
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' }),
      });
    });
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.emailField.fill(validEmail);
    await loginPage.passwordField.fill(validPassword);
    await loginPage.passwordField.press('Enter');

    await expect.poll(() => requestCount).toBe(1);
  });

  test('[TC-AUTH-042] menampilkan state loading selama request berlangsung', async ({ page }) => {
    let releaseResponse: () => void = () => {};
    const responseGate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    await page.route('**/auth/login', async (route) => {
      await responseGate;
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' }),
      });
    });
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.emailField.fill(validEmail);
    await loginPage.passwordField.fill(validPassword);
    await loginPage.loginButton.click();

    await expect(page.getByText('Loading...', { exact: true })).toBeVisible();
    releaseResponse();
    await expect(page.getByText('Invalid credentials').first()).toBeVisible();
  });

  test('[TC-AUTH-043] pesan error lama hilang saat mencoba login kembali', async ({ page }) => {
    let requestCount = 0;
    let releaseSecondResponse: () => void = () => {};
    const secondResponseGate = new Promise<void>((resolve) => {
      releaseSecondResponse = resolve;
    });
    await page.route('**/auth/login', async (route) => {
      requestCount += 1;
      if (requestCount === 1) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'First login failed' }),
        });
        return;
      }
      await secondResponseGate;
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Second login failed' }),
      });
    });
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAs(validEmail, validPassword);
    await expect(page.getByText('First login failed').first()).toBeVisible();

    await loginPage.emailField.fill(validEmail);
    await loginPage.passwordField.fill(validPassword);
    await loginPage.loginButton.click();
    await expect(page.getByText('First login failed')).toHaveCount(0);
    releaseSecondResponse();
    await expect(page.getByText('Second login failed').first()).toBeVisible();
  });

  test('[TC-AUTH-044] akun suspend ditolak dengan pesan yang ditentukan PRD', async ({ page }) => {
    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          errors: ['Account is suspended'],
          error_code: 'AUTH_FAILED',
        }),
      });
    });
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAs(validEmail, validPassword);

    await expect(page.getByText('Account is suspended').first()).toBeVisible();
    await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
    expect(await page.evaluate(() => localStorage.getItem('access_token'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('refresh_token'))).toBeNull();
  });

  test('[TC-AUTH-045] menampilkan pesan rate limit dari server', async ({ page }) => {
    const rateLimitMessage = 'Too many login attempts, please try again in 15 minutes';
    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 429,
        headers: { 'Retry-After': '900' },
        contentType: 'application/json',
        body: JSON.stringify({ error: rateLimitMessage, status: 429 }),
      });
    });
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAs(validEmail, validPassword);

    await expect(page.getByText(rateLimitMessage).first()).toBeVisible();
    await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
  });

  test('[TC-AUTH-046] login berhasil menyimpan access dan refresh token', async ({ page }) => {
    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(loginSuccessResponse()),
      });
    });
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAs(validEmail, validPassword);

    await expect.poll(() => page.evaluate(() => localStorage.getItem('access_token'))).toBe('mock-access-token');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('refresh_token'))).toBe('mock-refresh-token');
  });

  test('[TC-AUTH-047] login berhasil mengarahkan user aktif ke halaman utama', async ({ page }) => {
    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(loginSuccessResponse()),
      });
    });
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAs(validEmail, validPassword);

    await expect(page).toHaveURL(/\/home(?:\?.*)?$/);
  });

  test.fixme('[TC-AUTH-048] menyediakan opsi Remember me sesuai FE-12', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(page.getByRole('checkbox', { name: /remember me/i })).toBeVisible();
  });
});

test.describe('Login page - responsive layout', () => {
  test('[TC-AUTH-049] form tetap terlihat pada viewport mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.emailField).toBeVisible();
    await expect(loginPage.passwordField).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('[TC-AUTH-050] halaman tidak memiliki horizontal overflow pada mobile', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});

test.describe('Login page - smoke checks', () => {
  test('[TC-AUTH-051] halaman login dapat diakses langsung', async ({ page }) => {
    const response = await page.goto('/login');

    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
  });

  test('[TC-AUTH-052] pengunjung tanpa sesi tetap berada di halaman login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('[TC-AUTH-053] halaman login tidak membuat token untuk pengunjung', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    expect(await page.evaluate(() => localStorage.getItem('access_token'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('refresh_token'))).toBeNull();
  });
});
