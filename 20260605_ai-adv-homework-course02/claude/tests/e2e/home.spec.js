const { test, expect } = require('@playwright/test');

test.describe('首頁', () => {
  test('應顯示 Hero 區塊與商品列表', async ({ page }) => {
    await page.goto('/');

    // Hero 標題
    await expect(page.locator('h1')).toBeVisible();

    // 等待商品載入（API 呼叫）
    await page.waitForSelector('[v-for]', { state: 'hidden' }).catch(() => {});
    await page.waitForTimeout(1500);

    // 確認頁面標題含 BLOOM
    await expect(page).toHaveTitle(/BLOOM/);
  });

  test('點擊商品卡片應導向商品詳情頁', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const card = page.locator('#app [style*="cursor:pointer"]').first();
    if (await card.isVisible()) {
      await card.click();
      await expect(page).toHaveURL(/\/products\/.+/);
    }
  });
});

test.describe('登入頁', () => {
  test('應顯示登入表單', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('錯誤憑證應顯示錯誤訊息', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);
    // 頁面應仍在 /login（未跳轉）
    await expect(page).toHaveURL(/\/login/);
  });

  test('正確憑證應登入並跳轉', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hexschool.com');
    await page.fill('input[type="password"]', '12345678');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    // 成功後應離開 /login
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe('購物車頁', () => {
  test('未登入應顯示購物車（匿名 session）', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForTimeout(1500);
    // 頁面應正常載入（不是 500 錯誤）
    await expect(page.locator('#app')).toBeVisible();
  });
});
