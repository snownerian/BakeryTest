import { supabase } from "./supabaseClient.js";
import { IMAGES_BUCKET } from "./config.js";
import { login, register, logout, getSession, onAuthChange } from "./auth.js";
import * as cart from "./cart.js";

/* ---------------------------------------------------------
   Referencias al DOM
--------------------------------------------------------- */
const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");

const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");

const toggleRegisterBtn = document.getElementById("toggleRegister");
const registerForm = document.getElementById("registerForm");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");
const registerError = document.getElementById("registerError");
const registerSuccess = document.getElementById("registerSuccess");

const logoutBtn = document.getElementById("logoutBtn");
const searchInput = document.getElementById("searchInput");
const categoriesBar = document.getElementById("categoriesBar");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const addCategoryForm = document.getElementById("addCategoryForm");
const newCategoryName = document.getElementById("newCategoryName");
const cancelAddCategory = document.getElementById("cancelAddCategory");

const productGrid = document.getElementById("productGrid");
const emptyState = document.getElementById("emptyState");
const resultsCount = document.getElementById("resultsCount");

const cartTotalQty = document.getElementById("cartTotalQty");
const cartTotalPrice = document.getElementById("cartTotalPrice");
const clearCartBtn = document.getElementById("clearCartBtn");

const openAddProductBtn = document.getElementById("openAddProduct");
const productModal = document.getElementById("productModal");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalClose = document.getElementById("modalClose");
const modalTitle = document.getElementById("modalTitle");
const productForm = document.getElementById("productForm");
const productIdInput = document.getElementById("productId");
const productImageInput = document.getElementById("productImage");
const imagePreview = document.getElementById("imagePreview");
const productNameInput = document.getElementById("productName");
const productDescriptionInput = document.getElementById("productDescription");
const productPriceInput = document.getElementById("productPrice");
const productQuantityInput = document.getElementById("productQuantity");
const productCategoryInput = document.getElementById("productCategory");
const productFormError = document.getElementById("productFormError");
const deleteProductBtn = document.getElementById("deleteProductBtn");

const toast = document.getElementById("toast");

/* ---------------------------------------------------------
   Estado
--------------------------------------------------------- */
let categories = [];
let products = [];
let productsById = new Map();
let activeCategoryId = null;
let searchTerm = "";
let focusedIndex = -1;
let pendingImageFile = null;

/* ---------------------------------------------------------
   Utilidades
--------------------------------------------------------- */
function showToast(msg) {
  toast.textContent = msg;
  toast.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toast.hidden = true; }, 2200);
}

function money(n) {
  return "S/ " + Number(n || 0).toFixed(2);
}

/* ---------------------------------------------------------
   Autenticación
--------------------------------------------------------- */
async function init() {
  const session = await getSession();
  toggleViews(!!session);
  if (session) await bootApp();

  onAuthChange((session) => {
    toggleViews(!!session);
    if (session) bootApp();
  });
}

function toggleViews(isLoggedIn) {
  loginView.hidden = isLoggedIn;
  appView.hidden = !isLoggedIn;
}

async function bootApp() {
  await Promise.all([loadCategories(), loadProducts()]);
  renderCategories();
  renderProducts();
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  try {
    await login(loginEmail.value.trim(), loginPassword.value);
  } catch (err) {
    loginError.textContent = traducirErrorAuth(err.message);
    loginError.hidden = false;
  }
});

toggleRegisterBtn.addEventListener("click", () => {
  registerForm.hidden = !registerForm.hidden;
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  registerError.hidden = true;
  registerSuccess.hidden = true;
  try {
    const data = await register(registerEmail.value.trim(), registerPassword.value);
    if (!data.session) {
      registerSuccess.textContent = "Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.";
      registerSuccess.hidden = false;
    }
  } catch (err) {
    registerError.textContent = traducirErrorAuth(err.message);
    registerError.hidden = false;
  }
});

logoutBtn.addEventListener("click", async () => {
  await logout();
  cart.clearCart();
});

