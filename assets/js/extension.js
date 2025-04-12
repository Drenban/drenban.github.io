function toggleVerticalMode() {
    const container = document.querySelector('.auth-container');
    if (!container) return;
    container.classList.toggle('vertical-mode', window.innerWidth <= 768);
}

window.addEventListener('DOMContentLoaded', toggleVerticalMode);
window.addEventListener('resize', toggleVerticalMode);
