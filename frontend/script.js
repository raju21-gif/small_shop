const API_URL = window.location.origin;
let stockChart = null;

// Auth Check
const token = localStorage.getItem('token');
if (!token && window.location.pathname.includes('dashboard.html')) {
    window.location.href = 'login.html';
}

function getHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// ==================== TOAST NOTIFICATION ====================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const colors = {
        success: 'bg-green-500',
        error: 'bg-rose-500',
        info: 'bg-blue-500',
        warning: 'bg-amber-500'
    };
    const icons = {
        success: 'check_circle',
        error: 'cancel',
        info: 'info',
        warning: 'warning'
    };

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white font-semibold text-sm max-w-xs ${colors[type] || colors.success} transform translate-y-4 opacity-0 transition-all duration-300`;
    toast.innerHTML = `
        <span class="material-symbols-outlined">${icons[type] || icons.success}</span>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="ml-auto opacity-70 hover:opacity-100">
            <span class="material-symbols-outlined text-base">close</span>
        </button>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-4', 'opacity-0');
        });
    });

    // Auto dismiss after 4s
    setTimeout(() => {
        toast.classList.add('translate-y-4', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==================== DOM ELEMENTS ====================
const views = document.querySelectorAll('.view');
const navItems = document.querySelectorAll('.nav-item');
const productForm = document.getElementById('product-form');
const saleForm = document.getElementById('sale-form');
const productModal = document.getElementById('product-modal');

// ==================== NAVIGATION ====================
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const viewId = item.getAttribute('data-view');
        if (!viewId) return;
        switchView(viewId);

        navItems.forEach(nav => {
            nav.classList.remove('bg-primary/10', 'text-primary', 'border', 'border-primary/20');
            nav.classList.add('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
        });

        item.classList.remove('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
        item.classList.add('bg-primary/10', 'text-primary', 'border', 'border-primary/20');
    });
});

// Sidebar Toggle
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');
if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
        if (sidebar.classList.contains('-translate-x-full')) {
            sidebar.classList.remove('-translate-x-full');
        } else {
            sidebar.classList.add('-translate-x-full');
        }
    });

    document.addEventListener('click', (e) => {
        if (window.innerWidth < 1024) {
            if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target) && !sidebar.classList.contains('-translate-x-full')) {
                sidebar.classList.add('-translate-x-full');
            }
        }
    });
}

