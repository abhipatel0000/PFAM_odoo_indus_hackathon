const MOCK_DATA = [
    { title: 'Paracetamol Tablet', type: 'Product', url: 'products.html' },
    { title: 'Paracetamol Syrup', type: 'Product', url: 'products.html' },
    { title: 'Amoxicillin 500mg', type: 'Product', url: 'products.html' },
    { title: 'Dolo - 650', type: 'Product', url: 'products.html' },
    { title: 'Delivery #4812', type: 'Delivery', url: 'deliveries.html' },
    { title: 'Delivery #341', type: 'Delivery', url: 'deliveries.html' },
    { title: 'Supplier RX Pharma', type: 'Supplier', url: 'receipts.html' },
    { title: 'Global Parts Inc.', type: 'Supplier', url: 'receipts.html' }
];

export function initSearch() {
    const searchInput = document.getElementById('global-search-input');
    const searchResults = document.getElementById('global-search-results');
    if (!searchInput || !searchResults) return;

    let debounceTimer;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim().toLowerCase();
        
        if (query.length === 0) {
            searchResults.classList.add('hidden');
            return;
        }

        debounceTimer = setTimeout(() => {
            const results = MOCK_DATA.filter(item => 
                item.title.toLowerCase().includes(query) || 
                item.type.toLowerCase().includes(query)
            );
            renderResults(results, query, searchResults);
        }, 300);
    });

    // close on outside click
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.add('hidden');
        }
    });
}

function renderResults(results, query, container) {
    if (results.length === 0) {
        container.innerHTML = `<div class="p-4 text-sm text-on-surface-variant text-center">No results found for "${query}"</div>`;
    } else {
        container.innerHTML = results.map(item => `
            <a href="${item.url}" class="block px-4 py-3 hover:bg-surface-container-high transition-colors border-b border-outline-variant/30 last:border-0 pointer-events-auto">
                <div class="flex items-center justify-between">
                    <span class="text-sm font-bold text-white">${highlight(item.title, query)}</span>
                    <span class="text-[10px] uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded">${item.type}</span>
                </div>
            </a>
        `).join('');
    }
    container.classList.remove('hidden');
}

function highlight(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="text-primary">$1</span>');
}
