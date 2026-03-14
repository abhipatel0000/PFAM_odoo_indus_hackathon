import { apiCall } from '../api.js';

export function initProducts() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    loadProducts();

    async function loadProducts() {
        try {
            const response = await apiCall('/products');
            if (response.success && response.data) {
                renderProducts(response.data);
            } else {
                grid.innerHTML = '<div class="col-span-full text-center py-20 bg-surface-container-low rounded-3xl border border-dashed border-outline-variant"><p class="text-on-surface-variant font-medium">Failed to load products.</p></div>';
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            grid.innerHTML = '<div class="col-span-full text-center py-20 bg-surface-container-low rounded-3xl border border-dashed border-outline-variant"><p class="text-error font-medium">Error connecting to server to load products.</p></div>';
        }
    }

    function renderProducts(data) {
        if (!data || data.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-20 bg-surface-container-low rounded-3xl border border-dashed border-outline-variant"><p class="text-on-surface-variant font-medium">No products found.</p></div>';
            return;
        }

        grid.innerHTML = data.map(p => `
            <div class="glass-panel p-6 border border-outline-variant hover:border-primary transition-all group hover-lift">
                <div class="flex justify-between items-start mb-4">
                    <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <span class="material-symbols-outlined">inventory_2</span>
                    </div>
                    <div class="px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-bold text-on-surface-variant uppercase tracking-wider border border-outline-variant">
                        SKU: ${p.sku}
                    </div>
                </div>
                <h3 class="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">${p.name}</h3>
                <p class="text-sm text-on-surface-variant mb-4">${p.barcode ? 'Barcode: ' + p.barcode : 'No barcode'}</p>
                
                <div class="flex items-center justify-between pt-4 border-t border-outline-variant">
                    <div class="flex flex-col">
                        <span class="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">Available Stock</span>
                        <span class="text-xl font-headline font-extrabold ${p.total_stock < 10 ? 'text-error' : 'text-primary'}" data-stock-id="${p.id}">
                            ${p.total_stock || 0}
                        </span>
                    </div>
                    <button class="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white transition-all">
                        <span class="material-symbols-outlined text-sm">edit</span>
                    </button>
                </div>
            </div>
        `).join('');
    }
}
