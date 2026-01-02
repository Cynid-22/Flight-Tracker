/**
 * Layover Controls Module
 * Manages adding, removing, and querying layover stops
 */

import { showNotification } from '../utils/notifications.js';
import { findBestMatch, setupAutocomplete } from './autocomplete.js';
import { setupDragItems } from './dragdrop.js';
import { MAX_TOTAL_STOPS } from '../utils/constants.js';

/**
 * Checks if more stops can be added
 * @returns {boolean}
 */
export function canAddMoreStops() {
    const container = document.getElementById('layovers-container');
    const layoverCount = container.querySelectorAll('.layover-group').length;
    return (layoverCount + 2) < MAX_TOTAL_STOPS;
}

/**
 * Updates the Add Layover button state based on stop count
 */
export function updateAddButtonState() {
    const addBtn = document.getElementById('add-layover-btn');
    if (!canAddMoreStops()) {
        addBtn.disabled = true;
        addBtn.style.opacity = '0.4';
        addBtn.style.cursor = 'not-allowed';
    } else {
        addBtn.disabled = false;
        addBtn.style.opacity = '';
        addBtn.style.cursor = '';
    }
}

/**
 * Sets up layover control functionality
 * @param {Object[]} airports - List of airports
 * @param {Function} onUpdate - Callback when layovers change
 */
export function setupLayoverControls(airports, onUpdate) {
    const container = document.getElementById('layovers-container');
    const addBtn = document.getElementById('add-layover-btn');

    addBtn.addEventListener('click', () => {
        if (!canAddMoreStops()) {
            showNotification('Maximum 10 stops allowed (including origin and destination).', 'error');
            return;
        }

        const id = Date.now();
        const group = document.createElement('div');
        group.className = 'input-group layover-group';
        group.dataset.id = id;
        group.style.position = 'relative';

        group.innerHTML = `
            <span class="drag-handle">⠿</span>
            <div style="display: flex; gap: 5px; flex-grow: 1;">
                <input type="text" placeholder="Stop (e.g. CDG)" autocomplete="off" class="layover-input" style="flex-grow: 1;">
                <button class="remove-layover-btn">×</button>
            </div>
            <div class="suggestions"></div>
        `;

        // Clear dataset on input so we don't use stale selected data if user changes text
        const inputEl = group.querySelector('input');
        inputEl.addEventListener('input', () => {
            delete inputEl.dataset.airport;
        });

        container.appendChild(group);
        container.scrollTop = container.scrollHeight;

        group.querySelector('.remove-layover-btn').addEventListener('click', () => {
            container.removeChild(group);
            const suggestions = group.querySelector('.suggestions');
            if (suggestions && suggestions.parentNode === document.body) {
                document.body.removeChild(suggestions);
            }
            onUpdate();
            updateAddButtonState();
        });

        const input = group.querySelector('input');
        const suggestions = group.querySelector('.suggestions');

        setupAutocomplete(input, suggestions, airports, (selected) => {
            // Store selected airport on the input element
            input.dataset.airport = JSON.stringify(selected);
            onUpdate(); // Trigger update to redraw path
        });

        // Enable DnD for this new item
        setupDragItems();

        // Update button state
        updateAddButtonState();
    });
}

/**
 * Gets all valid layover airports
 * @param {Object[]} airports - List of airports for smart matching
 * @returns {Object[]} Array of layover airport objects
 * @throws {Error} If a layover cannot be matched
 */
export function getLayovers(airports) {
    const inputs = document.querySelectorAll('.layover-input');
    const layovers = [];

    for (const input of inputs) {
        if (input.dataset.airport) {
            try {
                layovers.push(JSON.parse(input.dataset.airport));
            } catch (e) {
                console.error("Failed to parse airport data", e);
            }
        } else if (input.value.trim().length > 0) {
            // Smart Match
            const match = findBestMatch(input.value.trim(), airports);
            if (match) {
                input.value = `${match.code} - ${match.city || match.name}`;
                input.dataset.airport = JSON.stringify(match); // Save it
                layovers.push(match);
                showNotification(`Auto-selected layover: ${match.code}`, 'info');
            } else {
                throw new Error(`Layover '${input.value}' matches no known airport.`);
            }
        }
    }
    return layovers;
}
