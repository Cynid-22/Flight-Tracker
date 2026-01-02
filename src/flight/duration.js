/**
 * Flight Duration Calculator
 * Estimates flight time based on distance, wind, and route factors
 */

const TO_RAD = Math.PI / 180;

/**
 * Calculates estimation of flight duration accounting for wind belts and route factors
 * @param {{ lat: number, lon: number }} origin - Origin airport
 * @param {{ lat: number, lon: number }} dest - Destination airport
 * @param {number} distanceMeters - Distance in meters
 * @returns {number} Duration in hours
 */
export function calculateFlightDuration(origin, dest, distanceMeters) {
    const lat1 = origin.lat * TO_RAD;
    const lat2 = dest.lat * TO_RAD;
    const dLon = (dest.lon - origin.lon) * TO_RAD;

    // Initial bearing (degrees 0..360)
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

    const distanceKm = distanceMeters / 1000;

    // --- 1. Route Efficiency ---
    let routeEfficiency = 1.10;
    if (distanceKm >= 12000) routeEfficiency = 1.03;
    else if (distanceKm >= 6000) routeEfficiency = 1.05;
    else if (distanceKm >= 3000) routeEfficiency = 1.08;
    else routeEfficiency = 1.10;

    const effectiveDistanceKm = distanceKm * routeEfficiency;

    // --- 2. Base Speeds ---
    let baseSpeed = 800;
    if (distanceKm < 500) {
        baseSpeed = 650;
    } else if (distanceKm < 2000) {
        baseSpeed = 800;
    } else if (distanceKm < 6000) {
        baseSpeed = 880;
    } else {
        baseSpeed = 900;
    }

    // --- 3. Wind Modeling ---
    const MAX_WIND = 200; // Symmetric ±200 km/h

    // Direction Factor: +1 East (Tail), -1 West (Head)
    const directionFactor = Math.cos((bearing - 90) * TO_RAD);

    // Wind Scale Tiers
    let windScale = 0.60;
    if (distanceKm < 300) {
        windScale = 0.15;
    } else if (distanceKm < 2000) {
        windScale = 0.60;
    } else if (distanceKm < 6000) {
        windScale = 0.90;
    } else if (distanceKm < 12000) {
        windScale = 1.00;
    } else {
        windScale = 0.35; // Polar/Ultra-Long dampening
    }

    // Latitude Factor — use average of absolute latitudes
    const midLat = (Math.abs(origin.lat) + Math.abs(dest.lat)) / 2;
    const latFactor = Math.max(0, Math.min(1, (midLat - 10) / 40));

    // Hemisphere Factor
    let hemisphereFactor = 1.0;
    if (origin.lat > 0 && dest.lat > 0) hemisphereFactor = 1.08; // NH
    else if (origin.lat < 0 && dest.lat < 0) hemisphereFactor = 0.92; // SH

    // Final Wind Component (compute capped magnitude)
    const maxWindEffective = MAX_WIND * windScale * latFactor * hemisphereFactor;
    const windComponent = directionFactor * maxWindEffective;

    // --- 4. Effective Speed & Safety Clamp ---
    let effectiveSpeed = baseSpeed + windComponent;
    effectiveSpeed = Math.max(effectiveSpeed, 200); // Minimum speed clamp

    const flightHours = effectiveDistanceKm / effectiveSpeed;

    // --- 5. Overheads ---
    let overheadHours = 0.75;
    if (distanceKm < 50) {
        overheadHours = 0.10;
    } else if (distanceKm < 300) {
        overheadHours = 0.50;
    } else if (distanceKm < 2000) {
        overheadHours = 0.50;
    } else if (distanceKm < 6000) {
        overheadHours = 0.75;
    } else {
        overheadHours = 1.00;
    }

    return flightHours + overheadHours;
}
