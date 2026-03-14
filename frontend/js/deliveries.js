import { apiCall } from './api.js';

export function initDeliveries() {
    console.log('Initializing Deliveries Module');
    
    const tableBody = document.getElementById('manifest-table-body');
    const validateBtn = document.querySelector('.btn-primary-gradient'); // Validate Delivery button
    
    if (!tableBody) {
        console.warn('Deliveries table body not found');
        return;
    }

    let allProducts = [];

    async function loadProducts() {
        try {
            const response = await apiCall('/products');
            allProducts = response.data || response || [];
            console.log('Loaded products for deliveries:', allProducts.length);
        } catch (error) {
            console.error('Failed to load products:', error);
        }
    }

    function createRow() {
        const tr = document.createElement('tr');
        tr.className = 'group hover:bg-surface-container-high/50 transition-colors';
        
        tr.innerHTML = `
            <td class="px-6 py-4">
                <div class="relative group/search">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                    <input class="product-search bg-surface-container-lowest border border-outline-variant rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none w-full" placeholder="Search product..." type="text">
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="sku-label text-xs text-on-surface-variant font-mono bg-surface-container-lowest px-2 py-1.5 rounded border border-outline-variant">—</span>
            </td>
            <td class="px-6 py-4 text-right">
                <input class="quantity-input bg-surface-container-lowest border border-outline-variant rounded-lg w-24 text-right text-[15px] font-bold text-white py-2 px-3 focus:ring-2 focus:ring-primary outline-none transition-all custom-scrollbar placeholder:text-on-surface-variant/50 group-hover:border-primary/50" placeholder="0" type="number" min="1">
            </td>
            <td class="px-6 py-4 text-center">
                <span class="unit-label text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">—</span>
            </td>
            <td class="px-6 py-4 text-right">
                <button class="remove-row-btn text-on-surface-variant opacity-50 hover:opacity-100 hover:text-error bg-surface-container-lowest hover:bg-error/10 p-2 rounded-lg transition-colors border border-outline-variant hover:border-error/30" type="button">
                    <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
            </td>
        `;

        const searchInput = tr.querySelector('.product-search');
        const skuLabel = tr.querySelector('.sku-label');
        const unitLabel = tr.querySelector('.unit-label');
        const removeBtn = tr.querySelector('.remove-row-btn');
        const qtyInput = tr.querySelector('.quantity-input');

        searchInput.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            if (val.length < 2) return;

            const found = allProducts.find(p => p.name.toLowerCase().includes(val) || (p.sku && p.sku.toLowerCase().includes(val)));
            if (found) {
                skuLabel.textContent = found.sku || 'N/A';
                unitLabel.textContent = found.unit || 'Units';
                tr.dataset.productId = found.id;
            } else {
                skuLabel.textContent = '—';
                unitLabel.textContent = '—';
                delete tr.dataset.productId;
            }
        });

        removeBtn.addEventListener('click', () => tr.remove());
        tableBody.appendChild(tr);
    }

    loadProducts().then(() => {
        createRow();
    });

    if (validateBtn) {
        validateBtn.addEventListener('click', () => {
            alert('Delivery validated locally. Backend connection pending.');
            window.location.href = 'dashboard.html';
        });
    }
}
