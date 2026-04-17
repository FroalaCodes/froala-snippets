
// Config Modal Functions
function openConfigModal() {
    const overlay = document.getElementById('configModalOverlay');
    if (overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeConfigModal(event) {
    const overlay = document.getElementById('configModalOverlay');
    if (!overlay) return;

    // Close if clicking outside the modal content box or on the close button
    const clickedOutside = !event.target.closest('.config-modal-content');
    const clickedClose = !!event.target.closest('.config-modal-close');

    if (clickedOutside || clickedClose) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function copyConfig() {
    const codeBlock = document.querySelector('.config-code code');
    if (!codeBlock) return;

    const text = codeBlock.textContent;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('.copy-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        btn.classList.add('copied');

        setTimeout(() => {
            btn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy Config';
            btn.classList.remove('copied');
        }, 2000);
    });
}

// Add event listener for escape key to close modal
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        const overlay = document.getElementById('configModalOverlay');
        if (overlay && overlay.classList.contains('active')) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
});