function traducirErrorAuth(msg) {
  if (!msg) return "Ocurrió un error. Intenta de nuevo.";
  if (msg.includes("Invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (msg.includes("already registered")) return "Ese correo ya tiene una cuenta.";
  if (msg.includes("Password should be")) return "La contraseña debe tener al menos 6 caracteres.";
  return msg;
}

/* ---------------------------------------------------------
   Cargar datos
--------------------------------------------------------- */
async function loadCategories() {
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) { showToast("No se pudieron cargar las categorías"); return; }
  categories = data || [];
}

async function loadProducts() {
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  if (error) { showToast("No se pudieron cargar los productos"); return; }
  products = data || [];
  productsById = new Map(products.map((p) => [p.id, p]));
}

/* ---------------------------------------------------------
   Categorías: render y filtro
--------------------------------------------------------- */
function renderCategories() {
  categoriesBar.querySelectorAll(".chip:not(.chip--add)").forEach((el) => el.remove());

  const allChip = document.createElement("button");
  allChip.className = "chip" + (activeCategoryId === null ? " is-active" : "");
  allChip.textContent = "Todas";
  allChip.addEventListener("click", () => { activeCategoryId = null; renderCategories(); renderProducts(); });
  categoriesBar.insertBefore(allChip, addCategoryBtn);

  categories.forEach((cat) => {
    const chip = document.createElement("button");
    chip.className = "chip" + (activeCategoryId === cat.id ? " is-active" : "");
    chip.textContent = cat.name;
    chip.addEventListener("click", () => { activeCategoryId = cat.id; renderCategories(); renderProducts(); });
    categoriesBar.insertBefore(chip, addCategoryBtn);
  });

  populateCategorySelect();
}

function populateCategorySelect() {
  productCategoryInput.innerHTML = "";
  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.name;
    productCategoryInput.appendChild(opt);
  });
}

addCategoryBtn.addEventListener("click", () => {
  addCategoryForm.hidden = !addCategoryForm.hidden;
  if (!addCategoryForm.hidden) newCategoryName.focus();
});
cancelAddCategory.addEventListener("click", () => { addCategoryForm.hidden = true; newCategoryName.value = ""; });

addCategoryForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = newCategoryName.value.trim();
  if (!name) return;
  const { error } = await supabase.from("categories").insert({ name });
  if (error) { showToast("No se pudo agregar la categoría"); return; }
  newCategoryName.value = "";
  addCategoryForm.hidden = true;
  await loadCategories();
  renderCategories();
  showToast("Categoría agregada 🎉");
});

/* ---------------------------------------------------------
   Búsqueda
--------------------------------------------------------- */
searchInput.addEventListener("input", () => {
  searchTerm = searchInput.value.trim().toLowerCase();
  focusedIndex = -1;
  renderProducts();
});

function getFilteredProducts() {
  return products.filter((p) => {
    const matchesCategory = activeCategoryId === null || p.category_id === activeCategoryId;
    const haystack = (p.name + " " + (p.description || "")).toLowerCase();
    const matchesSearch = !searchTerm || haystack.includes(searchTerm);
    return matchesCategory && matchesSearch;
  });
}

/* ---------------------------------------------------------
   Render de productos
--------------------------------------------------------- */
function categoryName(id) {
  const c = categories.find((c) => c.id === id);
  return c ? c.name : "Sin categoría";
}

