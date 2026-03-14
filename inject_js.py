import os
import re

files = [
    r'frontend\pages\dashboard.html',
    r'frontend\pages\deliveries.html',
    r'frontend\pages\products.html',
    r'frontend\pages\receipts.html'
]

global_modals = """
<!-- Toast Container -->
<div id="toast-container" class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"></div>

<!-- Activity Overlay -->
<div id="activity-overlay" class="hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-[90] transition-opacity opacity-0"></div>

<!-- Activity Panel -->
<div id="activity-panel" class="fixed top-0 right-0 h-full w-80 glass-panel border-l border-outline-variant z-[100] transform translate-x-full transition-transform duration-300 flex flex-col shadow-2xl">
    <div class="flex items-center justify-between p-6 border-b border-outline-variant/50">
        <h3 class="text-lg font-bold text-white tracking-tight">Activity History</h3>
        <button id="close-activity" class="p-2 text-on-surface-variant hover:text-white rounded-lg hover:bg-surface-container-high transition-colors">
            <span class="material-symbols-outlined">close</span>
        </button>
    </div>
    <div class="flex-1 overflow-y-auto p-4 custom-scrollbar" id="activity-log"></div>
</div>

<!-- Add New Item Modal -->
<div id="add-new-modal" class="modal hidden fixed inset-0 z-[110] items-center justify-center pointer-events-auto">
    <div class="absolute inset-0 bg-background/80 backdrop-blur-md modal-backdrop"></div>
    <div class="relative glass-panel border border-outline-variant rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl modal-content transform scale-95 translate-y-4 transition-all duration-300">
        <div class="flex items-center justify-between mb-8">
            <h2 class="text-2xl font-headline font-bold text-white">Create New Item</h2>
            <button data-close-modal class="text-on-surface-variant hover:text-white transition-colors p-2 rounded-lg hover:bg-surface-container-high">
                <span class="material-symbols-outlined">close</span>
            </button>
        </div>
        <div class="space-y-4">
            <a href="products.html" class="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low border border-outline-variant hover:border-primary hover:bg-surface-container-high transition-all group">
                <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined">vaccines</span>
                </div>
                <div>
                    <h3 class="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Add Medicine</h3>
                    <p class="text-xs text-on-surface-variant mt-1">Register a new medicine to inventory</p>
                </div>
            </a>
            <a href="deliveries.html" class="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low border border-outline-variant hover:border-secondary hover:bg-surface-container-high transition-all group">
                <div class="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined">local_shipping</span>
                </div>
                <div>
                    <h3 class="text-sm font-bold text-on-surface group-hover:text-secondary transition-colors">Supplier Delivery</h3>
                    <p class="text-xs text-on-surface-variant mt-1">Start a new delivery workflow</p>
                </div>
            </a>
            <a href="receipts.html" class="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low border border-outline-variant hover:border-tertiary hover:bg-surface-container-high transition-all group">
                <div class="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined">receipt_long</span>
                </div>
                <div>
                    <h3 class="text-sm font-bold text-on-surface group-hover:text-tertiary transition-colors">Dispense / Sale</h3>
                    <p class="text-xs text-on-surface-variant mt-1">Record pharmacy sales or dispatch</p>
                </div>
            </a>
        </div>
    </div>
</div>

<script type="module" src="../js/app.js"></script>
</body>
"""

search_result_html = """
            <input id="global-search-input" class="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-on-surface-variant/60 text-white ml-2 outline-none" placeholder="Search items, orders, or suppliers..." type="text" autocomplete="off" />
            <div class="px-2 py-0.5 bg-surface-container-high rounded text-[10px] text-on-surface-variant font-mono">⌘K</div>
            <!-- Search Results Dropdown -->
            <div id="global-search-results" class="hidden absolute top-full left-0 right-0 mt-3 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl overflow-hidden z-[100] max-h-96 overflow-y-auto custom-scrollbar"></div>
"""

notification_html = """
                <button data-dropdown-toggle="notifications-dropdown" class="relative hover:text-primary transition-colors p-2 hover:bg-surface-container-low rounded-lg">
                    <span class="material-symbols-outlined">notifications</span>
                    <span id="notifications-indicator" class="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full border-2 border-background animate-pulse hidden"></span>
                </button>
                <div id="notifications-dropdown" class="hidden absolute top-full right-0 mt-3 w-80 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl z-[100] transform transition-all origin-top-right dropdown-menu">
                    <div class="px-4 py-3 border-b border-outline-variant/50 flex justify-between items-center">
                        <h3 class="text-[11px] font-bold text-on-surface-variant tracking-widest uppercase">Notifications</h3>
                        <button class="text-primary text-xs font-bold hover:underline">Mark all read</button>
                    </div>
                    <div id="notifications-list" class="max-h-[400px] overflow-y-auto custom-scrollbar"></div>
                </div>
"""


