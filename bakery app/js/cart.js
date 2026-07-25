const STORAGE_KEY = "dulce-registro-cart";

// Mapa productId -> cantidad seleccionada
let cart = loadCart();

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const obj = JSON.parse(raw);
    return new Map(Object.entries(obj));
  } catch {
    return new Map();
  }
}

function persist() {
  const obj = Object.fromEntries(cart.entries());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

export function getQty(productId) {
  return cart.get(productId) || 0;
}

export function setQty(productId, qty, maxStock = Infinity) {
  const clamped = Math.max(0, Math.min(qty, maxStock));
  if (clamped === 0) {
    cart.delete(productId);
  } else {
    cart.set(productId, clamped);
  }
  persist();
  return clamped;
}

export function increment(productId, maxStock = Infinity) {
  return setQty(productId, getQty(productId) + 1, maxStock);
}

export function decrement(productId) {
  return setQty(productId, getQty(productId) - 1);
}

export function clearCart() {
  cart = new Map();
  persist();
}

export function getTotals(productsById) {
  let totalQty = 0;
  let totalPrice = 0;
  for (const [id, qty] of cart.entries()) {
    totalQty += qty;
    const product = productsById.get(id);
    if (product) totalPrice += qty * Number(product.price || 0);
  }
  return { totalQty, totalPrice };
}
