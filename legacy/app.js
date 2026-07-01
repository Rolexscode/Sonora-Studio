/**
 * Sonora Studio UX - Interactive Prototyping Script
 */

// --- Products Database ---
let products = [];

// --- Application State ---
let cart = [];
let currentCategory = 'all';
let currentMaxPrice = 3500;
let currentSort = 'default';
let currentStockOnly = false;

// --- Initialization ---
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch('/api/products');
    if (res.ok) products = await res.json();
  } catch(e) { console.error("Error loading API", e); }
  renderProducts(products);
  updateScreenStats();
  window.addEventListener("resize", updateScreenStats);

  // Close drawers/modals on Escape key press
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeQuickView();
      toggleCart(false);
      toggleMobileMenu(false);
      document.getElementById("searchAutocomplete").classList.remove("active");
    }
  });

  // Render dynamic media block graphic in Hero
  renderHeroGraphic();
});

// --- Viewport Stats Screen Indicator ---
function updateScreenStats() {
  const width = window.innerWidth;
  let deviceName = "Desktop";
  if (width <= 480) {
    deviceName = "Mobile Extra";
  } else if (width <= 768) {
    deviceName = "Mobile / Portrait Tablet";
  } else if (width <= 1024) {
    deviceName = "Tablet / Small Laptop";
  } else if (width <= 1280) {
    deviceName = "HD Standard Laptop";
  } else {
    deviceName = "Wide Desktop";
  }
  document.getElementById("screenSize").textContent = `${width}px (${deviceName})`;
}

// --- Dynamic Hero Graphics Toggle ---
function renderHeroGraphic() {
  const heroMedia = document.getElementById("heroBgMedia");
  heroMedia.innerHTML = `
    
  `;
}

// --- Theme Switching Mechanism ---
function setTheme(theme) {
  const body = document.body;
  const btnLight = document.getElementById("btnLightTheme");
  const btnDark = document.getElementById("btnDarkTheme");

  if (theme === 'light') {
    body.classList.remove("theme-dark");
    body.classList.add("theme-light");
    btnLight.classList.add("active");
    btnDark.classList.remove("active");
    showToast("Tema de Wireframe: Claro");
  } else if (theme === 'dark') {
    body.classList.remove("theme-light");
    body.classList.add("theme-dark");
    btnDark.classList.add("active");
    btnLight.classList.remove("active");
    showToast("Tema de Wireframe: Oscuro");
  }
}

// --- Toggle Specs / Annotations overlay ---
function toggleSpecs() {
  const body = document.body;
  const btn = document.getElementById("btnToggleSpecs");
  const label = document.getElementById("specsBtnText");

  if (body.classList.contains("show-specs")) {
    body.classList.remove("show-specs");
    btn.classList.remove("active-toggle");
    label.textContent = "Anotaciones: OFF";
    showToast("Anotaciones y guías de rejilla ocultas");
  } else {
    body.classList.add("show-specs");
    btn.classList.add("active-toggle");
    label.textContent = "Anotaciones: ON";
    showToast("Anotaciones y guías de rejilla visibles");
  }
}