function switchView(viewId) {
    views.forEach(v => v.classList.add('hidden'));
    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.remove('hidden');

    // Update title
    const titleMap = {
        'dashboard': 'Dashboard',
        'upload-stock': 'Upload Stock',
        'ai-predict': 'AI Predict',
        'products': 'Inventory',
        'sales': 'Sales',
        'marketplace': 'Marketplace',
        'admin-orders': 'Order Requests',
        'db-explorer': 'DB Explorer',
        'my-orders': 'My Orders'
    };
    const titleEl = document.getElementById('view-title');
    if (titleEl) titleEl.textContent = titleMap[viewId] || viewId;

    // Update nav highlight
    navItems.forEach(nav => {
        const view = nav.getAttribute('data-view');
        if (view === viewId) {
            nav.classList.remove('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
            nav.classList.add('bg-primary/10', 'text-primary', 'border', 'border-primary/20');
        } else {
            nav.classList.remove('bg-primary/10', 'text-primary', 'border', 'border-primary/20');
            nav.classList.add('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
        }
    });

    // Auto-load views
    if (viewId === 'admin-orders') loadAdminOrders();
    if (viewId === 'my-orders') loadMyOrders();
    if (viewId === 'marketplace') loadMarketplace();
    if (viewId === 'products') loadProducts();
    if (viewId === 'sales') loadSalesForm();
    if (viewId === 'ai-predict') loadPredictions();
    if (viewId === 'dashboard') loadDashboard();
}

// ==================== USER PROFILE ====================
async function loadUserProfile() {
    try {
        const res = await fetch(`${API_URL}/users/me`, { headers: getHeaders() });
        if (!res.ok) return;
        const user = await res.json();

        document.getElementById('user-display-name').textContent = user.username;
        document.getElementById('header-user-name').textContent = `Welcome, ${user.username}`;

        const img = document.getElementById('user-profile-img');
        const placeholder = document.getElementById('user-icon-placeholder');
        const headerImg = document.getElementById('header-user-img');
        const headerPlaceholder = document.getElementById('header-user-placeholder');

        if (user.image_url) {
            img.src = user.image_url; img.classList.remove('hidden'); placeholder.classList.add('hidden');
            headerImg.src = user.image_url; headerImg.classList.remove('hidden'); headerPlaceholder.classList.add('hidden');
        } else {
            img.classList.add('hidden');
            placeholder.classList.remove('hidden', 'material-symbols-outlined');
            placeholder.classList.add('font-bold', 'text-xl', 'uppercase');
            placeholder.innerText = user.username.charAt(0);

            headerImg.classList.add('hidden');
            headerPlaceholder.classList.remove('hidden');
            headerPlaceholder.classList.add('font-bold', 'text-sm', 'uppercase');
            headerPlaceholder.innerText = user.username.charAt(0);
        }

        // Role-based nav
        document.querySelectorAll('.nav-item').forEach(item => {
            const view = item.getAttribute('data-view');
            const adminOnlyViews = ['dashboard', 'products', 'sales', 'upload-stock', 'ai-predict', 'admin-orders', 'db-explorer', 'predictions'];
            if (user.role !== 'admin' && adminOnlyViews.includes(view)) {
                item.classList.add('hidden');
            } else {
                item.classList.remove('hidden');
            }
        });

        // Hide admin-only dashboard sections for regular users
        const chartSection = document.getElementById('admin-chart-section');
        if (chartSection) {
            if (user.role !== 'admin') {
                chartSection.classList.add('hidden');
            } else {
                chartSection.classList.remove('hidden');
            }
        }

        // For regular users: switch to Marketplace as default landing view
        if (user.role !== 'admin') {
            switchView('marketplace');
        }

        // Admin Link
        if (user.role === 'admin' || user.username === 'Admin') {
            const nav = document.getElementById('sidebar-nav');
            if (nav && !document.getElementById('admin-nav-link')) {
                const adminLink = document.createElement('a');
                adminLink.id = 'admin-nav-link';
                adminLink.className = 'nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mb-2';
                adminLink.href = 'admin.html';
                adminLink.innerHTML = `
                    <span class="material-symbols-outlined">admin_panel_settings</span>
                    <span class="text-sm font-semibold">User Management</span>
                `;
                if (nav.lastElementChild) {
                    nav.insertBefore(adminLink, nav.lastElementChild);
                } else {
                    nav.appendChild(adminLink);
                }
            }
        }

        // Profile Modal handlers
        const openProfileModal = () => {
            const modal = document.getElementById('user-profile-modal');
            const modalImg = document.getElementById('modal-user-img');
            const modalInitial = document.getElementById('modal-user-initial');
            document.getElementById('modal-user-name').textContent = user.username;
            document.getElementById('modal-user-email').textContent = user.email;
            if (user.image_url) {
                if (modalImg) { modalImg.src = user.image_url; modalImg.classList.remove('hidden'); }
                if (modalInitial) modalInitial.classList.add('hidden');
            } else {
                if (modalImg) modalImg.classList.add('hidden');
                if (modalInitial) { modalInitial.classList.remove('hidden'); modalInitial.textContent = user.username.charAt(0); }
            }
            modal.classList.remove('hidden');
        };

        const headerContainer = document.getElementById('header-user-img-container');
        if (headerContainer) headerContainer.onclick = openProfileModal;

        const closeBtn = document.getElementById('close-profile-modal');
        if (closeBtn) closeBtn.onclick = () => document.getElementById('user-profile-modal').classList.add('hidden');

        const modal = document.getElementById('user-profile-modal');
        if (modal) modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };

        // Start approval polling for non-admin users
        if (user.role !== 'admin') {
            startApprovalPolling();
        }

    } catch (err) {
        console.error("Error loading user profile:", err);
    }
}

// ==================== DASHBOARD ====================
async function loadDashboard() {
    try {
        loadUserProfile();
        const res = await fetch(`${API_URL}/products`, { headers: getHeaders() });
        if (res.status === 401) { window.location.href = 'login.html'; return; }
        const products = await res.json();

        const totalEl = document.getElementById('total-products');
        if (totalEl) totalEl.textContent = products.length;

        const lowStock = products.filter(p => p.current_stock <= p.low_stock_threshold);
        const lowStockEl = document.getElementById('low-stock-count');
        if (lowStockEl) lowStockEl.textContent = lowStock.length;

        if (document.getElementById('stockChart')) {
            try {
                const predRes = await fetch(`${API_URL}/prediction`, { headers: getHeaders() });
                const predictions = await predRes.json();
                if (predictions.length === 0) {
                    updateChart(products.map(p => ({ product_name: p.name, current_stock: p.current_stock, predicted_need: 0 })));
                } else {
                    updateChart(predictions);
                }
            } catch (e) {
                updateChart(products.map(p => ({ product_name: p.name, current_stock: p.current_stock, predicted_need: 0 })));
            }
        }
    } catch (err) {
        console.error("Error loading dashboard:", err);
    }
}

// ==================== AI PREDICTIONS ====================
async function loadPredictions() {
    try {
        const res = await fetch(`${API_URL}/prediction`, { headers: getHeaders() });
        const predictions = await res.json();

        const panel = document.getElementById('ai-notification-panel');
        const container = document.getElementById('prediction-cards');

        if (panel && container) {
            panel.classList.remove('hidden');
            setTimeout(() => panel.classList.remove('translate-y-full'), 10);

            const sorted = predictions.sort((a, b) => (a.predicted_need > a.current_stock ? -1 : 1));
            container.innerHTML = sorted.map(p => `
                <div class="p-4 rounded-xl border ${p.status === 'Stocked' ? 'bg-slate-50 border-slate-200' : 'bg-rose-50 border-rose-200'}">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-bold text-sm text-slate-700">${p.product_name}</span>
                        <span class="text-xs font-bold px-2 py-1 rounded bg-white/50 text-slate-500">${p.status}</span>
                    </div>
                    <div class="flex items-center gap-4 text-sm">
                        <div><span class="text-slate-500 text-xs">Current</span> <strong class="block">${p.current_stock}</strong></div>
                        <span class="material-symbols-outlined text-slate-300">arrow_right_alt</span>
                        <div><span class="text-blue-500 text-xs">Predicted</span> <strong class="block text-blue-600">${p.predicted_need}</strong></div>
                    </div>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error("Error loading predictions:", err);
    }
}

// ==================== CHART ====================
function updateChart(data) {
    const ctx = document.getElementById('stockChart').getContext('2d');
    if (stockChart) stockChart.destroy();

    // AI Forecast Gradient (Premium Neon Green)
    const aiGradient = ctx.createLinearGradient(0, 0, 0, 250);
    aiGradient.addColorStop(0, 'rgba(19, 236, 128, 0.4)');
    aiGradient.addColorStop(0.5, 'rgba(19, 236, 128, 0.1)');
    aiGradient.addColorStop(1, 'rgba(19, 236, 128, 0)');

    // Current Stock Gradient (Subtle Slate)
    const stockGradient = ctx.createLinearGradient(0, 0, 0, 250);
    stockGradient.addColorStop(0, 'rgba(148, 163, 184, 0.15)');
    stockGradient.addColorStop(1, 'rgba(148, 163, 184, 0.05)');

    stockChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(p => p.product_name),
            datasets: [
                {
                    label: 'Current Stock',
                    data: data.map(p => p.current_stock),
                    backgroundColor: stockGradient,
                    borderColor: 'rgba(148, 163, 184, 0.3)',
                    borderWidth: 1,
                    borderRadius: 12,
                    categoryPercentage: 0.6,
                    barPercentage: 0.8,
                    order: 2
                },
                {
                    label: 'AI Trading Forecast',
                    data: data.map(p => p.predicted_need),
                    backgroundColor: aiGradient,
                    borderColor: '#13ec80',
                    borderWidth: 4,
                    fill: true,
                    tension: 0.8, // High tension for sine wave effect
                    pointBackgroundColor: '#13ec80',
                    pointBorderColor: '#000',
                    pointBorderWidth: 4,
                    pointHoverRadius: 10,
                    pointHoverBorderWidth: 5,
                    pointRadius: 0, // Hidden points for cleaner wave
                    type: 'line',
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            },
            interaction: { intersect: false, mode: 'index' },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                    ticks: {
                        color: '#64748b',
                        font: { family: 'Manrope', weight: '700', size: 10 },
                        padding: 15
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#94a3b8',
                        font: { family: 'Manrope', weight: '700', size: 11 },
                        padding: 10
                    }
                }
            },
            plugins: {
                legend: { display: false }, // Use custom HTML legend defined in HTML
                tooltip: {
                    backgroundColor: 'rgba(10, 20, 15, 0.95)',
                    titleColor: '#13ec80',
                    titleFont: { size: 14, weight: '800' },
                    bodyColor: '#fff',
                    bodyFont: { size: 12, weight: '600' },
                    padding: 16,
                    cornerRadius: 16,
                    usePointStyle: true,
                    boxPadding: 8,
                    borderColor: 'rgba(19, 236, 128, 0.2)',
                    borderWidth: 1,
                    callbacks: {
                        label: (context) => {
                            const val = context.parsed.y;
                            if (context.datasetIndex === 1) return ` 🚀 AI Forecast: ${val} Units`;
                            return ` 📦 Actual: ${val} Units`;
                        },
                        footer: (items) => {
                            const stock = items[0].parsed.y;
                            const forecast = items[1].parsed.y;
                            if (stock < forecast) return '⚠️ AI Senses Impending Shortage';
                            return '✅ Stock levels healthy';
                        }
                    }
                }
            }
        }
    });
}

// ==================== PRODUCT MANAGEMENT ====================
if (document.getElementById('add-product-btn')) {
    document.getElementById('add-product-btn').addEventListener('click', () => {
        document.getElementById('modal-title').textContent = 'Add Product';
        productForm.reset();
        document.getElementById('edit-product-id').value = '';
        productModal.classList.remove('hidden');
    });
}

if (document.getElementById('close-modal')) {
    document.getElementById('close-modal').addEventListener('click', () => productModal.classList.add('hidden'));
}

if (productForm) {
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Product form submission started...");
        const id = document.getElementById('edit-product-id').value;
        const data = {
            name: document.getElementById('prod-name').value.trim(),
            category: document.getElementById('prod-category').value.trim(),
            price: parseFloat(document.getElementById('prod-price').value),
            current_stock: parseInt(document.getElementById('prod-stock').value),
            low_stock_threshold: parseInt(document.getElementById('prod-threshold').value)
        };

        console.log("Form data collected:", data);

        if (!data.name || isNaN(data.price) || isNaN(data.current_stock)) {
            showToast("Please fill all required fields correctly.", "error");
            return;
        }

        try {
            const method = id ? 'PUT' : 'POST';
            const url = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;
            console.log(`Sending ${method} request to ${url}...`);

            const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(data) });
            console.log("Response received:", res.status, res.statusText);

            if (res.ok) {
                productModal.classList.add('hidden');
                loadProducts();
                showToast(id ? 'Product updated successfully!' : 'Product added successfully!');
            } else {
                let errorMsg = "Failed to save product.";
                try {
                    const error = await res.json();
                    errorMsg = error.detail || JSON.stringify(error);
                } catch (e) {
                    errorMsg = `Server error: ${res.status}`;
                }
                showToast(`Error: ${errorMsg}`, 'error');
            }
        } catch (err) {
            console.error("Error saving product:", err);
            showToast("Connection error. Check console.", "error");
        }
    });
}

async function loadProducts() {
    try {
        const res = await fetch(`${API_URL}/products`, { headers: getHeaders() });
        if (res.status === 401) { window.location.href = 'login.html'; return; }
        const products = await res.json();
        const tbody = document.getElementById('product-list');
        if (!tbody) return;
        tbody.innerHTML = products.map(p => `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td class="px-6 py-4 font-bold text-sm text-slate-900 dark:text-white">${p.name}</td>
                <td class="px-6 py-4 text-sm text-slate-500">${p.category}</td>
                <td class="px-6 py-4 text-center">
                    <span class="px-2 py-1 ${p.current_stock <= p.low_stock_threshold ? 'bg-rose-100 text-rose-600' : 'bg-green-100 text-green-600'} rounded text-xs font-bold">${p.current_stock}</span>
                </td>
                <td class="px-6 py-4 text-right font-bold text-primary">₹${(p.price || 0).toFixed(2)}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 ${p.current_stock <= p.low_stock_threshold ? 'bg-rose-100 text-rose-600' : 'bg-green-100 text-green-600'} rounded text-[10px] font-bold uppercase">${p.current_stock <= p.low_stock_threshold ? 'Low Stock' : 'In Stock'}</span>
                </td>
                <td class="px-6 py-4 text-right">
                    <button onclick="editProduct('${p._id}')" class="px-3 py-1 text-[10px] font-bold border border-slate-200 rounded-lg hover:bg-slate-50 mr-1">Edit</button>
                    <button onclick="deleteProduct('${p._id}')" class="px-3 py-1 text-[10px] font-bold border border-rose-200 text-rose-500 rounded-lg hover:bg-rose-50">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (err) { console.error(err); }
}

async function editProduct(id) {
    try {
        const res = await fetch(`${API_URL}/products/${id}`, { headers: getHeaders() });
        if (res.status === 401) { window.location.href = 'login.html'; return; }
        const p = await res.json();
        document.getElementById('modal-title').textContent = 'Edit Product';
        document.getElementById('edit-product-id').value = p._id;
        document.getElementById('prod-name').value = p.name;
        document.getElementById('prod-category').value = p.category;
        document.getElementById('prod-price').value = p.price;
        document.getElementById('prod-stock').value = p.current_stock;
        document.getElementById('prod-threshold').value = p.low_stock_threshold;
        productModal.classList.remove('hidden');
    } catch (err) { console.error(err); }
}

async function deleteProduct(id) {
    console.log(`Delete requested for product ID: ${id}`);
    if (!confirm('Are you sure you want to delete this product?')) {
        console.log("Delete cancelled by user.");
        return;
    }

    try {
        const url = `${API_URL}/products/${id}`;
        console.log(`Sending DELETE request to ${url}...`);
        const res = await fetch(url, { method: 'DELETE', headers: getHeaders() });
        console.log("Delete response status:", res.status);

        if (res.ok) {
            loadProducts();
            showToast('Product deleted.', 'warning');
            console.log("Product deleted successfully.");
        } else {
            const error = await res.json().catch(() => ({ detail: `Server error ${res.status}` }));
            console.log("Delete failed:", error);
            showToast(`Error: ${error.detail}`, 'error');
        }
    } catch (err) {
        console.error("Error in deleteProduct:", err);
        showToast("Connection error during delete.", "error");
    }
}

// ==================== SALES ====================
if (saleForm) {
    saleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            product_id: document.getElementById('sale-product').value,
            quantity_sold: parseInt(document.getElementById('sale-quantity').value)
        };
        try {
            const res = await fetch(`${API_URL}/sales`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
            if (res.ok) {
                showToast('Sale recorded successfully!');
                saleForm.reset(); loadSalesForm();
            } else {
                const error = await res.json();
                showToast(`Error: ${error.detail}`, 'error');
            }
        } catch (err) { console.error(err); }
    });
}

async function loadSalesForm() {
    try {
        const res = await fetch(`${API_URL}/products`, { headers: getHeaders() });
        const products = await res.json();
        const select = document.getElementById('sale-product');
        if (select) {
            select.innerHTML = products.map(p => `<option value="${p._id}">${p.name} (Stock: ${p.current_stock})</option>`).join('');
        }
    } catch (err) { console.error(err); }
}

// ==================== STOCK UPLOAD ====================
const stockUploadForm = document.getElementById('stock-upload-form');
if (stockUploadForm) {
    stockUploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            product_name: document.getElementById('stock-prod-name').value,
            category: document.getElementById('stock-prod-category').value,
            quantity: parseInt(document.getElementById('stock-prod-quantity').value),
            price: parseFloat(document.getElementById('stock-prod-price').value)
        };
        try {
            const res = await fetch(`${API_URL}/stock`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
            if (res.ok) {
                showToast('Stock saved & Marketplace updated!');
                stockUploadForm.reset();
                loadMarketplace();
            } else {
                const error = await res.json();
                showToast(`Error: ${error.detail}`, 'error');
            }
        } catch (err) { console.error(err); showToast('Server error', 'error'); }
    });
}

