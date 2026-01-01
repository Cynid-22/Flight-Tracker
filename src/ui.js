
// UI Elements
const apiKeySection = document.getElementById('api-key-section');
const searchSection = document.getElementById('search-section');

const flightInfoSection = document.getElementById('flight-info');
const routeOriginEl = document.getElementById('route-origin');
const routeDestEl = document.getElementById('route-dest');
const distanceInfoEl = document.getElementById('distance-info');

export function hideApiKeySection() {
    apiKeySection.classList.add('hidden');
}

export function showApiKeySection() {
    apiKeySection.classList.remove('hidden');
}

export function enableSearch() {
    searchSection.classList.remove('disabled');
}

export function setupAutocomplete(input, suggestionBox, airports, onSelect) {
    if (!input || !suggestionBox) return;

    input.addEventListener('input', () => {
        const query = input.value.toLowerCase();
        suggestionBox.innerHTML = '';
        if (query.length < 2) {
            suggestionBox.classList.remove('active');
            return;
        }

        let matches = airports.filter(a =>
            a.code.toLowerCase().startsWith(query) ||
            (a.city && a.city.toLowerCase().includes(query)) ||
            a.name.toLowerCase().includes(query)
        );

        // Sort matches to prioritize IATA codes
        matches.sort((a, b) => {
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

            return 0; // Default order
        });

        matches = matches.slice(0, 10);

        if (matches.length > 0) {
            suggestionBox.classList.add('active');
            matches.forEach(airport => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.innerHTML = `<span class="highlight">${airport.code}</span> - ${airport.name} (${airport.city || 'N/A'}, ${airport.country})`;
                div.addEventListener('click', () => {
                    input.value = `${airport.code} - ${airport.city || airport.name}`;
                    suggestionBox.classList.remove('active');
                    onSelect(airport);
                });
                suggestionBox.appendChild(div);
            });
        } else {
            suggestionBox.classList.remove('active');
        }
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !suggestionBox.contains(e.target)) {
            suggestionBox.classList.remove('active');
        }
    });
}

export function updateFlightInfo(originCode, destCode, distanceKm) {
    flightInfoSection.classList.remove('hidden');
    routeOriginEl.textContent = originCode;
    routeDestEl.textContent = destCode;

    const distanceMiles = Math.round(distanceKm * 0.621371);
    distanceInfoEl.textContent = `${distanceKm} km (${distanceMiles} miles)`;
}
