import { apiCall } from './api.js';

export async function initDashboard() {
    console.log('Initializing Dashboard Module');

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userInfo = document.getElementById('userInfo');
    if (userInfo && user.name) {
        userInfo.textContent = `Welcome, ${user.name} (${user.role})`;
    }

    // Logout handler (backup — auth.js also sets this up)
    document.getElementById('logoutBtn')?.addEventListener('click', function () {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });

    // Fetch all dashboard data points in parallel
    fetchMainStats();
    fetchMovements();
    fetchExpiryAlerts();
    fetchDeadStock();
    fetchSmartReorders();
    fetchSynapseAlerts();
}

/**
 * Fetch high-level KPIs
 */
async function fetchMainStats() {
    try {
        const res = await apiCall('/stock/summary');
        if (res.success) {
            const totalQty = res.data?.reduce((sum, item) => sum + Number(item.total_qty), 0) || 0;
            setText('kpiTotalInventory', totalQty.toLocaleString());
        }

        const expiryRes = await apiCall('/expiry/stats');
        if (expiryRes.success) {
            const expData = expiryRes.data || {};
            const criticalCount = (Number(expData.expired_count) || 0) + (Number(expData.expiring_7d) || 0);
            setText('kpiCriticalAlerts', criticalCount);
        }

        // Hardcoded for demo if no endpoint exists for strictly today
        setText('kpiTodayDispense', '15');
        setText('kpiEfficiency', '98.5%');

        const healthBar = document.getElementById('kpiHealthBar');
        if (healthBar) healthBar.style.width = '98.5%';
        setText('kpiSystemHealth', '98.5%');

    } catch (err) {
        console.error('Error fetching main stats:', err);
    }
}

/**
 * Fetch and render recent movements
 */
