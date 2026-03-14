const NOTIFICATIONS = [
    { id: 1, type: "alert", message: "Low stock for Dolo-650", time: "2 mins ago", read: false },
    { id: 2, type: "info", message: "New shipment arrived from RX Pharma", time: "1 hour ago", read: false },
    { id: 3, type: "success", message: "Order #348 shipped successfully", time: "3 hours ago", read: true },
    { id: 4, type: "warning", message: "System maintenance tonight at 2 AM", time: "1 day ago", read: true }
];

export function initNotifications() {
    const listContainer = document.getElementById('notifications-list');
    const indicator = document.getElementById('notifications-indicator');
    if (!listContainer) return;

    renderNotifications(listContainer, indicator);

    // mark as read listener
    listContainer.addEventListener('click', (e) => {
        const item = e.target.closest('.notification-item');
        if (item && !item.classList.contains('read')) {
            const id = parseInt(item.dataset.id);
            const notif = NOTIFICATIONS.find(n => n.id === id);
            if (notif) {
                notif.read = true;
                renderNotifications(listContainer, indicator);
            }
        }
    }); 
}

function renderNotifications(container, indicator) {
    const unreadCount = NOTIFICATIONS.filter(n => !n.read).length;
    
    if (indicator) {
        if (unreadCount > 0) {
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    }

    if (NOTIFICATIONS.length === 0) {
        container.innerHTML = '<div class="p-4 text-sm text-center text-on-surface-variant">No notifications</div>';
        return;
    }

    const icons = {
        alert: '<span class="material-symbols-outlined text-error">error</span>',
        info: '<span class="material-symbols-outlined text-secondary">info</span>',
        success: '<span class="material-symbols-outlined text-emerald-400">check_circle</span>',
        warning: '<span class="material-symbols-outlined text-tertiary">warning</span>'
    };

    container.innerHTML = NOTIFICATIONS.map(n => `
        <div class="notification-item ${n.read ? 'read opacity-60' : 'bg-surface-container-high cursor-pointer'} px-4 py-3 border-b border-outline-variant/30 last:border-0 flex gap-3 hover:bg-surface-container-high transition-colors" data-id="${n.id}">
            <div class="mt-0.5">${icons[n.type]}</div>
            <div class="flex-1">
                <p class="text-[13px] font-bold ${n.read ? 'text-white' : 'text-primary'} leading-tight">${n.message}</p>
                <p class="text-[10px] text-on-surface-variant font-medium mt-1">${n.time}</p>
            </div>
            ${!n.read ? '<div class="w-2 h-2 bg-primary rounded-full mt-1 flex-shrink-0"></div>' : ''}
        </div>
    `).join('');
}
