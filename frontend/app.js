const appConfig = window.__APP_CONFIG__ || {};
const gatewayBaseUrl =
  window.location.protocol === "https:"
    ? appConfig.apiGatewayHttpsUrl || "https://localhost:4443"
    : appConfig.apiGatewayHttpUrl || "http://localhost:4000";
const API_BASE = `${gatewayBaseUrl}/api`;

const state = {
  token: "",
  user: null,
  products: [],
  cart: [],
  orders: [],
};

const authForm = document.getElementById("auth-form");
const authStatus = document.getElementById("auth-status");
const productsContainer = document.getElementById("products");
const cartContainer = document.getElementById("cart");
const totalElement = document.getElementById("total");
const orderButton = document.getElementById("order-button");
const orderStatus = document.getElementById("order-status");
const ordersContainer = document.getElementById("orders");

function setStatus(element, message, success = false) {
  element.textContent = message;
  element.classList.toggle("success", success);
}

function currency(value) {
  return `${value} грн`;
}

function getCartTotal() {
  return state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function renderProducts() {
  productsContainer.innerHTML = "";

  state.products.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <strong>${product.name}</strong>
      <p>${product.description}</p>
      <footer>
        <span>${currency(product.price)}</span>
        <button data-id="${product.id}">Додати в кошик</button>
      </footer>
    `;
    card.querySelector("button").addEventListener("click", () => addToCart(product.id));
    productsContainer.appendChild(card);
  });
}

function renderCart() {
  cartContainer.innerHTML = "";

  if (state.cart.length === 0) {
    cartContainer.innerHTML = "<p class='status'>Кошик порожній.</p>";
  }

  state.cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <strong>${item.name}</strong>
      <span>${item.quantity} x ${currency(item.price)}</span>
    `;
    cartContainer.appendChild(row);
  });

  totalElement.textContent = `Загальна сума: ${currency(getCartTotal())}`;
}

function renderOrders() {
  ordersContainer.innerHTML = "";

  if (state.orders.length === 0) {
    ordersContainer.innerHTML = "<p class='status'>Ще немає створених замовлень.</p>";
    return;
  }

  state.orders
    .slice()
    .reverse()
    .forEach((order) => {
      const card = document.createElement("article");
      card.className = "order-card";
      const items = order.items.map((item) => `${item.name} (${item.quantity})`).join(", ");
      card.innerHTML = `
        <strong>${order.id}</strong>
        <p>Користувач: ${order.userName}</p>
        <p>Товари: ${items}</p>
        <p>Сума: ${currency(order.total)}</p>
        <p>Статус: ${order.status}</p>
      `;
      ordersContainer.appendChild(card);
    });
}

function addToCart(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) {
    return;
  }

  const existing = state.cart.find((item) => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ ...product, quantity: 1 });
  }

  renderCart();
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload;
}

async function loadProducts() {
  const payload = await request("/products");
  state.products = payload.products;
  renderProducts();
}

async function loadOrders() {
  if (!state.token) {
    state.orders = [];
    renderOrders();
    return;
  }

  const payload = await request("/orders");
  state.orders = payload.orders;
  renderOrders();
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(authForm);
  const name = formData.get("name").toString().trim();
  const email = formData.get("email").toString().trim();

  try {
    const payload = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ name, email }),
    });

    state.token = payload.token;
    state.user = payload.user;
    setStatus(authStatus, `Авторизовано: ${payload.user.name}`, true);
    setStatus(orderStatus, "Можна оформлювати замовлення.", true);
    await loadOrders();
  } catch (error) {
    setStatus(authStatus, error.message);
  }
});

orderButton.addEventListener("click", async () => {
  if (!state.token || !state.user) {
    setStatus(orderStatus, "Спочатку увійдіть у систему.");
    return;
  }

  if (state.cart.length === 0) {
    setStatus(orderStatus, "Додайте товари до кошика.");
    return;
  }

  try {
    const payload = await request("/orders", {
      method: "POST",
      body: JSON.stringify({
        items: state.cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      }),
    });

    state.cart = [];
    renderCart();
    setStatus(
      orderStatus,
      `Замовлення ${payload.order.id} створено. Повідомлення надіслано.`,
      true
    );
    await loadOrders();
  } catch (error) {
    setStatus(orderStatus, error.message);
  }
});

renderCart();
renderOrders();
loadProducts().catch((error) => {
  setStatus(authStatus, `Не вдалося завантажити товари: ${error.message}`);
});