// ==================== MARKETPLACE ====================
async function loadMarketplace() {
    const grid = document.getElementById('marketplace-grid');
    if (!grid) return;

    grid.innerHTML = `<div class="col-span-full text-center py-16">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p class="mt-4 text-slate-500 font-medium">Loading products...</p>
    </div>`;

    try {
        const res = await fetch(`${API_URL}/products`, { headers: getHeaders() });
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const products = await res.json();

        if (!products || products.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center py-16">
                <span class="material-symbols-outlined text-6xl text-slate-300">storefront</span>
                <p class="mt-4 text-slate-500 font-semibold">No products available yet.</p>
                <p class="text-xs text-slate-400 mt-1">Admin needs to upload stock first.</p>
            </div>`;
            return;
        }

        grid.innerHTML = products.map(p => {
            const pid = p._id || p.id;
            const price = typeof p.price === 'number' ? p.price : 0;
            const stock = typeof p.current_stock === 'number' ? p.current_stock : 0;
            const category = p.category || 'General';
            const isLow = stock <= (p.low_stock_threshold || 10);
            const outOfStock = stock === 0;

            return `
            <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                <!-- Product Icon Header -->
                <div class="h-28 bg-gradient-to-br from-primary/10 to-green-400/10 flex items-center justify-center relative">
                    <span class="material-symbols-outlined text-6xl text-primary/40">inventory_2</span>
                    <span class="absolute top-3 right-3 px-2 py-1 bg-white dark:bg-slate-800 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow">${category}</span>
                    ${isLow && !outOfStock ? `<span class="absolute top-3 left-3 px-2 py-1 bg-amber-100 text-amber-600 rounded-full text-[10px] font-bold">Low Stock</span>` : ''}
                    ${outOfStock ? `<span class="absolute top-3 left-3 px-2 py-1 bg-rose-100 text-rose-600 rounded-full text-[10px] font-bold">Out of Stock</span>` : ''}
                </div>

                <!-- Product Info -->
                <div class="p-5 flex flex-col flex-grow">
                    <h4 class="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">${p.name}</h4>
                    <div class="flex items-center justify-between mt-2 mb-4">
                        <div>
                            <span class="text-xs text-slate-400 block">Available</span>
                            <span class="font-bold text-sm ${isLow ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}">${stock} Units</span>
                        </div>
                        <p class="text-2xl font-black text-primary">₹${price.toFixed(2)}</p>
                    </div>

                    <!-- Quantity Selector -->
                    <div class="flex items-center gap-2 mb-4 bg-slate-50 dark:bg-slate-900 rounded-xl p-2 border border-slate-100 dark:border-slate-700">
                        <span class="text-xs font-bold text-slate-500 mr-1">Qty:</span>
                        <button onclick="changeQty('qty-${pid}', -1)" class="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-all flex items-center justify-center">-</button>
                        <input type="number" id="qty-${pid}" value="1" min="1" max="${stock}" class="w-12 text-center font-bold text-sm bg-transparent outline-none text-slate-900 dark:text-white" ${outOfStock ? 'disabled' : ''}>
                        <button onclick="changeQty('qty-${pid}', 1)" class="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-all flex items-center justify-center">+</button>
                        <span class="ml-auto text-xs text-slate-400">of ${stock}</span>
                    </div>

                    <!-- Action Buttons -->
                    <div class="grid grid-cols-2 gap-3 mt-auto">
                        <button onclick="addToCart('${pid}', '${p.name}', ${price})"
                            ${outOfStock ? 'disabled' : ''}
                            class="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                            <span class="material-symbols-outlined text-base">shopping_cart</span>
                            Add to Cart
                        </button>
                        <button onclick="buyProduct('${pid}', '${p.name}')"
                            ${outOfStock ? 'disabled' : ''}
                            class="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-primary text-background-dark text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                            <span class="material-symbols-outlined text-base">bolt</span>
                            Buy Now
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('');
    } catch (err) {
        console.error("Error loading marketplace:", err);
        grid.innerHTML = `<div class="col-span-full text-center py-12 text-rose-500 font-semibold">${err.message}</div>`;
    }
}

function changeQty(inputId, delta) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const max = parseInt(input.max) || 999;
    const newVal = Math.max(1, Math.min(max, (parseInt(input.value) || 1) + delta));
    input.value = newVal;
}

