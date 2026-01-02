/**
 * Collapse/Expand Module
 * Handles collapsing stops to text view and expanding back
 */

import { animateExit, animateEnter } from './animations.js';

/**
 * Collapses the stops form into a compact text view
 */
export function collapseStops() {
    const container = document.getElementById('layovers-container');
    const stopsContainer = document.getElementById('stops-container');
    const layoverGroups = container.querySelectorAll('.layover-group');
    const originGroup = document.querySelector('[data-type="origin"]');
    const destGroup = document.querySelector('[data-type="dest"]');
    const originInput = document.getElementById('origin-input');
    const destInput = document.getElementById('dest-input');
    const addBtn = document.getElementById('add-layover-btn');
    const trackBtn = document.getElementById('track-btn');

    // Animate out inputs and buttons
    animateExit([originGroup, destGroup, container, addBtn, trackBtn], () => {
        // Hide all input groups and center line
        stopsContainer.classList.add('collapsed');
        originGroup.style.display = 'none';
        destGroup.style.display = 'none';
        container.style.display = 'none';
        addBtn.style.display = 'none';
        trackBtn.style.display = 'none';

        // Create collapsed view
        let collapsed = document.getElementById('collapsed-stops');
        if (!collapsed) {
            collapsed = document.createElement('div');
            collapsed.id = 'collapsed-stops';
            originGroup.parentNode.insertBefore(collapsed, originGroup.nextSibling);
        }

        collapsed.innerHTML = '';

        // Helper to get country code from dataset
        function getCountryCode(input) {
            if (input.dataset.airport) {
                try {
                    const airport = JSON.parse(input.dataset.airport);
                    return airport.country ? airport.country.slice(0, 2).toUpperCase() : '';
                } catch (e) { }
            }
            return '';
        }

        // Origin text with country
        const originCountry = getCountryCode(originInput);
        const originText = document.createElement('div');
        originText.className = 'collapsed-endpoint';
        originText.textContent = (originInput.value || 'Origin') + (originCountry ? ` (${originCountry})` : '');
        collapsed.appendChild(originText);

        // Layover texts with truncation
        const MAX_VISIBLE_STOPS = 5;
        const layoverArray = Array.from(layoverGroups);
        const totalLayovers = layoverArray.length;

        if (totalLayovers <= MAX_VISIBLE_STOPS) {
            // Show all
            layoverArray.forEach((group) => {
                const input = group.querySelector('input');
                const country = getCountryCode(input);
                let displayText = (input.value || 'Stop') + (country ? ` (${country})` : '');

                const stopText = document.createElement('div');
                stopText.className = 'collapsed-stop-item';
                stopText.innerHTML = `<span class="collapsed-stop-text">${displayText}</span>`;
                collapsed.appendChild(stopText);
            });
        } else {
            // Truncate: show first 2, then ..., then last 2
            for (let i = 0; i < 2; i++) {
                const input = layoverArray[i].querySelector('input');
                const country = getCountryCode(input);
                let displayText = (input.value || 'Stop') + (country ? ` (${country})` : '');

                const stopText = document.createElement('div');
                stopText.className = 'collapsed-stop-item';
                stopText.innerHTML = `<span class="collapsed-stop-text">${displayText}</span>`;
                collapsed.appendChild(stopText);
            }

            // Truncation indicator
            const truncatedCount = totalLayovers - 4;
            const truncText = document.createElement('div');
            truncText.className = 'collapsed-stop-item';
            truncText.innerHTML = `<span class="collapsed-stop-text" style="font-style: italic;">... ${truncatedCount} stop${truncatedCount > 1 ? 's' : ''} ...</span>`;
            collapsed.appendChild(truncText);

            // Last 2
            for (let i = totalLayovers - 2; i < totalLayovers; i++) {
                const input = layoverArray[i].querySelector('input');
                const country = getCountryCode(input);
                let displayText = (input.value || 'Stop') + (country ? ` (${country})` : '');

                const stopText = document.createElement('div');
                stopText.className = 'collapsed-stop-item';
                stopText.innerHTML = `<span class="collapsed-stop-text">${displayText}</span>`;
                collapsed.appendChild(stopText);
            }
        }

        // Destination text with country
        const destCountry = getCountryCode(destInput);
        const destText = document.createElement('div');
        destText.className = 'collapsed-endpoint';
        destText.textContent = (destInput.value || 'Destination') + (destCountry ? ` (${destCountry})` : '');
        collapsed.appendChild(destText);

        collapsed.addEventListener('click', expandStops);

        // Add edit hint inside collapsed div
        const editHint = document.createElement('div');
        editHint.id = 'edit-hint';
        editHint.textContent = 'Click anywhere to edit';
        editHint.style.textAlign = 'center';
        editHint.style.color = 'var(--text-muted)';
        editHint.style.fontSize = '0.8em';
        editHint.style.padding = '5px 0';
        editHint.style.cursor = 'pointer';
        editHint.style.opacity = '0.4';
        editHint.addEventListener('click', expandStops);
        collapsed.appendChild(editHint);

        // Animate in collapsed view
        animateEnter(collapsed);
    });
}

/**
 * Expands the collapsed view back to the full form
 */
export function expandStops() {
    const container = document.getElementById('layovers-container');
    const stopsContainer = document.getElementById('stops-container');
    const collapsed = document.getElementById('collapsed-stops');
    const flightInfo = document.getElementById('flight-info');
    const originGroup = document.querySelector('[data-type="origin"]');
    const destGroup = document.querySelector('[data-type="dest"]');

    // Animate out collapsed view
    if (collapsed) {
        animateExit(collapsed, () => {
            collapsed.remove();

            // Show inputs again and center line
            stopsContainer.classList.remove('collapsed');
            originGroup.style.display = '';
            destGroup.style.display = '';
            container.style.display = '';

            // Remove edit hint
            const editHint = document.getElementById('edit-hint');
            if (editHint) {
                editHint.remove();
            }

            // Show buttons again
            const addBtn = document.getElementById('add-layover-btn');
            const trackBtn = document.getElementById('track-btn');
            addBtn.style.display = '';
            trackBtn.style.display = '';

            if (flightInfo) {
                flightInfo.classList.add('hidden');
            }

            // Animate in inputs
            animateEnter([originGroup, destGroup, container, addBtn, trackBtn]);
        });
    } else {
        // Fallback if no collapsed view
        stopsContainer.classList.remove('collapsed');
        originGroup.style.display = '';
        destGroup.style.display = '';
        container.style.display = '';
    }
}
