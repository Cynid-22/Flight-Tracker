/**
 * Landmark Map Module
 * Renders landmarks on map with tier-based visibility and viewport virtualization
 */

import { getMap } from './core.js';
import { TIER_RADIUS_KM } from '../data/landmarks.js';
import { createBoundingBox, isWithinBoundingBox, getDistanceFromPath } from '../utils/geo.js';

// State management
let allFilteredLandmarks = []; // Data only, no markers
let activeMarkers = new Map(); // id -> { marker, infoWindow, landmark }
let currentOpenInfoWindow = null;
let closeTimeout = null;
let mapListeners = [];

// Filter State (Default Tier 3 OFF)
const enabledTiers = new Set([1, 2]);

// Configuration
const UPDATE_DEBOUNCE_MS = 100;
// Note: Viewport buffer logic simplified/removed for now to ensure Date Line correctness

// Keep these for reference, but filtering now overrides strict zoom limits if enabled
const ZOOM_THRESHOLDS = {
    TIER_1_MIN: 2,
    TIER_2_MIN: 2,
    TIER_3_MIN: 2
};

// Marker styles by tier
const TIER_STYLES = {
    1: {
        scale: 8,
        fillColor: '#FFD700',  // Gold
        strokeColor: '#000000',
        strokeWeight: 2,
        zIndex: 100
    },
    2: {
        scale: 7,
        fillColor: '#00BFFF',  // Bright cyan
        strokeColor: '#000000',
        strokeWeight: 2,
        zIndex: 50
    },
    3: {
        scale: 6,
        fillColor: '#FF69B4',  // Hot pink
        strokeColor: '#000000',
        strokeWeight: 1.5,
        zIndex: 25
    }
};

/**
 * Filters landmarks within the flight corridor
 * @param {Array} landmarks - All landmarks
 * @param {Array} routeAirports - Route airports with {lat, lon}
 * @returns {Array} Filtered landmarks within corridor
 */
export function filterLandmarksInCorridor(landmarks, routeAirports) {
    if (!landmarks.length || !routeAirports.length) return [];

    // Phase 1: Bounding box pre-filter with generous buffer
    const maxRadiusKm = Math.max(...Object.values(TIER_RADIUS_KM));
    const bounds = createBoundingBox(routeAirports, maxRadiusKm + 50);

    const preFiltered = landmarks.filter(lm =>
        isWithinBoundingBox({ lat: lm.lat, lon: lm.lon }, bounds)
    );

    console.log(`Bounding box pre-filter: ${preFiltered.length}/${landmarks.length} landmarks`);

    // Phase 2: Corridor distance check
    const pathPoints = routeAirports.map(a => ({ lat: a.lat, lon: a.lon }));

    const filtered = preFiltered.filter(lm => {
        const point = { lat: lm.lat, lon: lm.lon };
        // Assign a unique ID if not present
        if (!lm._id) lm._id = `${lm.lat}_${lm.lon}_${lm.name}`;

        const distanceKm = getDistanceFromPath(point, pathPoints);
        const tierRadiusKm = TIER_RADIUS_KM[lm.tier];
        return distanceKm <= tierRadiusKm;
    });

    console.log(`Corridor filter: ${filtered.length} landmarks within detection radius`);
    return filtered;
}

/**
 * Debounce utility
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Initializes landmark rendering
 * @param {Array} landmarks - Filtered landmarks to potential render
 */
export function renderLandmarks(landmarks) {
    const map = getMap();
    if (!map) return;

    // Reset state but KEEP filters (don't reset enabledTiers)
    clearLandmarkMarkers();
    allFilteredLandmarks = landmarks;

    // Show legend
    const legend = document.getElementById('landmark-legend');
    if (legend) legend.classList.remove('hidden');

    // Initial render
    updateVisibleMarkers();

    // Setup virtualization listeners (avoid duplicates)
    // Clear old listeners first if they exist (though clearLandmarkMarkers handles it, let's be safe)
    if (mapListeners.length > 0) {
        mapListeners.forEach(l => google.maps.event.removeListener(l));
        mapListeners = [];
    }

    const debouncedUpdate = debounce(() => updateVisibleMarkers(), UPDATE_DEBOUNCE_MS);

    mapListeners.push(map.addListener('idle', debouncedUpdate));
    mapListeners.push(map.addListener('zoom_changed', debouncedUpdate));
}

