/**
 * Drag and Drop Module
 * Handles reordering of flight stops via drag-and-drop
 */

/**
 * Swaps input values and data between two groups
 * @param {HTMLElement} groupA - First group
 * @param {HTMLElement} groupB - Second group
 */
function swapInputs(groupA, groupB) {
    const inputA = groupA.querySelector('input');
    const inputB = groupB.querySelector('input');

    // Swap values
    const tempVal = inputA.value;
    inputA.value = inputB.value;
    inputB.value = tempVal;

    // Swap datasets (the actual airport objects)
    const tempDataset = inputA.dataset.airport;
    if (inputB.dataset.airport) {
        inputA.dataset.airport = inputB.dataset.airport;
    } else {
        delete inputA.dataset.airport;
    }

    if (tempDataset) {
        inputB.dataset.airport = tempDataset;
    } else {
        delete inputB.dataset.airport;
    }

    // Optional: Visual feedback
    groupA.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    groupB.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    setTimeout(() => {
        groupA.style.backgroundColor = '';
        groupB.style.backgroundColor = '';
    }, 300);
}

/**
 * Sets up drag-and-drop functionality for input groups
 */
export function setupDragItems() {
    const draggables = document.querySelectorAll('.input-group');

    draggables.forEach(group => {
        // Skip if already set up
        if (group.dataset.dragSetup === 'true') return;
        group.dataset.dragSetup = 'true';

        const handle = group.querySelector('.drag-handle');
        if (!handle) return;

        // Make the handle the drag initiator
        handle.addEventListener('mousedown', () => {
            group.setAttribute('draggable', 'true');
        });

        group.addEventListener('dragstart', (e) => {
            group.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', ''); // Required for Firefox
        });

        group.addEventListener('dragend', () => {
            group.classList.remove('dragging');
            group.removeAttribute('draggable');
            // Clean up any lingering drag-over states
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        });

        // Allow drops
        group.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necessary to allow dropping
            e.dataTransfer.dropEffect = 'move';
            // Add drag-over class here for more reliable detection
            if (!group.classList.contains('dragging')) {
                group.classList.add('drag-over');
            }
        });

        group.addEventListener('dragenter', (e) => {
            e.preventDefault();
        });

        group.addEventListener('dragleave', (e) => {
            // Only remove if leaving to a non-child element
            if (!group.contains(e.relatedTarget)) {
                group.classList.remove('drag-over');
            }
        });

        group.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            group.classList.remove('drag-over');
            const sourceGroup = document.querySelector('.dragging');
            if (sourceGroup && sourceGroup !== group) {
                swapInputs(sourceGroup, group);
            }
        });
    });
}
