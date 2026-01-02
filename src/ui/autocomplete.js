/**
 * Autocomplete Module
 * Airport search and suggestion functionality
 */

/**
 * Compares two airport matches for sorting
 * @param {Object} a - First airport
 * @param {Object} b - Second airport
 * @param {string} query - Search query
 * @returns {number} Sort order
 */
function compareMatches(a, b, query) {
    const codeA = a.code.toLowerCase();
    const codeB = b.code.toLowerCase();

    // Exact code match gets highest priority
    if (codeA === query && codeB !== query) return -1;
    if (codeB === query && codeA !== query) return 1;

    // Starts with code gets second priority
    const startsA = codeA.startsWith(query);
    const startsB = codeB.startsWith(query);
    if (startsA && !startsB) return -1;
    if (!startsA && startsB) return 1;

    // Prioritize large_airport over medium_airport
    if (a.type === 'large_airport' && b.type !== 'large_airport') return -1;
    if (b.type === 'large_airport' && a.type !== 'large_airport') return 1;

    return 0;
}

/**
 * Finds the best matching airport for a query
 * @param {string} query - Search query
 * @param {Object[]} airports - List of airports
 * @returns {Object|null} Best matching airport or null
 */
export function findBestMatch(query, airports) {
    if (!query || query.length < 2) return null;
    query = query.toLowerCase();

    const matches = airports.filter(a =>
        a.code.toLowerCase().startsWith(query) ||
        (a.city && a.city.toLowerCase().includes(query)) ||
        a.name.toLowerCase().includes(query)
    );

    if (matches.length === 0) return null;

    matches.sort((a, b) => compareMatches(a, b, query));
    return matches[0];
}

/**
 * Sets up autocomplete functionality for an input
 * @param {HTMLInputElement} input - Input element
 * @param {HTMLElement} suggestionBox - Suggestion container
 * @param {Object[]} airports - List of airports
 * @param {Function} onSelect - Callback when airport is selected
 */
export function setupAutocomplete(input, suggestionBox, airports, onSelect) {
    if (!input || !suggestionBox) return;

    let currentMatches = [];
    let highlightedIndex = -1;

    function selectAirport(airport) {
        input.value = `${airport.code} - ${airport.city || airport.name}`;
        suggestionBox.classList.remove('active');
        highlightedIndex = -1;
        onSelect(airport);
    }

    function updateHighlight() {
        const items = suggestionBox.querySelectorAll('.suggestion-item');
        items.forEach((item, index) => {
            if (index === highlightedIndex) {
                item.classList.add('highlighted');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('highlighted');
            }
        });
    }

    input.addEventListener('input', () => {
        const query = input.value.toLowerCase();
        suggestionBox.innerHTML = '';
        currentMatches = [];
        highlightedIndex = -1;

        if (query.length < 2) {
            suggestionBox.classList.remove('active');
            return;
        }

        let matches = airports.filter(a =>
            a.code.toLowerCase().startsWith(query) ||
            (a.city && a.city.toLowerCase().includes(query)) ||
            a.name.toLowerCase().includes(query)
        );

        matches.sort((a, b) => compareMatches(a, b, query));

        currentMatches = matches.slice(0, 10);

        if (currentMatches.length > 0) {
            if (suggestionBox.parentNode !== document.body) {
                document.body.appendChild(suggestionBox);
            }
            suggestionBox.classList.add('active');
            const rect = input.getBoundingClientRect();
            suggestionBox.style.position = 'fixed';
            suggestionBox.style.top = `${rect.bottom + 5}px`;
            suggestionBox.style.left = `${rect.left}px`;
            suggestionBox.style.width = `${rect.width}px`;

            currentMatches.forEach((airport, index) => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.innerHTML = `<span class="highlight">${airport.code}</span> - ${airport.name} (${airport.city || 'N/A'}, ${airport.country})`;
                div.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    selectAirport(airport);
                });
                div.addEventListener('mouseenter', () => {
                    highlightedIndex = index;
                    updateHighlight();
                });
                suggestionBox.appendChild(div);
            });
        } else {
            suggestionBox.classList.remove('active');
        }
    });

    document.addEventListener('scroll', (e) => {
        if (suggestionBox.classList.contains('active')) {
            if (e.target === suggestionBox || suggestionBox.contains(e.target)) return;
            suggestionBox.classList.remove('active');
            input.blur();
        }
    }, true);

    input.addEventListener('keydown', (e) => {
        if (!suggestionBox.classList.contains('active') || currentMatches.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlightedIndex = (highlightedIndex + 1) % currentMatches.length;
            updateHighlight();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlightedIndex = highlightedIndex <= 0 ? currentMatches.length - 1 : highlightedIndex - 1;
            updateHighlight();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const indexToSelect = highlightedIndex >= 0 ? highlightedIndex : 0;
            selectAirport(currentMatches[indexToSelect]);
        } else if (e.key === 'Tab') {
            const indexToSelect = highlightedIndex >= 0 ? highlightedIndex : 0;
            selectAirport(currentMatches[indexToSelect]);
        } else if (e.key === 'Escape') {
            suggestionBox.classList.remove('active');
            highlightedIndex = -1;
        }
    });

    input.addEventListener('click', () => {
        input.select();
    });

    input.addEventListener('blur', () => {
        setTimeout(() => {
            suggestionBox.classList.remove('active');
            highlightedIndex = -1;
        }, 100);
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !suggestionBox.contains(e.target)) {
            suggestionBox.classList.remove('active');
            highlightedIndex = -1;
        }
    });
}
