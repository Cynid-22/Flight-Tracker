
// UI Elements
const searchSection = document.getElementById('search-section');

const flightInfoSection = document.getElementById('flight-info');
const routeOriginEl = document.getElementById('route-origin');
const routeDestEl = document.getElementById('route-dest');
const distanceInfoEl = document.getElementById('distance-info');

export function enableSearch() {
    searchSection.classList.remove('disabled');
}

export function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;

    // Choose icon/symbol based on type
    let icon = 'ℹ️';
    if (type === 'error') icon = '⚠️';
    if (type === 'success') icon = '✅';

    toast.innerHTML = `<span style="font-size: 1.2em;">${icon}</span><span>${message}</span>`;

    container.appendChild(toast);

    // Auto remove after animation (3s total: 0.3s in + 2.4s wait + 0.3s out)
    setTimeout(() => {
        if (container.contains(toast)) {
            container.removeChild(toast);
        }
    }, 3000);
}

export function findBestMatch(query, airports) {
    if (!query || query.length < 2) return null;
    query = query.toLowerCase();

    const matches = airports.filter(a =>
        a.code.toLowerCase().startsWith(query) ||
        (a.city && a.city.toLowerCase().includes(query)) ||
        a.name.toLowerCase().includes(query)
    );

    if (matches.length === 0) return null;

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

        // Prioritize large_airport over medium_airport
        if (a.type === 'large_airport' && b.type !== 'large_airport') return -1;
        if (b.type === 'large_airport' && a.type !== 'large_airport') return 1;

        return 0;
    });

    return matches[0];
}

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

        // Reuse logic? Valid approach is to just duplicate filter for now to keep autocomplete showing multiple
        // We can't strictly use findBestMatch because we need ALL matches for the UI list
        let matches = airports.filter(a =>
            a.code.toLowerCase().startsWith(query) ||
            (a.city && a.city.toLowerCase().includes(query)) ||
            a.name.toLowerCase().includes(query)
        );

        matches.sort((a, b) => {
            const codeA = a.code.toLowerCase();
            const codeB = b.code.toLowerCase();
            if (codeA === query && codeB !== query) return -1;
            if (codeB === query && codeA !== query) return 1;
            const startsA = codeA.startsWith(query);
            const startsB = codeB.startsWith(query);
            if (startsA && !startsB) return -1;
            if (!startsA && startsB) return 1;
            if (a.type === 'large_airport' && b.type !== 'large_airport') return -1;
            if (b.type === 'large_airport' && a.type !== 'large_airport') return 1;
            return 0;
        });

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