function renderProducts() {
  const filtered = getFilteredProducts();
  productGrid.innerHTML = "";
  resultsCount.textContent = filtered.length + (filtered.length === 1 ? " producto" : " productos");
  emptyState.hidden = filtered.length !== 0;

  filtered.forEach((p, index) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.dataset.id = p.id;
    card.dataset.index = String(index);
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `${p.name}, ${money(p.price)}`);

    const qty = cart.getQty(p.id);
    if (qty > 0) card.classList.add("is-selected");

    const photo = document.createElement("div");
    photo.className = "product-card__photo";
    if (p.image_url) {
      photo.style.backgroundImage = `url("${p.image_url}")`;
    } else {
      photo.textContent = "🍰";
    }
    const stamp = document.createElement("span");
    stamp.className = "product-card__stamp";
    stamp.textContent = categoryName(p.category_id);
    photo.appendChild(stamp);

    const editBtn = document.createElement("button");
    editBtn.className = "product-card__edit";
    editBtn.title = "Editar producto";
    editBtn.textContent = "✎";
    editBtn.addEventListener("click", (e) => { e.stopPropagation(); openEditModal(p); });
    photo.appendChild(editBtn);

    const body = document.createElement("div");
    body.className = "product-card__body";

    const name = document.createElement("h3");
    name.className = "product-card__name";
    name.textContent = p.name;

    const desc = document.createElement("p");
    desc.className = "product-card__desc";
    desc.textContent = p.description || "";

    const meta = document.createElement("div");
    meta.className = "product-card__meta";
    const price = document.createElement("span");
    price.className = "product-card__price";
    price.textContent = money(p.price);
    const stock = document.createElement("span");
    stock.className = "product-card__stock" + (Number(p.quantity) <= 0 ? " is-empty" : "");
    stock.textContent = Number(p.quantity) <= 0 ? "Agotado" : `Disponible: ${p.quantity}`;
    meta.append(price, stock);

    const cartRow = document.createElement("div");
    cartRow.className = "product-card__cart";
    const minusBtn = document.createElement("button");
    minusBtn.className = "qty-btn";
    minusBtn.textContent = "–";
    minusBtn.type = "button";
    minusBtn.addEventListener("click", (e) => { e.stopPropagation(); changeQty(p, -1); });

    const qtyVal = document.createElement("span");
    qtyVal.className = "qty-value";
    qtyVal.textContent = String(qty);

    const plusBtn = document.createElement("button");
    plusBtn.className = "qty-btn";
    plusBtn.textContent = "+";
    plusBtn.type = "button";
    plusBtn.addEventListener("click", (e) => { e.stopPropagation(); changeQty(p, 1); });

    cartRow.append(minusBtn, qtyVal, plusBtn);
    body.append(name, desc, meta, cartRow);
    card.append(photo, body);

    card.addEventListener("click", () => {
      focusedIndex = index;
      setFocusedCard();
      changeQty(p, 1);
    });
    card.addEventListener("focus", () => { focusedIndex = index; setFocusedCard(); });

    productGrid.appendChild(card);
  });

  if (focusedIndex >= filtered.length) focusedIndex = filtered.length - 1;
  setFocusedCard();
  refreshCartUI();
}

function setFocusedCard() {
  productGrid.querySelectorAll(".product-card").forEach((el) => el.classList.remove("is-focused"));
  if (focusedIndex < 0) return;
  const el = productGrid.querySelector(`.product-card[data-index="${focusedIndex}"]`);
  if (el) el.classList.add("is-focused");
}

/* ---------------------------------------------------------
   Carrito
--------------------------------------------------------- */
function changeQty(product, delta) {
  const current = cart.getQty(product.id);
  const next = delta > 0 ? cart.increment(product.id, Number(product.quantity)) : cart.decrement(product.id);
  if (delta > 0 && next === current) {
    showToast("No hay más stock disponible");
  }
  patchCardQty(product.id);
  refreshCartUI();
}

function patchCardQty(productId) {
  const card = productGrid.querySelector(`.product-card[data-id="${productId}"]`);
  if (!card) return;
  const qty = cart.getQty(productId);
  card.querySelector(".qty-value").textContent = String(qty);
  card.classList.toggle("is-selected", qty > 0);
}

function refreshCartUI() {
  const { totalQty, totalPrice } = cart.getTotals(productsById);
  cartTotalQty.textContent = String(totalQty);
  cartTotalPrice.textContent = money(totalPrice);
}

clearCartBtn.addEventListener("click", () => {
  cart.clearCart();
  renderProducts();
  showToast("Selección vaciada");
});

/* ---------------------------------------------------------
   Navegación por teclado (flechas + enter)
--------------------------------------------------------- */
function getColumnsCount() {
  const cards = productGrid.querySelectorAll(".product-card");
  if (!cards.length) return 1;
  const firstTop = cards[0].offsetTop;
  let count = 0;
  for (const c of cards) {
    if (c.offsetTop === firstTop) count++;
    else break;
  }
  return count || 1;
}

function focusCardAtIndex(i) {
  focusedIndex = i;
  const el = productGrid.querySelector(`.product-card[data-index="${i}"]`);
  if (el) el.focus({ preventScroll: false });
  setFocusedCard();
}

