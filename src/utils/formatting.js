/**
 * Formatting Utilities
 * Distance and time formatting functions
 */

/**
 * Formats distance in multiple units
 * @param {number} distanceMeters - Distance in meters
 * @returns {{ metric: string, imperial: string, nautical: string }}
 */
export function formatDistance(distanceMeters) {
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