for fp in files:
    with open(fp, 'r', encoding='utf-8') as f:
        content = f.read()

    filename = os.path.basename(fp)
    page_name = filename.split('.')[0]

    # Insert data-page
    content = re.sub(r'<body class="([^"]+)">', f'<body class="\\1" data-page="{page_name}">', content)

    # Insert modals and script at end of body
    content = content.replace("</body>", global_modals)

    # Add-new-modal trigger
    content = content.replace(
        '<button class="w-full btn-primary-gradient text-white py-3.5 rounded-xl text-sm font-bold mb-6 hover-lift flex items-center justify-center gap-2">',
        '<button data-modal-target="add-new-modal" class="w-full btn-primary-gradient text-white py-3.5 rounded-xl text-sm font-bold mb-6 hover-lift flex items-center justify-center gap-2">'
    )

    # Search fix
    search_pattern = r'<input class="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-on-surface-variant/60 text-white ml-2 outline-none"[^>]+/>\s*<div class="px-2 py-0.5 bg-surface-container-high rounded text-\[10px\] text-on-surface-variant font-mono">⌘K</div>'
    content = re.sub(search_pattern, search_result_html.strip(), content)

    # Search container needs to be relative
    content = content.replace(
        'class="flex items-center bg-surface-container-low px-4 py-2.5 rounded-2xl w-[400px]',
        'class="relative flex items-center bg-surface-container-low px-4 py-2.5 rounded-2xl w-[400px]'
    )

    # Notifications fix
    notif_pattern = r'<button class="relative hover:text-primary transition-colors p-2 hover:bg-surface-container-low rounded-lg">\s*<span class="material-symbols-outlined">notifications</span>\s*<span [^>]+></span>\s*</button>'
    
    if "animate-pulse" in content:
        content = re.sub(notif_pattern, notification_html.strip(), content)
    else:
        # Fallback if no pulse span
        content = re.sub(r'<button class="relative hover:text-primary transition-colors p-2 hover:bg-surface-container-low rounded-lg">\s*<span class="material-symbols-outlined">notifications</span>\s*</button>', notification_html.strip(), content)

    # Activity fix
    content = re.sub(r'<button class="hover:text-primary transition-colors p-2 hover:bg-surface-container-low rounded-lg">\s*<span class="material-symbols-outlined">history</span>\s*</button>',
        '<button data-toggle-activity class="hover:text-primary transition-colors p-2 hover:bg-surface-container-low rounded-lg">\n                    <span class="material-symbols-outlined">history</span>\n                </button>', content)

    # Profile Dropdown fix
    content = content.replace(
        '<div class="flex items-center gap-4 cursor-pointer hover:bg-surface-container-low p-1.5 pr-4 rounded-full transition-colors border border-transparent hover:border-outline-variant">',
        '<div class="relative"><div data-dropdown-toggle="profile-dropdown" class="flex items-center gap-4 cursor-pointer hover:bg-surface-container-low p-1.5 pr-4 rounded-full transition-colors border border-transparent hover:border-outline-variant">'
    )
    
    profile_dropdown = """
                <span class="material-symbols-outlined text-on-surface-variant text-sm">expand_more</span>
            </div>
            <!-- Profile Dropdown -->
            <div id="profile-dropdown" class="hidden absolute top-full right-0 mt-3 w-48 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl z-[100] transform transition-all origin-top-right dropdown-menu">
                <div class="py-2">
                    <a href="#" class="flex items-center gap-3 px-4 py-2 text-sm text-on-surface-variant hover:text-white hover:bg-surface-container-high transition-colors">
                        <span class="material-symbols-outlined text-[18px]">person</span> Profile
                    </a>
                    <a href="#" class="flex items-center gap-3 px-4 py-2 text-sm text-on-surface-variant hover:text-white hover:bg-surface-container-high transition-colors">
                        <span class="material-symbols-outlined text-[18px]">settings</span> Settings
                    </a>
                    <div class="h-[1px] bg-outline-variant/30 my-2"></div>
                    <a href="#" onclick="toast.success('Logged out successfully');setTimeout(() => window.location.href='login.html', 1500);" class="flex items-center gap-3 px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors">
                        <span class="material-symbols-outlined text-[18px]">logout</span> Logout
                    </a>
                </div>
            </div>
            </div>
"""
    # Find the end of profile block:
    #                 <span class="material-symbols-outlined text-on-surface-variant text-sm">expand_more</span>
    #             </div>
    # and replace
    content = re.sub(r'<span class="material-symbols-outlined text-on-surface-variant text-sm">expand_more</span>\s*</div>', profile_dropdown.strip(), content)

    with open(fp, 'w', encoding='utf-8') as f:
        f.write(content)

