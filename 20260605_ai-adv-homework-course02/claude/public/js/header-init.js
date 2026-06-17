document.addEventListener('DOMContentLoaded', function () {
  const authNav = document.getElementById('auth-nav');
  const cartBadge = document.getElementById('cart-badge');
  const ordersLink = document.getElementById('orders-link');

  if (authNav) {
    if (Auth.isLoggedIn()) {
      const user = Auth.getUser();
      let html = '';
      if (Auth.isAdmin()) {
        html += '<a href="/admin/products" style="color:#C9A96E;font-size:13px;letter-spacing:1px;text-decoration:none;">後台管理</a>';
      }
      html += '<span style="color:#7A9088;font-size:13px;letter-spacing:1px;">' + (user?.name || '') + '</span>';
      html += '<button onclick="Auth.logout()" style="color:#7A9088;font-size:13px;letter-spacing:1px;background:transparent;border:none;cursor:pointer;" onmouseover="this.style.color=\'#C9A96E\'" onmouseout="this.style.color=\'#7A9088\'">登出</button>';
      authNav.innerHTML = html;
    }
  }

  if (ordersLink) {
    ordersLink.style.display = Auth.isLoggedIn() ? '' : 'none';
  }

  if (cartBadge) {
    apiFetch('/api/cart').then(function (res) {
      const count = (res && res.data && res.data.items) ? res.data.items.length : 0;
      if (count > 0) {
        cartBadge.textContent = count;
        cartBadge.style.display = '';
      } else {
        cartBadge.style.display = 'none';
      }
    }).catch(function () {
      cartBadge.style.display = 'none';
    });
  }
});