function addToCart(productId, name, price) {
    const qtyInput = document.getElementById(`qty-${productId}`);
    const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
    // Save to localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(i => i.productId === productId);
    if (existing) { existing.qty += qty; } else { cart.push({ productId, name, price, qty }); }
    localStorage.setItem('cart', JSON.stringify(cart));
    showToast(`🛒 ${name} (x${qty}) added to cart!`, 'info');
}

async function buyProduct(productId, productName) {
    const qtyInput = document.getElementById(`qty-${productId}`);
    const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;

    if (!confirm(`Send order request for ${qty} unit(s) of "${productName}"?\nAdmin will verify and approve your order.`)) return;

    try {
        const res = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ product_id: productId, quantity_sold: qty })
        });

        if (res.ok) {
            showToast(`✅ Order for "${productName}" sent to admin! Check "My Orders" for status.`, 'success');
            loadMarketplace();
        } else {
            const error = await res.json();
            showToast(`Request failed: ${error.detail}`, 'error');
        }
    } catch (err) {
        console.error("Error buying product:", err);
        showToast('Connection error. Please try again.', 'error');
    }
}

// ==================== ADMIN ORDERS ====================
async function loadAdminOrders() {
    try {
        const res = await fetch(`${API_URL}/admin/orders`, { headers: getHeaders() });
        const tbody = document.getElementById('admin-order-list');
        if (!tbody) return;

        if (!res.ok) {
            const error = await res.json().catch(() => ({ detail: 'Unknown error' }));
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-12 text-rose-500 font-bold">⚠️ Error: ${error.detail || 'Access Denied'}</td></tr>`;
            return;
        }

        const orders = await res.json();

        if (!Array.isArray(orders) || orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-12 text-slate-400">No orders yet. (Fetched from: ${API_URL}/admin/orders)</td></tr>`;
            return;
        }

        console.log("Admin Orders:", orders);

        tbody.innerHTML = orders.map(order => `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td class="px-6 py-4">
                    <p class="font-bold text-sm text-slate-900 dark:text-white">${order.user_name || 'Unknown'}</p>
                    <p class="text-[10px] text-slate-400">${order.user_id}</p>
                </td>
                <td class="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">${order.product_name}</td>
                <td class="px-6 py-4 text-sm text-slate-600">${order.quantity_sold} Units</td>
                <td class="px-6 py-4 text-sm font-bold text-primary">₹${(order.total_price || 0).toFixed(2)}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded text-[10px] font-bold uppercase ${order.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}">
                        ${order.status}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    ${order.status === 'pending' ? `
                        <button onclick="approveOrder('${order._id}')"
                            class="px-4 py-2 bg-primary text-background-dark text-[10px] font-black rounded-lg hover:scale-105 active:scale-95 transition-all shadow shadow-primary/20">
                            ✓ Approve Order
                        </button>
                    ` : '<span class="text-green-500 text-xs font-bold">✓ Approved</span>'}
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error("Error loading admin orders:", err);
    }
}

async function approveOrder(orderId) {
    try {
        const res = await fetch(`${API_URL}/admin/orders/${orderId}/approve`, {
            method: 'POST', headers: getHeaders()
        });
        if (res.ok) {
            showToast('✅ Order approved! User has been notified.', 'success');
            loadAdminOrders();
        } else {
            const error = await res.json();
            showToast(`Approval failed: ${error.detail}`, 'error');
        }
    } catch (err) {
        console.error("Error approving order:", err);
    }
}

// ==================== MY ORDERS ====================
async function loadMyOrders() {
    const tbody = document.getElementById('order-history-list');
    if (!tbody) return;

    try {
        const res = await fetch(`${API_URL}/orders/me`, { headers: getHeaders() });
        const orders = await res.json();

        if (!orders || orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-16">
                <span class="material-symbols-outlined text-5xl text-slate-300">receipt_long</span>
                <p class="text-slate-400 mt-3 font-medium">No orders yet. Go to Marketplace to place your first order!</p>
            </td></tr>`;
            return;
        }

        const approvedOrders = orders.filter(o => o.status === 'approved');
        const pendingOrders = orders.filter(o => o.status !== 'approved');

        tbody.innerHTML = [
            // Approved confirmation cards
            ...approvedOrders.map(order => `
            <tr class="hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-colors bg-green-50/30 dark:bg-green-900/5">
                <td class="px-6 py-5" colspan="4">
                    <div class="flex items-start gap-4">
                        <div class="p-2 bg-green-500 rounded-xl text-white flex-shrink-0">
                            <span class="material-symbols-outlined">check_circle</span>
                        </div>
                        <div class="flex-grow">
                            <div class="flex items-center justify-between flex-wrap gap-2">
                                <div>
                                    <p class="font-extrabold text-slate-900 dark:text-white text-base">${order.product_name}</p>
                                    <p class="text-xs text-slate-500 mt-0.5">Ordered on ${new Date(order.timestamp).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                                </div>
                                <span class="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-800/40 dark:text-green-400 rounded-full text-xs font-extrabold uppercase tracking-wider">✓ Order Confirmed</span>
                            </div>
                            <div class="mt-3 grid grid-cols-3 gap-3">
                                <div class="bg-white dark:bg-slate-800 rounded-lg p-3 border border-green-200 dark:border-green-800">
                                    <span class="text-xs text-slate-400 block">Quantity</span>
                                    <span class="font-bold text-slate-900 dark:text-white">${order.quantity_sold} Units</span>
                                </div>
                                <div class="bg-white dark:bg-slate-800 rounded-lg p-3 border border-green-200 dark:border-green-800">
                                    <span class="text-xs text-slate-400 block">Unit Price</span>
                                    <span class="font-bold text-primary">₹${(order.unit_price || 0).toFixed(2)}</span>
                                </div>
                                <div class="bg-white dark:bg-slate-800 rounded-lg p-3 border border-green-200 dark:border-green-800">
                                    <span class="text-xs text-slate-400 block">Total Paid</span>
                                    <span class="font-extrabold text-green-600">₹${(order.total_price || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
            `),
            // Pending orders
            ...pendingOrders.map(order => `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td class="px-6 py-4">
                    <span class="font-bold text-sm text-slate-900 dark:text-white">${order.product_name}</span>
                </td>
                <td class="px-6 py-4 text-sm text-slate-600">${order.quantity_sold} Units</td>
                <td class="px-6 py-4 text-sm text-slate-500">${new Date(order.timestamp).toLocaleDateString()}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded text-[10px] font-bold uppercase tracking-wider">
                        ⏳ Pending Approval
                    </span>
                </td>
            </tr>
            `)
        ].join('');
    } catch (err) {
        console.error("Error loading orders:", err);
    }
}

