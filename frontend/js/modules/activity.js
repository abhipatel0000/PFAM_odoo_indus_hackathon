export function initActivity() {
    const panel = document.getElementById('activity-panel');
    const overlay = document.getElementById('activity-overlay');
    const closeBtn = document.getElementById('close-activity');

    if (!panel) return;

    function openPanel() {
        panel.classList.remove('translate-x-full');
        if(overlay) {
            overlay.classList.remove('hidden');
            setTimeout(() => overlay.classList.add('opacity-100'), 10);
        }
        renderLog();
    }

    function closePanel() {
        panel.classList.add('translate-x-full');
        if(overlay) {
            overlay.classList.remove('opacity-100');
            setTimeout(() => overlay.classList.add('hidden'), 300);
        }
    }

    // Bind all elements with data-toggle-activity
    document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('[data-toggle-activity]');
        if (toggleBtn) {
            const isHidden = panel.classList.contains('translate-x-full');
            if (isHidden) openPanel();
            else closePanel();
        }
    });

    if(closeBtn) closeBtn.addEventListener('click', closePanel);
    if(overlay) overlay.addEventListener('click', closePanel);

    // Initial render
    renderLog();
}

export function logActivity(action, ref) {
    const history = JSON.parse(localStorage.getItem('core_activity') || '[]');
    history.unshift({
        action,
        ref,
        timestamp: new Date().toISOString()
    });
    // keep only last 50
    if (history.length > 50) history.pop();
    localStorage.setItem('core_activity', JSON.stringify(history));
    
    // re-render if panel is open
    const logContainer = document.getElementById('activity-log');
    if (logContainer) renderLog();
}

function renderLog() {
    const logContainer = document.getElementById('activity-log');
    if (!logContainer) return;

    const history = JSON.parse(localStorage.getItem('core_activity') || '[]');
    
    if (history.length === 0) {
        logContainer.innerHTML = '<div class="text-sm text-center text-on-surface-variant mt-10">No recent activity</div>';
        return;
    }

    logContainer.innerHTML = history.map(item => {
        const time = new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const date = new Date(item.timestamp).toLocaleDateString([], {month: 'short', day: 'numeric'});
        return `
        <div class="relative pl-6 py-4 border-l-2 border-outline-variant/50 group hover:border-primary transition-colors ml-2">
            <span class="absolute -left-[5px] top-5 w-2 h-2 rounded-full bg-outline-variant group-hover:bg-primary transition-colors ring-4 ring-background"></span>
            <p class="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">${date}, ${time}</p>
            <p class="text-[14px] font-bold text-white group-hover:text-primary transition-colors">${item.action}</p>
            <p class="text-xs text-secondary mt-1 font-medium bg-secondary/10 px-2 py-0.5 rounded w-fit">${item.ref}</p>
        </div>
        `;
    }).join('');
}