export function setupLayoverControls(airports, onUpdate) {
    const container = document.getElementById('layovers-container');
    const addBtn = document.getElementById('add-layover-btn');

    addBtn.addEventListener('click', () => {
        const id = Date.now();
        const group = document.createElement('div');
        group.className = 'input-group layover-group';
        group.dataset.id = id;
        group.style.position = 'relative';

        group.innerHTML = `
            <label>Layover</label>
            <div style="display: flex; gap: 5px;">
                <div style="position: relative; flex-grow: 1;">
                    <input type="text" placeholder="City or Code" autocomplete="off" class="layover-input">
                    <div class="suggestions"></div>
                </div>
                <button class="remove-layover-btn">×</button>
            </div>
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
        });

        const input = group.querySelector('input');
        const suggestions = group.querySelector('.suggestions');

        setupAutocomplete(input, suggestions, airports, (selected) => {
            input.dataset.airport = JSON.stringify(selected);
            onUpdate();
        });
    });
}

export function getLayovers(airports) { // Now needs airports list for smart matching
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

export function updateFlightInfo(routeAirports, totalDistanceMeters) {
    flightInfoSection.classList.remove('hidden');

    // Clear previous info
    flightInfoSection.innerHTML = '';

    // Header for Total Stats
    const totalStatsDiv = document.createElement('div');
    totalStatsDiv.style.marginBottom = '15px';
    totalStatsDiv.style.paddingBottom = '10px';
    totalStatsDiv.style.borderBottom = '1px solid rgba(255,255,255,0.1)';

    // Calculate total duration
    let totalDuration = 0;
    for (let i = 0; i < routeAirports.length - 1; i++) {
        const origin = routeAirports[i];
        const dest = routeAirports[i + 1];
        const dist = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(origin.lat, origin.lon),
            new google.maps.LatLng(dest.lat, dest.lon)
        );
        totalDuration += calculateFlightDuration(origin, dest, dist);
    }

    const totalHours = Math.floor(totalDuration);
    const totalMinutes = Math.round((totalDuration - totalHours) * 60);
    const totalTimeStr = `${totalHours.toString().padStart(2, '0')}:${totalMinutes.toString().padStart(2, '0')}`;

    totalStatsDiv.innerHTML = `
        <div class="route-info" style="justify-content: center;">
            <span style="font-size: 1.1em;">Total Trip</span>
        </div>
        <div style="display: flex; justify-content: space-around; align-items: center; margin-top: 5px;">
            <div style="text-align: center;">
                <div class="tiny-text" style="margin-bottom: 5px;">DISTANCE</div>
                <div style="font-weight: 600;">${formatDistance(totalDistanceMeters).metric}</div>
            </div>
            <div style="text-align: center;">
                 <div class="tiny-text" style="margin-bottom: 5px;">TIME</div>
                 <div style="font-weight: 600;">${totalTimeStr}</div>
            </div>
        </div>
    `;
    flightInfoSection.appendChild(totalStatsDiv);

    // Per Leg Stats
    const legsContainer = document.createElement('div');
    legsContainer.id = 'flight-legs-container';

    for (let i = 0; i < routeAirports.length - 1; i++) {
        const origin = routeAirports[i];
        const dest = routeAirports[i + 1];

        const distMeters = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(origin.lat, origin.lon),
            new google.maps.LatLng(dest.lat, dest.lon)
        );

        const duration = calculateFlightDuration(origin, dest, distMeters);
        const legHours = Math.floor(duration);
        const legMinutes = Math.round((duration - legHours) * 60);
        const legTimeStr = `${legHours.toString().padStart(2, '0')}:${legMinutes.toString().padStart(2, '0')}`;

        const legDiv = document.createElement('div');
        legDiv.style.marginBottom = '10px';
        legDiv.style.background = 'rgba(255,255,255,0.05)';
        legDiv.style.padding = '8px';
        legDiv.style.borderRadius = '8px';

        legDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-weight: 600;">${origin.code}</span>
                <span class="arrow" style="font-size: 0.8em; color: white;">✈</span>
                <span style="font-weight: 600;">${dest.code}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.8em; color: var(--text-muted);">
                <span>${formatDistance(distMeters).metric}</span>
                <span>${legTimeStr}</span>
            </div>
        `;
        legsContainer.appendChild(legDiv);
    }
    flightInfoSection.appendChild(legsContainer);
}

function formatDistance(distanceMeters) {
    // Helper to format number based on magnitude
    function formatValue(value, isSmallUnit = false) {
        if (isSmallUnit) return Math.round(value); // m or ft always integer
        if (value >= 100) return Math.round(value);
        if (value >= 10) return value.toFixed(1);
        return value.toFixed(2);
    }

    // 1. Metric
    const distKm = distanceMeters / 1000;
    let metricText;
    if (distKm < 1) {
        metricText = `${Math.round(distanceMeters)} m`;
    } else {
        metricText = `${formatValue(distKm)} km`;
    }

    // 2. Imperial
    const distMiles = distanceMeters * 0.000621371;
    let imperialText;
    if (distMiles < 1) {
        const distFeet = distanceMeters * 3.28084;
        imperialText = `${Math.round(distFeet)} ft`;
    } else {
        imperialText = `${formatValue(distMiles)} miles`;
    }

    // 3. Nautical
    const distNM = distanceMeters * 0.000539957;
    const nauticalText = `${formatValue(distNM)} NM`;

    return {
        metric: metricText,
        imperial: imperialText,
        nautical: nauticalText
    };
}

/**
 * Calculates estimation of flight duration accounting for wind belts
 * @returns {number} Duration in hours
 */
function calculateFlightDuration(origin, dest, distanceMeters) {
    const toRad = (d) => d * Math.PI / 180;
    const lat1 = toRad(origin.lat);
    const lat2 = toRad(dest.lat);
    const dLon = toRad(dest.lon - origin.lon);

    // Calculate Bearing (Initial Bearing)
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

    // Base Speed (Typical commercial jet cruising speed)
    const baseSpeedKmh = 900;

    // Wind Effect (Westerlies in mid-latitudes)
    // Cosine of (Bearing - 90 deg) gives 1 for East, -1 for West
    // We assume a net wind component of ~100 km/h
    // This is a simplified model of the Jet Stream effect
    const windComponent = Math.cos((bearing - 90) * Math.PI / 180) * 100;

    const effectiveSpeed = baseSpeedKmh + windComponent;

    // Calculate raw flight time
    const distanceKm = distanceMeters / 1000;
    const flightHours = distanceKm / effectiveSpeed;

    // Add 30 mins (0.5h) for taxi, takeoff, approach, landing
    return flightHours + 0.5;
}
