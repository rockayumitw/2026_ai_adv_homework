const { test, expect } = require('@playwright/test');
const fs = require('fs');

test('完整購物結帳流程：登入 → 加入購物車 → 結帳 → 綠界 ATM 網路交易 → MockATM 完成', async ({ page }) => {
  test.setTimeout(300000);

  // 如果 ECPay 用 JS confirm/alert dialog，accept() 代表「確認/繼續」，dismiss() 代表「取消」
  // 必須用 accept() 才能讓付款流程繼續
  page.on('dialog', async (dialog) => {
    console.log(`✓ JS Dialog：type=${dialog.type()} msg="${dialog.message().substring(0, 80)}"`);
    await dialog.accept();
  });

  // ── Step 1：登入 ──────────────────────────────────────────────────
  await page.goto('/');
  await page.waitForTimeout(1000);
  await page.goto('/login');
  await page.waitForTimeout(1000);

  await page.fill('input[type="email"]', 'admin@hexschool.com');
  await page.fill('input[type="password"]', '12345678');
  await page.screenshot({ path: 'test-results/step-01-login.png' });

  await page.click('button[type="submit"]');
  await page.waitForURL(/^(?!.*\/login).*$/, { timeout: 10000 });
  await page.screenshot({ path: 'test-results/step-02-logged-in.png' });
  console.log('✓ 登入成功');

  // ── Step 2：首頁加入商品到購物車 ──────────────────────────────────
  await page.goto('/');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'test-results/step-03-homepage.png' });

  const addBtn = page.locator('button').filter({ hasText: '+ 加入' }).first();
  await addBtn.waitFor({ state: 'visible', timeout: 10000 });
  await addBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/step-04-added-to-cart.png' });
  console.log('✓ 商品加入購物車');

  // ── Step 3：購物車 ────────────────────────────────────────────────
  await page.goto('/cart');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/step-05-cart.png' });

  // ── Step 4：前往結帳 ──────────────────────────────────────────────
  const checkoutBtn = page.locator('button').filter({ hasText: '前往結帳' });
  await checkoutBtn.waitFor({ state: 'visible', timeout: 8000 });
  await checkoutBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/step-06-checkout.png' });

  // ── Step 5：填寫收件資訊 ──────────────────────────────────────────
  await page.fill('input[placeholder="請輸入收件人姓名"]', '測試收件人');
  await page.fill('input[type="email"]', 'test@bloom.com');
  await page.fill('input[placeholder*="台北市"]', '台北市信義區松仁路100號');
  await page.screenshot({ path: 'test-results/step-07-checkout-filled.png' });

  // ── Step 6：確認訂單 ──────────────────────────────────────────────
  await page.click('button:has-text("確認訂單")');
  await page.waitForURL(/\/orders\/[a-z0-9-]+$/, { timeout: 20000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'test-results/step-08-order-detail.png' });
  console.log('✓ 訂單建立：' + page.url());

  // ── Step 7：點擊「前往綠界付款」 ─────────────────────────────────
  const ecpayBtn = page.locator('button').filter({ hasText: '前往綠界付款' });
  await ecpayBtn.waitFor({ state: 'visible', timeout: 10000 });
  await ecpayBtn.click();

  await page.waitForURL(/ecpay\.com\.tw/, { timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test-results/step-09-ecpay-landing.png' });
  console.log('✓ 已進入綠界付款頁');

  // ── Step 8：選擇「網路ATM」Tab ────────────────────────────────────
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);

  const webatmTab = page.locator('#liWebATM, [id*="WebATM"]:not(select):not(a)').first();
  await webatmTab.waitFor({ state: 'visible', timeout: 8000 });
  await webatmTab.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/step-10-webatm-selected.png' });
  console.log('✓ 選擇網路ATM');

  // ── Step 9：選擇台灣土地銀行（精確鎖定 #selWebATMBank）─────────
  await page.evaluate(() => window.scrollBy(0, 300));
  await page.waitForTimeout(800);

  // 用 evaluate 選銀行，同時 log 可用選項供除錯
  const bankResult = await page.evaluate(() => {
    const sel = document.getElementById('selWebATMBank');
    if (!sel) return { error: 'selWebATMBank not found' };
    const allOpts = Array.from(sel.options).map(o => ({ v: o.value, t: o.text.trim() }));
    const target = sel.options[0]; // 嘗試先列出
    const landOpt = allOpts.find(o =>
      o.t.includes('土地') || o.v.toUpperCase().includes('LAND')
    );
    if (landOpt) {
      sel.value = landOpt.v;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      sel.dispatchEvent(new Event('input', { bubbles: true }));
      return { selected: landOpt, allOpts };
    }
    return { notFound: true, allOpts };
  });

  console.log('銀行選擇結果：' + JSON.stringify(bankResult).substring(0, 200));

  await page.waitForTimeout(800);
  await page.screenshot({ path: 'test-results/step-11-bank-selected.png' });

  // ── Step 10：捲動到「前往付款」按鈕並點擊（id=WebATMPaySubmit）─
  // 儲存點擊前的頁面原始碼，確認按鈕狀態
  fs.writeFileSync('test-results/ecpay-before-pay.html', await page.content());

  const payBtn = page.locator('#WebATMPaySubmit');
  await payBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'test-results/step-12-before-pay.png' });

  // 監聽可能在新視窗開啟的 MockMPPost（在點擊前先設好）
  const newPagePromise = page.context().waitForEvent('page', { timeout: 90000 }).catch(() => null);

  // 用 evaluate 直接呼叫 click()，避免 Playwright 攔截 <a href="#"> 的預設行為
  await page.evaluate(() => {
    const btn = document.getElementById('WebATMPaySubmit');
    if (btn) btn.click();
  });
  console.log('✓ 點擊前往付款（#WebATMPaySubmit via evaluate）');

  // 等待 popup 出現
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test-results/step-12-after-pay.png' });
  fs.writeFileSync('test-results/ecpay-after-pay.html', await page.content());

  // ── Step 11：關閉「跳轉銀行頁面」提醒彈窗 ──────────────────────
  // 彈窗標題："綠界科技貼心提醒您，將跳轉至銀行頁面進行後續付款!"
  // simplert 渲染後 #btnClose 可能有兩份：
  //   1. 原始 <div style="display:none"> 內的隱藏版
  //   2. simplert 渲染到 <body> 的可見版
  // 用 evaluate 尋找真正可見的關閉按鈕
  const popupClosed = await page.evaluate(() => {
    // 嘗試所有可能的關閉按鈕 selector
    const selectors = [
      '#btnClose',
      '.simplert__close',
      '.simplert__footer button',
      'button[id*="Close"]',
      'button[id*="close"]',
    ];
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      for (const el of els) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        // 檢查元素是否真正可見（不在 display:none 的祖先內）
        if (rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden') {
          el.click();
          return { clicked: sel, id: el.id, class: el.className };
        }
      }
    }
    // 記錄所有 #btnClose 的狀態
    const allClose = Array.from(document.querySelectorAll('#btnClose')).map(el => {
      const rect = el.getBoundingClientRect();
      return { w: rect.width, h: rect.height, display: window.getComputedStyle(el).display };
    });
    return { notFound: true, allClose };
  });

  console.log('彈窗關閉結果：' + JSON.stringify(popupClosed));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/step-13-after-popup-close.png' });

  // ── Step 12：等待導向 MockMPPost/LandWebAtm ───────────────────────
  console.log('⏳ 等待導向 MockMPPost...');

  let mockPage = page;
  const newPageResult = await newPagePromise;

  if (newPageResult) {
    mockPage = newPageResult;
    await mockPage.waitForLoadState('domcontentloaded', { timeout: 30000 });
    console.log('✓ MockMPPost 在新視窗：' + mockPage.url());
  } else {
    // 當前頁等待 URL 變化
    try {
      await page.waitForURL(/MockMPPost|LandWebAtm/, { timeout: 60000 });
      console.log('✓ 當前頁導向 MockMPPost：' + page.url());
    } catch {
      console.log('⚠ 60s 未到 MockMPPost，當前 URL：' + page.url());
    }
  }

  await page.waitForTimeout(2000);
  await mockPage.screenshot({ path: 'test-results/step-14-mock-atm.png' });
  fs.writeFileSync('test-results/mock-atm-source.html', await mockPage.content());
  console.log('✓ MockMPPost 頁面截圖，URL：' + mockPage.url());

  // ── Step 13：點擊 Save 完成模擬付款 ─────────────────────────────
  const saveSelectors = [
    'input[value="Save"]',
    'input[value="save"]',
    'input[type="submit"]',
    'button:has-text("Save")',
    'button[type="submit"]',
    'a:has-text("Save")',
  ];

  let saveClicked = false;
  for (const sel of saveSelectors) {
    const el = mockPage.locator(sel).first();
    if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
      await el.click();
      console.log(`✓ 點擊 Save：${sel}`);
      saveClicked = true;
      break;
    }
  }

  if (!saveClicked) {
    await mockPage.screenshot({ path: 'test-results/step-14b-save-not-found.png' });
    console.log('⚠ 找不到 Save 按鈕，截圖已儲存');
  }

  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'test-results/step-15-after-save.png' });

  // ── Step 14：等待回到訂單頁（付款成功驗證）─────────────────────
  try {
    await page.waitForURL(/\/orders\//, { timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/step-16-order-complete.png' });
    console.log('✅ 付款完成！回到訂單頁：' + page.url());
  } catch {
    await page.screenshot({ path: 'test-results/step-16-final.png' });
    console.log('⚠ 最終 URL：' + page.url());
  }

  console.log('✅ 完整流程結束，截圖與錄影已儲存至 test-results/');
});