// ==================== APPROVAL POLLING ====================
let _knownApprovedIds = null;
let _pollingTimer = null;

async function pollOrderApprovals() {
    try {
        const res = await fetch(`${API_URL}/orders/me`, { headers: getHeaders() });
        if (!res.ok) return;
        const orders = await res.json();
        const approvedIds = orders.filter(o => o.status === 'approved').map(o => o._id);

        if (_knownApprovedIds === null) {
            // First load — just store current approved IDs
            _knownApprovedIds = new Set(approvedIds);
            return;
        }

        // Find newly approved ones
        const newlyApproved = orders.filter(o => o.status === 'approved' && !_knownApprovedIds.has(o._id));
        newlyApproved.forEach(order => {
            showToast(`🎉 Your order for "${order.product_name}" has been APPROVED!`, 'success');
            _knownApprovedIds.add(order._id);

            // Show the top banner if on dashboard
            const banner = document.getElementById('order-approved-banner');
            const bannerText = document.getElementById('order-approved-text');
            if (banner) {
                if (bannerText) bannerText.textContent = `🎉 Your order for "${order.product_name}" has been approved!`;
                banner.classList.remove('hidden');
            }
        });
    } catch (err) {
        // silent fail
    }
}

function startApprovalPolling() {
    if (_pollingTimer) return; // already running
    _pollingTimer = setInterval(pollOrderApprovals, 30000); // every 30s
    pollOrderApprovals(); // run immediately once
}

// ==================== AUTH ====================
function logout() {
    if (_pollingTimer) clearInterval(_pollingTimer);
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        loadDashboard();
        loadUserProfile();
    }
});
