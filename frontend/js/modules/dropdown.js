export function initDropdown() {
    document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('[data-dropdown-toggle]');
        
        // Close all dropdowns if clicking outside
        if (!toggleBtn && !e.target.closest('.dropdown-menu')) {
            document.querySelectorAll('.dropdown-menu:not(.hidden)').forEach(menu => {
                menu.classList.add('hidden');
                menu.classList.remove('opacity-100', 'scale-100');
            });
            return;
        }

        if (toggleBtn) {
            e.preventDefault();
            const targetId = toggleBtn.getAttribute('data-dropdown-toggle');
            const targetMenu = document.getElementById(targetId);
            
            // Close others 
            document.querySelectorAll('.dropdown-menu:not(.hidden)').forEach(menu => {
                if (menu.id !== targetId) {
                    menu.classList.add('hidden');
                    menu.classList.remove('opacity-100', 'scale-100');
                }
            });

            if (targetMenu) {
                const isHidden = targetMenu.classList.contains('hidden');
                if (isHidden) {
                    targetMenu.classList.remove('hidden');
                    // transition
                    setTimeout(() => targetMenu.classList.add('opacity-100', 'scale-100'), 10);
                } else {
                    targetMenu.classList.remove('opacity-100', 'scale-100');
                    setTimeout(() => targetMenu.classList.add('hidden'), 200);
                }
            }
        }
    });
}
