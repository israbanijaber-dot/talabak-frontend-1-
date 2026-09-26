const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const TOKEN_KEY = "talabak_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "حدث خطأ غير متوقع، حاول مرة أخرى");
  return data;
}

export const api = {
  getToken,
  setToken,

  // مصادقة
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password }, auth: false }),
  register: (payload) => request("/auth/register", { method: "POST", body: payload, auth: false }),
  me: () => request("/auth/me"),

  // تصفح عام
  stores: () => request("/stores", { auth: false }),
  store: (id) => request(`/stores/${id}`, { auth: false }),
  products: (storeId) => request(`/stores/${storeId}/products`, { auth: false }),

  // عميل
  myFavorites: () => request("/stores/me/favorites"),
  toggleFavorite: (storeId) => request(`/stores/${storeId}/favorite`, { method: "POST" }),
  createOrder: (payload) => request("/orders", { method: "POST", body: payload }),
  myOrders: () => request("/orders/mine"),
  order: (id) => request(`/orders/${id}`),
  reviewOrder: (id, rating, comment) => request(`/orders/${id}/review`, { method: "POST", body: { rating, comment } }),

  // صاحب المحل
  storeOrders: () => request("/store/orders"),
  updateStoreOrderStatus: (id, status) => request(`/store/orders/${id}/status`, { method: "PATCH", body: { status } }),
  storeProducts: () => request("/store/products"),
  createProduct: (payload) => request("/store/products", { method: "POST", body: payload }),
  updateProduct: (id, payload) => request(`/store/products/${id}`, { method: "PUT", body: payload }),
  deleteProduct: (id) => request(`/store/products/${id}`, { method: "DELETE" }),
  updateStoreSettings: (payload) => request("/store/settings", { method: "PATCH", body: payload }),

  // مندوب
  availableOrders: () => request("/driver/available"),
  myDeliveries: () => request("/driver/orders"),
  acceptOrder: (id) => request(`/driver/orders/${id}/accept`, { method: "POST" }),
  updateDeliveryStatus: (id, status) => request(`/driver/orders/${id}/status`, { method: "PATCH", body: { status } }),
  collectCash: (id) => request(`/driver/orders/${id}/collect-cash`, { method: "POST" }),

  // إدارة
  adminStats: () => request("/admin/stats"),
  adminOrders: (status) => request(`/admin/orders${status && status !== "all" ? `?status=${status}` : ""}`),
  adminStores: () => request("/admin/stores"),
  adminCreateStore: (payload) => request("/admin/stores", { method: "POST", body: payload }),
  adminUpdateStore: (id, payload) => request(`/admin/stores/${id}`, { method: "PATCH", body: payload }),
  adminSetStoreOpen: (id, isOpen) => request(`/admin/stores/${id}`, { method: "PATCH", body: { isOpen } }),
  adminDeleteStore: (id) => request(`/admin/stores/${id}`, { method: "DELETE" }),
  adminDrivers: () => request("/admin/drivers"),
  adminCreateDriver: (payload) => request("/admin/drivers", { method: "POST", body: payload }),
  adminSetDriverActive: (id, isActive) => request(`/admin/drivers/${id}`, { method: "PATCH", body: { isActive } }),
  adminUsers: () => request("/admin/users"),
  adminSetUserActive: (id, isActive) => request(`/admin/users/${id}`, { method: "PATCH", body: { isActive } }),
};