async function fetchMovements() {
    const container = document.getElementById('movementsContainer');
    if (!container) return;

    try {
        const res = await apiCall('/stock/recent?limit=5');
        if (!res.success) throw new Error('Failed to fetch recent movements');

        if (!res.data || res.data.length === 0) {
            container.innerHTML = `<p class="text-xs text-on-surface-variant/50 text-center py-4">No recent movements.</p>`;
            return;
        }

        container.innerHTML = res.data.map(m => {
            const isOut = ['delivery', 'transfer_out'].includes(m.movement_type);
            const icon = isOut ? 'fa-plane-up' : 'fa-truck-fast';
            const color = isOut ? 'primary' : 'secondary';
            const urgency = isOut ? 'Urgent' : 'Standard';

            return `
                <div class="p-6 bg-surface-container border border-outline-variant/30 rounded-3xl flex items-center group hover:border-$\\{color\\}/30 transition-all hover:translate-x-1 duration-300">
                    <div class="h-12 w-12 rounded-2xl bg-$\\{color\\}/10 flex items-center justify-center text-$\\{color\\} group-hover:bg-$\\{color\\} group-hover:text-on-$\\{color\\} transition-all duration-300 mr-6">
                        <i class="fas $\\{icon\\}"></i>
                    </div>
                    <div class="flex-1 min-w-0 pr-8">
                        <div class="flex items-center space-x-2 mb-1">
                            <h5 class="font-black text-on-surface text-sm uppercase tracking-tight truncate">$\\{m.product_name\\} ($\\{m.sku\\})</h5>
                            <span class="px-2 py-0.5 rounded-md bg-$\\{isOut?'secondary':'primary'\\}/10 text-[9px] font-black text-$\\{isOut?'secondary':'primary'\\} uppercase tracking-widest">$\\{urgency\\}</span>
                        </div>
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center text-[10px] font-bold text-on-surface-variant">
                                <i class="fas fa-location-dot mr-1.5 opacity-40"></i>
                                <span>Location: $\\{m.location_name\\}</span>
                            </div>
                            <div class="flex items-center text-[10px] font-bold text-$\\{color\\}/70">
                                <i class="fas fa-clock mr-1.5 opacity-40"></i>
                                <span>$\\{new Date(m.created_at).toLocaleString()\\}</span>
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-lg font-headline font-black text-on-surface">$\\{Math.abs(m.qty_change)\\}</p>
                        <p class="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest">Units</p>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        container.innerHTML = `<p class="text-xs text-error text-center py-4">Error loading movements.</p>`;
        console.error(err);
    }
}

/**
 * Fetch and render Expiry Alerts
 */
async function fetchExpiryAlerts() {
    const container = document.getElementById('expiryAlertsContainer');
    if (!container) return;

    try {
        const res = await apiCall('/expiry/alerts?days=30');
        if (!res.success) throw new Error('Failed to fetch expiry alerts');

        const expired = res.data.expired || [];
        const expiringSoon = res.data.expiringSoon || [];
        const allList = [...expired, ...expiringSoon].slice(0, 10);

        if (allList.length === 0) {
            container.innerHTML = `<p class="text-xs text-on-surface-variant/50 text-center py-4">All stock expiry dates are well within bounds.</p>`;
            return;
        }

        container.innerHTML = allList.map(item => {
            const isExpired = item.days_past_expiry !== undefined;
            const statusColor = isExpired ? 'error' : 'amber-500';
            const statusText = isExpired ?\`Expired $\\{item.days_past_expiry\\}d ago\` : \`Expires in $\\{item.days_until_expiry\\}d\`;
            
            return `
                < div class="flex items-center justify-between p-3 rounded-2xl bg-surface hover:bg-surface-container transition-colors border border-outline-variant/30" >
                    <div>
                        <p class="text-xs font-bold text-on-surface truncate pr-2">$\\{item.name\\}</p>
                        <div class="flex items-center mt-1 space-x-2">
                            <span class="text-[9px] font-black text-$\\{statusColor\\} uppercase tracking-widest">$\\{statusText\\}</span>
                            <span class="text-[9px] text-on-surface-variant/60 font-medium">Qty: $\\{item.qty_on_hand\\}</span>
                        </div>
                    </div>
                    <div class="text-[9px] text-on-surface-variant/40 uppercase tracking-widest">
                        $\\{new Date(item.expiry_date).toLocaleDateString()\\}
                    </div>
                </div >
                `;
        }).join('');
    } catch (err) {
        container.innerHTML = `< p class="text-xs text-error text-center py-4" > Error loading expiry alerts.</p > `;
        console.error(err);
    }
}

/**
 * Fetch and render Dead Stock
 */
async function fetchDeadStock() {
    const summaryCount = document.getElementById('deadStockCount');
    const summaryUnits = document.getElementById('deadStockUnits');
    const container = document.getElementById('deadStockContainer');
    if (!container) return;

    try {
        const res = await apiCall('/dead-stock?days=90');
        if (!res.success) throw new Error('Failed to fetch dead stock');
        
        const summary = res.data.summary || {};
        const items = res.data.items || [];

        if (summaryCount) summaryCount.textContent = summary.dead_stock_count || '0';
        if (summaryUnits) summaryUnits.textContent = summary.total_dead_units || '0';

        if (items.length === 0) {
            container.innerHTML = `< p class="text-xs text-on-surface-variant/50 text-center py-4" > No dead stock detected.</p > `;
            return;
        }

        container.innerHTML = items.slice(0, 5).map(item => {
            return `
                < div class="flex items-center justify-between p-3 rounded-2xl bg-surface hover:bg-surface-container transition-colors border border-outline-variant/30" >
                    <div class="flex-1 min-w-0 pr-4">
                        <p class="text-xs font-bold text-on-surface truncate">$\\{item.name\\}</p>
                        <p class="text-[9px] text-on-surface-variant/60 font-medium uppercase mt-1">
                            $\\{item.days_since_last_sale || '>90'\\} days since last movement
                        </p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-black text-amber-500">$\\{item.qty_on_hand\\}</p>
                        <p class="text-[9px] text-on-surface-variant/40 uppercase tracking-widest">Units</p>
                    </div>
                </div >
                `;
        }).join('');
    } catch (err) {
        container.innerHTML = `< p class="text-xs text-error text-center py-4" > Error loading dead stock.</p > `;
        console.error(err);
    }
}

/**
 * Fetch and render Smart Reorders
 */
async function fetchSmartReorders() {
    const container = document.getElementById('reorderContainer');
    if (!container) return;

    try {
        const res = await apiCall('/reorder/suggestions');
        if (!res.success) throw new Error('Failed to fetch reorder suggestions');
        const suggestions = res.data || [];

        if (suggestions.length === 0) {
            container.innerHTML = `< p class="text-xs text-on-surface-variant/50 text-center py-4" > Stock levels are optimal.</p > `;
            return;
        }

        container.innerHTML = suggestions.slice(0, 10).map(item => {
            let color = item.urgency === 'CRITICAL' ? 'error' : (item.urgency === 'URGENT' ? 'amber-500' : 'primary');
            return `
                < div class="flex items-center justify-between p-3 rounded-2xl bg-surface hover:bg-surface-container transition-colors border border-outline-variant/30" >
                    <div class="flex-1 min-w-0 pr-2">
                        <div class="flex items-center space-x-2">
                            <p class="text-xs font-bold text-on-surface truncate">$\\{item.name\\}</p>
                            <span class="px-1.5 py-0.5 rounded-sm bg-$\\{color\\}/10 text-[8px] font-black text-$\\{color\\} uppercase tracking-widest">$\\{item.urgency\\}</span>
                        </div>
                        <div class="flex space-x-3 mt-1 text-[9px] font-medium text-on-surface-variant/60">
                            <span>Have: $\\{item.qty_on_hand\\}</span>
                            <span>Min: $\\{item.reorder_level\\}</span>
                            <span>Daily: $\\{parseFloat(item.avg_daily_consumption).toFixed(1)\\}/d</span>
                        </div>
                    </div>
                    <button class="h-8 px-3 ml-2 bg-primary/10 text-primary hover:bg-primary hover:text-on-primary transition-colors rounded-xl text-[10px] font-black uppercase tracking-widest">
                        +$\\{item.suggested_reorder_qty\\}
                    </button>
                </div >
                `;
        }).join('');
    } catch (err) {
        container.innerHTML = `< p class="text-xs text-error text-center py-4" > Error loading reorder suggestions.</p > `;
        console.error(err);
    }
}

/**
 * Fetch and render System/Synapse Alerts (Activity Log + custom bits)
 */
async function fetchSynapseAlerts() {
    const container = document.getElementById('alertsContainer');
    if (!container) return;

    try {
        const res = await apiCall('/activity?limit=3');
        if (!res.success) return;
        const logs = res.data || [];

        if (logs.length === 0) {
            container.innerHTML = `< p class="text-xs text-white/50 px-4" > No recent system activity.</p > `;
            return;
        }

        container.innerHTML = logs.map(log => {
            let icon = 'fa-circle-nodes';
            let color = 'primary';
            
            if (log.action.includes('EXPIRY') || log.action.includes('DEAD_STOCK')) {
                icon = 'fa-triangle-exclamation';
                color = 'error';
            } else if (log.action.includes('REORDER') || log.action.includes('ADJUSTMENT')) {
                icon = 'fa-rotate';
                color = 'amber-500';
            }

            return `
                < div class="flex items-start space-x-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors" >
                    <i class="fas $\\{icon\\} text-$\\{color\\} mt-1"></i>
                    <div>
                        <p class="text-xs font-bold text-white tracking-tight">$\\{log.description\\}</p>
                        <p class="text-[9px] text-white/40 uppercase font-black tracking-widest mt-1">$\\{new Date(log.created_at).toLocaleString()\\}</p>
                    </div>
                </div >
                `;
        }).join('');
    } catch (err) {
        console.error('Error fetching synapse alerts:', err);
    }
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}
