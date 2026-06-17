const { createApp, ref, computed, onMounted } = Vue;

createApp({
  setup() {
    if (!Auth.requireAuth()) return {};

    const orders = ref([]);
    const loading = ref(true);
    const activeStatus = ref('all');

    const tabs = [
      { value: 'all', label: '全部' },
      { value: 'pending', label: '待付款' },
      { value: 'paid', label: '已付款' },
      { value: 'failed', label: '付款失敗' },
    ];

    const statusMap = {
      pending: { label: '待付款' },
      paid: { label: '已付款' },
      failed: { label: '付款失敗' },
    };

    const filteredOrders = computed(function () {
      if (activeStatus.value === 'all') return orders.value;
      return orders.value.filter(function (o) {
        return o.status === activeStatus.value;
      });
    });

    onMounted(async function () {
      try {
        const res = await apiFetch('/api/orders');
        orders.value = res.data.orders;
      } catch (e) {
        orders.value = [];
      } finally {
        loading.value = false;
      }
    });

    return { orders, loading, statusMap, tabs, activeStatus, filteredOrders };
  }
}).mount('#app');
