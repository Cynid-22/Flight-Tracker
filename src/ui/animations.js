/**
 * Animations Module
 * Fade-in/fade-out animation helpers
 */

/**
 * Animates elements out with fade effect
 * @param {HTMLElement|HTMLElement[]} elements - Elements to animate
 * @param {Function} callback - Called after animation completes
 */
export function animateExit(elements, callback) {
    elements = Array.isArray(elements) ? elements : [elements];
    elements.forEach(el => {
        el.classList.add('fade-exit');
        el.offsetHeight; // Force reflow
        el.classList.add('fade-exit-active');
    });

    setTimeout(() => {
        elements.forEach(el => {
            el.classList.remove('fade-exit', 'fade-exit-active');
        });
        if (callback) callback();
    }, 200); // Match CSS duration
}

/**
 * Animates elements in with fade effect
 * @param {HTMLElement|HTMLElement[]} elements - Elements to animate
 */
export function animateEnter(elements) {
    elements = Array.isArray(elements) ? elements : [elements];
    elements.forEach(el => {
        el.classList.add('fade-enter');
    });

    requestAnimationFrame(() => {
        elements.forEach(el => {
            el.classList.add('fade-enter-active');
        });
    });

    setTimeout(() => {
        elements.forEach(el => {
            el.classList.remove('fade-enter', 'fade-enter-active');
        });
    }, 300); // Match CSS duration
}
