const { createApp, ref, onMounted } = Vue;

createApp({
  setup() {
    if (!Auth.requireAuth()) return {};

    const el = document.getElementById('app');
    const orderId = el.dataset.orderId;
    const paymentResult = ref(el.dataset.paymentResult || null);

    const order = ref(null);
    const loading = ref(true);
    const paying = ref(false);
    const verifying = ref(false);

    const statusMap = {
      pending: { label: '待付款', cls: 'bg-apricot/20 text-apricot' },
      paid: { label: '已付款', cls: 'bg-sage/20 text-sage' },
      failed: { label: '付款失敗', cls: 'bg-red-100 text-red-600' },
    };

    const paymentMessages = {
      success: { text: '付款成功！感謝您的購買。', cls: 'bg-sage/10 text-sage border border-sage/20' },
      failed: { text: '付款失敗，請重試。', cls: 'bg-red-50 text-red-600 border border-red-100' },
      cancel: { text: '付款已取消。', cls: 'bg-apricot/10 text-apricot border border-apricot/20' },
    };

    // 點擊「前往綠界付款」：取得付款參數後動態建立 form 並 submit
    async function handleEcpayPayment() {
      if (!order.value || paying.value) return;
      paying.value = true;
      try {
        const res = await apiFetch('/api/orders/' + order.value.id + '/ecpay-checkout', {
          method: 'POST',
        });
        const { action, params } = res.data;

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = action;
        Object.entries(params).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
      } catch (e) {
        Notification.show('無法發起付款，請稍後再試', 'error');
        paying.value = false;
      }
    }

    // 從綠界 ClientBackURL 導回時（URL 含 ?verify=ecpay），主動查詢付款結果
    async function autoVerifyIfNeeded() {
      const params = new URLSearchParams(location.search);
      if (!params.has('verify')) return;

      verifying.value = true;
      // 清除 URL 中的 verify 參數，避免重新整理時再次觸發
      history.replaceState(null, '', location.pathname);

      try {
        const res = await apiFetch('/api/orders/' + orderId + '/verify-ecpay', {
          method: 'POST',
        });
        order.value = res.data.order;
        const status = res.data.order.status;
        if (status === 'paid') {
          paymentResult.value = 'success';
        } else if (status === 'failed') {
          paymentResult.value = 'failed';
        } else {
          Notification.show('付款尚未完成，請稍後再確認', 'warning');
        }
      } catch (e) {
        Notification.show('查詢付款結果失敗，請重新整理頁面', 'error');
      } finally {
        verifying.value = false;
      }
    }

    onMounted(async function () {
      try {
        const res = await apiFetch('/api/orders/' + orderId);
        order.value = res.data;
      } catch (e) {
        Notification.show('載入訂單失敗', 'error');
      } finally {
        loading.value = false;
        await autoVerifyIfNeeded();
      }
    });

    return {
      order,
      loading,
      paying,
      verifying,
      paymentResult,
      statusMap,
      paymentMessages,
      handleEcpayPayment,
    };
  }
}).mount('#app');
