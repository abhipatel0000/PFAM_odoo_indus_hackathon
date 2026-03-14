document.addEventListener('DOMContentLoaded', async function() {
    const grid = document.getElementById('productGrid');
    
    function renderProducts(data) {
        if (!data || data.length === 0) {
            grid.innerHTML = '<p>No products found.</p>';
            return;
        }
        
        grid.innerHTML = data.map(p => `
            <div class="product-card glass animate-fade-in">
                <div class="sku">${p.sku}</div>
                <h4 style="margin: 0.5rem 0;">${p.name}</h4>
                <p style="font-size: 0.875rem; color: var(--text-muted);">${p.barcode ? 'Barcode: ' + p.barcode : ''}</p>
                <div class="stock" style="${p.total_stock < 10 ? 'color: var(--accent-color)' : 'color: var(--primary-color)'}">
                    Total Stock: ${p.total_stock || 0}
                </div>
            </div>
        `).join('');
    }

    try {
        const response = await apiCall('/products');
        if (response.success && response.data) {
            renderProducts(response.data);
        } else {
            grid.innerHTML = '<p class="text-error">Failed to load products.</p>';
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        grid.innerHTML = '<p class="text-error">Error connecting to server to load products.</p>';
    }
});
