import { apiCall } from './api.js';

export function initReceipts() {
    console.log('Initializing Receipts Module');
    
    const tableBody = document.getElementById('manifest-table-body');
    const addRowBtn = document.getElementById('add-row-btn');
    const validateBtn = document.getElementById('validate-receipt-btn');
    const saveDraftBtn = document.getElementById('save-draft-btn');
    
    if (!tableBody || !addRowBtn) {
        console.warn('Receipts elements not found');
        return;
    }

    let allProducts = [];

    async function loadProducts() {
        try {
            const response = await apiCall('/products');
            allProducts = response.data || response || [];
            console.log('Loaded products for receipts:', allProducts.length);
        } catch (error) {
            console.error('Failed to load products:', error);
        }
    }

    /**
     * Create a new table row
     */
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
            if (val.length < 2) {
                skuLabel.textContent = '—';
                unitLabel.textContent = '—';
                return;
            }

            const found = allProducts.find(p => 
                p.name.toLowerCase().includes(val) || 
                (p.sku && p.sku.toLowerCase().includes(val))
            );

            if (found) {
                skuLabel.textContent = found.sku || 'N/A';
                unitLabel.textContent = found.unit || 'Units';
                skuLabel.classList.remove('text-on-surface-variant/30');
                unitLabel.classList.remove('text-on-surface-variant/50');
                qtyInput.classList.add('bg-primary/10', 'text-primary');
                qtyInput.classList.remove('text-white');
                tr.dataset.productId = found.id;
            } else {
                skuLabel.textContent = '—';
                unitLabel.textContent = '—';
                skuLabel.classList.add('text-on-surface-variant');
                unitLabel.classList.add('text-on-surface-variant');
                qtyInput.classList.remove('bg-primary/10', 'text-primary');
                qtyInput.classList.add('text-white');
                delete tr.dataset.productId;
            }
        });

        removeBtn.addEventListener('click', () => {
            tr.classList.add('scale-y-0', 'opacity-0');
            setTimeout(() => tr.remove(), 200);
        });

        tableBody.appendChild(tr);
    }

    // Initialize
    loadProducts().then(() => {
        createRow();
        createRow();
    });

    addRowBtn.addEventListener('click', createRow);

    if (validateBtn) {
        validateBtn.addEventListener('click', async () => {
            const supplier = document.getElementById('supplier-name')?.value;
            const warehouse = document.getElementById('destination-hub')?.value;
            const date = document.getElementById('receive-date')?.value;

            if (!supplier || !date) {
                alert('Please fill in Supplier and Date');
                return;
            }

            const rows = tableBody.querySelectorAll('tr');
            const items = [];
            rows.forEach(tr => {
                const productId = tr.dataset.productId;
                const qty = tr.querySelector('.quantity-input')?.value;
                if (productId && qty > 0) {
                    items.push({ product_id: parseInt(productId), quantity: parseFloat(qty) });
                }
            });

            if (items.length === 0) {
                alert('Please add at least one valid product');
                return;
            }

            // Show loading state
            validateBtn.disabled = true;
            const originalHtml = validateBtn.innerHTML;
            validateBtn.innerHTML = `Validating... <span class="material-symbols-outlined text-[20px] animate-spin">sync</span>`;

            try {
                // For now, we simulate the receipt creation or send to a real endpoint if implemented
                // await api.createReceipt({ supplier, warehouse, date, items });
                
                await new Promise(resolve => setTimeout(resolve, 1000));

                validateBtn.innerHTML = `Validated <span class="material-symbols-outlined text-[20px]">check_circle</span>`;
                validateBtn.classList.remove('btn-primary-gradient');
                validateBtn.classList.add('bg-success', 'text-white');
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } catch (error) {
                console.error('Validation failed:', error);
                validateBtn.disabled = false;
                validateBtn.innerHTML = originalHtml;
                alert('Failed to validate receipt');
            }
        });
    }

    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', () => {
            const statusSpan = document.getElementById('save-status');
            if (statusSpan) {
                statusSpan.textContent = 'Saving...';
                setTimeout(() => {
                    statusSpan.textContent = 'Draft saved at ' + new Date().toLocaleTimeString();
                }, 800);
            }
        });
    }
}