/**
 * Sets up the interactive legend and filter checkboxes
 * Should be called once on app init
 */
export function setupLegend() {
    const tier1 = document.getElementById('tier-1-check');
    const tier2 = document.getElementById('tier-2-check');
    const tier3 = document.getElementById('tier-3-check');

    // Default state: Tier 1 & 2 ON, Tier 3 OFF
    if (tier1) {
        tier1.checked = true;
        tier1.addEventListener('change', (e) => toggleTier(1, e.target.checked));
    }
    if (tier2) {
        tier2.checked = true;
        tier2.addEventListener('change', (e) => toggleTier(2, e.target.checked));
    }
    if (tier3) {
        tier3.checked = false;
        tier3.addEventListener('change', (e) => toggleTier(3, e.target.checked));
    }
}

/**
 * Toggles a tier on/off
 */
function toggleTier(tier, isEnabled) {
    if (isEnabled) {
        enabledTiers.add(tier);
    } else {
        enabledTiers.delete(tier);
    }
    updateVisibleMarkers();
}

/**
 * Updates markers based on current viewport bounds and zoom level
 */
function updateVisibleMarkers() {
    const map = getMap();
    if (!map) return;

    const bounds = map.getBounds();

    if (!bounds) return;

    // 1. Identify which landmarks should be visible
    const visibleData = allFilteredLandmarks.filter(lm => {
        // Filter Check: Is this tier enabled?
        if (!enabledTiers.has(lm.tier)) return false;

        // Date Line / Wrapping Check:
        // Use Google Maps geometry for robust inclusion check instead of manual math
        const latLng = new google.maps.LatLng(lm.lat, lm.lon);

        // Strict bounds check (no buffer for now to ensure correctness across date line)
        if (!bounds.contains(latLng)) return false;

        return true;
    });

    // 2. Diff with currently active markers
    const visibleIds = new Set(visibleData.map(lm => lm._id));

    // Remove markers that are no longer visible
    for (const [id, entry] of activeMarkers.entries()) {
        if (!visibleIds.has(id)) {
            entry.marker.setMap(null);
            activeMarkers.delete(id);
        }
    }

    // Add markers that are newly visible
    visibleData.forEach(lm => {
        if (!activeMarkers.has(lm._id)) {
            createMarker(lm, map);
        }
    });
}

/**
 * Creates a single marker instance
 */
function createMarker(landmark, map) {
    const style = TIER_STYLES[landmark.tier];
    const pos = { lat: landmark.lat, lng: landmark.lon };

    const marker = new google.maps.Marker({
        position: pos,
        map: map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: style.scale,
            fillColor: style.fillColor,
            fillOpacity: 0.9,
            strokeColor: style.strokeColor,
            strokeWeight: style.strokeWeight
        },
        zIndex: style.zIndex,
        title: landmark.name
    });

    // Create info window
    const infoWindow = createLandmarkInfoWindow(landmark);
    const markerPos = pos;

    // Add interactions
    marker.addListener('mouseover', () => {
        if (closeTimeout) {
            clearTimeout(closeTimeout);
            closeTimeout = null;
        }

        if (currentOpenInfoWindow) {
            // If dragging from one marker to another quickly
            if (currentOpenInfoWindow !== infoWindow) {
                currentOpenInfoWindow.close();
            }
        }
        infoWindow.open(map, marker);
        currentOpenInfoWindow = infoWindow;
    });

    marker.addListener('mouseout', (e) => {
        const mouseY = e.domEvent?.clientY;
        const markerPixel = getMarkerScreenPosition(map, markerPos);

        // Logic to allow moving mouse into the popup
        const movingTowardPopup = markerPixel && mouseY && mouseY < markerPixel.y;

        if (movingTowardPopup) {
            closeTimeout = setTimeout(() => {
                if (currentOpenInfoWindow === infoWindow) {
                    infoWindow.close();
                    currentOpenInfoWindow = null;
                }
            }, 300);
        } else {
            if (currentOpenInfoWindow === infoWindow) {
                infoWindow.close();
                currentOpenInfoWindow = null;
            }
        }
    });

    infoWindow.addListener('domready', () => {
        const popup = document.querySelector('.landmark-popup');
        if (popup) {
            popup.addEventListener('mouseenter', () => {
                if (closeTimeout) {
                    clearTimeout(closeTimeout);
                    closeTimeout = null;
                }
            });
            popup.addEventListener('mouseleave', () => {
                closeTimeout = setTimeout(() => {
                    infoWindow.close();
                    currentOpenInfoWindow = null;
                }, 300);
            });
        }
    });

    activeMarkers.set(landmark._id, { marker, infoWindow, landmark });
}


