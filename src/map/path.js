/**
 * Map Path Module
 * Flight path drawing and marker management
 */

import { getMap } from './core.js';
import { createLabelContent, calculateLabelOffsets } from './labels.js';
import { animateCamera } from './animation.js';

// Track all markers for cleanup
let markers = [];

/**
 * Draws the flight path on the map
 * @param {Object[]} routeAirports - Array of airport objects
 * @returns {number} Total distance in meters
 */
export function drawPath(routeAirports) {
    const map = getMap();
    if (!map || routeAirports.length < 2) return;

    // Clear previous
    markers.forEach(m => m.setMap(null));
    markers = [];

    const bounds = new google.maps.LatLngBounds();
    let totalDistanceMeters = 0;

    // Iterate through segments
    for (let i = 0; i < routeAirports.length - 1; i++) {
        const originAirport = routeAirports[i];
        const destAirport = routeAirports[i + 1];

        const origin = { lat: originAirport.lat, lng: originAirport.lon };
        const dest = { lat: destAirport.lat, lng: destAirport.lon };

        bounds.extend(origin);
        bounds.extend(dest);

        // Draw Polyline (Shadow)
        const shadowPath = new google.maps.Polyline({
            path: [origin, dest],
            geodesic: true,
            strokeColor: "#000000",
            strokeOpacity: 0.4,
            strokeWeight: 6,
            map: map,
            zIndex: 1
        });
        markers.push(shadowPath);

        // Draw Polyline (Main)
        const flightPath = new google.maps.Polyline({
            path: [origin, dest],
            geodesic: true,
            strokeColor: "#FFFFFF",
            strokeOpacity: 0.9,
            strokeWeight: 3,
            map: map,
            zIndex: 2
        });
        markers.push(flightPath);

        // Calculate segment distance
        totalDistanceMeters += google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(origin),
            new google.maps.LatLng(dest)
        );
    }

    // Calculate offsets for overlapping labels
    const labelOffsets = calculateLabelOffsets(routeAirports);

    // Add airport markers
    routeAirports.forEach((airport, index) => {
        const pos = { lat: airport.lat, lng: airport.lon };

        // 1. Draw the white dot marker
        const dotMarker = new google.maps.Marker({
            position: pos,
            map: map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 5,
                fillColor: "#FFFFFF",
                fillOpacity: 1,
                strokeColor: "#000000",
                strokeWeight: 1
            },
            zIndex: 3
        });
        markers.push(dotMarker);

        // 2. Add the label InfoWindow with offset
        const offset = labelOffsets[index];
        const infoWindow = new google.maps.InfoWindow({
            content: createLabelContent(airport, offset.direction),
            position: pos,
            disableAutoPan: true,
            pixelOffset: new google.maps.Size(offset.x, offset.y)
        });
        infoWindow.open(map);
        markers.push({ setMap: () => infoWindow.close() });
    });

    animateCamera(bounds);

    return totalDistanceMeters;
}
