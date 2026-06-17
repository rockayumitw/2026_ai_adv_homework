const crypto = require('crypto');

const MERCHANT_ID = process.env.ECPAY_MERCHANT_ID;
const HASH_KEY = process.env.ECPAY_HASH_KEY;
const HASH_IV = process.env.ECPAY_HASH_IV;
const IS_STAGING = process.env.ECPAY_ENV !== 'production';

const BASE_URL = IS_STAGING
  ? 'https://payment-stage.ecpay.com.tw'
  : 'https://payment.ecpay.com.tw';

const CHECKOUT_URL = `${BASE_URL}/Cashier/AioCheckOut/V5`;
const QUERY_URL = `${BASE_URL}/Cashier/QueryTradeInfo/V5`;

// AIO CMV-SHA256 URL encode:
// encodeURIComponent → %20→+ → ~→%7e → '→%27 → toLowerCase → .NET 字元還原
function ecpayUrlEncode(str) {
  return encodeURIComponent(str)
    .replace(/%20/g, '+')
    .replace(/~/g, '%7e')
    .replace(/'/g, '%27')
    .toLowerCase()
    .replace(/%2d/g, '-')
    .replace(/%5f/g, '_')
    .replace(/%2e/g, '.')
    .replace(/%21/g, '!')
    .replace(/%2a/g, '*')
    .replace(/%28/g, '(')
    .replace(/%29/g, ')');
}

function generateCheckMacValue(params) {
  const sorted = Object.entries(params).sort(([a], [b]) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );
  const raw =
    `HashKey=${HASH_KEY}&` +
    sorted.map(([k, v]) => `${k}=${v}`).join('&') +
    `&HashIV=${HASH_IV}`;
  const encoded = ecpayUrlEncode(raw);
  return crypto.createHash('sha256').update(encoded).digest('hex').toUpperCase();
}

function verifyCheckMacValue(params) {
  const { CheckMacValue: received, ...rest } = params;
  const computed = generateCheckMacValue(rest);
  const bufA = Buffer.from(computed);
  const bufB = Buffer.from((received || '').toUpperCase());
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// 產生 UTC+8 格式的 MerchantTradeDate：yyyy/MM/dd HH:mm:ss
function getMerchantTradeDate() {
  const now = new Date();
  const utc8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return [
    `${utc8.getUTCFullYear()}/${pad(utc8.getUTCMonth() + 1)}/${pad(utc8.getUTCDate())}`,
    `${pad(utc8.getUTCHours())}:${pad(utc8.getUTCMinutes())}:${pad(utc8.getUTCSeconds())}`,
  ].join(' ');
}

// 產生唯一 MerchantTradeNo：F + Unix秒(10碼) + 8碼 hex = 19碼，純英數
function generateMerchantTradeNo() {
  const ts = Math.floor(Date.now() / 1000).toString();
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `F${ts}${rand}`;
}

// 組合 ItemName，每項 "商品名 xN"，用 # 分隔，安全截斷 200 字元
function buildItemName(orderItems) {
  const parts = orderItems.map((i) => `${i.product_name} x${i.quantity}`);
  let name = parts.join('#');
  if (name.length > 200) {
    name = name.substring(0, 197) + '...';
  }
  return name;
}

// 建立 ECPay AIO 付款參數（含 CheckMacValue）
// 回傳 { action, params }
function buildPaymentParams({ order, orderItems, serverBaseUrl, clientBaseUrl }) {
  const merchantTradeNo = generateMerchantTradeNo();
  // clientBaseUrl 為瀏覽器可存取的 base（預設等於 serverBaseUrl）
  const browserBase = clientBaseUrl || serverBaseUrl;

  const params = {
    MerchantID: MERCHANT_ID,
    MerchantTradeNo: merchantTradeNo,
    MerchantTradeDate: getMerchantTradeDate(),
    PaymentType: 'aio',
    TotalAmount: String(order.total_amount),
    TradeDesc: '花卉電商訂單',
    ItemName: buildItemName(orderItems),
    // ReturnURL：ECPay server-to-server callback，需要外部可存取的網址
    ReturnURL: `${serverBaseUrl}/api/ecpay/notify`,
    ChoosePayment: 'ALL',
    EncryptType: '1',
    // OrderResultURL：付款後瀏覽器導回，用瀏覽器可存取的 host（避免 Codespaces 警告頁）
    OrderResultURL: `${browserBase}/api/ecpay/order-result`,
    // ClientBackURL：用戶按返回按鈕時導回
    ClientBackURL: `${browserBase}/orders/${order.id}`,
  };

  params.CheckMacValue = generateCheckMacValue(params);

  return { action: CHECKOUT_URL, params, merchantTradeNo };
}

// 查詢 ECPay 交易狀態，回傳解析後的物件（含 TradeStatus）
async function queryTradeInfo(merchantTradeNo) {
  const queryParams = {
    MerchantID: MERCHANT_ID,
    MerchantTradeNo: merchantTradeNo,
    TimeStamp: Math.floor(Date.now() / 1000).toString(),
  };
  queryParams.CheckMacValue = generateCheckMacValue(queryParams);

  const body = new URLSearchParams(queryParams).toString();

  const response = await fetch(QUERY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const text = await response.text();

  // 回應為 URL-encoded 字串
  const result = Object.fromEntries(new URLSearchParams(text));

  if (!verifyCheckMacValue(result)) {
    throw new Error('ECPay QueryTradeInfo CheckMacValue 驗證失敗');
  }

  return result;
}

module.exports = {
  generateCheckMacValue,
  verifyCheckMacValue,
  buildPaymentParams,
  queryTradeInfo,
};
