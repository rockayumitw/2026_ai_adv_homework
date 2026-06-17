const { app, request, registerUser } = require('./setup');
const ecpayService = require('../src/services/ecpayService');

describe('ECPay 金流 API', () => {
  let token;
  let productId;

  // 建立測試使用者，取得商品 ID
  beforeAll(async () => {
    const { token: t } = await registerUser();
    token = t;

    const prodRes = await request(app).get('/api/products');
    productId = prodRes.body.data.products[0].id;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 建立一個 pending 訂單並設定 ecpay_merchant_trade_no，回傳 { orderId, merchantTradeNo }
  async function createPendingOrderWithTradeNo() {
    await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity: 1 });

    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recipientName: '綠界測試',
        recipientEmail: 'ecpay@test.com',
        recipientAddress: '台北市測試路 1 號',
      });
    const orderId = orderRes.body.data.id;

    const checkoutRes = await request(app)
      .post(`/api/orders/${orderId}/ecpay-checkout`)
      .set('Authorization', `Bearer ${token}`);
    const merchantTradeNo = checkoutRes.body.data.params.MerchantTradeNo;

    return { orderId, merchantTradeNo };
  }

  // ──────────────────────────────────────────────
  describe('POST /api/orders/:id/ecpay-checkout', () => {
    let checkoutOrderId;

    beforeAll(async () => {
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId, quantity: 1 });

      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          recipientName: '綠界測試',
          recipientEmail: 'ecpay@test.com',
          recipientAddress: '台北市測試路 1 號',
        });
      checkoutOrderId = orderRes.body.data.id;
    });

    it('應回傳 ECPay 付款參數與正確的 action URL', async () => {
      const res = await request(app)
        .post(`/api/orders/${checkoutOrderId}/ecpay-checkout`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.error).toBeNull();
      expect(res.body.data.action).toContain('payment-stage.ecpay.com.tw');
      expect(res.body.data.action).toContain('AioCheckOut');
    });

    it('CheckMacValue 應為 64 碼大寫 hex', async () => {
      const res = await request(app)
        .post(`/api/orders/${checkoutOrderId}/ecpay-checkout`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.data.params.CheckMacValue).toMatch(/^[0-9A-F]{64}$/);
    });

    it('必填參數應完整', async () => {
      const res = await request(app)
        .post(`/api/orders/${checkoutOrderId}/ecpay-checkout`)
        .set('Authorization', `Bearer ${token}`);

      const { params } = res.body.data;
      expect(params.MerchantID).toBe('3002607');
      expect(params.PaymentType).toBe('aio');
      expect(params.ChoosePayment).toBe('Credit');
      expect(params.EncryptType).toBe('1');
    });

    it('OrderResultURL 應指向 /api/ecpay/order-result', async () => {
      const res = await request(app)
        .post(`/api/orders/${checkoutOrderId}/ecpay-checkout`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.data.params.OrderResultURL).toContain('/api/ecpay/order-result');
    });

    it('訂單不存在應回 404', async () => {
      const res = await request(app)
        .post('/api/orders/non-existent-id/ecpay-checkout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('NOT_FOUND');
    });

    it('未登入應回 401', async () => {
      const res = await request(app)
        .post(`/api/orders/${checkoutOrderId}/ecpay-checkout`);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('UNAUTHORIZED');
    });
  });

  // ──────────────────────────────────────────────
  describe('POST /api/orders/:id/verify-ecpay', () => {
    it('TradeStatus=1 應將訂單更新為 paid', async () => {
      const { orderId } = await createPendingOrderWithTradeNo();

      vi.spyOn(ecpayService, 'queryTradeInfo').mockResolvedValue({ TradeStatus: '1' });

      const res = await request(app)
        .post(`/api/orders/${orderId}/verify-ecpay`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.error).toBeNull();
      expect(res.body.data.order.status).toBe('paid');
      expect(res.body.data.tradeStatus).toBe('1');
    });

    it('TradeStatus=0 應維持訂單 pending', async () => {
      const { orderId } = await createPendingOrderWithTradeNo();

      vi.spyOn(ecpayService, 'queryTradeInfo').mockResolvedValue({ TradeStatus: '0' });

      const res = await request(app)
        .post(`/api/orders/${orderId}/verify-ecpay`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.order.status).toBe('pending');
      expect(res.body.message).toBe('尚未付款');
    });

    it('其他 TradeStatus（如 10200047）應將訂單更新為 failed', async () => {
      const { orderId } = await createPendingOrderWithTradeNo();

      vi.spyOn(ecpayService, 'queryTradeInfo').mockResolvedValue({ TradeStatus: '10200047' });

      const res = await request(app)
        .post(`/api/orders/${orderId}/verify-ecpay`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.order.status).toBe('failed');
    });

    it('尚未發起付款（無 ecpay_merchant_trade_no）應回 400', async () => {
      // 建立訂單但不呼叫 ecpay-checkout
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId, quantity: 1 });

      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          recipientName: '綠界測試',
          recipientEmail: 'ecpay@test.com',
          recipientAddress: '台北市測試路 1 號',
        });

      const res = await request(app)
        .post(`/api/orders/${orderRes.body.data.id}/verify-ecpay`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('訂單不存在應回 404', async () => {
      const res = await request(app)
        .post('/api/orders/non-existent-id/verify-ecpay')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('NOT_FOUND');
    });
  });

  // ──────────────────────────────────────────────
  describe('POST /api/ecpay/order-result', () => {
    it('有效 MerchantTradeNo 應 302 導向 /orders/:id?verify=ecpay', async () => {
      const { orderId, merchantTradeNo } = await createPendingOrderWithTradeNo();

      const res = await request(app)
        .post('/api/ecpay/order-result')
        .type('form')
        .send({ MerchantTradeNo: merchantTradeNo, RtnCode: '1' });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(`/orders/${orderId}?verify=ecpay`);
    });

    it('無效 MerchantTradeNo 應 302 導向 /orders', async () => {
      const res = await request(app)
        .post('/api/ecpay/order-result')
        .type('form')
        .send({ MerchantTradeNo: 'NONEXISTENT12345', RtnCode: '1' });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/orders');
    });
  });
});