/**
 * Converts lat/lng to screen coords (helper for mouseout logic)
 */
function getMarkerScreenPosition(map, latLng) {
    try {
        const overlay = new google.maps.OverlayView();
        overlay.draw = function () { };
        overlay.setMap(map);
        const projection = overlay.getProjection();
        if (!projection) return null;
        const point = projection.fromLatLngToContainerPixel(new google.maps.LatLng(latLng.lat, latLng.lng));
        overlay.setMap(null);
        return point ? { x: point.x, y: point.y } : null;
    } catch {
        return null;
    }
}

/**
 * Creates info window content
 */
function createLandmarkInfoWindow(landmark) {
    const imageHtml = landmark.imageUrl
        ? `<img src="${landmark.imageUrl}" alt="${landmark.name}" class="landmark-popup-image" onerror="this.style.display='none'">`
        : '';
    const descriptionHtml = landmark.description
        ? `<p class="landmark-popup-description">${landmark.description}</p>`
        : '';

    let linkHtml;
    if (landmark.wikiUrl && landmark.wikiUrl.trim() !== '') {
        linkHtml = `<a href="${landmark.wikiUrl}" target="_blank" rel="noopener noreferrer" class="landmark-popup-link">View on Wikipedia →</a>`;
    } else {
        const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(landmark.name)}`;
        linkHtml = `<span class="landmark-popup-no-wiki">No Wikipedia article available</span>
        <a href="${googleSearchUrl}" target="_blank" rel="noopener noreferrer" class="landmark-popup-link landmark-popup-search">Search on Google →</a>`;
    }

    const content = `
        <div class="landmark-popup">
            ${imageHtml}
            <div class="landmark-popup-content">
                <h3 class="landmark-popup-title">${landmark.name}</h3>
                ${descriptionHtml}
                <div class="landmark-popup-meta">
                    <span class="landmark-tier tier-${landmark.tier}">${getTierLabel(landmark.tier)}</span>
                </div>
                ${linkHtml}
            </div>
        </div>
    `;

    return new google.maps.InfoWindow({
        content,
        disableAutoPan: true,
        maxWidth: 320,
        zIndex: 10000
    });
}

function getTierLabel(tier) {
    switch (tier) {
        case 1: return 'Global Icon';
        case 2: return 'National Landmark';
        case 3: return 'Local Interest';
        default: return 'Landmark';
    }
}

/**
 * Clears all landmark markers and listeners
 */
export function clearLandmarkMarkers() {
    // Remove Map listeners
    mapListeners.forEach(l => google.maps.event.removeListener(l));
    mapListeners = [];

    // Clear visible markers
    for (const entry of activeMarkers.values()) {
        entry.marker.setMap(null);
    }
    activeMarkers.clear();

    if (currentOpenInfoWindow) {
        currentOpenInfoWindow.close();
        currentOpenInfoWindow = null;
    }

    allFilteredLandmarks = [];
}