// --- Product Cards Rendering Engine ---
function renderProducts(productsList) {
  const grid = document.getElementById("productsGrid");
  const noProductsMsg = document.getElementById("noProductsMsg");
  grid.innerHTML = "";

  if (productsList.length === 0) {
    grid.style.display = "none";
    noProductsMsg.style.display = "block";
    return;
  }

  grid.style.display = "grid";
  noProductsMsg.style.display = "none";

  productsList.forEach(product => {
    // Generate star ratings display
    let starsHtml = "";
    const fullStars = Math.floor(product.rating);
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        starsHtml += `<span class="star-icon">★</span>`;
      } else {
        starsHtml += `<span class="star-icon" style="opacity: 0.3;">★</span>`;
      }
    }

    const card = document.createElement("article");
    card.className = "product-card";

    // Add dynamic UI features for both modes in card
    card.innerHTML = `
      <span class="spec-label" data-spec="[Card | 270px x 410px]"></span>
      
      <!-- Badges -->
      <div class="card-badges">
        ${product.isNew ? '<span class="badge badge-new">NUEVO</span>' : ''}
        ${!product.inStock ? '<span class="badge badge-stock">AGOTADO</span>' : ''}
      </div>

      <!-- Media Illustration (Combines wireframe cross blueprint with hi-fi vector details) -->
      <div class="card-media">
        <img src="${product.image}" alt="${product.name}" class="product-image" />
      </div>

      <!-- Content -->
      <div class="card-content">
        <span class="card-category">${product.category}</span>
        <h3 class="card-title">${product.name}</h3>
        
        <div class="card-rating">
          ${starsHtml}
          <span>${product.rating.toFixed(1)}</span>
        </div>

        <div class="card-footer">
          <span class="card-price">S/ ${product.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <div class="card-actions">
            <button class="icon-btn" onclick="openQuickView(${product.id})" title="Vista Rápida">
              
            </button>
            <button class="btn btn-primary btn-sm" onclick="addToCart(${product.id})" ${!product.inStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
              Agregar
            </button>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// --- Advanced Filtering and Sorting Logic ---
function filterCategory(category, element) {
  currentCategory = category;

  // Sync the category switches in both Desktop Header and Sidebar Radio filters
  const desktopLinks = document.querySelectorAll(".nav-desktop a");
  desktopLinks.forEach(link => link.classList.remove("active"));

  if (element) {
    element.classList.add("active");
  } else {
    // If selected from sidebar, manually sync header link
    desktopLinks.forEach(link => {
      const onclickAttr = link.getAttribute("onclick") || "";
      if (onclickAttr.includes(`'${category}'`)) {
        link.classList.add("active");
      }
    });
  }

  // Sync the sidebar radios
  const radios = document.getElementsByName("cat-radio");
  radios.forEach(radio => {
    if (radio.value === category) {
      radio.checked = true;
    }
  });

  applyAllFilters();
}

function updatePriceFilter(value) {
  currentMaxPrice = parseFloat(value);
  document.getElementById("priceRangeVal").textContent = `S/ ${currentMaxPrice.toLocaleString("en-US")}`;
  applyAllFilters();
}

function applyAllFilters() {
  // Read additional filters from DOM
  currentStockOnly = document.getElementById("stockFilter").checked;
  currentSort = document.getElementById("sortBy").value;

  // Filter items
  let filteredList = products.filter(product => {
    // Category filter
    const matchesCategory = (currentCategory === 'all' || product.category === currentCategory);
    // Price filter
    const matchesPrice = (product.price <= currentMaxPrice);
    // Stock filter
    const matchesStock = (!currentStockOnly || product.inStock);

    return matchesCategory && matchesPrice && matchesStock;
  });

  // Sort items
  if (currentSort === 'price-low') {
    filteredList.sort((a, b) => a.price - b.price);
  } else if (currentSort === 'price-high') {
    filteredList.sort((a, b) => b.price - a.price);
  } else if (currentSort === 'rating') {
    filteredList.sort((a, b) => b.rating - a.rating);
  }

  renderProducts(filteredList);
}

function resetFilters() {
  currentCategory = 'all';
  currentMaxPrice = 3500;
  currentSort = 'default';
  currentStockOnly = false;

  // Reset inputs
  document.getElementById("priceRange").value = 3500;
  document.getElementById("priceRangeVal").textContent = "S/ 3,500";
  document.getElementById("stockFilter").checked = false;
  document.getElementById("sortBy").value = "default";

  // Reset navigation states
  filterCategory('all', document.querySelector(".nav-desktop a"));
}

function sortProducts() {
  applyAllFilters();
}

// --- Autocomplete Dynamic Search Functionality ---
function handleSearch(query) {
  const autocomplete = document.getElementById("searchAutocomplete");
  if (!query.trim()) {
    autocomplete.innerHTML = "";
    autocomplete.classList.remove("active");
    return;
  }

  const results = products.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.category.toLowerCase().includes(query.toLowerCase())
  );

  if (results.length === 0) {
    autocomplete.innerHTML = `<div class="autocomplete-item" style="color:var(--text-muted);">No hay resultados coincidiendo</div>`;
    autocomplete.classList.add("active");
    return;
  }

  autocomplete.innerHTML = "";
  results.slice(0, 5).forEach(product => {
    const item = document.createElement("div");
    item.className = "autocomplete-item";
    item.onclick = () => {
      openQuickView(product.id);
      autocomplete.classList.remove("active");
      document.getElementById("searchInput").value = "";
    };
    item.innerHTML = `
      <div class="autocomplete-img-placeholder">
        □
      </div>
      <div class="autocomplete-info">
        <span class="autocomplete-title">${product.name}</span>
        <span class="autocomplete-price">S/ ${product.price.toLocaleString("en-US")}</span>
      </div>
    `;
    autocomplete.appendChild(item);
  });
  autocomplete.classList.add("active");
}

// --- Smooth Drawer & Navigation Toggle Helpers ---
function toggleMobileMenu(isOpen) {
  const drawer = document.getElementById("mobileDrawer");
  const overlay = document.getElementById("mobileDrawerOverlay");

  if (isOpen) {
    overlay.style.display = "block";
    // Brief delay to allow CSS grid layouts display toggle
    setTimeout(() => drawer.classList.add("active"), 10);
  } else {
    drawer.classList.remove("active");
    setTimeout(() => overlay.style.display = "none", 300);
  }
}

function toggleCart(isOpen) {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartOverlay");

  if (isOpen) {
    overlay.style.display = "block";
    setTimeout(() => drawer.classList.add("active"), 10);
  } else {
    drawer.classList.remove("active");
    setTimeout(() => overlay.style.display = "none", 300);
  }
}

// --- Shopping Cart Management Core ---
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product || !product.inStock) return;

  const existingItem = cart.find(item => item.product.id === productId);
  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({ product, qty: 1 });
  }

  updateCartUI();
  showToast(`¡Se agregó "${product.name}" al carrito!`);
}

function changeCartQty(productId, amount) {
  const item = cart.find(item => item.product.id === productId);
  if (!item) return;

  item.qty += amount;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.product.id !== productId);
  }

  updateCartUI();
}

function updateCartUI() {
  const badge = document.getElementById("cartBadge");
  const headerCount = document.getElementById("cartCountHeader");
  const emptyView = document.getElementById("cartEmptyView");
  const itemsView = document.getElementById("cartItemsView");
  const itemsList = document.getElementById("cartItemsList");
  const subtotalLabel = document.getElementById("cartSubtotal");
  const totalLabel = document.getElementById("cartTotal");

  // Sum total items count and prices
  let totalItemsCount = 0;
  let subtotal = 0;

  itemsList.innerHTML = "";

  cart.forEach(item => {
    totalItemsCount += item.qty;
    subtotal += item.product.price * item.qty;

    const itemRow = document.createElement("div");
    itemRow.className = "cart-item";
    itemRow.innerHTML = `
      <div class="cart-item-img">
        <img src="${item.product.image}" alt="${item.product.name}" class="cart-item-image" />
      </div>
      <div class="cart-item-info">
        <h4>${item.product.name}</h4>
        <p class="cart-item-price">S/ ${item.product.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeCartQty(${item.product.id}, -1)">-</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="changeCartQty(${item.product.id}, 1)">+</button>
        </div>
      </div>
    `;
    itemsList.appendChild(itemRow);
  });

  badge.textContent = totalItemsCount;
  headerCount.textContent = totalItemsCount;

  if (totalItemsCount === 0) {
    emptyView.style.display = "flex";
    itemsView.style.display = "none";
  } else {
    emptyView.style.display = "none";
    itemsView.style.display = "flex";
    subtotalLabel.textContent = `S/ ${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    totalLabel.textContent = `S/ ${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

// --- Product Details Modal Quick-View Control ---
function openQuickView(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const modalContainer = document.getElementById("modalProductDetails");
  const overlay = document.getElementById("quickViewOverlay");
  const modal = document.getElementById("quickViewModal");

  // Populate dynamic specifications layout inside the modal
  let specsListHtml = "";
  for (const [label, val] of Object.entries(product.specs)) {
    specsListHtml += `
      <li>
        <span class="modal-specs-label">${label}:</span>
        <span class="modal-specs-val">${val}</span>
      </li>
    `;
  }

  modalContainer.innerHTML = `
    <!-- Left Column: Illustration Media Box -->
    <div class="modal-media">
      <img src="${product.image}" alt="${product.name}" class="modal-product-image" />
    </div>

    <!-- Right Column: Specs and Info -->
    <div class="modal-info">
      <h2 class="modal-title">${product.name}</h2>
      <p class="modal-price">S/ ${product.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      <p class="modal-desc">${product.desc}</p>
      
      <ul class="modal-specs">
        ${specsListHtml}
      </ul>

      <div class="modal-actions">
        <button class="btn btn-primary" onclick="addToCart(${product.id}); closeQuickView();" ${!product.inStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
          Agregar al Carrito
        </button>
        <button class="btn btn-secondary" onclick="closeQuickView()">Volver</button>
      </div>
    </div>
  `;

  overlay.style.display = "block";
  setTimeout(() => modal.classList.add("active"), 10);
}

function closeQuickView() {
  const modal = document.getElementById("quickViewModal");
  const overlay = document.getElementById("quickViewOverlay");

  modal.classList.remove("active");
  setTimeout(() => overlay.style.display = "none", 300);
}

// --- Checkout Mock Handler ---
function checkout() {
  toggleCart(false);
  showToast("[Pago] ¡Simulando proceso de pasarela de pago! Prototipo completado.");
}

// --- Toast Alert Notification System ---
function showToast(message) {
  const container = document.getElementById("toastContainer");

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <span class="toast-icon">■</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  // Animate show
  setTimeout(() => toast.classList.add("show"), 10);

  // Auto close and remove element
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Helper to handle smooth scroll to catalog from Hero CTA
function scrollToCatalog() {
  document.getElementById("catalog").scrollIntoView({ behavior: 'smooth' });
}