document.addEventListener("keydown", (e) => {
  if (!productModal.hidden) return;
  if (appView.hidden) return;

  const filtered = getFilteredProducts();
  if (!filtered.length) return;

  const active = document.activeElement;

  if (active === searchInput) {
    if (e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex < 0) focusedIndex = 0;
      focusCardAtIndex(focusedIndex);
      if (e.key === "Enter") changeQty(filtered[focusedIndex], 1);
    }
    return;
  }

  const tag = active.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

  if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"].includes(e.key)) return;
  e.preventDefault();

  if (focusedIndex < 0) focusedIndex = 0;
  const cols = getColumnsCount();

  if (e.key === "ArrowRight") focusedIndex = Math.min(focusedIndex + 1, filtered.length - 1);
  else if (e.key === "ArrowLeft") focusedIndex = Math.max(focusedIndex - 1, 0);
  else if (e.key === "ArrowDown") focusedIndex = Math.min(focusedIndex + cols, filtered.length - 1);
  else if (e.key === "ArrowUp") focusedIndex = Math.max(focusedIndex - cols, 0);
  else if (e.key === "Enter") { changeQty(filtered[focusedIndex], 1); return; }

  focusCardAtIndex(focusedIndex);
});

/* ---------------------------------------------------------
   Modal: crear / editar producto
--------------------------------------------------------- */
function openAddModal() {
  productForm.reset();
  productIdInput.value = "";
  pendingImageFile = null;
  imagePreview.hidden = true;
  deleteProductBtn.hidden = true;
  productFormError.hidden = true;
  modalTitle.textContent = "Nuevo producto";
  populateCategorySelect();
  productModal.hidden = false;
  setTimeout(() => productNameInput.focus(), 50);
}

function openEditModal(product) {
  productForm.reset();
  populateCategorySelect();
  productIdInput.value = product.id;
  productNameInput.value = product.name;
  productDescriptionInput.value = product.description || "";
  productPriceInput.value = product.price;
  productQuantityInput.value = product.quantity;
  productCategoryInput.value = product.category_id || "";
  pendingImageFile = null;
  if (product.image_url) {
    imagePreview.src = product.image_url;
    imagePreview.hidden = false;
  } else {
    imagePreview.hidden = true;
  }
  deleteProductBtn.hidden = false;
  productFormError.hidden = true;
  modalTitle.textContent = "Editar producto";
  productModal.hidden = false;
}

function closeModal() {
  productModal.hidden = true;
}

openAddProductBtn.addEventListener("click", openAddModal);
modalClose.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", closeModal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !productModal.hidden) closeModal();
});

productImageInput.addEventListener("change", () => {
  const file = productImageInput.files[0];
  if (!file) return;
  pendingImageFile = file;
  const reader = new FileReader();
  reader.onload = () => {
    imagePreview.src = reader.result;
    imagePreview.hidden = false;
  };
  reader.readAsDataURL(file);
});

async function uploadImageIfNeeded(existingUrl) {
  if (!pendingImageFile) return existingUrl || null;
  const ext = pendingImageFile.name.split(".").pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(IMAGES_BUCKET).upload(path, pendingImageFile, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  productFormError.hidden = true;

  const id = productIdInput.value || null;
  const existing = id ? productsById.get(id) : null;

  try {
    const image_url = await uploadImageIfNeeded(existing ? existing.image_url : null);

    const payload = {
      name: productNameInput.value.trim(),
      description: productDescriptionInput.value.trim(),
      price: Number(productPriceInput.value),
      quantity: Number(productQuantityInput.value),
      category_id: productCategoryInput.value || null,
      image_url,
    };

    let error;
    if (id) {
      ({ error } = await supabase.from("products").update(payload).eq("id", id));
    } else {
      ({ error } = await supabase.from("products").insert(payload));
    }
    if (error) throw error;

    await loadProducts();
    renderProducts();
    closeModal();
    showToast(id ? "Producto actualizado ✏️" : "Producto agregado 🎉");
  } catch (err) {
    productFormError.textContent = err.message || "No se pudo guardar el producto";
    productFormError.hidden = false;
  }
});

deleteProductBtn.addEventListener("click", async () => {
  const id = productIdInput.value;
  if (!id) return;
  if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) return;
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) { showToast("No se pudo eliminar"); return; }
  cart.setQty(id, 0);
  await loadProducts();
  renderProducts();
  closeModal();
  showToast("Producto eliminado");
});

/* ---------------------------------------------------------
   Arranque
--------------------------------------------------------- */
init();
