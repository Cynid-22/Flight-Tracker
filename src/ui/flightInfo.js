/**
 * Flight Info Display Module
 * Displays flight route information and statistics
 */

import { formatDistance } from '../utils/formatting.js';
import { calculateFlightDuration } from '../flight/duration.js';

// DOM Elements
const searchSection = document.getElementById('search-section');
const flightInfoSection = document.getElementById('flight-info');

/**
 * Enables search section
 */
export function enableSearch() {
    searchSection.classList.remove('disabled');
}

/**
 * Updates the flight info display with route details
 * @param {Object[]} routeAirports - Array of airports in the route
 * @param {number} totalDistanceMeters - Total route distance in meters
 */
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
        legDiv.style.marginRight = '3px';
        legDiv.style.background = 'rgba(255,255,255,0.05)';
        legDiv.style.padding = '8px';
        legDiv.style.borderRadius = '8px';

        legDiv.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; margin-bottom: 4px;">
                <span style="font-weight: 600; text-align: left;">${origin.code}</span>
                <span style="text-align: center; white-space: nowrap;">
                    <span style="color: var(--text-muted); font-size: 0.85em;">${legTimeStr}</span>
                    <span class="arrow" style="font-size: 0.9em; color: white; margin: 0 4px;">✈</span>
                </span>
                <span style="font-weight: 600; text-align: right;">${dest.code}</span>
            </div>
            <div style="text-align: center; font-size: 0.8em; color: var(--text-muted);">
                ${formatDistance(distMeters).metric} | ${formatDistance(distMeters).imperial} | ${formatDistance(distMeters).nautical}
            </div>
        `;
        legsContainer.appendChild(legDiv);
    }
    flightInfoSection.appendChild(legsContainer);
}
