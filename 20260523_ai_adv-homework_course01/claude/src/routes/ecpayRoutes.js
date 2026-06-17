const express = require('express');
const db = require('../database');
const { verifyCheckMacValue } = require('../services/ecpayService');

const router = express.Router();

/**
 * @openapi
 * /api/ecpay/order-result:
 *   post:
 *     summary: 綠界 AIO OrderResultURL — 付款完成後瀏覽器導回處理
 *     description: 接收綠界瀏覽器端 Form POST，查詢訂單後導向訂單詳情頁觸發驗證。
 *     tags: [ECPay]
 *     responses:
 *       302:
 *         description: 導向訂單詳情頁（帶 ?verify=ecpay）
 */
router.post('/order-result', (req, res) => {
  const { MerchantTradeNo } = req.body;
  if (!MerchantTradeNo) {
    return res.redirect('/orders');
  }
  const order = db.prepare(
    'SELECT id FROM orders WHERE ecpay_merchant_trade_no = ?'
  ).get(MerchantTradeNo);
  if (order) {
    res.redirect(`/orders/${order.id}?verify=ecpay`);
  } else {
    res.redirect('/orders');
  }
});

/**
 * @openapi
 * /api/ecpay/notify:
 *   post:
 *     summary: 綠界 AIO ReturnURL 付款通知（Server-to-Server）
 *     description: 接收綠界伺服器主動發送的付款結果通知。本地開發環境下此端點無法被外部呼叫，僅作為正式環境使用。
 *     tags: [ECPay]
 *     responses:
 *       200:
 *         description: 回傳純文字 1|OK
 */
router.post('/notify', (req, res) => {
  const params = req.body;

  if (!verifyCheckMacValue(params)) {
    console.error('[ECPay notify] CheckMacValue 驗證失敗');
    // 仍需回應 1|OK + HTTP 200，否則綠界會重試（每日最多 4 次）
    return res.type('text').send('1|OK');
  }

  // AIO RtnCode 為字串型別
  if (params.RtnCode === '1') {
    const tradeNo = params.MerchantTradeNo;
    db.prepare(
      "UPDATE orders SET status = 'paid' WHERE ecpay_merchant_trade_no = ?"
    ).run(tradeNo);
    console.log(`[ECPay notify] 付款成功 MerchantTradeNo=${tradeNo}`);
  } else {
    console.log(`[ECPay notify] 付款未成功 RtnCode=${params.RtnCode}`);
  }

  res.type('text').send('1|OK');
});

module.exports = router;
