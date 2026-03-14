export function initModal() {
    document.addEventListener('click', (e) => {
        const openBtn = e.target.closest('[data-modal-target]');
        if (openBtn) {
            openModal(openBtn.getAttribute('data-modal-target'));
        }

        const closeBtn = e.target.closest('[data-close-modal]');
        if (closeBtn) {
            closeModal(closeBtn.closest('.modal').id);
        }

        if (e.target.classList.contains('modal-backdrop')) {
            closeModal(e.target.closest('.modal').id);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                closeModal(modal.id);
            });
        }
    });
}

export function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    // small delay for transition
    setTimeout(() => modal.classList.add('active', 'opacity-100'), 10);
    const content = modal.querySelector('.modal-content');
    if (content) {
        setTimeout(() => content.classList.add('scale-100', 'translate-y-0'), 10);
        content.classList.remove('scale-95', 'translate-y-4');
    }
}

export function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    
    modal.classList.remove('active', 'opacity-100');
    const content = modal.querySelector('.modal-content');
    if (content) {
        content.classList.remove('scale-100', 'translate-y-0');
        content.classList.add('scale-95', 'translate-y-4');
    }

    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300); // Wait for transition
}
