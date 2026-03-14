document.addEventListener('DOMContentLoaded', async function() {
    const grid = document.getElementById('productGrid');
    
    // In a real app, we'd fetch from /api/products
    const mockProducts = [
        { name: 'Steel Rod', sku: 'ST-001', category: 'Raw Material', stock: 50 },
        { name: 'Office Chair', sku: 'CH-022', category: 'Furniture', stock: 12 },
        { name: 'LED Bulb', sku: 'EL-109', category: 'Electronics', stock: 245 },
        { name: 'Safety Helmet', sku: 'SF-551', category: 'Safety', stock: 8 }
    ];

    function renderProducts(data) {
        grid.innerHTML = data.map(p => `
            <div class="product-card glass animate-fade-in">
                <div class="sku">${p.sku}</div>
                <h4 style="margin: 0.5rem 0;">${p.name}</h4>
                <p style="font-size: 0.875rem; color: var(--text-muted);">${p.category}</p>
                <div class="stock" style="color: ${p.stock < 10 ? 'var(--accent-color)' : 'var(--primary-color)'}">
                    Stock: ${p.stock}
                </div>
            </div>
        `).join('');
    }

    renderProducts(mockProducts);
});
